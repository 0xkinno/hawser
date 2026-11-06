import { AgentSocket } from "@hawser/switch-client";
import { Bot, adminGateway, freshRoom, loadWorld, sleep, writeResult } from "./lib";

const w1 = await freshRoom(loadWorld(), "p11-desk");
const g = await adminGateway(w1);
const bridge = await g.createRoom({
  name: `p11-bridge-${Date.now().toString(36)}`,
  description: "bridge",
  internal_only: true,
  agent_ids: Object.values(w1.agents).map((a) => a.id),
});
const desk = (w1.rooms.desk as { id: string }).id;
const watchDesk = await new Bot(w1, "charter-desk", desk).connect();
const watchBridge = await new Bot(w1, "agency-clerk", bridge.id).connect();
const tk = new Bot(w1, "timekeeper-a", desk);
const sock = new AgentSocket(tk.api, {
  scope: "all",
  filter: "all",
  rooms: [desk, bridge.id],
  client: "hawser-probe-p11",
});
const first = await sock.open();
const a = await tk.api.postMessage(desk, "probe: post to desk");
const b = await tk.api.postMessage(bridge.id, "probe: post to bridge");
await sleep(1500);
const covered = (first.data as { rooms: string[] }).rooms;
const deskSaw = watchDesk.messages().some((m) => m.name === "timekeeper-a" && m.body.includes("to desk"));
const bridgeSaw = watchBridge
  .messages()
  .some((m) => m.name === "timekeeper-a" && m.body.includes("to bridge"));
sock.close();
watchDesk.close();
watchBridge.close();
await writeResult(w1, {
  id: "p11",
  question: "Can the Timekeeper post into both rooms with one scope=all connection and the /message route?",
  status: "observed",
  summary: `One connection covered ${covered.length} rooms. POST /message succeeded for both rooms. The desk watcher saw the desk post: ${deskSaw}. The bridge watcher saw the bridge post: ${bridgeSaw}. Note: a scope=all connection receives every room it belongs to, each event tagged with its room_id.`,
  observed: {
    coveredRooms: covered,
    deskPost: a,
    bridgePost: b,
    deskWatcherSawDeskPost: deskSaw,
    bridgeWatcherSawBridgePost: bridgeSaw,
  },
});
