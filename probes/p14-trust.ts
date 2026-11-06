import { adminGateway, loadWorld, writeResult } from "./lib";

const w = loadWorld();
const g = await adminGateway(w);
const out: Record<string, unknown> = {};
for (const path of ["/trust-settings", "/feature-flags"]) {
  try {
    out[path] = await g.call("GET", path);
  } catch (e) {
    out[path] = { error: String(e).slice(0, 300) };
  }
}
const asText = JSON.stringify(out).slice(0, 700);
await writeResult(w, {
  id: "p14",
  question: "Is Switch Trust available on this server?",
  status: "observed",
  summary: `Gateway answers: ${asText}. Switch Trust is not used by HAWSER and is not claimed.`,
  observed: out,
});
