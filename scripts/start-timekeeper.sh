#!/usr/bin/env bash
# Build and start Timekeeper A and B in the background. Logs: ~/.hawser/timekeeper-{a,b}.log, PIDs beside them.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p "$HOME/.hawser"
set -a
[ -f .env ] && . ./.env
set +a
pnpm install --frozen-lockfile
pnpm --filter @hawser/timekeeper build
for id in a b; do
  pidfile="$HOME/.hawser/timekeeper-$id.pid"
  if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    echo "timekeeper-$id already running (pid $(cat "$pidfile"))"
    continue
  fi
  HAWSER_TIMEKEEPER_ID="$id" nohup node apps/timekeeper/dist/main.js >>"$HOME/.hawser/timekeeper-$id.log" 2>&1 &
  echo $! >"$pidfile"
  echo "started timekeeper-$id pid $(cat "$pidfile")"
done
