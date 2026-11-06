import { randomUUID } from "node:crypto";
import WebSocket from "ws";
import { HttpError } from "./gateway";

export interface Frame {
  event: string;
  data: Record<string, any>;
  id?: number;
}

export interface OpenOptions {
  scope?: "single" | "all";
  filter?: "all" | "addressed";
  startFrom?: string;
  rooms?: string[];
  client?: string;
  clientVersion?: string;
  expectedGeneration?: number;
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

  async beat(cursor: number): Promise<number> {
    const r = await fetch(new URL(`/agents/${this.agentId}/connection/beat`, this.baseUrl), {
      method: "POST",
      headers: this.headers(false),
      body: JSON.stringify({ connection_id: this.connectionId, cursor }),
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
  cursor = 0;

  constructor(
    readonly api: AgentApi,
    readonly options: OpenOptions,
  ) {}

  onFrame(fn: (f: Frame) => void) {
    this.listeners.push(fn);
  }

  open(): Promise<void> {
    const url = this.api.openUrl("connection/ws", this.options);
    this.ws = new WebSocket(url, { headers: { Authorization: `Bearer ${this.api.apiKey}` } });
    return new Promise((resolve, reject) => {
      const ws = this.ws as WebSocket;
      ws.on("open", () => resolve());
      ws.on("error", (e) => reject(e));
      ws.on("close", (code) => {
        this.closed = true;
        this.closeCode = code;
      });
      ws.on("message", (raw) => {
        const f = JSON.parse(String(raw)) as Frame;
        if (f.event === "ping") {
          this.pings.push(Date.now());
          ws.send(JSON.stringify({ type: "pong", cursor: this.cursor }));
          return;
        }
        if (typeof f.id === "number") this.cursor = Math.max(this.cursor, f.id);
        if (f.event === "connection_state" && typeof f.data.cursor === "number")
          this.cursor = Math.max(this.cursor, f.data.cursor);
        this.frames.push(f);
        for (const l of this.listeners) l(f);
        this.waiters = this.waiters.filter((w) => {
          if (w.pred(f)) {
            w.resolve(f);
            return false;
          }
          return true;
        });
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
