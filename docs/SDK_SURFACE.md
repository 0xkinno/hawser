# Switch surface used

Every Switch feature HAWSER touches, where it lives in the Switch source (commit 9e158a7, switch-core 0.31.0), and how far it was exercised. Status words: live means exercised against a real server in this repository's runs; designed means written and not yet run; not used means not claimed.

| Feature | Switch source | HAWSER file | Status |
|---|---|---|---|
| Agent registration with a personal registration key | `core/switch_core/bridges/agent/api/handlers.py` line 206 (`POST /agents`), `_resolve_registration_user_id` line 149 | `packages/switch-client/src/gateway.ts` (`registerAgent`), `scripts/register-timekeeper.ts` | live |
| WebSocket connection `/agents/{id}/connection/ws`, server `ping`, client `pong` | `handlers.py` lines 1218 to 1330 | `packages/switch-client/src/agent.ts` (`AgentSocket`), `apps/timekeeper/src/switch/connection.ts` | live (P01) |
| SSE event stream, compatibility path | `handlers.py` line 738 | none used in production; probed | live (P02) |
| Resume by saved cursor (`start_from`, ticket ids), `expected_generation` | `handlers.py` lines 806 to 870 (`_resolve_start_position`) | `connection.ts` | live (P07, B7) |
| Heartbeat interval and TTL | `bridges/agent/protocol/liveness.py` lines 25, 26 | read from `connection_state` | live |
| Operations over HTTP with `X-Switch-Connection-Id` | `bridges/agent/operations/definitions.py`, `docs/official/internals/agent-protocol.md` | `AgentApi.op` | live |
| `connect_to_room` | `definitions.py` | `service.ts` (`tryLease`) | live |
| `post_message` without a connection | `handlers.py` line 487 (`POST /agents/{id}/message`) | `AgentApi.postMessage` | live (P11) |
| Media upload (PDF into both rooms) | `handlers.py` line 545 | `AgentApi.postMedia`, `service.ts` (`publishArtifacts`) | live (end to end run) |
| `read_context` for rebuild | `definitions.py` | `service.ts` (`history`, `rebuild`) | live (B6, B7) |
| `list_references`, `load_internal_documents` to read the other companies' logs | `definitions.py` | `service.ts` (`readDocs`) | live |
| Room documents: author only edit and delete | `core/switch_core/bridges/resource/service.py` lines 1135 to 1176 (update, author check at 1152), 1179 to 1200 (delete); size limit `definitions.py` line 584 | company agents' instructions in `agents/` | live (P03, B3) |
| Room documents keep no history; update notice | `service.py` `update_fields` writes in place | `watcher.ts` fingerprints | live (P04) |
| Template `docs:` written by a person (charter terms) | `service.py` lines 1100 to 1113 (`created_by_agent_id=None`), `docs/TEMPLATES.md` | `templates/port-call.template.yaml` | designed (needs agent management) |
| Exclusive role, `define_role`, `assume_role`, `release_role`, `leases/renew` | `definitions.py`, `handlers.py` line 619, `db/stores/room_role_store.py` line 47 (`LEASE_TTL` 6 s) | `service.ts` | live (P06, B6) |
| Ownership: an agent inherits its owner's permissions | `docs/official/internals/identity-and-access.md` line 92 | one owner per company | live |
| Addressing policy and visible refusal | `identity-and-access.md` lines 119, 120; `core/switch_core/addressing.py` | `scripts/set-addressing.ts`, `probes/lib.ts` | live (P08, P09) |
| Identity claims for platform accounts | `identity-and-access.md` lines 130, 134 | enrolment binds a sender id | designed (needs a messaging app) |
| `send_targeted_message` | `definitions.py` | `probes/p09-targeted.ts` | live (P09) |
| `link_rooms` | `definitions.py` | `scripts/link-rooms.ts` | designed |
| Version 2 templates, `join:`, roles, `aliases:` | `docs/TEMPLATES.md`, server's `get_template_guide` | `templates/*.yaml`, `scripts/build-templates.ts` | designed (P13 not runnable here) |
| Slack and Telegram bridges | `docs/official/deploy/messaging-apps/` | none yet | designed |
| Switch Console remote host and server | `docs/official/deploy/host-remotely.md`, `getting-started/add-a-server.md` | `docs/RUN_REMOTE_HOST.md` | designed |

## Not used, so not claimed

The task protocol (the docs say it is not ready), Switch Trust (disabled on the server probed, P14), Switch ROI, packages, WorkOS, Microsoft Teams, Discord and Mattermost bridges.
