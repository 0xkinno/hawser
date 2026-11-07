#!/usr/bin/env bash
# Brings the Switch server and the agent controller back after a Codespace restart.
for i in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 2; done
for c in switchdash-remote-postgres-1 switchdash-remote-switch-1 switchdash-remote-gateway-1 switchdash-remote-mattermost-1; do
  [ "$(docker inspect -f '{{.State.Running}}' "$c" 2>/dev/null)" = "true" ] || { docker start "$c" >/dev/null && echo "started $c"; sleep 3; }
done
tmux has-session -t sac 2>/dev/null || { tmux new-session -d -s sac "switch-agent-controller run 2>&1 | tee -a ~/.hawser-sac.log"; echo "started controller"; }
