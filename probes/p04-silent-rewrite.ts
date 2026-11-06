import { CALL, cast, docIds, freshRoom, loadWorld, logDoc, sleep, writeResult } from "./lib";

const w = await freshRoom(loadWorld(), "p04");
const c = await cast(w);
const doc = await c.bots.clerk.api.op<{ document_id: string }>("create_room_document", {
  name: "log-agency",
  description: "company log",
  instructions: "append only",
  content: logDoc("agency", CALL, [{ kind: "ALL_FAST", time: "2026-11-16 09:12" }]),
});
await sleep(500);
const before = c.bots.observer.messages().length;
const framesBefore = c.bots.observer.socket?.frames.length ?? 0;
await c.bots.clerk.api.op("update_room_document", {
  document_id: doc.document_id,
  content: logDoc("agency", CALL, [{ kind: "ALL_FAST", time: "2026-11-16 12:00" }]),
});
await sleep(5000);
const newFrames = (c.bots.observer.socket?.frames ?? []).slice(framesBefore).map((f) => f.event);
const refs = await c.bots.observer.api.op<{ documents: Array<Record<string, unknown>> }>("list_references");
const keys = Object.keys(refs.documents[0] ?? {});
const loaded = await c.bots.observer.api.op<Array<Record<string, unknown>>>("load_internal_documents", {
  ids: [doc.document_id],
});
const loadedKeys = Object.keys(loaded[0] ?? {});
const history = await c.bots.observer.api.history(c.room, 100);
c.closeAll();
const notice = c.bots.observer
  .messages()
  .slice(before)
  .find((m) => /updated room document/i.test(m.body));
await writeResult(w, {
  id: "p04",
  question:
    "Agent A rewrites its own document. Is any event emitted to the room or to other agents? Is any prior version retrievable?",
  status: "observed",
  summary: `Switch posts a one-line notice to the room when a document is updated: ${JSON.stringify(notice?.body ?? null)} from ${JSON.stringify(notice?.name ?? null)}. It names the document but not what changed. list_references fields: ${keys.join(", ")}. load_internal_documents fields: ${loadedKeys.join(", ")}. Only the current content is returned and no revision field exists, so the earlier content is not retrievable (prior text visible: ${JSON.stringify(loaded).includes("09:12")}).`,
  observed: {
    newFramesAfterRewrite: newFrames,
    updateNotice: notice ?? null,
    listReferencesFields: keys,
    loadInternalDocumentsFields: loadedKeys,
    priorVersionRetrievable: JSON.stringify(loaded).includes("09:12"),
    roomHistoryAfterRewrite: history.map((h) => h.body.slice(0, 80)),
  },
});
