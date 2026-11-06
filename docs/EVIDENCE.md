# Evidence

Every claim made in the README, the site and the submission, and the file, link, probe or run bundle that backs it. A claim without a row here does not belong in those places.

| Claim | Evidence |
|---|---|
| The Brake judgment removed about USD 840,000 of discharge port demurrage | `docs/MOMENT.md` rows 1 to 5, paragraph numbers from the National Archives page |
| The laytime counter reproduces 15 of 16 published examples | `packages/laytime/test/external/*.json`, `packages/laytime/test/external.test.ts`, `docs/FACTS.json` `engine_external_match` |
| The USD 1,996.53 figure for 230 minutes at USD 12,500 a day | `packages/laytime/test/money.test.ts` |
| Another agent cannot edit a company log | probe P03, break case B3, `probes/results/p03-*.json`, `b3-*.json` |
| A silent rewrite is detected and voids signatures | break case B4 (5 trials), `apps/timekeeper/test/call.test.ts` |
| A casual "noted" is never acceptance | break cases B1, B2, `apps/timekeeper/test/call.test.ts`, `sign.test.ts` |
| An agent cannot sign for a person | break case B11, `call.test.ts` |
| A crashed clock is replaced with an identical digest | break case B6 (5 trials), probe P06 |
| The Timekeeper survives a server restart without duplicate cards | break case B7, probe P07 |
| A time with no zone is not placed | break case B9, `packages/laytime/test/reconcile.test.ts` |
| Ambiguous wall-clock times are not guessed | `packages/laytime/test/reconcile.test.ts` ("ambiguous wall-clock times"), `scripts/test/scenarios.test.ts` (300 seeds) |
| A model's money figure gets a correction | break case B10, `call.test.ts` |
| A signed call verifies offline | `runs/*.json`, `pnpm verify`, CI step "every committed run bundle recomputes offline" |
| Room documents keep no history and the update notice does not say what changed | probe P04 |
| The live transport is the WebSocket with a 10 second server ping | probe P01, source `handlers.py` line 1218 |
| Crash failover takes about 22 to 25 seconds | probes P06 and B6, source `protocol/liveness.py` line 26 |
| The site shows only recorded evidence | `apps/web/scripts/sync-data.ts`, CI step "the site's data copies match the evidence" |
| Everything on the call page is simulated people on a local server | `runs/*.json` `provenance`, banner on the call page |

## What is not evidenced

Anything that needs a real messaging app (P05, P12, B5, the human B2 and B8), the Codespace server, Claude Code and OpenCode running under Console (P13, and the model-generated words of the company agents), and the Track 3 pull requests. These are listed as not yet run wherever they appear.
