/**
 * Writes templates/*.yaml from agents/*.md so the agent instructions in the templates can never drift from the
 * files people read. Run `pnpm templates`; a test fails when a committed template is out of date.
 * The schema was checked against the template guide served by switch-core 0.31.0 (get_template_guide).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { stringify } from "yaml";

const read = (n: string) => readFileSync(`agents/${n}.md`, "utf8").trimEnd();
const dump = (o: unknown) => stringify(o, { lineWidth: 0, blockQuote: "literal" });

const roles = [
  {
    name: "timekeeper",
    exclusive: true,
    instructions: "Hold the clock. Only the agent with no model may take this role.",
  },
  {
    name: "vessel-side",
    exclusive: false,
    instructions: "Speak for the shipowner. Never sign. Never state money.",
  },
  {
    name: "agency-side",
    exclusive: false,
    instructions: "Speak for the port agency. Never sign. Never state money.",
  },
  {
    name: "charterer-side",
    exclusive: false,
    instructions: "Speak for the charterer. Never sign. Never state money.",
  },
];

export const templates: Record<string, unknown> = {
  "port-call": {
    version: 2,
    params: {
      vessel: {
        type: "string",
        description: "Vessel slug",
        pattern: "^[a-z0-9-]+$",
        default: "saltmarsh-grace",
      },
      port: { type: "string", description: "Port slug", pattern: "^[a-z0-9-]+$", default: "brake" },
      bridge: { type: "bridge", description: "Messaging app for the desk room", default: ["$first"] },
      provider: {
        type: "provider",
        description: "Agent provider for the agency clerk",
        default: ["opencode", "claude"],
      },
      machine: { type: "machine", default: ["$first"], input: "advanced" },
      terms: {
        type: "string",
        multiline: true,
        description: "Charter party recap: laytime, NOR and demurrage clauses",
      },
    },
    resources: {
      clerk: {
        type: "agent",
        name: "agency-clerk",
        display_name: "Agency clerk",
        description: "Keeps the port agency's log for this call.",
        provider: "{provider}",
        machine: "{machine}",
        directory: "{$agents_dir}/agency-clerk",
        auto_mode: true,
        auto_approve: false,
        addressing: { anyone_in: ["desk"] },
        instructions: read("agency-clerk"),
      },
      desk: {
        type: "room",
        name: "call-{vessel}-{port}",
        description:
          "Port call of {vessel} at {port}: one Statement of Facts, signed by owner, agency and charterer.",
        bridge: "{bridge}",
        channel_type: "channel_private",
        agents: ["clerk"],
        users: ["{$creator}"],
        aliases: { clerk: "clerk" },
        roles,
        docs: [
          {
            name: "charter-terms",
            description: "Charter party terms for this call, written by a person. Agents cannot edit this.",
            instructions:
              "Read before every reply about time counting. Quote clause names, never paraphrase numbers.",
            content: "{terms}",
          },
        ],
        instructions:
          "This room is one port call shared by three companies. Each company's agent keeps only its own log document. The timekeeper counts; people sign. Reply in the thread you were asked in, in two lines. Never state a money figure. Never say a notice was accepted. Fail loud: say what failed.",
        kickoff: "@agency-clerk create your company log document now and post one line saying you are ready.",
      },
    },
  },
  "party-shipowner": {
    version: 2,
    params: {
      vessel: { type: "string", pattern: "^[a-z0-9-]+$", default: "saltmarsh-grace" },
      port: { type: "string", pattern: "^[a-z0-9-]+$", default: "brake" },
      provider: { type: "provider", default: ["claude"] },
      machine: { type: "machine", default: ["$first"], input: "advanced" },
    },
    resources: {
      mate: {
        type: "agent",
        name: "ship-mate",
        display_name: "Ship mate",
        description: "Keeps the shipowner's vessel log. Reads the master's photos.",
        provider: "{provider}",
        machine: "{machine}",
        directory: "{$agents_dir}/ship-mate",
        auto_mode: true,
        auto_approve: false,
        addressing: "owner-agents",
        join: ["call-{vessel}-{port}"],
        instructions: read("ship-mate"),
      },
    },
  },
  "party-charterer": {
    version: 2,
    params: {
      vessel: { type: "string", pattern: "^[a-z0-9-]+$", default: "saltmarsh-grace" },
      port: { type: "string", pattern: "^[a-z0-9-]+$", default: "brake" },
      provider: { type: "provider", default: ["opencode", "claude"] },
      machine: { type: "machine", default: ["$first"], input: "advanced" },
    },
    resources: {
      desk: {
        type: "agent",
        name: "charter-desk",
        display_name: "Charter desk",
        description: "Keeps the charterer's log. Cannot accept a Notice of Readiness.",
        provider: "{provider}",
        machine: "{machine}",
        directory: "{$agents_dir}/charter-desk",
        auto_mode: true,
        auto_approve: false,
        addressing: "owner-agents",
        join: ["call-{vessel}-{port}"],
        instructions: read("charter-desk"),
      },
    },
  },
};

if (process.argv[1]?.endsWith("build-templates.ts")) {
  for (const [name, doc] of Object.entries(templates)) {
    const header =
      "# Generated by scripts/build-templates.ts from agents/*.md. Edit those files, then run: pnpm templates\n";
    writeFileSync(`templates/${name}.template.yaml`, header + dump(doc));
    console.log(`wrote templates/${name}.template.yaml`);
  }
}
