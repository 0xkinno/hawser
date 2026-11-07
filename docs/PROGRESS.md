# Progress

## Session 1, 6 November 2026

Done: everything marked `[x]` in `docs/TASK.md`. In numbers (from `docs/FACTS.json`): 15 of 16 published laytime examples reproduced; 10 of 10 runnable break cases held on a real switch-core; silent rewrite detected in a median 2.2 s; crashed clock replaced in a median 21.9 s with an identical digest; reconciler 0 false and 0 missed divergences with 271 abstentions on 16,498 generated events. 127 unit tests, 152 browser tests across six viewports.

Defects found by our own tests and fixed: signer remarks were part of the digest and voided other signatures; a version was issued before all three logs existed; zero allowed laytime never started demurrage; two Timekeepers could both believe they held the role; the reconciler guessed an ambiguous local time and produced 77 false divergences; four accessibility faults on the site.

Corrections to the brief, kept: the Brake award figure and reason, the update notice, the WebSocket ping interval, the crash failover time, the restart behaviour.

Later in session one: the hero photograph was placed (with phone layout and link preview image), the builder approved the Vercel deployment, and Codespaces access from the cloud session was tested and found blocked (HTTP 403, see `docs/HANDOFF.md`).

In progress: nothing. The work stopped at the edge of what needs the builder's accounts.

## Session 2, 6 November 2026 (builder's computer)

Cloned to Downloads/hawser, installed, `pnpm run verify:all` green, 152 browser tests green in Chromium. Visual review found one real defect: `.desk-head` removed the side gutter, so the desk, verify, findings, judge and trace pages touched the screen edge on phones. Fixed in `apps/web/app/globals.css`, README screenshots regenerated. Added `apps/web/e2e/demo.spec.ts` and `playwright.demo.config.ts`: a paced walk-through of every action (anchors, replay, seven-step tour, themes, verify pass, tampered bundle mismatch, junk refusal, stats endpoint, 404) recorded as video at 1440x900 and 393x852 into `demo-footage/` (gitignored, for the film). Known gap: the lane chart on a phone is legible only as a shape; its labels are tiny.

Later the same day: GitHub CLI installed under `C:\Users\hp\tools\gh` and signed in with the codespace scope, Codespace created, commit pushed, Track 3 fork made and claims posted (see `docs/TRACK3_LOG.md`).

Evening of 6 November: Slack workspace and desk channel created by the builder, Telegram bot created, SSH alias for the Codespace working, Switch Console v0.40.1 installer downloaded from the official release. Tokens stay in the gitignored `.env` or in Console only.

7 November: Switch Console on Windows cannot run agents locally (its source says SDK sessions need a POSIX SSH host), so the server and agents run on the Codespace through an SSH port forward kept alive by `keep-forward.ps1`. The templates used a `machine` param, which Console offers only on servers with agent management; they now use a `location` param, which lists SSH hosts.

Still needs the builder: Codespace (the `gh` CLI was not installed on this machine), Slack and Telegram, the real call, video, form.

Next: `docs/HANDOFF.md` section 3.

## Self-judging against five generic rivals A to E (1 to 5, honest, to be revisited after the real call)

| Criterion | HAWSER | Reasoning |
|---|---|---|
| Use of Switch | 4 | Ownership, addressing, author-locked documents, the exclusive role lease and the raw WebSocket are central and observed. Held back from 5 by the missing Slack and Telegram run and the unrun templates |
| Technical execution | 4 | Reproducible with `pnpm verify`, CI, and a real server run. Held back by the evidence being from a local server and simulated people |
| Creativity and impact | 4 | An empty lane, a real court case, a document the industry already signs. A practitioner has not yet commented |
| Presentation | 3 | The site and README are strong. The video does not exist yet and the real chat screenshots are missing |

Blocking questions: Is Switch central, and would HAWSER stop without it? Yes. Does a judge see a real chat with real people in the video? Not yet. Can a stranger run `pnpm verify` with no keys? Yes. Is every Switch claim backed by a probe or file and line? Yes, or marked not run. Is the person and the moment clear in 10 seconds? Yes on the landing page. Does the master do something software cannot (photo, signature)? Designed, not yet recorded. Are misses published? Yes. Is the landing page clean at six viewports? Yes.

## Session 2, live setup, 7 November 2026

What ran, in order, with the obstacles that cost time:

1. Switch Console 0.40.1 on Windows cannot host agent sessions (its source: "SDK sessions require a POSIX SSH execution host"). WSL on this laptop would not start (HCS_E_INVALID_JSON, then 0x8037010d, on Windows build 21996), so the Codespace became the host.
2. Console's SSH client does not use `ProxyCommand`, so `gh codespace ssh --config` aliases fail. A `gh codespace ports forward 2222:2222` loop (`keep-forward.ps1`) and a plain `Host hawser-codespace` alias on 127.0.0.1:2222 work.
3. Console reads the agent from `SSH_AUTH_SOCK`, which Windows does not set; pointing it at `\.\pipe\openssh-ssh-agent` fixed "SSH agent socket not found".
4. The server was added through "Run a server on a remote host", then also as an existing server at `http://127.0.0.1:63295/gateway` through an SSH tunnel, because the managed entry hid the host from the template form.
5. The Codespace container restarts on its own (idle timeout). `scripts/hawser-ensure.sh` restarts the server containers, the agents controller and the Timekeepers; the laptop tunnel runs it on every reconnect.
6. Console's template form checks providers by SSH to the machine id, which fails. The agents were created in Switch Gateway, Machines, New managed agent, with the instructions from `agents/*.md`. Templates now use a `location` param; the `machine` param is offered only with agent management.
7. `switch-client` sent `agent_id` to add agents to a room; switch-core 0.31 wants `agent_ids`. Fixed.
8. Timekeepers registered with `scripts/live-setup.ts`, added to both rooms, addressing open to the desk room; A holds the role, B stands by.

Cast of the live call: Sean (master, Telegram), Eberebaby (port agent, Slack), Kingsley (charterer's manager, Slack). Track 3: sandbox-quantum/switch#1672 open, CLA signed, three maintainer-gated checks waiting.
