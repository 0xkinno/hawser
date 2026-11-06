import { randomUUID } from "node:crypto";
import WebSocket from "ws";
import { HttpError } from "./gateway";

/**
 * Sequence numbers are generation * 2^20 + n and pass JavaScript's safe-integer range after a server restart.
 * `id`, `sequence`, `cursor` and `generation` are therefore kept as exact decimal strings whenever they are that large.
 */
export interface Frame {
  event: string;
  data: Record<string, unknown>;
  id?: number | string;
}

const BIG = /"(id|sequence|cursor|generation)":(\d{15,})/g;
export const parseFrame = (raw: string): Frame => JSON.parse(raw.replace(BIG, '"$1":"$2"')) as Frame;

/** Compare two decimal ids exactly and return the larger as a string. */
export const maxId = (a: string | number | undefined, b: string | number | undefined): string => {
  const x = BigInt(a ?? 0);
  const y = BigInt(b ?? 0);
  return (x > y ? x : y).toString();
};

export interface OpenOptions {
  scope?: "single" | "all";
  filter?: "all" | "addressed";
  startFrom?: string;
  rooms?: string[];
  client?: string;
  clientVersion?: string;
  expectedGeneration?: number | string;
  protocol?: number;
}

/** HTTP side of one agent: operations, posting, history. */
export class AgentApi {
  readonly connectionId: string;
  constructor(
    readonly baseUrl: string,
    readonly agentId: string,
    readonly apiKey: string,
    connectionId?: string,
  ) {
    this.connectionId = connectionId ?? randomUUID();
  }

  private headers(withConnection: boolean) {
    const h: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
    if (withConnection) h["X-Switch-Connection-Id"] = this.connectionId;
    return h;
  }

  /** Invoke an operation. Fails loud with the server's own error text. */
  async op<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T> {
    const r = await fetch(new URL(`/agents/${this.agentId}/ops/${name}`, this.baseUrl), {
      method: "POST",
      headers: this.headers(true),
      body: JSON.stringify(args),
    });
    const text = await r.text();
    if (!r.ok) throw new HttpError(r.status, text, `op ${name} -> HTTP ${r.status}: ${text.slice(0, 500)}`);
    return (JSON.parse(text) as { result: T }).result;
  }

  async listOps(): Promise<Record<string, { description: string; input_schema: unknown }>> {
    const r = await fetch(new URL(`/agents/${this.agentId}/ops`, this.baseUrl), {
      headers: this.headers(false),
    });
    const text = await r.text();
    if (!r.ok) throw new HttpError(r.status, text, `list ops -> HTTP ${r.status}`);
    return (
      JSON.parse(text) as { operations: Record<string, { description: string; input_schema: unknown }> }
    ).operations;
  }

  /** Post without a connection. */
  async postMessage(roomId: string, content: string): Promise<unknown> {
    const r = await fetch(new URL(`/agents/${this.agentId}/message`, this.baseUrl), {
      method: "POST",
      headers: this.headers(false),
      body: JSON.stringify({ room_id: roomId, content }),
    });
    const text = await r.text();
    if (!r.ok) throw new HttpError(r.status, text, `post message -> HTTP ${r.status}: ${text.slice(0, 400)}`);
    return text ? JSON.parse(text) : {};
  }

  async history(
    roomId: string,
    limit = 200,
  ): Promise<Array<{ sender: string; sender_name: string; body: string; timestamp: number }>> {
    const r = await fetch(
      new URL(`/agents/${this.agentId}/rooms/${roomId}/history?limit=${limit}`, this.baseUrl),
      {
        headers: this.headers(false),
      },
    );
    const text = await r.text();
    if (!r.ok) throw new HttpError(r.status, text, `history -> HTTP ${r.status}: ${text.slice(0, 400)}`);
    return (
      JSON.parse(text) as {
        events: Array<{ sender: string; sender_name: string; body: string; timestamp: number }>;
      }
    ).events;
  }

  /** Keep an exclusive role seat. The server's lease lasts 6 seconds, so call about every 2 seconds. */
  async renewLease(): Promise<boolean> {
    const r = await fetch(new URL(`/agents/${this.agentId}/leases/renew`, this.baseUrl), {
      method: "POST",
      headers: this.headers(true),
    });
    const text = await r.text();
    if (!r.ok) throw new HttpError(r.status, text, `renew lease -> HTTP ${r.status}: ${text.slice(0, 300)}`);
    return (JSON.parse(text) as { held: boolean }).held;
  }

  /** Post a file into a room as this agent. */
  async postMedia(
    roomId: string,
    filename: string,
    bytes: Uint8Array,
    contentType: string,
    caption?: string,
  ): Promise<unknown> {
    const form = new FormData();
    form.append("file", new Blob([bytes], { type: contentType }), filename);
    if (caption) form.append("caption", caption);
    const r = await fetch(new URL(`/agents/${this.agentId}/rooms/${roomId}/media`, this.baseUrl), {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });
    const text = await r.text();
    if (!r.ok) throw new HttpError(r.status, text, `post media -> HTTP ${r.status}: ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : {};
  }

  async beat(cursor: number | string): Promise<number> {
    const r = await fetch(new URL(`/agents/${this.agentId}/connection/beat`, this.baseUrl), {
      method: "POST",
      headers: this.headers(false),
      body: `{"connection_id":${JSON.stringify(this.connectionId)},"cursor":${cursor}}`,
    });
    return r.status;
  }

  openUrl(path: "connection/ws" | "events", o: OpenOptions): URL {
    const url = new URL(`/agents/${this.agentId}/${path}`, this.baseUrl);
    if (path === "connection/ws") url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.searchParams.set("connection_id", this.connectionId);
    url.searchParams.set("scope", o.scope ?? "all");
    url.searchParams.set("filter", o.filter ?? "all");
    url.searchParams.set("start_from", o.startFrom ?? "head");
    if (o.rooms?.length) url.searchParams.set("rooms", o.rooms.join(","));
    if (o.expectedGeneration != null)
      url.searchParams.set("expected_generation", String(o.expectedGeneration));
    if (o.client) url.searchParams.set("client", o.client);
    if (o.clientVersion) url.searchParams.set("client_version", o.clientVersion);
    if (o.protocol != null) {
      url.searchParams.set("protocol", String(o.protocol));
      url.searchParams.set("protocol_accepts", String(o.protocol));
    }
    return url;
  }
}

/** One WebSocket connection. Answers pings itself, records every frame, never hides a refusal. */
export class AgentSocket {
  readonly frames: Frame[] = [];
  readonly pings: number[] = [];
  closed = false;
  closeCode?: number;
  private ws?: WebSocket;
  private waiters: Array<{ pred: (f: Frame) => boolean; resolve: (f: Frame) => void }> = [];
  private listeners: Array<(f: Frame) => void> = [];
  cursor = "0";

  constructor(
    readonly api: AgentApi,
    readonly options: OpenOptions,
  ) {}

  onFrame(fn: (f: Frame) => void) {
    this.listeners.push(fn);
  }

  /** Resolves once the server has registered the connection (first frame), rejects on a refusal. */
  open(): Promise<Frame> {
    const url = this.api.openUrl("connection/ws", this.options);
    this.ws = new WebSocket(url, { headers: { Authorization: `Bearer ${this.api.apiKey}` } });
    return new Promise((resolve, reject) => {
      const ws = this.ws as WebSocket;
      ws.on("error", (e) => reject(e));
      ws.on("close", (code) => {
        this.closed = true;
        this.closeCode = code;
        reject(new Error(`socket closed (code ${code}) before connection_state`));
      });
      ws.on("message", (raw) => {
        const f = parseFrame(String(raw));
        if (f.event === "ping") {
          this.pings.push(Date.now());
          ws.send(`{"type":"pong","cursor":${this.cursor}}`);
          return;
        }
        if (f.event === "refused") {
          this.frames.push(f);
          reject(new Error(`refused: ${JSON.stringify(f.data)}`));
          return;
        }
        if (f.id !== undefined) this.cursor = maxId(this.cursor, f.id);
        if (f.event === "connection_state") {
          const c = f.data.cursor;
          if (typeof c === "number" || typeof c === "string") this.cursor = maxId(this.cursor, c);
        }
        this.frames.push(f);
        for (const l of this.listeners) l(f);
        this.waiters = this.waiters.filter((w) => {
          if (w.pred(f)) {
            w.resolve(f);
            return false;
          }
          return true;
        });
        if (f.event === "connection_state") resolve(f);
      });
    });
  }

  /** Resolve with the first frame, already seen or yet to come, that matches. Rejects on timeout. */
  waitFor(pred: (f: Frame) => boolean, ms = 10_000, what = "frame"): Promise<Frame> {
    const seen = this.frames.find(pred);
    if (seen) return Promise.resolve(seen);
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`timed out after ${ms} ms waiting for ${what}`)), ms);
      this.waiters.push({
        pred,
        resolve: (f) => {
          clearTimeout(t);
          resolve(f);
        },
      });
    });
  }

  close() {
    this.ws?.close();
  }

  terminate() {
    this.ws?.terminate();
  }
}
