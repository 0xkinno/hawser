#!/usr/bin/env bash
# Failover probe (B6): kill A with SIGKILL so its lease is not released cleanly. Prints the kill time in epoch ms.
set -euo pipefail
pidfile="$HOME/.hawser/timekeeper-a.pid"
[ -f "$pidfile" ] || { echo "timekeeper-a pid file not found" >&2; exit 1; }
pid="$(cat "$pidfile")"
kill -0 "$pid" 2>/dev/null || { echo "timekeeper-a is not running" >&2; exit 1; }
date +%s%3N
kill -9 "$pid"
rm -f "$pidfile"
