import { type ChildProcess, spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { AgentApi, AgentSocket, type Frame, Gateway } from "@hawser/switch-client";

export interface World {
  base: string;
  agents: Record<string, { id: string; apiKey: string; owner: string }>;
  rooms: Record<string, { id: string; name: string }>;
}

export const loadWorld = (): World => JSON.parse(readFileSync(".data/world.json", "utf8")) as World;
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class Bot {
  readonly api: AgentApi;
  socket?: AgentSocket;
  constructor(
    readonly w: World,
    readonly name: string,
    readonly room: string,
  ) {
    const a = w.agents[name];
    if (!a) throw new Error(`no agent ${name} in the world`);
    this.api = new AgentApi(w.base, a.id, a.apiKey);
  }
  async connect(): Promise<this> {
    this.socket = new AgentSocket(this.api, {
      scope: "all",
      filter: "all",
      rooms: [this.room],
      client: `hawser-e2e-${this.name}`,
    });
    await this.socket.open();
    await this.api.op("connect_to_room", { room_id: this.room });
    return this;
  }
  say(body: string) {
    return this.api.postMessage(this.room, body);
  }
  /** Messages seen on this bot's socket, in order. */
  messages(): Array<{ sender: string; name: string; body: string; id: string }> {
    return (this.socket?.frames ?? [])
      .filter((f) => f.event === "message")
      .map((f) => {
        const p = (
          f.data as { payload: { sender: string; sender_name: string; body: string; message_id: string } }
        ).payload;
        return { sender: p.sender, name: p.sender_name, body: p.body, id: p.message_id };
      });
  }
  async waitMessage(
    pred: (m: { name: string; body: string }) => boolean,
    ms = 20_000,
    what = "message",
  ): Promise<{ name: string; body: string }> {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      const m = this.messages().find(pred);
      if (m) return m;
      await sleep(150);
    }
    throw new Error(`timed out after ${ms} ms waiting for ${what}`);
  }
  waitTag(prefix: string, ms = 20_000) {
    return this.waitMessage((m) => m.body.includes(`[hk:${prefix}`), ms, `a card tagged ${prefix}`);
  }
  tags(): string[] {
    return this.messages().flatMap((m) =>
      [...m.body.matchAll(/\[hk:([^\]]+)\]/g)].map((x) => x[1] as string),
    );
  }
  lastTag(prefix: string): string | undefined {
    return this.tags()
      .filter((t) => t.startsWith(prefix))
      .pop();
  }
  close() {
    this.socket?.close();
  }
}

export function logDoc(
  party: string,
  call: string,
  lines: Array<{ kind: string; time: string; zone?: string | null; reason?: string; ref?: string }>,
): string {
  const body = lines.map((l, i) =>
    JSON.stringify({
      seq: i + 1,
      kind: l.kind,
      localTime: l.time,
      zone: l.zone === undefined ? "Europe/Berlin" : l.zone,
      ...(l.reason ? { reason: l.reason } : {}),
      source: { type: "message", ref: l.ref ?? `${party}:${i + 1}` },
      enteredBy: `${party}-agent`,
    }),
  );
  return [`HAWSER LOG v1 | party=${party} | call=${call}`, ...body].join("\n");
}

export interface TkProc {
  name: string;
  proc: ChildProcess;
  lines: string[];
  waitLine(re: RegExp, ms?: number): Promise<string>;
  kill(signal?: NodeJS.Signals): void;
}

export function spawnTimekeeper(
  w: World,
  which: "a" | "b",
  dataDir: string,
  extra: Record<string, string> = {},
): TkProc {
  const U = which.toUpperCase();
  const ag = w.agents[`timekeeper-${which}`];
  if (!ag) throw new Error(`no timekeeper-${which}`);
  mkdirSync(dataDir, { recursive: true });
  const proc = spawn("node", ["apps/timekeeper/dist/main.js"], {
    env: {
      ...process.env,
      SWITCH_URL: w.base,
      HAWSER_TIMEKEEPER_ID: which,
      [`TIMEKEEPER_${U}_AGENT_ID`]: ag.id,
      [`TIMEKEEPER_${U}_API_KEY`]: ag.apiKey,
      HAWSER_DESK_ROOM_ID: (w.rooms.desk as { id: string }).id,
      HAWSER_DATA_DIR: resolve(dataDir),
      HAWSER_CALL_CONFIG: resolve(".data/call-config.json"),
      HAWSER_POLL_MS: "1000",
      HAWSER_CLOCK_MS: "3600000",
      HAWSER_PROVENANCE_MODE: "simulated",
      HAWSER_PROVENANCE_LABEL: "simulated people on a local switch-core in a cloud session",
      HAWSER_SWITCH_VERSION: "0.31.0",
      ...extra,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const lines: string[] = [];
  const onData = (b: Buffer) => lines.push(...String(b).split("\n").filter(Boolean));
  proc.stdout?.on("data", onData);
  proc.stderr?.on("data", onData);
  return {
    name: `timekeeper-${which}`,
    proc,
    lines,
    async waitLine(re, ms = 20_000) {
      const end = Date.now() + ms;
      while (Date.now() < end) {
        const l = lines.find((x) => re.test(x));
        if (l) return l;
        await sleep(100);
      }
      throw new Error(`timed out waiting for ${re} in ${this.name}: ${lines.slice(-5).join(" | ")}`);
    },
    kill(signal = "SIGTERM") {
      proc.kill(signal);
    },
  };
}

export const freshDir = (p: string) => {
  rmSync(p, { recursive: true, force: true });
  mkdirSync(p, { recursive: true });
  return p;
};

export type { Frame };

/** A fresh internal desk room with every agent in it, so a run never meets another run's documents. */
export async function freshRoom(w: World, label: string): Promise<World> {
  const email = process.env.SWITCH_ADMIN_EMAIL ?? process.env.GATEWAY_ADMIN_EMAIL;
  const password = process.env.SWITCH_ADMIN_PASSWORD ?? process.env.GATEWAY_ADMIN_PASSWORD;
  if (!email || !password)
    throw new Error("set SWITCH_ADMIN_EMAIL and SWITCH_ADMIN_PASSWORD (or load reference/switch/.env)");
  const g = new Gateway(w.base);
  await g.login(email, password);
  const room = await g.createRoom({
    name: `${label}-${Date.now().toString(36)}`,
    description: `Test room for ${label}. Fictional port call.`,
    internal_only: true,
    agent_ids: Object.values(w.agents).map((a) => a.id),
  });
  for (const n of ["timekeeper-a", "timekeeper-b"]) {
    const a = w.agents[n];
    if (a)
      await g.setAddressingPolicy(a.id, {
        policy: { rules: [{ rooms: [room.id], users: "*", agents: "*", owner: true }] },
      });
  }
  return { ...w, rooms: { ...w.rooms, desk: { id: room.id, name: room.name } } };
}
