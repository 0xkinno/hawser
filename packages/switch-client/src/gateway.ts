/** Operator-side client for the Switch Gateway (cookie session). Used by setup scripts and probes. */

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
    message: string,
  ) {
    super(message);
  }
}

export interface RegisteredAgent {
  id: string;
  api_key: string;
}

export interface IntegrationProfile {
  connection_model: "always_on" | "session_addressable" | "session_passive" | "auto_session";
  message_exchange: boolean;
  pre_invocation_mediation: string[];
  post_invocation_mediation: string[];
  event_reporting: string[];
}

export const ALWAYS_ON_PROFILE: IntegrationProfile = {
  connection_model: "always_on",
  message_exchange: true,
  pre_invocation_mediation: [],
  post_invocation_mediation: [],
  event_reporting: [],
};

async function json<T>(r: Response, what: string): Promise<T> {
  const text = await r.text();
  if (!r.ok) throw new HttpError(r.status, text, `${what} -> HTTP ${r.status}: ${text.slice(0, 400)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

export class Gateway {
  private cookie = "";
  constructor(
    readonly baseUrl: string,
    readonly gatewayPath = "/gateway",
  ) {}

  private url(path: string) {
    return new URL(`${this.gatewayPath}${path}`, this.baseUrl);
  }

  async login(email: string, password: string): Promise<{ id: string; name: string; role: string }> {
    const r = await fetch(this.url("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const set = r.headers.getSetCookie();
    this.cookie = set.map((c) => c.split(";")[0]).join("; ");
    return json(r, "login");
  }

  async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.cookie) throw new Error("Gateway: not logged in");
    const init: RequestInit = {
      method,
      headers: { Cookie: this.cookie, "Content-Type": "application/json" },
    };
    if (body !== undefined) init.body = JSON.stringify(body);
    return json<T>(await fetch(this.url(path), init), `${method} ${path}`);
  }

  createUser(u: { name: string; email: string; password: string; role?: string }) {
    return this.call<{ id: string; email: string }>("POST", "/users", { role: "user", ...u });
  }

  /** Mint a personal registration key. Agents registered with it are owned by this user. */
  async mintRegistrationKey(label: string): Promise<string> {
    const r = await this.call<{ key: string }>("POST", "/api-keys", { label });
    return r.key;
  }

  createRoom(body: Record<string, unknown>) {
    return this.call<{ id: string; name: string }>("POST", "/rooms", body);
  }

  roomDetail(roomId: string) {
    return this.call<Record<string, unknown>>("GET", `/rooms/${roomId}`);
  }

  addAgentToRoom(roomId: string, agentId: string) {
    return this.call<unknown>("POST", `/rooms/${roomId}/agents`, { agent_id: agentId });
  }

  addUsersToRoom(roomId: string, userNames: string[]) {
    return this.call<unknown>("POST", `/rooms/${roomId}/users`, { user_names: userNames });
  }

  setAddressingPolicy(agentId: string, policy: unknown) {
    return this.call<unknown>("PUT", `/agents/${agentId}/addressing-policy`, policy);
  }

  listAgents() {
    return this.call<Array<Record<string, unknown>>>("GET", "/agents");
  }

  deleteAgentByName(name: string) {
    return this.call<unknown>("DELETE", `/agents/by-name/${encodeURIComponent(name)}`);
  }
}

/** Register a custom agent on the agent bridge with a personal registration key. */
export async function registerAgent(
  baseUrl: string,
  registrationKey: string,
  spec: {
    name: string;
    description: string;
    displayName?: string;
    connectorType?: string;
    overwrite?: boolean;
  },
): Promise<RegisteredAgent> {
  const r = await fetch(new URL("/agents", baseUrl), {
    method: "POST",
    headers: { Authorization: `Bearer ${registrationKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: spec.name,
      description: spec.description,
      display_name: spec.displayName ?? null,
      connector_type: spec.connectorType ?? "hawser-protocol-client",
      integration_profile: ALWAYS_ON_PROFILE,
      overwrite: spec.overwrite ?? false,
    }),
  });
  return json<RegisteredAgent>(r, `register ${spec.name}`);
}
