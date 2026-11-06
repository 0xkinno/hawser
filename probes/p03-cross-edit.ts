import type { HttpError } from "@hawser/switch-client";
import { CALL, cast, freshRoom, loadWorld, logDoc, writeResult } from "./lib";

const w = await freshRoom(loadWorld(), "p03");
const c = await cast(w);
const created = await c.bots.desk.api.op<{ document_id: string }>("create_room_document", {
  name: "log-charterer",
  description: "company log",
  instructions: "append only",
  content: logDoc("charterer", CALL, []),
});
let edit: unknown;
let del: unknown;
try {
  await c.bots.mate.api.op("update_room_document", { document_id: created.document_id, content: "tampered" });
  edit = { refused: false };
} catch (e) {
  edit = { refused: true, status: (e as HttpError).status, body: (e as HttpError).body };
}
try {
  await c.bots.mate.api.op("delete_room_document", { document_id: created.document_id });
  del = { refused: false };
} catch (e) {
  del = { refused: true, status: (e as HttpError).status, body: (e as HttpError).body };
}
const after = await c.bots.desk.api.op<Array<{ content: string }>>("load_internal_documents", {
  ids: [created.document_id],
});
c.closeAll();
const refused = (edit as { refused: boolean }).refused && (del as { refused: boolean }).refused;
await writeResult(w, {
  id: "p03",
  question: "Agent B calls update_room_document on agent A's document. Result?",
  status: "observed",
  summary: `ship-mate update on charter-desk's log-charterer: ${JSON.stringify(edit)}. delete: ${JSON.stringify(del)}. Content unchanged afterwards: ${after[0]?.content !== "tampered"}.`,
  observed: { edit, delete: del, contentUnchanged: after[0]?.content !== "tampered", bothRefused: refused },
});
