import type { HttpError } from "@hawser/switch-client";
import { cast, freshRoom, loadWorld, writeResult } from "./lib";

const w = await freshRoom(loadWorld(), "p09");
const c = await cast(w);
let res: unknown;
try {
  res = await c.bots.desk.api.op("send_targeted_message", {
    body: "NOR accepted, confirm",
    target_names: ["ship-mate"],
    target_roles: null,
    thread_id: null,
  });
} catch (e) {
  res = { error: true, status: (e as HttpError).status, body: (e as HttpError).body };
}
c.closeAll();
await writeResult(w, {
  id: "p09",
  question: "send_targeted_message to an agent that does not admit the sender. Per-target status?",
  status: "observed",
  summary: `charter-desk to ship-mate (owner-only): ${JSON.stringify(res)}`,
  observed: res,
});
