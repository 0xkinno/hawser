#!/usr/bin/env bash
# Run probes P01..P14 and break cases B1..B11 against the Switch server in .env / .data/world.json.
# Each probe script writes probes/results/<id>-<date>.json itself, with provenance. A probe without a script or a
# result file is reported as "not yet run". Results are never invented.
#   bash probes/run-all.sh            run everything that can run
#   bash probes/run-all.sh p01 p03    run only those
set -uo pipefail
cd "$(dirname "$0")/.."
[ -f reference/switch/.env ] && { set -a; . reference/switch/.env; set +a; }
[ -f .env ] && { set -a; . ./.env; set +a; }
mkdir -p probes/results
ids=("$@")
if [ ${#ids[@]} -eq 0 ]; then ids=(p01 p02 p03 p04 p05 p06 p07 p08 p09 p10 p11 p12 p13 p14 b8); fi
ran=0; missing=0; failed=0
for id in "${ids[@]}"; do
  script="$(ls probes/${id}-*.ts 2>/dev/null | head -1 || true)"
  if [ -z "$script" ]; then echo "$id: not yet run (no script)"; missing=$((missing+1)); continue; fi
  if pnpm exec tsx "$script"; then ran=$((ran+1)); else echo "$id: FAILED"; failed=$((failed+1)); fi
done
echo "ran=$ran failed=$failed not_yet_run=$missing"
echo "break campaign B1 to B11 (B1 B2 B3 B4 B6 B7 B9 B10 B11, with live Timekeepers): pnpm exec tsx probes/break-campaign.ts"
echo "B5 (message edit on Slack and Telegram), P05 and P12 need real messaging apps and are not run here."
