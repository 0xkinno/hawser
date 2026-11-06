import { AgentApi } from "@hawser/switch-client";
import { loadWorld, writeResult } from "./lib";

const w = loadWorld();
const a = w.agents["timekeeper-a"] as { id: string; apiKey: string };
const api = new AgentApi(w.base, a.id, a.apiKey);
const url = api.openUrl("events", {
  scope: "all",
  filter: "all",
  rooms: [(w.rooms.desk as { id: string }).id],
});
const ctl = new AbortController();
const r = await fetch(url, {
  headers: { Authorization: `Bearer ${a.apiKey}`, Accept: "text/event-stream" },
  signal: ctl.signal,
});
const reader = (r.body as ReadableStream<Uint8Array>).getReader();
let text = "";
const end = Date.now() + 4000;
while (Date.now() < end && !text.includes("\n\n")) {
  const { value, done } = await reader.read();
  if (done) break;
  text += new TextDecoder().decode(value);
}
ctl.abort();
const ev = /event: (\S+)/.exec(text)?.[1];
const deprecation = [...r.headers.entries()].filter(([k]) => /deprecat|sunset|warning|x-switch/i.test(k));
await writeResult(w, {
  id: "p02",
  question: "Does SSE still work for our agent, and is it reported as fallback?",
  status: "observed",
  summary: `GET /events answered HTTP ${r.status}, content-type ${r.headers.get("content-type")}, first event ${ev}. Compatibility headers: ${deprecation.length ? JSON.stringify(deprecation) : "none seen"}. The frame carried no field naming SSE as a fallback.`,
  observed: {
    status: r.status,
    contentType: r.headers.get("content-type"),
    firstEvent: ev,
    firstChunk: text.slice(0, 600),
    relevantHeaders: deprecation,
  },
});
