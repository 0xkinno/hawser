/**
 * Link the bridge room to the desk room with the label from the design: "vessel reports to port call".
 * Run after the Telegram bridge room has been adopted in Console. The agent named must be a member of both rooms.
 *   pnpm exec tsx scripts/link-rooms.ts <agent-name> <bridge-room-id> <desk-room-id>
 */
import { readFileSync } from "node:fs";
import { AgentApi } from "@hawser/switch-client";

const [name, bridge, desk] = process.argv.slice(2);
if (!name || !bridge || !desk) {
  console.error("usage: link-rooms.ts <agent-name> <bridge-room-id> <desk-room-id>");
  process.exit(2);
}
const base = process.env.SWITCH_URL ?? "http://localhost:8000";
const envName = name.toUpperCase().replace(/[^A-Z0-9]/g, "_");
const envKey = process.env[`AGENT_KEY_${envName}`];
const envId = process.env[`AGENT_ID_${envName}`];
const world =
  envKey && envId
    ? undefined
    : (JSON.parse(readFileSync(".data/world.json", "utf8")) as {
        agents: Record<string, { id: string; apiKey: string }>;
      });
const creds = envKey && envId ? { id: envId, apiKey: envKey } : world?.agents[name];
if (!creds) throw new Error(`no credentials for ${name}: set AGENT_ID_${envName} and AGENT_KEY_${envName}`);
const api = new AgentApi(base, creds.id, creds.apiKey);
await api.op("connect_to_room", { room_id: bridge });
const r = await api.op("link_rooms", {
  source_room_id: bridge,
  target_room_id: desk,
  label: "vessel reports to port call",
});
console.log(JSON.stringify(r));
