import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { Gateway } from "@hawser/switch-client";
import {
  Bot,
  type World,
  freshDir,
  freshRoom,
  loadWorld,
  logDoc,
  sleep,
  spawnTimekeeper,
} from "../scripts/lib/e2e";

export { Bot, freshDir, freshRoom, loadWorld, logDoc, sleep, spawnTimekeeper };
export type { World, TkProc } from "../scripts/lib/e2e";
export type { World as WorldType };

export const ENVIRONMENT =
  process.env.HAWSER_PROBE_ENV ??
  "switch-core started from the cloned repository with a local Postgres, no Docker, in a Claude Code cloud session. Not the Codespace server.";

export async function switchVersion(base: string): Promise<string> {
  const email = process.env.SWITCH_ADMIN_EMAIL ?? process.env.GATEWAY_ADMIN_EMAIL;
  const password = process.env.SWITCH_ADMIN_PASSWORD ?? process.env.GATEWAY_ADMIN_PASSWORD;
  if (!email || !password)
    throw new Error("set SWITCH_ADMIN_EMAIL and SWITCH_ADMIN_PASSWORD to read the server version");
  const g = new Gateway(base);
  await g.login(email, password);
  const v = await g.call<{ version?: string }>("GET", "/version");
  if (!v.version) throw new Error(`the gateway did not report a version: ${JSON.stringify(v)}`);
  return v.version;
}

export interface ProbeResult {
  id: string;
  question: string;
  status: "observed" | "partial" | "not_runnable_here";
  summary: string;
  observed: unknown;
  ranAt: string;
  switchVersion: string;
  environment: string;
  caveats?: string[];
}

export async function writeResult(
  w: World,
  r: Omit<ProbeResult, "ranAt" | "switchVersion" | "environment">,
): Promise<ProbeResult> {
  const full: ProbeResult = {
    ...r,
    ranAt: new Date().toISOString(),
    switchVersion: await switchVersion(w.base),
    environment: ENVIRONMENT,
  };
  mkdirSync("probes/results", { recursive: true });
  const file = `probes/results/${r.id}-${full.ranAt.slice(0, 10)}.json`;
  writeFileSync(file, `${JSON.stringify(full, null, 2)}\n`);
  console.log(`${r.id}: ${r.status} -> ${file}\n   ${r.summary}`);
  return full;
}

export const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
};

export function restartSwitch(): void {
  execFileSync("bash", ["scripts/dev-switch.sh", "restart"], { stdio: "inherit", timeout: 240_000 });
}

export async function adminGateway(w: World): Promise<Gateway> {
  const email = process.env.SWITCH_ADMIN_EMAIL ?? process.env.GATEWAY_ADMIN_EMAIL;
  const password = process.env.SWITCH_ADMIN_PASSWORD ?? process.env.GATEWAY_ADMIN_PASSWORD;
  if (!email || !password)
    throw new Error("set SWITCH_ADMIN_EMAIL and SWITCH_ADMIN_PASSWORD (or load reference/switch/.env)");
  const g = new Gateway(w.base);
  await g.login(email, password);
  return g;
}

export const CALL = "call-saltmarsh-grace-brake";
export const VESSEL = [
  { kind: "ANCHORED", time: "2026-11-13 14:00" },
  { kind: "NOR_TENDERED", time: "2026-11-13 16:41" },
  { kind: "ALL_FAST", time: "2026-11-16 09:12" },
  { kind: "COMPLETED", time: "2026-11-18 10:00" },
];

export interface Cast {
  w: World;
  room: string;
  bots: { mate: Bot; clerk: Bot; desk: Bot; master: Bot; agent: Bot; priya: Bot; observer: Bot };
  closeAll: () => void;
}

export async function cast(w: World): Promise<Cast> {
  const room = (w.rooms.desk as { id: string }).id;
  const bots = {
    mate: await new Bot(w, "ship-mate", room).connect(),
    clerk: await new Bot(w, "agency-clerk", room).connect(),
    desk: await new Bot(w, "charter-desk", room).connect(),
    master: await new Bot(w, "master-sim", room).connect(),
    agent: await new Bot(w, "agent-sim", room).connect(),
    priya: await new Bot(w, "charterer-sim", room).connect(),
  };
  const bots2 = { ...bots, observer: bots.desk };
  return {
    w,
    room,
    bots: bots2,
    closeAll: () => {
      for (const b of Object.values(bots)) b.close();
    },
  };
}

/** Company logs created and people enrolled. Agreeing times everywhere so the call is complete at once. */
export async function startCall(c: Cast): Promise<void> {
  const mk = (bot: Bot, name: string, party: string, lines = VESSEL) =>
    bot.api.op("create_room_document", {
      name,
      description: `Company log of ${party}. Append only.`,
      instructions:
        "Company log. Append only. Never change an existing line; correct by appending a CORRECTION.",
      content: logDoc(party, CALL, lines),
    });
  await mk(c.bots.mate, "log-vessel", "vessel");
  await mk(c.bots.clerk, "log-agency", "agency");
  await mk(c.bots.desk, "log-charterer", "charterer", []);
  await c.bots.master.say("@timekeeper enrol master");
  await c.bots.agent.say("@timekeeper enrol agent");
  await c.bots.priya.say("@timekeeper enrol charterer");
}

export async function docIds(c: Cast): Promise<Record<string, string>> {
  const refs = await c.bots.mate.api.op<{ documents: Array<{ id: string; name: string }> }>(
    "list_references",
  );
  return Object.fromEntries(refs.documents.map((d) => [d.name, d.id]));
}

/** Everyone signs the current digest. Returns it. */
export async function signAll(c: Cast, v: number): Promise<string> {
  await c.bots.observer.waitTag(`sof:v${v}:`, 30_000);
  const digest = (c.bots.observer.lastTag(`sof:v${v}:`) as string).split(":")[2] as string;
  await c.bots.master.say(`@timekeeper sign ${digest}`);
  await c.bots.agent.say(`@timekeeper sign ${digest}`);
  await c.bots.priya.say(`@timekeeper sign ${digest}`);
  await c.bots.observer.waitTag(`closed:${digest}`, 30_000);
  return digest;
}
