/**
 * End to end on a real switch-core: three company agents write their own logs, two Timekeepers share one exclusive
 * role, three stand-in people decide and sign, the PDF is posted, and the bundle verifies offline.
 * Everything here is simulated people. It proves the machinery; the recorded human call replaces it later.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { type RunBundle, verifyBundle } from "@hawser/laytime";
import { Bot, freshDir, freshRoom, loadWorld, logDoc, spawnTimekeeper } from "./lib/e2e";

const w = await freshRoom(loadWorld(), "e2e-local");
const room = (w.rooms.desk as { id: string }).id;
const call = "call-saltmarsh-grace-brake";
const data = freshDir(".data/e2e");
const results: Array<{ step: string; ok: boolean; detail: string }> = [];
const check = (step: string, ok: boolean, detail = "") => {
  results.push({ step, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${step}${detail ? `: ${detail}` : ""}`);
  if (!ok) {
    console.log(
      `--- timekeeper-a\n${a.lines.slice(-12).join("\n")}\n--- timekeeper-b\n${b.lines.slice(-12).join("\n")}`,
    );
    throw new Error(`step failed: ${step}`);
  }
};

const a = spawnTimekeeper(w, "a", `${data}/a`);
let b = spawnTimekeeper(w, "b", `${data}/b`);
b.kill();
const bots = {
  mate: await new Bot(w, "ship-mate", room).connect(),
  clerk: await new Bot(w, "agency-clerk", room).connect(),
  desk: await new Bot(w, "charter-desk", room).connect(),
  master: await new Bot(w, "master-sim", room).connect(),
  agent: await new Bot(w, "agent-sim", room).connect(),
  priya: await new Bot(w, "charterer-sim", room).connect(),
};
try {
  await a.waitLine(/holds the timekeeper role/);
  check("A takes the exclusive timekeeper role", true);
  b = spawnTimekeeper(w, "b", `${data}/b`);
  await b.waitLine(/connected, protocol/);
  await new Promise((r) => setTimeout(r, 3000));
  check("B stays on standby", !b.lines.some((l) => /holds the timekeeper role/.test(l)));

  const vessel = [
    { kind: "ANCHORED", time: "2026-11-13 14:00" },
    { kind: "NOR_TENDERED", time: "2026-11-13 16:41" },
    { kind: "ALL_FAST", time: "2026-11-16 09:12" },
    { kind: "COMPLETED", time: "2026-11-18 10:30" },
  ];
  const agency = vessel.map((l) => (l.kind === "COMPLETED" ? { ...l, time: "2026-11-18 10:00" } : l));
  const mk = async (bot: Bot, name: string, party: string, lines: typeof vessel) =>
    bot.api.op("create_room_document", {
      name,
      description: `Company log of ${party}. Append only.`,
      instructions:
        "Company log. Append only. Never change an existing line; correct by appending a CORRECTION.",
      content: logDoc(party, call, lines),
    });
  await mk(bots.mate, "log-vessel", "vessel", vessel);
  await mk(bots.clerk, "log-agency", "agency", agency);
  await mk(bots.desk, "log-charterer", "charterer", []);
  await bots.master.say("@timekeeper enrol master");
  await bots.agent.say("@timekeeper enrol agent");
  await bots.priya.say("@timekeeper enrol charterer");

  await bots.desk.waitTag("rev:log-vessel:r1");
  check("revision card for each company log", true);
  await bots.desk.waitTag("nor:");
  check("NOR card posted with its own digest", true);
  const div = await bots.desk.waitTag("div:COMPLETED");
  check(
    "COMPLETED difference priced and shown",
    /Money at stake under the stated terms: USD 260\.41/.test(div.body),
    div.body.split("\n")[0] ?? "",
  );
  await bots.desk.waitTag("ask:COMPLETED");
  check(
    "the deciding party (agency) is asked once",
    bots.desk.tags().filter((t) => t.startsWith("ask:COMPLETED")).length === 1,
  );

  await bots.priya.say("noted");
  await bots.desk.waitTag("rna:");
  check("B2: 'noted' recorded as received, not accepted", true);
  await bots.desk.say("NOR accepted, laytime starts now");
  for (let i = 0; i < 100 && bots.desk.tags().filter((t) => t.startsWith("rna:")).length < 2; i++) {
    await new Promise((r) => setTimeout(r, 150));
  }
  check(
    "B1: an agent saying 'NOR accepted' changes nothing",
    bots.desk.tags().filter((t) => t.startsWith("rna:")).length >= 2,
  );

  await bots.agent.say("@timekeeper settle COMPLETED: 2026-11-18 10:00 Europe/Berlin");
  await bots.desk.waitTag("sof:v2:");
  check("settled difference produces SOF version 2 after version 1 when all logs were in", true);
  const nor = bots.desk.lastTag("nor:")?.split(":")[1] as string;
  await bots.priya.say(`@timekeeper accept nor without prejudice ${nor}`);
  await bots.desk.waitTag("nordec:");
  await bots.desk.waitTag("sof:v3:");
  const digest = (bots.desk.lastTag("sof:v3:") as string).split(":")[2] as string;
  check(
    "charterer decision on the exact NOR digest produces version 3",
    /^[0-9A-F]{8}$/.test(digest),
    digest,
  );

  await bots.desk.say(`@timekeeper sign ${digest}`);
  await bots.desk.waitTag("reply:");
  check(
    "B11: an agent cannot sign for a person",
    !bots.desk.messages().some((m) => /signed version/.test(m.body) && m.body.includes("charter-desk")),
  );

  await bots.master.say(`@timekeeper sign ${digest}`);
  await bots.agent.say(`@timekeeper sign ${digest}: tally agreed`);
  await bots.priya.say(`@timekeeper sign ${digest}`);
  await bots.desk.waitTag("closed:", 30_000);
  check("three signatures close the call", true);
  const closedDigest = (bots.desk.lastTag("closed:") as string).split(":")[1] as string;
  let pdfSeen = false;
  for (let i = 0; i < 80 && !pdfSeen; i++) {
    pdfSeen =
      existsSync(`${data}/a/artifacts`) && readdirSync(`${data}/a/artifacts`).some((f) => f.endsWith(".pdf"));
    if (!pdfSeen) await new Promise((r) => setTimeout(r, 250));
  }
  if (!pdfSeen) console.log(a.lines.slice(-6).join("\n"));
  check("PDF and run bundle written", pdfSeen);
  const files = readdirSync(`${data}/a/artifacts`);
  const json = files.find((f) => f.endsWith(".json")) as string;
  const bundle = JSON.parse(readFileSync(`${data}/a/artifacts/${json}`, "utf8")) as RunBundle;
  const v = verifyBundle(bundle);
  check("bundle recomputes offline", v.ok, v.firstMismatch ?? `${v.checks.length} checks`);
  check(
    "signed digest matches the closed digest",
    closedDigest === bundle.finalDigest && bundle.signatures.length === 3,
  );
  mkdirSync("runs", { recursive: true });
  const out = `runs/${call}-simulated-${new Date().toISOString().slice(0, 10)}.json`;
  copyFileSync(`${data}/a/artifacts/${json}`, out);
  const pdf = files.find((f) => f.endsWith(".pdf")) as string;
  if (existsSync(`${data}/a/artifacts/${pdf}`)) copyFileSync(`${data}/a/artifacts/${pdf}`, `runs/${pdf}`);
  console.log(`bundle written to ${out}`);
} catch (e) {
  console.log(
    `--- last room messages\n${bots.desk
      .messages()
      .slice(-9)
      .map((m) => `${m.name}: ${m.body.replace(/\n/g, " / ").slice(0, 230)}`)
      .join("\n")}`,
  );
  console.log(
    `--- tags\n${bots.desk
      .tags()
      .filter((t) => /^(sof|void|nor|closed)/.test(t))
      .join("\n")}`,
  );
  throw e;
} finally {
  for (const bot of Object.values(bots)) bot.close();
  a.kill();
  b.kill();
  console.log(`${results.filter((r) => r.ok).length} of ${results.length} steps passed`);
}
