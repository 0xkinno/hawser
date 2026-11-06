#!/usr/bin/env bash
# Run first in every new clone, cloud session or Codespace.
set -euo pipefail
cd "$(dirname "$0")/.."
git config core.hooksPath .githooks
chmod +x .githooks/commit-msg
echo "commit-msg hook enabled (core.hooksPath=$(git config core.hooksPath))"
