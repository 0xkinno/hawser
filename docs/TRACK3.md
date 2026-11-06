# Track 3: Best Core Contribution

Copied from the working notes so a new session has it. Written on 6 November 2026 from issue pages read by a fetch agent, not through the GitHub API, so counts can be off by a person or two. Re-check each issue page before commenting. Times in WAT and UTC.

**Deadline: pull requests must be open before 7 November 2026, 19:29 WAT (18:29 UTC).**



## What changed from the addendum's assumptions

- All 63 open `hackathon` issues already have assignees (3 to 10). The addendum's rule "skip any issue already assigned" would exclude every issue.
- The maintainer (`petr-sandbox`) wrote on 22 and 29 October: issues are assigned to everyone who expressed interest, PRs are reviewed after the hackathon window, and only one PR is selected per issue. GitHub caps an issue at 10 assignees; on #804 and #801 the maintainer said a PR from a non-assigned person counts the same.
- A person is limited to five assigned issues.
- Consequence: a claim comment is cheap, but the win is "your PR is the one selected for that issue". Pick issues where few people compete and where we can finish with tests before 18:29 UTC on 7 November (19:29 WAT).

## Ranked shortlist

| Rank | Issue | Label | People interested | PRs already open | Why it fits us |
|---|---|---|---|---|---|
| 1 | #796 Add SMS (Twilio) as a messaging platform | hard, P3 | 4 | #1244 | We read the collaboration bridge code path. Webhook in, REST out, no threads. Maintainer wants an allow-list so strangers cannot run up costs. |
| 2 | #792 Add Signal as a messaging platform | hard, P2 | 4 | #1041, #1228 | Same adapter shape: a `signal-cli` daemon the user runs, groups map to rooms, quote-replies for threads. |
| 3 | #790 Add Google Chat as a messaging platform | hard, P2 | 3 to 8 | #1337, #1278 | Maintainer pre-approved Pub/Sub plus Workspace Events on 22 October and said to list gaps instead of adding shared contracts. |
| 4 | #805 Room invites should respect who can talk to an agent | medium, P1 | 11 | #1549, #1043 | Touches the addressing policy and `invite_agent_to_room`, which HAWSER depends on. Crowded and already has PRs. |
| 5 | #791 Add Zulip as a messaging platform | hard, P2 | 7 | #1451, #1279 | Event queue long polling, no public webhook. Crowded. |

Not recommended: provider additions (#778, #783 and similar) need Console TypeScript plus real CLI logins; the documentation issues (#807, #808) are crowded and the maintainer has restricted where the pages go.

## Honest odds

Every row already has at least one open PR from someone else, and the maintainer keeps one. A late PR wins only if it is clearly better: complete, tested, documented, with the allow-list and docs page the issue asks for. Rank 1 and 2 are the best trade of effort against competition. Plan for one finished PR, with a second only if the first is done early.


## Draft claim comments (no emoji, no dashes)

Post only the ones approved. They are public and in the builder's name.

#796:
> @petr-sandbox I would like to take this. Plan: add a Twilio SMS adapter under the existing collaboration bridge `PlatformAdapter` contract in `core/switch_core/bridges/collaboration/`, with the per-connection webhook checking Twilio's request signature, outbound sends through the Twilio REST API with long replies split to bounded segments, and an allow-list of phone numbers so strangers cannot run up costs. I will add tests in `core/tests/switch_core/bridges/collaboration/`, a docs page at `docs/messaging-platforms/sms.md`, and open a PR with `Closes #796`.

#792:
> @petr-sandbox I would like to take this. Plan: add a Signal adapter under the existing collaboration bridge `PlatformAdapter` contract in `core/switch_core/bridges/collaboration/` that talks to a user-run `signal-cli` daemon over its JSON-RPC interface, maps Signal groups to rooms and uses quote-replies in place of threads, and documents the risks of an unofficial client. I will add tests in `core/tests/switch_core/bridges/collaboration/`, a docs page at `docs/messaging-platforms/signal.md`, and open a PR with `Closes #792`.

#790:
> @petr-sandbox I would like to take this. Plan: add a Google Chat adapter under the existing `PlatformAdapter` contract in `core/switch_core/bridges/collaboration/` using Pub/Sub with Workspace Events subscriptions as already accepted in this thread, mapping spaces to rooms and Chat threads to Switch threads, and listing any contract gaps in the PR instead of adding shared contracts. I will add tests in `core/tests/switch_core/bridges/collaboration/`, a docs page at `docs/messaging-platforms/google-chat.md`, and open a PR with `Closes #790`.

#805:
> @petr-sandbox I would like to take this. Plan: make the agent's `addressing_policy` (see `core/switch_core/addressing.py`) decide who may invite it on every path named in the issue: the `!invite-agent` and `/invite-agent` commands, the `invite_agent_to_room` operation, the agent bridge API, room creation with agents and the Gateway room page, with a refusal that says why and names the owner, and without removing agents already in rooms. I will add tests per path in `core/tests/switch_core/` against real Postgres and open a PR with `Closes #805`.

#791:
> @petr-sandbox I would like to take this. Plan: add a Zulip adapter under the existing `PlatformAdapter` contract in `core/switch_core/bridges/collaboration/` using the event queue long-polling API so no public address is needed, mapping streams to rooms and topics to threads. I will add tests in `core/tests/switch_core/bridges/collaboration/`, a docs page at `docs/messaging-platforms/zulip.md`, and open a PR with `Closes #791`.


## Rules (from the event page, binding)

- Only issues in `sandbox-quantum/switch` labelled `hackathon` count.
- Comment, tag the maintainer, state in one or two lines how it will be solved. The maintainer has said issues are assigned to everyone who expressed interest and only one pull request is selected per issue, so start as soon as the comment is posted.
- At most 5 pull requests open at once. Each pull request description contains `Closes #<number>`.
- A one-time CLA is signed on the first pull request, by the builder personally.
- No low-effort pull requests. Every one is a real fix with tests and the documentation page the issue asks for.
- An assigned issue with no activity for 48 hours may be reassigned.

## Procedure per issue

1. Fork once: `gh repo fork sandbox-quantum/switch --clone=false`, then `git clone https://github.com/0xkinno/switch ~/switch-fork`, `git remote add upstream https://github.com/sandbox-quantum/switch.git`, `git config user.name 0xkinno`, `git config user.email 0xkinno@users.noreply.github.com`.
2. Install the author-only commit hook in the fork (not committed to their repository): copy `.githooks/commit-msg` from this repository to `~/switch-fork/.git/hooks/commit-msg` and make it executable.
3. Read `CONTRIBUTING.md`, `CLAUDE.md` (code style: imports at the top, no comments that narrate a change, no needless optional parameters, store tests against real Postgres, fail loud), `RELEASING.md` for the changelog rule, `.pre-commit-config.yaml` and `.github/workflows/` to see what CI runs.
4. `git fetch upstream && git switch -c fix/<number>-<slug> upstream/main`.
5. Write a failing test first. Then the smallest correct change that follows the repository's style.
6. Run what CI runs: `just check`, `just typecheck`, `just test`, plus Console checks if Console is touched. Backend tests need Postgres. On a machine with Docker use `just init-env && just up && just migrate`. Without Docker, `scripts/dev-switch.sh` in the HAWSER repository shows a working way to run a real switch-core against a local Postgres.
7. Commit as 0xkinno, clear message, no trailer of any kind. Push to the fork. Open the pull request against `sandbox-quantum/switch:main`: title states the change; body has the problem, the fix, how it was tested (commands and results) and `Closes #<number>`. Follow the repository's pull request template if one exists. No generated-by footer.
8. Tell the builder the pull request link so he signs the CLA when the bot asks.
9. Watch review comments and CI. Fix promptly.
10. Record each pull request in `docs/TRACK3_LOG.md` (issue, branch, link, CI state, review state).

## Where the Switch source lives for the adapters

`core/switch_core/bridges/collaboration/adapter.py` defines `PlatformAdapter` (line 438 at commit 9e158a7). Existing adapters are in the `slack`, `telegram`, `teams`, `discord` and `mattermost` folders beside it. `core/tests/switch_core/bridges/collaboration/` has a `dummy_platform` and `outbound_fakes.py` to build tests on. Documentation pages for messaging platforms go in `docs/messaging-platforms/`. The maintainer has asked that adapters be built on the existing contracts and that any gaps be listed in the pull request, not added as new shared contracts. Run `git fetch upstream` first: the repository moves quickly.

## Link to HAWSER, only where honest

If an issue fixes something HAWSER ran into, say so in the pull request as a user report. HAWSER's findings that touch Switch behaviour are in `docs/FINDINGS.md`. Never claim a merge that has not happened.
