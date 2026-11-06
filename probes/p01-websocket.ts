import { AgentApi, AgentSocket } from "@hawser/switch-client";
import { loadWorld, switchVersion, writeResult } from "./lib";

const w = loadWorld();
const a = w.agents["timekeeper-a"] as { id: string; apiKey: string };
const api = new AgentApi(w.base, a.id, a.apiKey);
const sock = new AgentSocket(api, {
  scope: "all",
  filter: "all",
  rooms: [(w.rooms.desk as { id: string }).id],
  client: "hawser-probe-p01",
  clientVersion: "0.1.0",
  protocol: 9,
});
const first = await sock.open();
const want = Number((first.data as { heartbeat_interval_seconds: number }).heartbeat_interval_seconds);
const t0 = Date.now();
while (sock.pings.length < 3 && Date.now() - t0 < (want * 3 + 6) * 1000)
  await new Promise((r) => setTimeout(r, 250));
const gaps = sock.pings.slice(1).map((p, i) => (p - (sock.pings[i] as number)) / 1000);
const stillOpen = !sock.closed;
sock.close();
await writeResult(w, {
  id: "p01",
  question:
    "Does the WebSocket /connection/ws accept our agent and send connection_state then ping every interval? What interval?",
  status: "observed",
  summary: `connection_state first (protocol ${String(first.data.protocol)}, server ${JSON.stringify((first.data.server as { version?: string }).version)}), heartbeat_interval_seconds ${want}, ${sock.pings.length} pings seen, gaps ${gaps.map((g) => g.toFixed(1)).join("s, ")}s, connection stayed open while we answered pong: ${stillOpen}.`,
  observed: {
    firstFrame: first.event,
    connectionState: first.data,
    heartbeatIntervalSeconds: want,
    pingGapsSeconds: gaps,
    pingsSeen: sock.pings.length,
    openAfterPongs: stillOpen,
    switchVersionRoute: await switchVersion(w.base),
  },
});
