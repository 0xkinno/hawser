#!/usr/bin/env bash
set -euo pipefail
corepack enable
npm i -g opencode-ai @anthropic-ai/claude-code
mkdir -p "$HOME/agents" "$HOME/.hawser"
git config --global core.hooksPath "$PWD/.githooks"
echo "Runtime ready. Next: onboard this Codespace as a remote host in Switch Console."
