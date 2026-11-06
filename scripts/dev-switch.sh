#!/usr/bin/env bash
# Run a real switch-core from reference/switch with a local Postgres, no Docker. For development and probes only.
# Usage: scripts/dev-switch.sh start|stop|status|restart|reset
# State: Postgres data in $PGDATA (default /var/lib/hawser-pg), logs in $HAWSER_DEV_LOG_DIR.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SW="$ROOT/reference/switch"
PGB="${PGB:-/usr/lib/postgresql/16/bin}"
PGDATA="${PGDATA:-/var/lib/hawser-pg}"
LOGDIR="${HAWSER_DEV_LOG_DIR:-/tmp/hawser-dev}"
mkdir -p "$LOGDIR"

pg_up() {
  "$PGB/pg_isready" -h 127.0.0.1 -q && return 0
  if [ "$(id -u)" = 0 ]; then
    id pguser >/dev/null 2>&1 || useradd -m pguser
    mkdir -p "$PGDATA" && chown pguser "$PGDATA"
    [ -f "$PGDATA/PG_VERSION" ] || su pguser -c "$PGB/initdb -D $PGDATA -A trust -U postgres" >/dev/null
    su pguser -c "$PGB/pg_ctl -D $PGDATA -l $PGDATA/pg.log -o '-p 5432 -c listen_addresses=127.0.0.1 -c unix_socket_directories=/tmp' start" >/dev/null
  else
    [ -f "$PGDATA/PG_VERSION" ] || "$PGB/initdb" -D "$PGDATA" -A trust -U postgres >/dev/null
    "$PGB/pg_ctl" -D "$PGDATA" -l "$LOGDIR/pg.log" -o "-p 5432 -c listen_addresses=127.0.0.1 -c unix_socket_directories=/tmp" start >/dev/null
  fi
  for _ in $(seq 1 20); do "$PGB/pg_isready" -h 127.0.0.1 -q && return 0; sleep 1; done
  echo "postgres did not start, see $PGDATA/pg.log" >&2; exit 1
}

env_ready() {
  cd "$SW"
  if [ ! -f .env ]; then cp .env.example .env && bash deploy/local/generate-env-secrets.sh .env local >/dev/null; fi
  set -a; . ./.env; set +a
  export PGPASSWORD=
  psql -h 127.0.0.1 -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || psql -h 127.0.0.1 -U postgres -qc "CREATE DATABASE $DB_NAME;"
  psql -h 127.0.0.1 -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || psql -h 127.0.0.1 -U postgres -qc "CREATE ROLE \"$DB_USER\" LOGIN PASSWORD '$DB_PASSWORD' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;"
  psql -h 127.0.0.1 -U postgres -qc "ALTER ROLE \"$DB_USER\" PASSWORD '$DB_PASSWORD';"
  psql -h 127.0.0.1 -U postgres -qc "ALTER ROLE postgres PASSWORD '$DB_OWNER_PASSWORD';"
}

core_pid() { pgrep -f "switch_core.main" | head -1 || true; }

case "${1:-status}" in
  start)
    pg_up; env_ready
    if [ -n "$(core_pid)" ]; then echo "switch-core already running (pid $(core_pid))"; exit 0; fi
    (cd "$SW" && uv sync --project core --frozen >/dev/null 2>&1)
    cd "$SW"; set -a; . ./.env; set +a
    GATEWAY_COOKIE_SECURE=false setsid nohup uv run --project core python -m switch_core.main >"$LOGDIR/switch-core.log" 2>&1 < /dev/null &
    for _ in $(seq 1 60); do curl -fsS -m 2 localhost:8000/health >/dev/null 2>&1 && { echo "switch-core up on :8000"; exit 0; }; sleep 1; done
    echo "switch-core did not come up, see $LOGDIR/switch-core.log" >&2; exit 1 ;;
  stop) pkill -f "switch_core.main" || true; echo stopped ;;
  restart) "$0" stop; sleep 2; "$0" start ;;
  reset)
    "$0" stop; sleep 2; pg_up
    export PGPASSWORD=
    set -a; . "$SW/.env"; set +a
    psql -h 127.0.0.1 -U postgres -qc "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE);"
    echo "database $DB_NAME dropped"; "$0" start ;;
  status) curl -fsS -m 2 localhost:8000/health || echo "switch-core not running" ;;
  *) echo "usage: $0 start|stop|status|restart|reset" >&2; exit 2 ;;
esac
