#!/usr/bin/env bash
# Run probes P01..P14 and break cases B1..B11 against the Codespace server.
# Each probe script prints one JSON object. Results go to probes/results/<id>-<date>.json.
# A probe without a result file is reported as "not yet run". Results are never invented.
set -uo pipefail
cd "$(dirname "$0")/.."
set -a
[ -f .env ] && . ./.env
set +a
date_tag="$(date -u +%Y-%m-%d)"
mkdir -p probes/results
ids=(p01 p02 p03 p04 p05 p06 p07 p08 p09 p10 p11 p12 p13 p14 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11)
ran=0; missing=0
for id in "${ids[@]}"; do
  script="$(ls probes/${id}-*.mjs 2>/dev/null | head -1 || true)"
  if [ -z "$script" ]; then echo "$id: not yet run (no script)"; missing=$((missing+1)); continue; fi
  out="probes/results/${id}-${date_tag}.json"
  if node "$script" >"$out.tmp" 2>"$out.err"; then mv "$out.tmp" "$out"; echo "$id: ok -> $out"; ran=$((ran+1));
  else echo "$id: FAILED (see $out.err)"; rm -f "$out.tmp"; fi
done
echo "ran=$ran not_yet_run=$missing"
