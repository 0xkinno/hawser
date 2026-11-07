/**
 * Live setup on the server Switch Console runs (run it on the same host, for example the Codespace).
 *   list                  print the rooms with their ids and bridges
 *   register              mint a registration key for the admin, register timekeeper-a and timekeeper-b,
 *                         and write their ids and keys into .env (never printed)
 *   wire <desk> [bridge]  add both Timekeepers to the rooms, open their addressing to everyone in the desk room,
 *                         and write HAWSER_DESK_ROOM_ID and HAWSER_BRIDGE_ROOM_ID into .env
 * Login comes from GATEWAY_ADMIN_EMAIL and GATEWAY_ADMIN_PASSWORD in the environment.
 */
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { Gateway, registerAgent } from "@hawser/switch-client";

const base = process.env.SWITCH_URL ?? "http://127.0.0.1:63295";
const email = process.env.GATEWAY_ADMIN_EMAIL;
const password = process.env.GATEWAY_ADMIN_PASSWORD;
if (!email || !password) throw new Error("set GATEWAY_ADMIN_EMAIL and GATEWAY_ADMIN_PASSWORD");

function setEnv(values: Record<string, string>) {
  const lines = existsSync(".env") ? readFileSync(".env", "utf8").split("\n") : [];
  for (const [k, v] of Object.entries(values)) {
    const i = lines.findIndex((l) => l.startsWith(`${k}=`));
    if (i >= 0) lines[i] = `${k}=${v}`;
    else lines.push(`${k}=${v}`);
  }
  writeFileSync(".env", `${lines.filter((l, i) => l !== "" || i < lines.length - 1).join("\n")}\n`);
  chmodSync(".env", 0o600);
}

const g = new Gateway(base);
await g.login(email, password);
const [cmd, a1, a2] = process.argv.slice(2);

if (cmd === "list") {
  const rooms = await g.call<unknown>("GET", "/rooms");
  const list = Array.isArray(rooms)
    ? rooms
    : ((rooms as { rooms?: unknown[]; items?: unknown[] }).rooms ??
      (rooms as { items?: unknown[] }).items ??
      []);
  for (const r of list as Array<Record<string, unknown>>) {
    console.log(
      JSON.stringify({
        id: r.id,
        name: r.name,
        bridge: r.bridge ?? r.bridge_name ?? r.platform ?? null,
        channel: r.channel_name ?? r.external_name ?? null,
      }),
    );
  }
} else if (cmd === "register") {
  const key = await g.mintRegistrationKey(`hawser-timekeepers-${new Date().toISOString().slice(0, 16)}`);
  const env: Record<string, string> = { SWITCH_URL: base };
  for (const n of ["timekeeper-a", "timekeeper-b"] as const) {
    const a = await registerAgent(base, key, {
      name: n,
      description:
        n === "timekeeper-a"
          ? "Timekeeper A. Deterministic, no model."
          : "Timekeeper B, standby. Deterministic, no model.",
      overwrite: true,
    });
    const U = n.endsWith("a") ? "A" : "B";
    env[`TIMEKEEPER_${U}_AGENT_ID`] = a.id;
    env[`TIMEKEEPER_${U}_API_KEY`] = a.api_key;
    console.log(`registered ${n} as ${a.id}`);
  }
  setEnv(env);
  console.log("ids and keys written to .env");
} else if (cmd === "wire" && a1) {
  const env = readFileSync(".env", "utf8");
  const id = (k: string) => env.match(new RegExp(`^${k}=(.+)$`, "m"))?.[1];
  const ids = [id("TIMEKEEPER_A_AGENT_ID"), id("TIMEKEEPER_B_AGENT_ID")].filter((x): x is string => !!x);
  if (ids.length !== 2) throw new Error("run register first");
  for (const room of [a1, a2].filter((x): x is string => !!x)) {
    for (const agent of ids) {
      await g
        .addAgentToRoom(room, agent)
        .catch((e: Error) => console.log(`add ${agent} to ${room}: ${e.message}`));
    }
  }
  for (const agent of ids) {
    await g.setAddressingPolicy(agent, {
      policy: { rules: [{ rooms: [a1], users: "*", agents: "*", owner: true }] },
    });
  }
  setEnv({ HAWSER_DESK_ROOM_ID: a1, ...(a2 ? { HAWSER_BRIDGE_ROOM_ID: a2 } : {}) });
  console.log(
    `Timekeepers in ${[a1, a2].filter(Boolean).join(" and ")}; anyone in the desk room may address them`,
  );
} else {
  console.log("usage: live-setup.ts list | register | wire <desk-room-id> [bridge-room-id]");
}
