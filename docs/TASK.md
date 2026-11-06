# Task list (live)

Mark `[x]` only when done and verified. Updated at the end of session one, 6 November 2026. Details and next steps: `docs/HANDOFF.md`.

## Phase 0. Repo, rules, safety rails
- [x] Repository `0xkinno/hawser`, authorship 0xkinno only, hook tested, attribution workflow, CI
- [x] `.gitignore`, `.claude/settings.json`, `.githooks/commit-msg`, `.github/workflows/no-claude-attribution.yml`
- [x] Switch cloned into `reference/switch` (local, gitignored). Competitor clones skipped on purpose. V5 file not supplied
- [x] RULES_EXTRACT, MOMENT (sources opened and checked, corrections recorded), SPONSOR_INTEL (verified and corrected), THESIS
- [x] pnpm workspace, lint, typecheck, test, copy check

## Addendum B (runtime) and D (Track 3)
- [x] B.1 and B.2 devcontainer, B.3 `docs/RUN_REMOTE_HOST.md`, B.4 scripts
- [x] D.2 shortlist and claim comments in `docs/TRACK3.md`
- [x] D.3 fork `0xkinno/switch` cloned; claims posted on #796 and #792
- [ ] D.4 pull requests (none yet; see `docs/TRACK3_LOG.md`)

## Phase 1. Switch server and accounts
- [x] Codespace `literate-space-dollop-jj5479r4755xfpp4j` created (Docker, Node 22, Claude Code, OpenCode, tmux verified), repo synced
- [ ] Console onboarding of the Codespace, four Switch users, Slack and Telegram, identity claims (needs the builder)
- [x] A real switch-core 0.31.0 run locally for development and probes (not the Codespace)

## Phase 2. Probes
- [x] P01 to P04, P06 to P11, P14 on a real server; P08 and P10 with agent senders only
- [ ] P05, P12 (need real messaging apps), P13 (needs agent management)
- [ ] Re-run on the Codespace server

## Phase 3. Laytime counter
- [x] Complete. 16 external examples, 15 reproduced, mismatch recorded, NOT_MODELLED.md

## Phase 4. Timekeeper
- [x] WebSocket, state, rebuild, tags, fingerprints, reconciler cards, grammar, enrolment, signatures, voiding, clock cards, PDF, bundle, lease and standby
- [x] End to end on a real server (`scripts/e2e-local.ts`), simulated people

## Phase 5. Company agents and templates
- [x] `agents/*.md`, three templates generated from them, addressing and link scripts
- [ ] Run the templates under three accounts, adopt the Telegram bridge room, link rooms
- [ ] A real recorded call with people

## Phase 6. Web app core and README v1
- [x] `/call/[id]`, `/verify`, `/judge`, `/findings`, `/trace/[id]`, `/api/stats`, deployed on Vercel
- [x] README in the fixed order. Two screenshots pending the real call

## Phase 7. Proof and break campaign
- [x] Six scenarios with counterfactuals, 20 seeded variations and 300 seeds, B1 to B4 and B6 to B11 on a live server, FACTS.json, CI staleness check
- [ ] B5 (needs Slack)

## Phase 8. Landing page and design pass
- [x] DESIGN.md, SVG set, landing, glow cards, hawser line, guided tour, both themes, six viewports, axe, zero console errors
- [x] Hero photograph in place, compressed, with a phone layout and a social card

## Phase 9. Hosted mode
- [x] Dropped per the addendum: the Codespace is the hosted mode. Optional live read-only view not built

## Phase 10. Red team, video, blog, submission
- [x] Self red team (docs/REDTEAM_LOG.md), blog and post drafted
- [ ] Judge-agent rounds on the deployed URL
- [ ] Demo video, blog published, form submitted, tag `v1.0-submission` (all need the builder)

## Phase 11. Optional depth
- [ ] Second port call, practitioner reply, Wispr card (not applicable)
