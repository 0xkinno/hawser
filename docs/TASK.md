# Task list (live)

Mark `[x]` only when done and verified.

### Phase 0. Repo, rules, safety rails
- [x] Create public repo `0xkinno/hawser`; set local `git config user.name "0xkinno"` and `user.email` to the address Kinnoski gives (or his GitHub noreply address)
- [x] Add `.gitignore` with `reference/`, `.env*` (except `.env.example`), `.data/`, `node_modules/`, `probes/results/*.local.json`
- [x] Add `.claude/settings.json`, `.githooks/commit-msg`, `.github/workflows/no-claude-attribution.yml` (Part 20); run `git config core.hooksPath .githooks`
- [ ] Clone references into `reference/` (Part 24); copy V5 into `reference/` (blocked: Switch repo access and V5 file pending)
- [x] Write `docs/RULES_EXTRACT.md`, `reference/LANE_MAP.md`, `docs/SPONSOR_INTEL.md` (rows marked to verify), `docs/MOMENT.md`, `docs/THESIS.md`
- [x] pnpm workspace skeleton, CI with lint, typecheck, test, check-copy
- Exit: CI green on an empty skeleton; first commit authored by 0xkinno with no trailer

### Phase 1. Switch server and accounts (with Kinnoski)
- [ ] Kinnoski installs Switch Console (Windows .exe) with Docker running; local server created; Console admin login works
- [ ] Create Switch users `saltmarsh-owner`, `weserkai-agency`, `kestrel-charterer`, `hawser-service` (ask first)
- [ ] Connect Slack (desk) and Telegram (bridge) per Switch docs; Telegram group privacy off before adding the bot
- [ ] Each human links their platform account to their Switch user (identity claims)
- [ ] Record server version, URLs, bridge names in `docs/SDK_SURFACE.md`
- Exit: a test message in Slack and Telegram appears in Switch rooms

### Phase 2. Probes first (pre-registered)
- [ ] Commit `docs/FINDINGS.md` with questions P01 to P14 only; record the commit hash
- [ ] Register `timekeeper-a` and `timekeeper-b` (Part 12.9); write probe scripts; run; record results
- Exit: FINDINGS.md has an observed result for every question, including surprises

### Phase 3. Laytime engine
- [ ] Types, calendar, NOR validity, commencement, engine, money, two-scenario helper
- [ ] Unit tests including the USD 1,996.53 assertion and the S1 Brake scenario
- [ ] External worked examples (at least 8) with sources; publish n of m and mismatches; `NOT_MODELLED.md`
- Exit: engine tests green; external results recorded

### Phase 4. Timekeeper service (the action path)
- [ ] WebSocket connection, state, ops helper, rebuild-from-room, tag idempotency
- [ ] Log watcher with fingerprints and revision cards; non-append detection
- [ ] Reconciler cards with verdicts and money at stake; interruption budget; abstention
- [ ] NOR card, strict grammar, RECEIVED_NOT_ACCEPTED handling, enrolment, signatures, version invalidation
- [ ] Clock card at port shift change and "laytime ends in 2 h" warning (unattended)
- [ ] SOF PDF and time sheet; post to both rooms; export bundle
- [ ] Lease: assume `timekeeper`; standby loop for B
- Exit: on the live server, a scripted call from first log line to three signatures and a posted PDF

### Phase 5. Company agents and templates
- [ ] `agents/*.md` instructions; three templates; addressing script; run each template under its own account
- [ ] Bridge room adopted on Telegram; link to desk room
- [ ] Real end-to-end run with Kinnoski and teammates playing the three people; export bundle to `runs/`
- Exit: one real recorded call, bundle verifies offline

### Phase 6. Web app core and README v1 (submittable checkpoint)
- [ ] `/call/[id]`, `/verify`, `/judge`, `/findings` reading real bundles; deploy to Vercel
- [ ] README v1 per Part 15 with real screenshots; `docs/SUBMISSION_WEMAKEDEVS.md` drafted
- Exit: Kinnoski could submit now (ask whether to submit an early version)

### Phase 7. Proof and break campaign
- [ ] Six scenarios with counterfactuals; reconciler both directions on scenarios plus 20 seeded variations
- [ ] Break cases B1 to B11 on the live server; fault switch documented
- [ ] `scripts/facts.mjs` -> FACTS.json; CI staleness check; `/api/stats`
- Exit: PROOF.md and FACTS.json complete, misses published

### Phase 8. Landing page and design pass
- [ ] DESIGN.md; SVG set; hero with generated image; sections per 13.3; glow cards; signature motion
- [ ] Desk page polish, both themes, guided tour
- Exit: Playwright viewport suite, axe and zero console errors green

### Phase 9. Hosted mode (only if Kinnoski chooses it)
- [ ] switch-core on Render (Docker image from GHCR) with Render Postgres, or on a small VM; Telegram and Slack connected to it
- [ ] Timekeeper on Render; `/api/live` read-only endpoint behind a public read token; reachability check script
- Exit: live page shows the hosted call; README states which mode the video used

### Phase 10. Red team, video, blog, submission
- [ ] Five judge-agent rounds (Appendix B of V5) on the deployed URL; fix; log in REDTEAM_LOG.md until a clean round
- [ ] Video under 3 minutes (Part 18); upload unlisted
- [ ] Blog draft in docs/BLOG.md; Kinnoski publishes (ask first); #HowISwitch post text drafted
- [ ] Final README, FACTS regenerate, tag `v1.0-submission`
- Exit: Kinnoski submits (ask first); deployment frozen

### Phase 11. Optional depth (only after Phase 10 is safe)
- [ ] Second port call from the same templates (generalisation check) with a different charter form
- [ ] Practitioner reply recorded
- [ ] Wispr usage card if Kinnoski dictated with Wispr Flow

### Addendum B.1 and B.2 (runtime)
- [x] `.devcontainer/devcontainer.json` and `.devcontainer/post-create.sh` committed; npm package names `opencode-ai` and `@anthropic-ai/claude-code` confirmed against the npm registry on 2026-11-06
- [ ] `docs/RUN_REMOTE_HOST.md` (B.3), `scripts/*timekeeper*.sh` and `probes/run-all.sh` (B.4): not started

### Addendum D.2 (Track 3)
- [ ] Shortlist in `reference/TRACK3_SHORTLIST.md` with drafted claim comments: blocked on read access to the Switch repository

### Later phases
Phases 1 to 11 follow Part 17 of `reference/HAWSER_BUILD_INSTRUCTION.md` and the order in addendum F.
