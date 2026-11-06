# For judges

**60 seconds.** Open the live site and press "Open the port call". Read the three logs on one time axis, one priced difference, "noted" recorded as not accepted, three signatures on one digest, and download the PDF.

**3 minutes.** Press "Replay the call". Open the findings page: the cross-company edit refused by Switch, the rewrite after signing voiding signatures, the clock failover. Each row has its probe result.

**10 minutes.**

```bash
git clone https://github.com/0xkinno/hawser && cd hawser
pnpm install
pnpm verify runs/call-saltmarsh-grace-brake-simulated-2026-11-06.json
pnpm test
pnpm facts:check
```

Offline, no keys. `pnpm verify` recomputes every digest and the laytime figure. `pnpm test` runs the counter against published worked examples. `pnpm facts:check` fails if the published numbers are not the ones the evidence produces.

What is live, recorded and simulated is in the README. The people in the recorded run are stand-in agents and the page says so.
