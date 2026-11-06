import { cast, freshRoom, loadWorld, sleep, writeResult } from "./lib";

const w = await freshRoom(loadWorld(), "b8");
const c = await cast(w);
await c.bots.desk.say("@ship-mate please confirm the NOR time");
await sleep(3000);
const msgs = c.bots.observer.messages();
const refusal = msgs.filter((m) => /not permitted|restricted who can address/i.test(m.body));
c.closeAll();
await writeResult(w, {
  id: "b8",
  question: "Priya addresses @mate (cross-company addressing)",
  status: "partial",
  summary: `A charterer-side AGENT (charter-desk, owner kestrel-charterer) addressed @ship-mate (owner saltmarsh-owner, default owner-only policy). Refusal messages seen: ${refusal.length}. Text: ${JSON.stringify(refusal[0]?.body ?? null)} posted as ${JSON.stringify(refusal[0]?.name ?? null)}.`,
  observed: { refusals: refusal, allRoomMessagesAfter: msgs.slice(-6) },
  caveats: [
    "The sender was an agent, not a human on Slack or Telegram. The human case still needs the real messaging apps.",
  ],
});
