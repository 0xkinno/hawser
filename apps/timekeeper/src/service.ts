import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Party, Terms } from "@hawser/laytime";
import { type AgentApi, type AgentSocket, type Frame, HttpError } from "@hawser/switch-client";
import { type Action, Call, type CallConfig, type IncomingMessage } from "./call";
import { type RoomMessage, buildBundle } from "./export";
import { type SofMeta, buildSofPdf } from "./sof-pdf";
import { type RunOptions, StateStore, runConnection } from "./switch/connection";

export interface FileConfig {
  terms: Terms;
  participants: Record<Party, string[]>;
  /** Agent names allowed to author each company log. A document by anyone else is refused. */
  authors: Record<Party, string>;
  selfNames: string[];
  meta: SofMeta;
  verifyUrl: string;
  /** Display names for the signature block, by role. */
  signerNames?: Record<string, string>;
}

export interface ServiceOptions {
  switchUrl: string;
  agentName: string;
  agentId: string;
  apiKey: string;
  deskRoomId: string;
  bridgeRoomId?: string;
  dataDir: string;
  configPath: string;
  pollMs: number;
  clockMs: number;
  provenance: { mode: "live" | "recorded" | "simulated"; label: string };
  version: string;
  fault?: string;
  log: (msg: string, extra?: unknown) => void;
}

const DOC_NAMES: Record<string, Party> = {
  "log-vessel": "vessel",
  "log-agency": "agency",
  "log-charterer": "charterer",
};
const TAG = /\[hk:([^\]]+)\]/g;
const ROLE = "timekeeper";

export class Timekeeper {
  readonly cfg: FileConfig;
  call: Call;
  role: "standby" | "active" = "standby";
  api?: AgentApi;
  socket?: AgentSocket;
  private abort = new AbortController();
  private timers: NodeJS.Timeout[] = [];
  private busy = false;
  private lastStandbyWhy?: string;
  private authors = new Map<Party, string>();
  readonly events: Array<{ at: number; what: string }> = [];
  becameActiveAt?: number;

  constructor(readonly o: ServiceOptions) {
    this.cfg = JSON.parse(readFileSync(o.configPath, "utf8")) as FileConfig;
    this.call = this.freshCall();
  }

  private note(what: string) {
    this.events.push({ at: Date.now(), what });
    this.o.log(what);
  }

  private freshCall(): Call {
    const c: CallConfig = {
      terms: this.cfg.terms,
      participants: this.cfg.participants,
      selfIds: [],
      selfNames: [this.o.agentName, ...this.cfg.selfNames],
    };
    return new Call(c);
  }

  private rooms() {
    return [this.o.deskRoomId, ...(this.o.bridgeRoomId ? [this.o.bridgeRoomId] : [])];
  }

  async start(): Promise<void> {
    mkdirSync(this.o.dataDir, { recursive: true });
    const store = new StateStore(join(this.o.dataDir, `${this.o.agentName}.json`));
    const opts: RunOptions = {
      baseUrl: this.o.switchUrl,
      agentId: this.o.agentId,
      apiKey: this.o.apiKey,
      store,
      rooms: this.rooms(),
      client: "hawser-timekeeper",
      version: this.o.version,
      signal: this.abort.signal,
      log: this.o.log,
      onOpen: async (api, socket, state) => {
        this.api = api;
        this.socket = socket;
        this.note(
          `connected, protocol ${String(state.data.protocol)}, heartbeat ${String(state.data.heartbeat_interval_seconds)}s`,
        );
        await this.tryLease();
      },
      onFrame: (f) => this.onFrame(f),
      onClose: (why) => {
        this.note(`connection closed: ${why}`);
        this.demote("connection lost");
        this.api = undefined;
        this.socket = undefined;
      },
    };
    this.timers.push(setInterval(() => void this.leaseTick(), 1000));
    this.timers.push(setInterval(() => void this.pollTick(), this.o.pollMs));
    this.timers.push(setInterval(() => void this.clockTick(), this.o.clockMs));
    await runConnection(opts);
  }

  stop() {
    this.abort.abort();
    for (const t of this.timers) clearInterval(t);
    this.socket?.terminate();
  }

  /** Kill without releasing the role, as the failover probe does. */
  crash() {
    this.note("crash: terminating without releasing the role");
    this.stop();
  }

  // -------------------------------------------------------------------- lease

  private demote(why: string) {
    if (this.role === "active") this.note(`standby again: ${why}`);
    this.role = "standby";
  }

  private async tryLease(): Promise<void> {
    const api = this.api;
    if (!api) return;
    await api.op("connect_to_room", { room_id: this.o.deskRoomId });
    const roles = await api.op<Array<{ name: string }>>("list_roles");
    if (!roles.some((r) => r.name === ROLE)) {
      await api.op("define_role", {
        name: ROLE,
        instructions: "Hold the clock. Only the agent with no model may take this role.",
        exclusive: true,
      });
    }
    try {
      await api.op("assume_role", { role: ROLE });
    } catch (e) {
      if (e instanceof HttpError && (e.status === 409 || e.status === 400 || e.status === 403)) {
        if (!this.lastStandbyWhy || this.lastStandbyWhy !== e.body) {
          this.lastStandbyWhy = e.body;
          this.note(`standby: assume_role refused: ${e.body.slice(0, 200)}`);
        }
        this.role = "standby";
        return;
      }
      throw e;
    }
    if (this.role !== "active") {
      // Two agents can both be told "assumed" when the role is first used (observed on switch-core 0.31.0).
      // Only the sole holder in the roster counts as active.
      const roster = await api.op<Array<{ name: string; held_by: Array<{ name: string }> }>>("list_roles");
      const holders = roster.find((r) => r.name === ROLE)?.held_by.map((h) => h.name) ?? [];
      if (holders.length !== 1 || holders[0] !== this.o.agentName) {
        this.note(
          `assume_role succeeded but the roster shows holders ${JSON.stringify(holders)}: staying on standby`,
        );
        if (holders.includes(this.o.agentName) && holders.length > 1) await api.op("release_role");
        this.role = "standby";
        return;
      }
      this.role = "active";
      this.becameActiveAt = Date.now();
      this.note(`holds the ${ROLE} role`);
      await this.rebuild();
    }
  }

  private async leaseTick(): Promise<void> {
    const api = this.api;
    if (!api || !this.socket || this.socket.closed) return;
    try {
      if (this.role === "active") {
        const held = await api.renewLease();
        if (!held) {
          this.demote("lease no longer held");
        }
      } else {
        await this.tryLease();
      }
    } catch (e) {
      this.o.log("lease tick failed", String(e));
    }
  }

  // ------------------------------------------------------------------ rebuild

  private async history(): Promise<RoomMessage[]> {
    const api = this.api as AgentApi;
    const ctx = await api.op<{
      threads: Array<{
        root: {
          id: string;
          kind: string;
          sender: string;
          sender_name: string;
          body: string;
          timestamp: number;
        };
        replies: Array<{
          id: string;
          kind: string;
          sender: string;
          sender_name: string;
          body: string;
          timestamp: number;
        }>;
      }>;
    }>("read_context", { limit: 500, room_id: this.o.deskRoomId });
    const flat = ctx.threads.flatMap((t) => [t.root, ...t.replies]);
    flat.sort((a, b) => a.timestamp - b.timestamp);
    return flat.map(
      (m, i) =>
        ({
          seq: i + 1,
          sender: m.sender,
          senderName: m.sender_name,
          kind: m.kind,
          body: m.body ?? "",
          timestamp: m.timestamp,
          id: m.id,
        }) as RoomMessage & { id: string },
    );
  }

  /** The room is the database: rebuild every tag and every decision from what is already there. */
  async rebuild(): Promise<void> {
    this.call = this.freshCall();
    const msgs = (await this.history()) as Array<RoomMessage & { id: string }>;
    const selfNames = new Set(this.call.cfg.selfNames);
    const tags: string[] = [];
    for (const m of msgs) {
      if (!selfNames.has(m.senderName)) continue;
      for (const t of m.body.matchAll(TAG)) tags.push(t[1] as string);
    }
    this.call.markPosted(tags);
    await this.readDocs(false);
    for (const m of msgs) {
      if (m.kind !== "message" || selfNames.has(m.senderName)) continue;
      await this.exec(this.call.onMessage(this.incoming(m.sender, m.senderName, m.body, m.id, false)));
    }
    this.note(
      `rebuilt from the room: ${tags.length} tags, ${msgs.length} messages, digest ${this.call.currentDigest || "none"}`,
    );
  }

  private incoming(
    sender: string,
    senderName: string,
    body: string,
    messageId: string,
    addressed: boolean,
    room: "desk" | "bridge" = "desk",
  ): IncomingMessage {
    return { sender, senderName, body, messageId, addressed, room };
  }

  // -------------------------------------------------------------------- docs

  private async resolveAuthors(): Promise<void> {
    const api = this.api as AgentApi;
    const parts = await api.op<Array<{ id: string; name: string }>>("list_participants");
    for (const [party, name] of Object.entries(this.cfg.authors) as Array<[Party, string]>) {
      const p = parts.find((x) => x.name === name);
      if (p) this.authors.set(party, p.id);
    }
  }

  private async readDocs(execute = true): Promise<void> {
    const api = this.api as AgentApi;
    if (this.authors.size < 3) await this.resolveAuthors();
    const refs = await api.op<{
      documents: Array<{ id: string; name: string; created_by_agent_id: string | null }>;
    }>("list_references");
    const found = refs.documents.filter((d) => d.name in DOC_NAMES);
    for (const d of found) {
      const party = DOC_NAMES[d.name] as Party;
      const want = this.authors.get(party);
      if (want && d.created_by_agent_id !== want) {
        const out: Action[] = [];
        const tag = `author:${d.name}:${d.id.slice(0, 8)}`;
        if (!this.call.posted.has(tag)) {
          this.call.markPosted([tag]);
          out.push({
            type: "post",
            room: "desk",
            tag,
            text: `${d.name} was created by an agent that is not the ${party} company's agent, so it is not used.\n[hk:${tag}]`,
          });
        }
        if (execute) await this.exec(out);
        continue;
      }
      const loaded = await api.op<Array<{ id: string; content: string }>>("load_internal_documents", {
        ids: [d.id],
      });
      const content = loaded[0]?.content;
      if (content === undefined) continue;
      const actions = this.call.ingestDoc(party, content);
      if (execute) await this.exec(actions);
      else await this.exec(actions);
    }
  }

  private async pollTick() {
    if (this.role !== "active" || !this.api || this.busy) return;
    this.busy = true;
    try {
      await this.readDocs();
    } catch (e) {
      this.o.log("poll failed", String(e));
    } finally {
      this.busy = false;
    }
  }

  private async clockTick() {
    if (this.role !== "active" || !this.api) return;
    try {
      await this.exec(this.call.clock(new Date().toISOString()));
    } catch (e) {
      this.o.log("clock failed", String(e));
    }
  }

  // ------------------------------------------------------------------ frames

  private async onFrame(f: Frame): Promise<void> {
    if (f.event === "gap") {
      this.note(`gap frame: ${JSON.stringify(f.data)}`);
      if (this.role === "active") await this.rebuild();
      return;
    }
    if (f.event !== "message" || this.role !== "active") return;
    const notice = (f.data as { payload?: { body?: string } }).payload?.body ?? "";
    if (/room document\s+[\u201c"]?log-(vessel|agency|charterer)/i.test(notice)) void this.pollTick();
    const d = f.data as {
      room_id: string;
      payload: { sender: string; sender_name: string; body: string; message_id: string; addressed: boolean };
    };
    const room = d.room_id === this.o.deskRoomId ? "desk" : d.room_id === this.o.bridgeRoomId ? "bridge" : null;
    if (!room) return;
    const p = d.payload;
    await this.exec(
      this.call.onMessage(this.incoming(p.sender, p.sender_name, p.body, p.message_id, p.addressed, room)),
    );
  }

  // ----------------------------------------------------------------- actions

  private roomIds(room: "desk" | "bridge" | "both"): string[] {
    const bridge = this.o.bridgeRoomId;
    if (room === "desk") return [this.o.deskRoomId];
    if (room === "bridge") return bridge ? [bridge] : [];
    return bridge ? [this.o.deskRoomId, bridge] : [this.o.deskRoomId];
  }

  async exec(actions: Action[]): Promise<void> {
    const api = this.api;
    if (!api) return;
    for (const a of actions) {
      if (a.type === "post") {
        for (const id of this.roomIds(a.room)) await api.postMessage(id, a.text);
      } else {
        await this.publishArtifacts(a.digest);
      }
    }
  }

  /** Signed Statement of Facts and run bundle, posted to the rooms and written to the data directory. */
  async publishArtifacts(digest: string): Promise<void> {
    const api = this.api as AgentApi;
    const view = this.call.view();
    const names = this.cfg.signerNames ?? {};
    const roleOf: Record<string, string> = { vessel: "master", agency: "agent", charterer: "charterer" };
    const pdf = await buildSofPdf({
      terms: this.cfg.terms,
      meta: this.cfg.meta,
      version: this.call.version,
      digest,
      events: view.r.agreed,
      norDecision: this.call.nor.decision,
      fingerprints: Object.fromEntries(Object.entries(view.body.sourceFingerprints)),
      signatures: Object.entries(this.call.signatures).flatMap(([party, s]) =>
        s
          ? [
              {
                role: roleOf[party] as string,
                name: names[roleOf[party] as string] ?? s.sender,
                digest: s.digest,
                ...(s.remarks ? { remarks: s.remarks } : {}),
              },
            ]
          : [],
      ),
      verifyUrl: this.cfg.verifyUrl,
    });
    const msgs = (await this.history()).map(({ seq, sender, senderName, kind, body, timestamp }) => ({
      seq,
      sender,
      senderName,
      kind,
      body,
      timestamp,
    }));
    const bundle = buildBundle(
      this.call,
      msgs,
      { mode: this.o.provenance.mode, label: this.o.provenance.label, switchVersion: this.o.version },
      new Date(),
    );
    const dir = join(this.o.dataDir, "artifacts");
    mkdirSync(dir, { recursive: true });
    const pdfName = `sof-${this.cfg.terms.callId}-${digest}.pdf`;
    writeFileSync(join(dir, pdfName), pdf);
    writeFileSync(
      join(dir, `${this.cfg.terms.callId}-${digest}.json`),
      `${JSON.stringify(bundle, null, 2)}\n`,
    );
    for (const id of this.roomIds("both")) {
      await api.postMedia(
        id,
        pdfName,
        pdf,
        "application/pdf",
        `Signed Statement of Facts and laytime time sheet, digest ${digest}`,
      );
    }
    this.note(`published ${pdfName} and the run bundle`);
  }

  digest(): string {
    return this.call.currentDigest;
  }

  existsArtifact(name: string): boolean {
    return existsSync(join(this.o.dataDir, "artifacts", name));
  }
}
