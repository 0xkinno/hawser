import { cast, freshRoom, loadWorld, sleep, writeResult } from "./lib";

const w = await freshRoom(loadWorld(), "p10");
const c = await cast(w);
const parts = await c.bots.observer.api.op<Array<Record<string, unknown>>>("list_participants");
await c.bots.master.say("probe message to read the sender shape");
await sleep(1500);
const frame = c.bots.observer.socket?.frames.filter((f) => f.event === "message").pop();
const payload = (frame?.data as { payload: Record<string, unknown> } | undefined)?.payload;
c.closeAll();
const fields = Object.keys(parts[0] ?? {});
await writeResult(w, {
  id: "p10",
  question:
    "Does list_participants expose enough to bind a participant id to a party (name, kind, linked user)?",
  status: "partial",
  summary: `list_participants fields: ${fields.join(", ")}. Message events carry sender ${JSON.stringify(payload?.sender)} and sender_name ${JSON.stringify(payload?.sender_name)}. The participant list id is an agent uuid, not the @ sender id, and carries no linked user. Binding therefore uses the @ sender id learned at enrolment, or an explicit name entry.`,
  observed: {
    listParticipantsFields: fields,
    sample: parts[0],
    messagePayloadKeys: Object.keys(payload ?? {}),
    senderSample: payload?.sender,
    onBehalfOf: payload?.on_behalf_of,
  },
  caveats: [
    "Agents only. For a human on a messaging app, on_behalf_of and the linked Switch user were not observable without a real platform account.",
  ],
});
