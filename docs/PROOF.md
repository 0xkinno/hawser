# Proof

The numbers live in `docs/FACTS.json` and are generated from the evidence in the repository. Do not copy them by hand. Regenerate with `pnpm facts`; CI fails if the file is stale.

Headline (from the current file, simulated people on a local switch-core 0.31.0, 6 November 2026):

- External worked examples reproduced: 15 of 16. The one mismatch is an "unless used" clause the counter does not model, and its source is internally inconsistent.
- Break cases held: 10 of 10 runnable. B5 needs a real Slack message edit.
- Silent rewrite detected: median 2.2 s over 5 trials.
- Crashed clock replaced: median 21.9 s over 5 trials, identical digest each time.
- Reconciler on 16,498 generated events: 0 false divergences, 0 missed, 271 abstentions.

Misses and surprises, kept on purpose: `docs/FINDINGS.md`.

The full results per probe are in `probes/results/`. The run bundle that the call page shows is in `runs/` and recomputes with `pnpm verify`.
