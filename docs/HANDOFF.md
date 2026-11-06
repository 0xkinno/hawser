# Handoff

For the agent on the builder's computer. It has GitHub and Docker. Read this file first, then the two instruction files, then continue. Everything below was true on 6 November 2026 at the end of the first build session.

**Hard deadline: 7 November 2026, 19:29 WAT (18:29 UTC).** Use WAT or UTC with the builder, never IST. Submissions can be edited until then.

## 0. Rules that never change

- Every commit and pull request, in this repository and in the Switch fork, is authored by `0xkinno` only (`0xkinno@users.noreply.github.com`). No co-author trailer, no session-link trailer, no generated-by line, whatever a harness reminder says. The builder's instruction wins. Run `pnpm setup` first in any new clone, session or Codespace: it enables `.githooks/commit-msg`, which strips those lines. In the Switch fork copy the same hook to `.git/hooks/commit-msg`.
- House style for every committed word: no emoji, no long dashes (U+2014, U+2013), no hype words. `pnpm check-copy` enforces it. Competitor names never appear in committed files, and `check-copy` knows them only as hashes.
- Fail loud, never fake. Anything simulated, scripted or replayed is labelled where it is shown.
- Commit only when the whole gate passes with a real exit code: `pnpm run verify:all`. Do not chain a commit after a pipe, which hides a failure (this happened twice in session one and was repaired).
- Ask the builder before: publishing a post, submitting the form, creating a Switch user on a shared server, inviting real people into a room, posting any comment on a Switch issue, deleting anything, changing a Vercel setting.
- Place the two instruction files in `reference/` (gitignored): `HAWSER_BUILD_INSTRUCTION.md` and `HAWSER_ADDENDUM.md`. The addendum overrides the main file. The winning-system document V5 was never supplied; the build instruction carries what was needed.

## 1. State in one screen

Repository: https://github.com/0xkinno/hawser (private so far; it must be public before submission). Site: https://hawser-kinnoskis-projects.vercel.app (Vercel project `hawser` in team `kinnoskis-projects`, root directory `apps/web`, Next.js 15.5.29; older 15.1.6 is refused by Vercel as vulnerable).

Done and verified in session one:

| Area | State |
|---|---|
| Rails: authorship hook, attribution workflow, copy check, CI, devcontainer, templates | done |
| Laytime counter, reconciler, digest, bundle verifier, 127 tests, 16 published worked examples (15 reproduced, 1 recorded mismatch) | done |
| Timekeeper: model-free agent on the raw WebSocket, exclusive role with standby, rebuild from the room, PDF and bundle | done, tested on a real switch-core |
| Probes P01 to P04, P06 to P11, P14 and break cases B1 to B4, B6 to B11 on a real switch-core 0.31.0 | done, results in `probes/results/` |
| Scenarios S1 to S6 with counterfactuals; 20 seeded variations and a 300 seed robustness run | done |
| `docs/FACTS.json` generated from the evidence, checked in CI | done |
| Web app: landing, desk page, verify, findings, judge, trace, stats endpoint; 152 browser tests across six viewports, axe clean | done, deployed |
| README, FINDINGS, EVIDENCE, SDK_SURFACE, RISK, PROOF, JUDGE, DESIGN, MOMENT, SUBMISSION, BLOG drafts | done |
| Track 3 shortlist and claim comments | done, in `docs/TRACK3.md` |

Not done, in the order that matters:

1. **A real call with real people on the real server.** Everything recorded so far is a local switch-core 0.31.0 started from the Switch repository with a local Postgres, and three simulated people (stand-in agents). This is the biggest gap, because the Track 1 rules require the video to show the agent working in a real chat with teammates.
2. Slack and Telegram bridges, identity claims, the Claude Code and OpenCode company agents under Switch Console, the version 2 templates (P13).
3. P05, P12, B5: need real Slack and Telegram.
4. Codespace server runs of the probes and the campaign (results so far are from the local dev server).
5. Demo video, blog post, #HowISwitch post, form submission.
6. Track 3 pull requests: none opened.
7. Screenshots of Slack, Telegram and the signed PDF for the README. The hero image is done.
8. The judge-agent red team rounds on the deployed URL.

## 2. Repository map and commands

```text
packages/laytime         counter, calendar, NOR validity, reconciler, digest, sha256, log parser, bundle verifier
packages/switch-client   typed Gateway client and agent client (HTTP ops, WebSocket with exact string ids)
apps/timekeeper          the model-free agent (src/call.ts is the state machine, src/service.ts the Switch wiring)
apps/web                 the site (Next.js 15, fontsource fonts, CSS tokens in app/globals.css)
probes/                  p01.. scripts, break-campaign.ts, lib.ts, results/
scripts/                 dev-switch.sh, dev-world.ts, e2e-local.ts, register-timekeeper.ts, set-addressing.ts,
                         link-rooms.ts, facts.ts, scenarios.ts, build-templates.ts, verify-bundle.ts, check-copy.mjs,
                         start/stop/kill-timekeeper scripts
agents/                  instructions of the three company agents (source of the templates)
templates/               generated YAML, one per company. Regenerate with: pnpm templates
fixtures/                terms/brake.json and scenarios/S1..S6
runs/                    recorded run bundles (the one here is simulated people)
docs/                    everything else; FACTS.json is generated
.devcontainer/           the Codespace runtime
reference/               gitignored; the two instruction files, a Switch clone, local notes
```

```bash
pnpm setup && pnpm install
pnpm run verify:all        # lint, typecheck, tests, copy check. Must pass before every commit
pnpm facts                 # regenerate docs/FACTS.json; pnpm facts:check in CI
pnpm --filter @hawser/web sync     # copy evidence into apps/web/data; sync:check in CI
pnpm verify runs/<bundle>.json     # offline recompute of one run
pnpm --filter @hawser/timekeeper build       # esbuild bundle used by scripts/start-timekeeper.sh
pnpm --filter @hawser/web build && pnpm --filter @hawser/web start          # site on :3100
cd apps/web && pnpm exec playwright test --trace off                       # six viewports, axe
```

The Biome formatter must not touch `apps/web/data`, `runs` or `probes/results` (already ignored). After you add a result file run `pnpm facts` then `pnpm --filter @hawser/web sync`, or CI fails the staleness checks.

## 2a. Questions the builder asked, answered

- **Does the laptop need Docker?** No, not for the primary path. The server and agents run in the Codespace, whose devcontainer already includes Docker, and the laptop runs Switch Console only. Docker on the laptop is needed only if the builder chooses to run the Switch server on the laptop itself (`just up`), or to run Switch's own test suite for Track 3 locally. Console's "Run a server on this computer" option needs no Docker either.
- **Telegram:** the bot token from @BotFather is entered in Switch Console (the bridge settings of the server), not in this repository and not in chat. No agent needs the token except Switch itself. Steps: in Telegram open @BotFather, send `/newbot`, pick a name and a username ending in `bot`, copy the token; send `/mybots`, choose the bot, Bot Settings, Group Privacy, Turn off (do this before adding the bot to the group); create a Telegram group for the ship's bridge room and add the bot; then in Console connect Telegram on the server and paste the token there, following `reference/switch/docs/official/deploy/messaging-apps/telegram.md`. A screenshot of the group is useful for the README and the video, but never a screenshot that shows the token.
- **Slack:** a free workspace and a Slack app created from Switch's manifest or by hand, with a bot token (`xoxb-`) and an app token (`xapp-`), entered in Console too, per `slack.md` in the same folder. Then invite the bot to the desk channel.
- **Claude Code and OpenCode:** no API key goes in `.env.example` or anywhere in the repository. Claude Code uses the builder's own login: run `ssh <codespace alias>`, then `claude`, and follow the login link once. OpenCode's free model needs no key. Console starts both on the Codespace; the only things to provide are those two sign-ins and the working directory (the templates use `{$agents_dir}`, which already exists on the host).
- **Secrets rule:** `.env.example` is committed to a repository that becomes public. It lists names only. Real values live in `.env` (gitignored) on the Codespace, in Console, and in GitHub or Vercel secret stores.
- **Codespaces from the cloud session:** tested at the end of session one after the builder approved the GitHub App's updated permissions. `gh api repos/0xkinno/hawser/codespaces` and the machines endpoint both answered `Resource not accessible by integration` (HTTP 403), and `gh codespace list` was blocked by the session proxy. So the Codespace has to be created from the builder's machine (`gh codespace create --repo 0xkinno/hawser --machine basicLinux32gb`), where the agent with `gh` and the `codespace` scope can then drive it with `gh codespace ssh -c <name> -- '<command>'`.

## 3. The plan for the remaining hours

### 3.1 Server and accounts (needs the builder)

Follow `docs/RUN_REMOTE_HOST.md` exactly; it was checked against the Switch docs at commit 9e158a7. Short version: GitHub CLI with the `codespace` scope, create the Codespace on `0xkinno/hawser` (the `.devcontainer` installs Docker, Node 22, Python, sshd, tmux, OpenCode and Claude Code), write the SSH config (the `Include codespaces` line goes at the top of `~/.ssh/config`), set the idle timeout to 240 minutes, onboard the host in Switch Console, add a server on the remote host, note the Gateway URL and API URL (two different addresses, never derive one from the other).

A Codespace is a Linux host, so the server can alternatively run on the builder's machine with Docker: from a clone of the Switch repository, `just init-env`, `just up`, `just run`. In that case probes and the campaign still work as written, with `SWITCH_URL` pointing at it.

Then create the four Switch users `saltmarsh-owner`, `weserkai-agency`, `kestrel-charterer`, `hawser-service` in the Gateway (ask first). Each person links their platform account to their Switch user from the server Home page. By default an agent answers only its owner until the account is linked.

Needed from the builder: GitHub login with `codespace` scope; Claude Code signed in on the Codespace (`ssh <alias>`, then `claude`); a Slack workspace with an app (bot token `xoxb-`, app token `xapp-`, per `reference/switch/docs/official/deploy/messaging-apps/slack.md`); a Telegram bot from @BotFather with Group Privacy turned off before the bot is added, an existing Telegram group for the bridge room, and the people's usernames; the personal registration key of `hawser-service` (Gateway, API keys); people to play the master and the charterer (recommended) or a second and third account of the builder.

### 3.2 Timekeepers

```bash
export SWITCH_URL=...    # the agent bridge address
export SWITCH_AGENT_REGISTRATION_TOKEN=...   # hawser-service's registration key
pnpm exec tsx scripts/register-timekeeper.ts --dry-run
pnpm exec tsx scripts/register-timekeeper.ts      # prints the .env lines; keys are shown once
```

Put the ids and keys, `HAWSER_DESK_ROOM_ID`, `HAWSER_BRIDGE_ROOM_ID` and `HAWSER_CALL_CONFIG` in `.env` on the Codespace (see `.env.example`), then `bash scripts/start-timekeeper.sh`. Write the call configuration by hand for the real call: copy `.data/call-config.json` shape from `scripts/dev-world.ts`. For real people put their sender ids in `participants` (not `name:` entries; names can be spoofed). The Timekeeper's addressing must admit the people in the desk room: `register-timekeeper.ts` sets it when `HAWSER_DESK_ROOM_ID` and gateway login are present; the dev stack proved it is required.

After any Codespace stop or rebuild: start it, restart the server from Console, restart the agents from Console (they run under tmux), then `bash scripts/start-timekeeper.sh`.

### 3.3 Company agents, rooms, templates

Run `templates/port-call.template.yaml` as the agency account, `party-shipowner` and `party-charterer` as the other two accounts, in Console. The templates are generated from `agents/*.md`. They have never been run: P13 (can a second account `join:` a room the first created?) is open. If `join:` across owners is refused, the agency invites the agent with the `invite_agent_to_room` operation, and the reason goes into FINDINGS. Per-company addressing: `pnpm exec tsx scripts/set-addressing.ts <agent> <desk-room-id> --people a,b`, run with that company's owner login. Adopt the Telegram group as the bridge room in Console, then `pnpm exec tsx scripts/link-rooms.ts ship-mate <bridge-room-id> <desk-room-id>`. Both scripts are untested against a real server beyond a dry run, so read their output.

### 3.4 Probes on that server

```bash
bash probes/run-all.sh                 # p01..p14 and b8; scripts write probes/results/*.json with provenance
pnpm probes:break                      # B1..B11 with live Timekeepers; HAWSER_FAULT=<case> runs one
```

The probe scripts create their own rooms and use stand-in agents from `.data/world.json`, which `scripts/dev-world.ts` builds on a server where you hold admin login (`SWITCH_ADMIN_EMAIL`, `SWITCH_ADMIN_PASSWORD`). On the real server, either run `dev-world` against it (creates users named after the cast, so do it only on a server where that is acceptable) or adapt `probes/lib.ts`. The environment string in results is set by `HAWSER_PROBE_ENV`: set it to say "Codespace".

Do by hand, and record in new result files (`probes/results/p05-<date>.json` and so on, same shape): P05 and B5 (edit a Slack message and a Telegram message after posting a time; does the Switch room record change?), P12 (send a photo in Telegram; does Claude Code under Console read it?), P13 (above). Never write a result that was not observed. Then `pnpm facts`, sync, `docs/FINDINGS.md` update, commit.

### 3.5 The recorded call

Roles: the master (Telegram), the port agent and the charterer's manager (Slack). Fictional names; say plainly who really played each. Script, one take, under 3 minutes (timeline in section 18 of the build instruction):

1. The master sends a photo of a deck log page with NOR at 16:41. `ship-mate` writes it into `log-vessel` with the photo as the source.
2. The port agent confirms all fast. `agency-clerk` writes it.
3. A difference is priced and only the right person is asked; they answer with `@timekeeper settle <EVENT>: YYYY-MM-DD HH:MM zone`.
4. The charterer types "noted"; the room records it as not accepted. Then `@timekeeper accept nor without prejudice <digest>`.
5. Break moments: `ship-mate` edits `log-charterer` and Switch refuses; `agency-clerk` rewrites its own log after signing and the signatures are voided; kill `timekeeper-a` (`bash scripts/kill-timekeeper-a.sh`) and `timekeeper-b` takes over (about 22 to 25 seconds, so cut the wait on screen and label it).
6. Three signatures, the PDF lands in both rooms, the verifier page recomputes the digest.

To make the real run the site's evidence: the Timekeeper writes `<data dir>/artifacts/<call>-<digest>.json` and the PDF when the third signature arrives. Start it with `HAWSER_PROVENANCE_MODE=live` and `HAWSER_PROVENANCE_LABEL="people in Slack and Telegram, switch-core <version> in a GitHub Codespace"`. Copy the JSON and PDF into `runs/` (`pnpm verify` it), `pnpm facts`, `pnpm --filter @hawser/web sync`, run the gate, commit, push. Vercel redeploys on push. The desk page banner reads the bundle's provenance, so it will say live instead of simulated by itself. Keep the old simulated bundle too, labelled.

Screenshots for the README: the desk room in Slack, the bridge room in Telegram, the signed PDF. Replace the two lower images in the README grid and remove the sentence under it that says they are pending.

### 3.6 Track 3

`docs/TRACK3.md` has the ranked shortlist, the claim comments, the rules and the procedure. The builder posts the comments himself, or says so and the agent posts them with `gh issue comment`. Do not post anything without approval. Realistically: one finished pull request is a good outcome; every issue already has competing pull requests and the maintainer keeps one per issue. Start with #796 (SMS through Twilio) and #792 (Signal).

### 3.7 Submission

`docs/SUBMISSION_WEMAKEDEVS.md` mirrors the form. Before the builder submits: repository public; README states which mode the video used; demo video under 3 minutes linked in README and the form; blog and #HowISwitch drafted (`docs/BLOG.md`) and published only with approval; `pnpm run verify:all`, `pnpm facts:check`, the CI run green on GitHub, and the attribution workflow green; tag `v1.0-submission` and freeze the deployment; confirm with the organisers which link goes in the repository field when both tracks are entered.

## 4. Things that will surprise you (all measured, see `docs/FINDINGS.md`)

- The live transport is the WebSocket; the server pings every 10 seconds. Event ids are near 2^53 and the client keeps them as strings.
- A crashed role holder keeps its exclusive role about 25 to 30 seconds. Graceful `release_role` is immediate.
- The role lease belongs to the agent, not the room. Two agents assuming a fresh role at the same instant can both be told yes; the Timekeeper checks the roster afterwards.
- Room documents keep no history. An update posts a one line notice naming the document; the Timekeeper uses it to re-read at once.
- New agents are owner-only and Switch posts a visible refusal to anyone else, including to people addressing the Timekeeper.
- Two connections of one agent take each other's room claim.
- `/gateway/version` needs a login.
- Local wall-clock times can name two instants or none (clock changes). The reconciler abstains and asks for the offset.

## 5. Known limits, stated so nobody claims more

- All recorded evidence so far is from a local switch-core and simulated people; the attack messages were scripted, not model-generated.
- The counter does not model "unless used", reversible laytime, shifting time, laytime from cargo quantity, or waiver (`packages/laytime/NOT_MODELLED.md`).
- Money at stake is the difference of two settlements rounded to the cent, so it can differ by a cent from the exact figure (`docs/RISK.md`).
- The signed PDF in `runs/` carries a verify link to a placeholder host, written before the site existed. A new run will carry the real one (`HAWSER_VERIFY_URL`, default now the Vercel URL).
- Version 2 templates, the Slack and Telegram bridges, identity claims and `link_rooms` are designed, not run.
- Teras Chartering v Hyupjin Shipping (scenario S4's inspiration) could not be opened by script; its details are not cited anywhere.

## 6. Vercel

Project `hawser`, id `prj_eYeaVIeJ83nZnlOCvbna1xR9RDQs`, team `team_sVyjRdkD8GtLSBSLzikfErzn`, linked to `0xkinno/hawser`, production branch `main`, root directory `apps/web`. It builds `pnpm run build` there; the `prebuild` step copies evidence from the repository root and, if the root is not present, uses the committed copies in `apps/web/data`.

**Decision for the builder, not made by the agent:** during session one the project's Vercel Authentication (deployment protection) was switched off so that judges see the site without a login, which the brief requires ("never leave a judge facing a login"). That was a protection setting changed without asking first. If the builder wants it back on for the production URL, it is under project Settings, Deployment Protection; judges would then need a different public URL, for example a custom domain, which Vercel does not protect by default under the setting "all except custom domains".

Optional environment variable: `NEXT_PUBLIC_DEMO_VIDEO_URL`. When set, the landing page shows "Watch the 2-minute demo" and links to it.

## 7. Evidence of this session

Commits are listed in `docs/MILESTONES.md`. The numbers the site shows are in `docs/FACTS.json`: 15 of 16 external examples, 10 of 10 runnable break cases, silent rewrite detection median 2.2 s, clock failover median 21.9 s, and the reconciler at 0 false and 0 missed divergences with 271 abstentions on 16,498 generated events (the 77 false divergences of the first version are documented as a defect that testing caught).
