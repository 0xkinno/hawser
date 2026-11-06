import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { AgentApi, AgentSocket, type Frame, maxId } from "@hawser/switch-client";

export interface ConnState {
  connectionId: string;
  generation?: string;
  cursor?: string;
}

export class StateStore {
  constructor(readonly file: string) {}
  load(): ConnState {
    if (existsSync(this.file)) return JSON.parse(readFileSync(this.file, "utf8")) as ConnState;
    const s: ConnState = { connectionId: randomUUID() };
    this.save(s);
    return s;
  }
  save(s: ConnState) {
    mkdirSync(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(s)}\n`, { mode: 0o600 });
    renameSync(tmp, this.file);
  }
}

export interface RunOptions {
  baseUrl: string;
  agentId: string;
  apiKey: string;
  store: StateStore;
  rooms: string[];
  client: string;
  version: string;
  onOpen: (api: AgentApi, socket: AgentSocket, state: Frame) => Promise<void>;
  onFrame: (f: Frame) => Promise<void>;
  onClose: (why: string) => void;
  log: (msg: string, extra?: unknown) => void;
  signal: AbortSignal;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Hold one WebSocket connection to Switch for as long as the signal allows.
 * Reuses the persisted connection id so a dropped socket resumes instead of starting over, answers pings through
 * AgentSocket, and treats `taken_over` as a stop and everything else as a reconnect with jittered backoff.
 */
export async function runConnection(o: RunOptions): Promise<void> {
  for (let attempt = 0; !o.signal.aborted; attempt++) {
    const st = o.store.load();
    const api = new AgentApi(o.baseUrl, o.agentId, o.apiKey, st.connectionId);
    const opts: ConstructorParameters<typeof AgentSocket>[1] = {
      scope: "all",
      filter: "all",
      startFrom: st.cursor ?? "head",
      rooms: o.rooms,
      client: o.client,
      clientVersion: o.version,
      protocol: 9,
    };
    if (st.generation !== undefined) opts.expectedGeneration = st.generation;
    const socket = new AgentSocket(api, opts);
    let why = "closed";
    try {
      const first = await socket.open();
      attempt = 0;
      const gen = first.data.generation;
      o.store.save({
        ...o.store.load(),
        ...(typeof gen === "string" || typeof gen === "number" ? { generation: String(gen) } : {}),
        cursor: maxId(st.cursor, socket.cursor),
      });
      await o.onOpen(api, socket, first);
      await new Promise<void>((resolve) => {
        socket.onFrame((f) => {
          if (f.event === "evicted") {
            const code = (f.data as { code?: string }).code;
            why = code === "taken_over" ? "taken_over" : `evicted:${code ?? "?"}`;
          }
          if (f.id !== undefined)
            o.store.save({ ...o.store.load(), cursor: maxId(o.store.load().cursor, f.id) });
          o.onFrame(f).catch((e) => o.log("frame handler failed", String(e)));
        });
        const t = setInterval(() => {
          if (socket.closed || o.signal.aborted) {
            clearInterval(t);
            resolve();
          }
        }, 250);
      });
    } catch (e) {
      why = `open failed: ${(e as Error).message}`;
      if (/"status":(4\d\d)/.test(why) && !/"status":409/.test(why)) {
        o.log("refused, not retrying", why);
        o.onClose(why);
        return;
      }
    } finally {
      socket.terminate();
    }
    o.onClose(why);
    if (why === "taken_over") return;
    await sleep(Math.min(30_000, 500 * 2 ** Math.min(attempt, 6)) * (0.75 + Math.random() / 2));
  }
}
