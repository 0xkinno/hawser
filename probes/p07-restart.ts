import { AgentApi, AgentSocket } from "@hawser/switch-client";
import { Bot, freshRoom, loadWorld, restartSwitch, sleep, switchVersion, writeResult } from "./lib";

const summarise = (xs: string[]) => {
  const c: Record<string, number> = {};
  for (const x of xs) c[x] = (c[x] ?? 0) + 1;
  return `frames after connection_state ${JSON.stringify(c)}`;
};
const w = await freshRoom(loadWorld(), "p07");
const room = (w.rooms.desk as { id: string }).id;
const ag = w.agents["timekeeper-a"] as { id: string; apiKey: string };
const api = new AgentApi(w.base, ag.id, ag.apiKey);
const s1 = new AgentSocket(api, { scope: "all", filter: "all", rooms: [room], client: "hawser-probe-p07" });
const first = await s1.open();
const other = await new Bot(w, "charter-desk", room).connect();
await other.say("probe before restart");
await s1.waitFor((f) => f.event === "message", 8000, "a message before the restart");
await sleep(300);
const gen1 = String(first.data.generation);
const cursor1 = s1.cursor;
restartSwitch();
for (let i = 0; i < 60; i++) {
  const ok = await fetch(new URL("/health", w.base))
    .then((r) => r.ok)
    .catch(() => false);
  if (ok) break;
  await sleep(1000);
}
const other2 = await new Bot(w, "charter-desk", room).connect();
await other2.say("probe after restart");
other2.close();
other.close();
await sleep(500);
const closedBy = s1.closed ? `socket closed with code ${s1.closeCode}` : "socket still open";
// resume exactly as a client would: same connection id, cursor, expected generation
const attempts: Record<string, unknown> = {};
const tryOpen = async (label: string, o: ConstructorParameters<typeof AgentSocket>[1]) => {
  const s = new AgentSocket(api, o);
  try {
    const f = await s.open();
    await sleep(500);
    attempts[label] = {
      opened: true,
      firstFrame: f.event,
      state: f.data,
      framesAfter: s.frames.slice(1).map((x) => x.event),
    };
  } catch (e) {
    attempts[label] = {
      opened: false,
      error: String(e).slice(0, 400),
      frames: s.frames.map((x) => ({ event: x.event, data: x.data })),
    };
  } finally {
    s.close();
  }
};
await tryOpen("resumeWithOldCursorAndGeneration", {
  scope: "all",
  filter: "all",
  rooms: [room],
  startFrom: cursor1,
  expectedGeneration: gen1,
});
await tryOpen("resumeWithOldCursorNoGeneration", {
  scope: "all",
  filter: "all",
  rooms: [room],
  startFrom: cursor1,
});
await tryOpen("openAtHead", { scope: "all", filter: "all", rooms: [room], startFrom: "head" });
await writeResult(w, {
  id: "p07",
  question: "Restart switch-core. Does the agent see a gap frame? Does the cursor survive?",
  status: "observed",
  summary: `Before: generation ${gen1}, cursor ${cursor1}. After restart the old socket: ${closedBy}. The pre-restart cursor was a ticket id; a message posted after the restart was queued for the resume. Resume attempts: ${Object.entries(
    attempts,
  )
    .map(
      ([k, v]) =>
        `${k}: ${(v as { opened: boolean }).opened ? `opened, ${summarise((v as { framesAfter: string[] }).framesAfter)}` : "refused"}`,
    )
    .join("; ")}.`,
  observed: {
    generationBefore: gen1,
    cursorBefore: cursor1,
    oldSocket: closedBy,
    attempts,
    switchVersionAfter: await switchVersion(w.base),
  },
  caveats: ["The server restart here is a local process restart, not a Codespace stop or a Docker restart."],
});
