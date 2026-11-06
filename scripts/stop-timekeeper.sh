#!/usr/bin/env bash
# Stop Timekeeper A and B.
set -euo pipefail
for id in a b; do
  pidfile="$HOME/.hawser/timekeeper-$id.pid"
  if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    kill "$(cat "$pidfile")" && echo "stopped timekeeper-$id"
  else
    echo "timekeeper-$id not running"
  fi
  rm -f "$pidfile"
done
