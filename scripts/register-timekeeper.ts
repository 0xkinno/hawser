/**
 * Register timekeeper-a and timekeeper-b on a Switch server and print the .env lines.
 * Needs the personal registration key of the hawser-service user (Gateway, API keys), in SWITCH_AGENT_REGISTRATION_TOKEN.
 * Re-registering the same name is refused unless --overwrite is given, because the API key is returned once.
 * With --dry-run nothing is sent. With HAWSER_DESK_ROOM_ID and gateway login set, it also opens the Timekeepers' addressing
 * to the people in the desk room (they must hear all three companies).
 */
import { Gateway, registerAgent } from "@hawser/switch-client";

const args = new Set(process.argv.slice(2));
const dry = args.has("--dry-run");
const overwrite = args.has("--overwrite");
const base = process.env.SWITCH_URL ?? "http://localhost:8000";
const token = process.env.SWITCH_AGENT_REGISTRATION_TOKEN;
const names = ["timekeeper-a", "timekeeper-b"] as const;

if (dry) {
  console.log(
    `dry run: would register ${names.join(", ")} at ${base} as always_on protocol clients (overwrite=${overwrite}).`,
  );
  console.log(
    "dry run: would print TIMEKEEPER_A_AGENT_ID, TIMEKEEPER_A_API_KEY, TIMEKEEPER_B_AGENT_ID, TIMEKEEPER_B_API_KEY.",
  );
  console.log(
    `dry run: registration key present: ${token ? "yes" : "NO, set SWITCH_AGENT_REGISTRATION_TOKEN"}`,
  );
  process.exit(0);
}
if (!token)
  throw new Error("set SWITCH_AGENT_REGISTRATION_TOKEN to the hawser-service user's registration key");

const out: string[] = [];
const ids: string[] = [];
for (const n of names) {
  const a = await registerAgent(base, token, {
    name: n,
    description:
      n === "timekeeper-a"
        ? "Timekeeper A. Deterministic, no model."
        : "Timekeeper B, standby. Deterministic, no model.",
    overwrite,
  });
  const U = n.endsWith("a") ? "A" : "B";
  out.push(`TIMEKEEPER_${U}_AGENT_ID=${a.id}`, `TIMEKEEPER_${U}_API_KEY=${a.api_key}`);
  ids.push(a.id);
}
console.log(out.join("\n"));
console.error("Copy those lines into .env now. The API keys are shown once.");

const room = process.env.HAWSER_DESK_ROOM_ID;
const email = process.env.SWITCH_ADMIN_EMAIL ?? process.env.GATEWAY_ADMIN_EMAIL;
const password = process.env.SWITCH_ADMIN_PASSWORD ?? process.env.GATEWAY_ADMIN_PASSWORD;
if (room && email && password) {
  const g = new Gateway(base, process.env.SWITCH_GATEWAY_PATH ?? "/gateway");
  await g.login(email, password);
  for (const id of ids) {
    await g.setAddressingPolicy(id, {
      policy: { rules: [{ rooms: [room], users: "*", agents: "*", owner: true }] },
    });
  }
  console.error(`Addressing set: anyone in room ${room} may address the Timekeepers.`);
} else {
  console.error(
    "Addressing not changed. Set HAWSER_DESK_ROOM_ID and gateway login, or open it in the Gateway by hand.",
  );
}
