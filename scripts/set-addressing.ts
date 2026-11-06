/**
 * Set who may address one company agent. Run by that company's owner (Gateway login), never by the agent.
 *   pnpm exec tsx scripts/set-addressing.ts <agent-name> <desk-room-id> [--people user1,user2]
 * Policy written: the owner, the owner's own agents, and the named Switch users, in the desk room only.
 * Another company's people and agents are not admitted, so they get Switch's visible refusal.
 * Use --dry-run to print the policy without sending it.
 */
import { Gateway } from "@hawser/switch-client";

const [agentName, roomId, ...rest] = process.argv.slice(2);
if (!agentName || !roomId) {
  console.error("usage: set-addressing.ts <agent-name> <desk-room-id> [--people a,b] [--dry-run]");
  process.exit(2);
}
const dry = rest.includes("--dry-run");
const pi = rest.indexOf("--people");
const people = pi >= 0 ? (rest[pi + 1] ?? "").split(",").filter(Boolean) : [];
const policy = {
  policy: { rules: [{ rooms: [roomId], users: people, agents: [], owner: true, owner_agents: true }] },
};
console.log(JSON.stringify(policy, null, 2));
if (dry) process.exit(0);

const base = process.env.SWITCH_GATEWAY_BASE ?? process.env.SWITCH_URL ?? "http://localhost:8000";
const email = process.env.SWITCH_OWNER_EMAIL;
const password = process.env.SWITCH_OWNER_PASSWORD;
if (!email || !password)
  throw new Error("set SWITCH_OWNER_EMAIL and SWITCH_OWNER_PASSWORD (the company owner's Gateway login)");
const g = new Gateway(base, process.env.SWITCH_GATEWAY_PATH ?? "/gateway");
await g.login(email, password);
const agents = await g.listAgents();
const found = agents.find((a) => a.name === agentName) as { id: string } | undefined;
if (!found) throw new Error(`no agent named ${agentName} visible to this login`);
await g.setAddressingPolicy(found.id, policy);
console.log(`policy set on ${agentName}`);
