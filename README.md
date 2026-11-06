<p align="center"><img src="docs/screens/landing-desktop-1440.png" alt="HAWSER landing page" width="100%"></p>

# HAWSER

**One Switch room where a ship's master, a port agent and a charterer, and their three AI agents, agree every minute in port and sign the Statement of Facts before the ship sails.**

[![CI](https://github.com/0xkinno/hawser/actions/workflows/ci.yml/badge.svg)](https://github.com/0xkinno/hawser/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) ![built on Switch 0.31](https://img.shields.io/badge/built%20on-Switch%200.31-0F1C2E)

Friday, 16:41, off Brake. Captain Rui sends Notice of Readiness. The charterer answers "noted". The agent writes 16:50 in his own book. Under a clause like "laytime commences 0800 the next working day after valid NOR", the gap between those records decides who pays for the weekend. (Captain Rui, the vessel and the companies are fictional.)

This is not a made-up risk. In April 2026 the English High Court removed about USD 840,000 of discharge port demurrage at Brake from an arbitration award, because the notice of readiness had been tendered before the ship had arrived and the court found no valid basis for treating that as waived: [Trans Trade RK SA v Sebat Shipping and Trading Company [2026] EWHC 950 (Comm)](https://caselaw.nationalarchives.gov.uk/ewhc/comm/2026/950), paragraphs 4, 85, 86 and 98.

| | |
|---|---|
| Live | https://hawser-kinnoskis-projects.vercel.app (no login; a custom domain can replace it) |
| For judges | `/judge`, a 60 second walk |
| Demo video | to be linked at submission, under 3 minutes |
| Track | Track 01, Best Business Workflow. Also entered for Track 03, Best Core Contribution |
| Agents connected | Claude Code (shipowner), OpenCode (agency and charterer), and the Timekeeper, our own agent with no model |
| Messaging apps | Slack (desk room) and Telegram (the ship's bridge room), linked. Status in the table below |
| Measured | 15 of 16 published worked examples reproduced, 10 of 10 runnable break cases held, a silent rewrite detected in a median 2.2 s, a crashed clock replaced in a median 21.9 s. All from [`docs/FACTS.json`](docs/FACTS.json) |

<p align="center">
<img src="docs/screens/call-desktop-1440.png" alt="The port call desk page" width="49%">
<img src="docs/screens/findings-desktop-1440.png" alt="The findings page" width="49%">
<img src="docs/screens/verify-desktop-1440.png" alt="The in-browser verifier" width="49%">
<img src="docs/screens/judge-desktop-1440.png" alt="The judge path" width="49%">
</p>

The desk room in Slack, the bridge room in Telegram and the signed PDF will replace the two lower images after the recorded call with people. Until then everything shown is a recorded run on a real Switch server, and the people in it are labelled as simulated. The hero photograph was generated for this project.

## The problem

A port call is a team of three companies. The ship's master keeps the deck log. The port agent writes what he sees on the quay. The charterer's operator is in another time zone and replies "noted". Each keeps their own record of the same minutes, in their own chat, email and spreadsheet. The Statement of Facts is compiled afterwards and signed in a hurry before sailing, and the disagreements surface weeks later at the claims desk, when the only evidence is three versions of the story.

| What is true | Source |
|---|---|
| In the April 2026 Brake judgment the Statement of Facts said the ship anchored at 1100 and the ship's log said 1450. The award included US$840,017.19 of demurrage at Brake. The court held the tribunal erred in law in treating laytime as started by the commencement of cargo operations after an invalid notice, and varied the award to US$4,114.06 and about EUR 21,616 "and no more". | [National Archives, paras 4, 11, 12, 85, 86, 98, 104](https://caselaw.nationalarchives.gov.uk/ewhc/comm/2026/950) |
| Charters often make demurrage payable on a Statement of Facts "mutually confirmed by Master and ... PORT AUTHORITIES", and the facts in it can themselves be disputed. | [High Seas Venture v Sinom [2007] EWHC 673 (Comm)](https://caselaw.nationalarchives.gov.uk/ewhc/comm/2007/673) |
| A Saturday 08:00 arrival with NOR on arrival at Paranagua saw laytime start on Monday 08:00, two days on the owner's side. | [Maritime Executive, 31 May 2026](https://maritime-executive.com/article/the-hidden-clause-contradictions-driving-demurrage-claims) |
| A single miscategorised six hour weather event at USD 20,000 a day changes a claim by USD 5,000. | [Voyager Portal](https://www.voyagerportal.com/the-basics-of-demurrage-a-guide-for-commodity-traders/) |
| The Statement of Facts should avoid phrases such as "about noon" because laytime disputes turn on exact times. | [HandyBulk](https://www.handybulk.com/what-is-laytime/) |

Details, with what was and was not opened, are in [`docs/MOMENT.md`](docs/MOMENT.md).

## What HAWSER does

1. **Log.** Each company's agent appends to its own log, with a source for every time: a photo, a message, a quay check. Switch lets no other agent change it.
2. **Reconcile.** The Timekeeper, an agent with no model, compares the three logs in UTC, prices every disagreement in money the moment it appears, and abstains on a time that carries no zone.
3. **Ask.** It asks only the one person a fact binds. A casual "noted" is recorded as received, never as acceptance of a notice.
4. **Sign.** The master, the port agent and the charterer sign a version digest in chat. A silent rewrite of any log voids the signatures and tells the room.
5. **Close.** A Statement of Facts and laytime time sheet, as a PDF, lands in the rooms with a bundle anyone can recompute offline.

What each person physically does: the master photographs the deck log page and signs; the port agent confirms the quay events and signs; the charterer's manager decides the notice with an exact phrase and signs. What always gets through to a human: a notice tendered, a notice decision, free pratique when required, all fast, completion.

## Explore in 2 minutes

1. Open [the port call](https://hawser-kinnoskis-projects.vercel.app/call/call-saltmarsh-grace-brake-simulated-2026-11-06): three logs on one time axis, one priced difference, "noted" recorded as not accepted, three signatures on one digest, the PDF.
2. Press **Replay the call**, or **Guided tour**.
3. Open [Findings](https://hawser-kinnoskis-projects.vercel.app/findings): every probe and break case with its date and the server it ran on.
4. Open [Verify](https://hawser-kinnoskis-projects.vercel.app/verify): recompute the digest and the laytime figure in your own browser.

## How Switch is used

**Agents and owners.** Four Switch users own the agents: `saltmarsh-owner` (`ship-mate`, Claude Code), `weserkai-agency` (`agency-clerk`, OpenCode), `kestrel-charterer` (`charter-desk`, OpenCode) and `hawser-service` (`timekeeper-a` and `timekeeper-b`, our own protocol client). Three companies, three owners, no shared keys.

**Channels.** The desk room runs on Slack, the ship's bridge room on Telegram, joined by a labelled link. Templates, one per company, are in [`templates/`](templates) and are generated from the agent instructions in [`agents/`](agents) so they cannot drift.

**What only Switch makes possible, each with the evidence that it was observed:**

- *A company log only its own agent can write.* The server refuses another agent's edit and delete with HTTP 403 ([probe P03](probes/p03-cross-edit.ts), break case B3). The charter terms are a template `docs:` document written by a person, so no agent can change them.
- *One clock at a time.* The `timekeeper` role is exclusive. A standby takes over after a crash in a median 21.9 s with an identical digest, five times out of five (B6, P06).
- *Each company's agent refuses the others' people.* New agents answer only their owner and Switch posts a visible refusal to anyone else (P08, P09).
- *Revisions anchored in the room.* Switch keeps no revision history and its update notice does not say what changed (P04). The Timekeeper fingerprints every revision of each log and posts the fingerprint into the room's own record.
- *Resume across a restart.* The Timekeeper's connection resumes from its saved cursor after a server restart with no duplicate cards (P07, B7).
- *A model-free agent on the raw protocol.* The Timekeeper speaks the WebSocket at `/connection/ws` directly. No SDK, no model, every output reproducible.

**Would it stop working without Switch?** Yes. The three-company property is Switch's: ownership, per-agent addressing, author-locked room documents and the exclusive role lease are the mechanisms the guarantees rest on, and the break campaign shows each one holding on a live server. Remove Switch and what remains is a shared chat thread, which is exactly the record this project exists to replace.

Every Switch feature used, with file and line references, is in [`docs/SDK_SURFACE.md`](docs/SDK_SURFACE.md). What was found is in [`docs/FINDINGS.md`](docs/FINDINGS.md).

## Architecture

```mermaid
flowchart LR
  subgraph TG["Telegram: bridge room"]
    M["Captain Rui (master)"]
  end
  subgraph SL["Slack: desk room"]
    J["Jonas (port agent)"]
    P["Priya (charterer ops)"]
  end
  subgraph SW["Switch server"]
    SM["ship-mate<br/>owner: shipowner"]
    AC["agency-clerk<br/>owner: agency"]
    CD["charter-desk<br/>owner: charterer"]
    TK["timekeeper (exclusive role)<br/>no model, WebSocket"]
    LV[("log-vessel<br/>only ship-mate writes")]
    LA[("log-agency<br/>only agency-clerk writes")]
    LC[("log-charterer<br/>only charter-desk writes")]
    CT[("charter-terms<br/>deployer document")]
    SEQ[["room messages<br/>append-only, ordered"]]
  end
  M -- "photo of deck log" --> SM --> LV
  J --> AC --> LA
  P --> CD --> LC
  LV & LA & LC & CT --> TK
  TK -- "revision fingerprints, difference cards, clock cards" --> SEQ
  TK -- "asks the one person a fact binds" --> M & J & P
  M & J & P -- "sign digest / accept NOR digest" --> TK
  TK -- "signed SOF and time sheet PDF" --> SL & TG
```

```text
        ONE SWITCH ROOM
 shipowner        port agency        charterer
 ship-mate        agency-clerk       charter-desk
    |                 |                  |
 [log-vessel]     [log-agency]      [log-charterer]     [charter-terms]
 only ship-mate   only the clerk    only charter-desk    written by a person,
 can write        can write         can write            no agent can write
          \           |            /
           timekeeper (exclusive role, no model): reads all, counts, posts cards
```

```mermaid
sequenceDiagram
  participant Master
  participant Mate as ship-mate
  participant TK as Timekeeper
  participant Priya
  Master->>Mate: photo of the deck log page
  Mate->>TK: appends NOR_TENDERED 16:41 Europe/Berlin to log-vessel (source: photo)
  TK->>TK: fingerprint, reconcile, price any difference
  TK-->>Priya: NOR card with its digest, engine reading shown, not a legal call
  Priya->>TK: "noted"
  TK-->>Priya: recorded as received, not as accepted, with the exact reply form
  Priya->>TK: accept nor without prejudice DIGEST
  TK-->>Master: Statement of Facts version, digest
  Master->>TK: sign DIGEST
  Priya->>TK: sign DIGEST
  TK-->>Master: closed, PDF posted in both rooms
```

## Product flow

```mermaid
flowchart TD
  A[Company agent appends a log line] --> B{Zone present and unambiguous?}
  B -- no --> Q[Ask once, do not place the time]
  B -- yes --> C[Fingerprint, reconcile in UTC]
  C --> D{Differs beyond tolerance?}
  D -- no --> E[OBSERVED]
  D -- yes --> F[Price it, show both claims]
  F --> G{Critical event or money over threshold?}
  G -- no --> H[Shown, nobody asked]
  G -- yes --> I[Ask the one person it binds]
  I --> J[Settled by that person's exact reply]
  E --> K[Statement of Facts version and digest]
  H --> K
  J --> K
  K --> L{Three signatures on this digest?}
  L -- yes --> M[Closed: PDF posted, bundle exported]
  L -- no --> N[Wait]
  O[Any source changes after signing] --> P2[Signatures void, new version, room told]
  K -.-> P2
```

## What it will not do

| It will not | Enforced by |
|---|---|
| Let another company's agent edit a log | Switch itself (HTTP 403), break case B3 |
| Count a casual reply as acceptance of a notice | `apps/timekeeper/src/sign.ts` and `call.ts`, B1, B2 |
| Sign for a person | Enrolled signer check in `call.ts`, B11 |
| Accept a signature on any version but the current digest | `call.ts`, tested in `call.test.ts` |
| State a money figure from a model | Money guard in `moneyGuard.ts`, B10 |
| Place a time with no zone, or one that is ambiguous | `packages/laytime/src/reconcile.ts`, B9 |
| Present the engine's reading of a notice as the law | Both readings shown in the time sheet |
| Run two clocks | Exclusive role, plus a roster check after `assume_role` |

## Proof

- The laytime counter reproduces **15 of 16** published worked examples (HandyBulk, Voyager Portal, xSHIPx). The one mismatch is a charter with an "unless used" clause the counter does not model, and that source is also internally inconsistent. Every example, with its URL and access date, is in [`packages/laytime/test/external/`](packages/laytime/test/external).
- Six scenarios shaped on public sources, each with a counterfactual: a single chat thread leaves **6** unresolved items for the claims desk and surfaces none before sailing; HAWSER surfaces **6** and asks **3** questions. See [`fixtures/scenarios/`](fixtures/scenarios).
- A break campaign on a live Switch server: **10 of 10** runnable cases held. B5 needs a real Slack message edit and was not run.
- The reconciler on 16,498 generated events across 300 seeds: **0** false divergences and **0** missed, and **271** abstentions on wall-clock times that did not name one instant. An earlier version guessed those and produced **77** false divergences; that defect is documented rather than hidden.
- Misses and surprises are kept in [`docs/FINDINGS.md`](docs/FINDINGS.md). Not every number is good: failover after a crash takes about 22 seconds, not the "few seconds" the documentation suggests.

## Findings on Switch

Short version: authorship, ownership and addressing made a three-company room possible with no custom authentication. Switch's update notice does not say what changed and no history is kept, which the Timekeeper covers. A crashed holder keeps its role for about 30 seconds. Full list, with dates and the server they ran on: [`docs/FINDINGS.md`](docs/FINDINGS.md).

## What is live, recorded and simulated

| Part | Status |
|---|---|
| Switch server, agents, rooms, role lease, documents | Live: a real switch-core 0.31.0, run for the probes and the break campaign on 6 November 2026. Started from the cloned repository with a local Postgres, not on the Codespace |
| The three people in the recorded call | **Simulated**: stand-in agents, labelled on the call page. A recorded run with people in Slack and Telegram replaces it |
| Company agents' words in the break campaign | Scripted, not generated by a model |
| Slack and Telegram bridges | Not yet connected. They need the owner's tokens, listed in `docs/HANDOFF.md` |
| Claude Code and OpenCode company agents | Instructions and templates written, not yet run under Console |
| Laytime counter | Live code, checked against published examples |
| This website | Reads recorded run bundles and does not talk to a Switch server |

## Run it

Prerequisites: Node 22, pnpm 10, and for the live path a Switch server. Docker is not needed on your own machine for the Codespace path (the Codespace has it); it is needed only to run the Switch server on your machine with `just up`.

```bash
git clone https://github.com/0xkinno/hawser && cd hawser
pnpm setup          # enables the commit hook
pnpm install
pnpm test           # laytime counter, Timekeeper, scenarios, templates
pnpm verify runs/call-saltmarsh-grace-brake-simulated-2026-11-06.json   # offline, no keys
pnpm facts:check    # facts match the evidence
```

**Codespace path (primary).** The server, the agents and the Timekeeper run in a GitHub Codespace and are driven from Switch Console on a laptop. Follow [`docs/RUN_REMOTE_HOST.md`](docs/RUN_REMOTE_HOST.md), then:

```bash
pnpm exec tsx scripts/register-timekeeper.ts --dry-run
bash scripts/start-timekeeper.sh
```

**Console path (alternative, no Docker).** In Switch Console choose "Run a server on this computer". The Timekeeper scripts work the same.

**Without Console, for development.** `bash scripts/dev-switch.sh start` runs a real switch-core from `reference/switch` with a local Postgres. `pnpm exec tsx scripts/dev-world.ts` creates the cast, `pnpm exec tsx scripts/e2e-local.ts` runs a call end to end, `pnpm probes:break` runs the break campaign.

The server and agents for the recorded demonstration ran in a GitHub Codespace and were driven from Switch Console. The development runs in this repository ran on a local server, and say so.

**Browser tests and demo footage.** `cd apps/web && pnpm exec playwright test` runs 152 checks across six viewports with axe. `pnpm exec playwright test -c playwright.demo.config.ts` replays every user action (anchors, replay, seven-step tour, both themes, verify pass, tampered bundle refused, junk file refused) and records video at 1440 by 900 and 393 by 852 into `demo-footage/`, which is not committed.

## Judging criteria map

| Criterion (weight) | Where to look |
|---|---|
| Use of Switch (30%): "Is Switch central, and would the project stop working without it?" | How Switch is used, `docs/SDK_SURFACE.md`, `docs/FINDINGS.md` |
| Technical execution (25%): "Does it run, and could someone clone the repo and reproduce it?" | Run it, CI, `pnpm verify`, `probes/`, `scripts/e2e-local.ts` |
| Creativity and impact (25%): "Is it a fresh idea that solves a problem a real team has?" | The problem, the Brake judgment, the scenarios |
| Presentation (20%): "Do the demo video and README make clear how Switch is used?" | This README, `/judge`, the demo video |

## Disclosures

AI coding assistants were used to write this repository, including Claude Code. The author is 0xkinno and can explain every part. The people, companies and vessels are fictional, and the charter terms are a fictional recap modelled on the public Brake facts. No real charter, vessel or crew data is used. No prior work was reused. Quoted court text is limited to a few facts with paragraph numbers, and the judgment page was read and cited, not scraped.

## Track 3, Best Core Contribution

Claim comments are posted on [#796 (SMS through Twilio)](https://github.com/sandbox-quantum/switch/issues/796) and [#792 (Signal)](https://github.com/sandbox-quantum/switch/issues/792) in `sandbox-quantum/switch`, from the fork `0xkinno/switch`. No pull request is open yet; the log is [`docs/TRACK3_LOG.md`](docs/TRACK3_LOG.md) and nothing is claimed as merged.

## Repository map

[`packages/laytime`](packages/laytime) the counter, reconciler, digest and bundle verifier. [`apps/timekeeper`](apps/timekeeper) the model-free agent. [`apps/web`](apps/web) the site. [`packages/switch-client`](packages/switch-client) a typed Gateway and agent client. [`probes`](probes) and [`runs`](runs) the evidence. [`fixtures`](fixtures) scenarios and terms. [`templates`](templates) and [`agents`](agents) the company side.

Docs: [`RULES_EXTRACT`](docs/RULES_EXTRACT.md), [`SPONSOR_INTEL`](docs/SPONSOR_INTEL.md), [`MOMENT`](docs/MOMENT.md), [`THESIS`](docs/THESIS.md), [`RISK`](docs/RISK.md), [`FINDINGS`](docs/FINDINGS.md), [`PROOF`](docs/PROOF.md), [`EVIDENCE`](docs/EVIDENCE.md), [`SDK_SURFACE`](docs/SDK_SURFACE.md), [`TASK`](docs/TASK.md), [`PROGRESS`](docs/PROGRESS.md), [`MILESTONES`](docs/MILESTONES.md), [`JUDGE`](docs/JUDGE.md), [`DESIGN`](docs/DESIGN.md), [`HANDOFF`](docs/HANDOFF.md).

Licence: MIT.
