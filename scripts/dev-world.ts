/**
 * Build the HAWSER cast on a Switch server reachable at SWITCH_URL, using the operator login in
 * SWITCH_ADMIN_EMAIL / SWITCH_ADMIN_PASSWORD. Writes .data/world.json (gitignored) with ids and keys.
 * Four owners, five agents, one internal desk room. It never touches a messaging app.
 */
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { Gateway, HttpError, registerAgent } from "@hawser/switch-client";

const base = process.env.SWITCH_URL ?? "http://localhost:8000";
const adminEmail = process.env.SWITCH_ADMIN_EMAIL ?? process.env.GATEWAY_ADMIN_EMAIL;
const adminPassword = process.env.SWITCH_ADMIN_PASSWORD ?? process.env.GATEWAY_ADMIN_PASSWORD;
if (!adminEmail || !adminPassword) throw new Error("set SWITCH_ADMIN_EMAIL and SWITCH_ADMIN_PASSWORD");

const owners = [
  {
    key: "saltmarsh",
    name: "saltmarsh-owner",
    agent: "ship-mate",
    desc: "Shipowner's agent: keeps the vessel log.",
  },
  {
    key: "weserkai",
    name: "weserkai-agency",
    agent: "agency-clerk",
    desc: "Port agency's agent: keeps the agency log.",
  },
  {
    key: "kestrel",
    name: "kestrel-charterer",
    agent: "charter-desk",
    desc: "Charterer's agent: keeps the charterer log.",
  },
  { key: "service", name: "hawser-service", agent: "timekeeper-a", desc: "Timekeeper A. No model." },
] as const;

const admin = new Gateway(base);
await admin.login(adminEmail, adminPassword);

interface World {
  base: string;
  owners: Record<string, { name: string; email: string; password: string; userId: string }>;
  agents: Record<string, { id: string; apiKey: string; owner: string }>;
  rooms: Record<string, { id: string; name: string }>;
}
const world: World = { base, owners: {}, agents: {}, rooms: {} };
for (const o of owners) {
  const email = `${o.name}@hawser.test`;
  const password = randomBytes(12).toString("base64url");
  try {
    await admin.createUser({ name: o.name, email, password });
  } catch (e) {
    if (!(e instanceof HttpError && e.status === 409)) throw e;
    throw new Error(`user ${email} already exists with an unknown password: reset the dev database first`);
  }
  const g = new Gateway(base);
  const me = await g.login(email, password);
  const regKey = await g.mintRegistrationKey(`hawser-${o.key}`);
  world.owners[o.key] = { name: o.name, email, password, userId: me.id };
  const a = await registerAgent(base, regKey, { name: o.agent, description: o.desc, overwrite: true });
  world.agents[o.agent] = { id: a.id, apiKey: a.api_key, owner: o.key };
  if (o.key === "service") {
    const b = await registerAgent(base, regKey, {
      name: "timekeeper-b",
      description: "Timekeeper B, standby. No model.",
      overwrite: true,
    });
    world.agents["timekeeper-b"] = { id: b.id, apiKey: b.api_key, owner: o.key };
  }
}

const agentIds = Object.values(world.agents).map((a) => a.id);
const room = await admin.createRoom({
  name: "call-saltmarsh-grace-brake",
  description:
    "Port call of MV Saltmarsh Grace at Brake (fictional). One Statement of Facts, signed by owner, agency and charterer.",
  internal_only: true,
  agent_ids: agentIds,
});
world.rooms.desk = { id: room.id, name: room.name };
mkdirSync(".data", { recursive: true });
writeFileSync(".data/world.json", `${JSON.stringify(world, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ room: room.id, agents: Object.keys(world.agents) }));
