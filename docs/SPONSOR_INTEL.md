# Sponsor intelligence: Switch

Status: written from the build brief. Every row in section 2 is marked `to verify` until it has been checked against a clone of the Switch repository (session access to that repository is pending). Nothing marked `to verify` may be claimed in the README. Verified rows get a file and line reference and a date.

## 1. Founders' thesis (Switch README, quoted)

- "Switch turns each channel into a room where your team and everyone's AI teammates work together, with shared context."
- "Any agent, any model, any provider. Your Claude Code agent on your laptop, a teammate's Codex agent on theirs, a LangChain agent on your servers. If it speaks the protocol, it can join."
- "Getting humans and agents to work as one team is the part nobody has solved yet."
- "Not an agent provider. Switch ships no agents and no models."
- House rule in the repository's agent guide: "Fail Loud, Never Fake."

HAWSER takes that thesis one step further than the documented examples: one room shared by agents of different companies, which Switch's ownership, addressing and authorship rules are designed to make safe.

## 2. Switch facts to verify (brief dated 6 November 2026, repo head f62ae50, switch-core 0.31.0)

| Primitive | Claim in the brief | Where to confirm | Status |
|---|---|---|---|
| Ownership | An agent inherits exactly its owner's permissions. | docs/official/internals/identity-and-access.md | to verify |
| Addressing policy | Rules over rooms, groups, users, agents; once any rule exists, everything not admitted is denied; a new agent starts owner-only; set by the owner from the Gateway. | same; docs/TEMPLATES.md | to verify |
| Visible refusal | A non-admitted sender gets one reply saying the agent cannot act; targeted sends return per-target `not_permitted`. | identity-and-access | to verify |
| Identity claims | A claim links a platform account to a Switch user; an unclaimed account matches nobody. | identity-and-access | to verify |
| Room documents | An agent can change or delete only a document it created; server check raises `PermissionError`; 1 MiB maximum; no revision history, `update_room_document` overwrites in place. | core/switch_core/bridges/resource/service.py; operations/definitions.py | to verify |
| Template `docs:` | Documents created in the room by the deployer, so no agent can edit them. | docs/TEMPLATES.md | to verify |
| Roles and leases | Exclusive role, one holder; lease keyed to the agent, heartbeat based, released a few seconds after the session stops. | hand-off-work.md; rooms-and-resources.md | to verify |
| Linked rooms | Directed links with a label; context stops at the room. | rooms-and-resources; shared-context | to verify |
| One room, one channel | A room maps to one channel on the far side; Telegram adopts an existing group and connects outwards. | collaboration-bridge.md; deploy/messaging-apps/telegram.md | to verify |
| Message bus | PostgreSQL messages table, per-room advisory lock assigns `seq`. | CLAUDE.md architecture | to verify |
| Agent connection | Live transport is the WebSocket at `/agents/{id}/connection/ws`; SSE plus beat is a compatibility path; revision 9 adds `start_at`; refusal arrives as a `refused` frame. | bridges/agent/api/handlers.py | to verify |
| Operations | `GET /agents/{id}/ops`; `POST /agents/{id}/ops/{name}` with `X-Switch-Connection-Id`. | agent-protocol.md; operations/definitions.py | to verify |
| Media and history | Media POST and GET under `/agents/{id}/rooms/{room_id}/media`; history under `.../history`. | handlers.py | to verify |
| Templates v2 | `resources:` of type agent, room, group; `join:`; `links:`; rooms carry `roles:`, `docs:`, `aliases:`, `users:`. | docs/TEMPLATES.md | to verify |
| Task protocol | Present but not ready for use. Build nothing on it. | agent-protocol.md | to verify |
| Switch Trust | Message checks can return ok, blocked or redacted; product gated. | agent_core.py; collaboration_core.py | to verify |

## 3. Depth ladder for this build

| Primitive | Shallow | Deep | Newest |
|---|---|---|---|
| Rooms | one room, one owner's agents | three owners' agents in one room, each refusing the other companies' people | two rooms on two messaging apps joined by a labelled link |
| Agents | Console-run Claude Code | Claude Code and OpenCode from different owners, plus a protocol-native agent with no model | protocol-native agent on the WebSocket transport, generation fencing, `refused` frame handling |
| Documents | agent writes notes | each company's log is a room document only its agent can write; charter terms are a template `docs:` entry no agent can write | every revision fingerprinted into the room's sequenced message log |
| Roles | none | `timekeeper` exclusive role held by a deterministic agent | measured lease failover to a standby agent |
| Addressing | `anyone` | `{anyone_in: [desk]}` plus per-company owner rules, refusals observed and recorded | room-group scoping documented as a permissions change |
| Templates | one room template | one template per company, each run under its own account | group template with links, roles, docs, aliases |

## 4. Not used, so not claimed

Task protocol. Switch Trust (unless a probe shows the server exposes it). Switch ROI. Packages (unless a real package is created through the Gateway). WorkOS. Microsoft Teams, Discord and Mattermost bridges (Mattermost only if used for local tests, then labelled).
