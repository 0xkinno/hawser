import { adminGateway, loadWorld, writeResult } from "./lib";

const w = loadWorld();
const g = await adminGateway(w);
const flags = await g.call<{ flags: Array<{ key: string; enabled: boolean }> }>("GET", "/feature-flags");
const mgmt = flags.flags.find((f) => f.key === "agent_management");
await writeResult(w, {
  id: "p13",
  question: "Template run by a second account with join: into the desk room: allowed? Addressing set?",
  status: "not_runnable_here",
  summary: `Not run. docs/TEMPLATES.md says a version 2 template creates managed agents and needs a server that runs agent management. On this dev server the agent_management flag is ${mgmt?.enabled ? "on" : "off"}, and no Switch Console host or controller exists in this environment. To be run on the Codespace server through Console, with the three party templates in templates/.`,
  observed: { agent_management: mgmt, doc: "reference/switch/docs/TEMPLATES.md, section Version 2" },
  caveats: ["Not claimed anywhere until it is run on a server with agent management."],
});
