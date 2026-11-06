# Progress

## Session 1, 6 November 2026

Done: everything marked `[x]` in `docs/TASK.md`. In numbers (from `docs/FACTS.json`): 15 of 16 published laytime examples reproduced; 10 of 10 runnable break cases held on a real switch-core; silent rewrite detected in a median 2.2 s; crashed clock replaced in a median 21.9 s with an identical digest; reconciler 0 false and 0 missed divergences with 271 abstentions on 16,498 generated events. 127 unit tests, 152 browser tests across six viewports.

Defects found by our own tests and fixed: signer remarks were part of the digest and voided other signatures; a version was issued before all three logs existed; zero allowed laytime never started demurrage; two Timekeepers could both believe they held the role; the reconciler guessed an ambiguous local time and produced 77 false divergences; four accessibility faults on the site.

Corrections to the brief, kept: the Brake award figure and reason, the update notice, the WebSocket ping interval, the crash failover time, the restart behaviour.

Later in session one: the hero photograph was placed (with phone layout and link preview image), the builder approved the Vercel deployment, and Codespaces access from the cloud session was tested and found blocked (HTTP 403, see `docs/HANDOFF.md`).

In progress: nothing. The work stopped at the edge of what needs the builder's accounts.

Next: `docs/HANDOFF.md` section 3.

## Self-judging against five generic rivals A to E (1 to 5, honest, to be revisited after the real call)

| Criterion | HAWSER | Reasoning |
|---|---|---|
| Use of Switch | 4 | Ownership, addressing, author-locked documents, the exclusive role lease and the raw WebSocket are central and observed. Held back from 5 by the missing Slack and Telegram run and the unrun templates |
| Technical execution | 4 | Reproducible with `pnpm verify`, CI, and a real server run. Held back by the evidence being from a local server and simulated people |
| Creativity and impact | 4 | An empty lane, a real court case, a document the industry already signs. A practitioner has not yet commented |
| Presentation | 3 | The site and README are strong. The video does not exist yet and the real chat screenshots are missing |

Blocking questions: Is Switch central, and would HAWSER stop without it? Yes. Does a judge see a real chat with real people in the video? Not yet. Can a stranger run `pnpm verify` with no keys? Yes. Is every Switch claim backed by a probe or file and line? Yes, or marked not run. Is the person and the moment clear in 10 seconds? Yes on the landing page. Does the master do something software cannot (photo, signature)? Designed, not yet recorded. Are misses published? Yes. Is the landing page clean at six viewports? Yes.
