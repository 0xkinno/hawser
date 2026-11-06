/**
 * Generates docs/FACTS.json from the committed evidence only: scenario files, external examples, probe results and the
 * run bundles. Nothing is typed by hand. `pnpm facts --check` fails when the committed file is stale.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { loadExternal, runExternal } from "../packages/laytime/test/external-run";
import { loadScenarios, runScenario, runVariations } from "./scenarios";

const read = (f: string) => JSON.parse(readFileSync(f, "utf8"));
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
};
const round1 = (x: number) => Math.round(x * 10) / 10;

const results: Record<string, any> = {};
for (const f of readdirSync("probes/results").filter(
  (x) => x.endsWith(".json") && !x.endsWith(".local.json"),
)) {
  const d = read(`probes/results/${f}`);
  if (!results[d.id] || d.ranAt > results[d.id].ranAt) results[d.id] = d;
}

const scenarioFiles = readdirSync("fixtures/scenarios")
  .filter((d) => d.startsWith("S"))
  .sort();
const scenarioSha = createHash("sha256")
  .update(scenarioFiles.map((d) => readFileSync(`fixtures/scenarios/${d}/scenario.json`, "utf8")).join("\n"))
  .digest("hex")
  .slice(0, 12);

const ext = runExternal();
const scenarios = loadScenarios().map(runScenario);
const var1 = runVariations(1, 20);
let fp300 = 0;
let fn300 = 0;
let abstained300 = 0;
let events300 = 0;
for (let s = 1; s <= 300; s++) {
  const v = runVariations(s, 20);
  fp300 += v.falseDivergences;
  fn300 += v.missedDivergences;
  abstained300 += v.abstainedAmbiguous;
  events300 += v.events;
}

const bundles = readdirSync("runs")
  .filter((f) => f.endsWith(".json"))
  .sort();
const latest = bundles.length ? read(`runs/${bundles[bundles.length - 1]}`) : undefined;

const passes: Record<string, boolean | "not_run"> = {
  b1: results.b1?.observed?.decisionCardsPosted === 0,
  b2: Boolean(results.b2?.observed?.card),
  b3: Boolean(results.b3?.observed?.outcome?.refused && results.b3?.observed?.contentUnchanged),
  b4: Boolean(
    results.b4 &&
      results.b4.observed.trials.length === 5 &&
      results.b4.observed.trials.every((t: any) => t.oldDigestRefused && t.newDigest),
  ),
  b5: "not_run",
  b6: Boolean(
    results.b6?.observed?.allDigestsIdentical &&
      results.b6.observed.trials.every((t: any) => t.duplicateTags.length === 0),
  ),
  b7: Boolean(results.b7 && results.b7.observed.duplicateTagsAfter.length === 0),
  b8: Boolean(results.b8?.observed?.refusals?.length >= 1),
  b9: Boolean(
    results.b9 && results.b9.observed.askedTimes === 1 && results.b9.observed.norCardPosted === false,
  ),
  b10: Boolean(results.b10?.observed?.card),
  b11: Boolean(results.b11?.observed?.refusals?.length === 2),
};
const ran = Object.values(passes).filter((v) => v !== "not_run");
const probeIds = [
  "p01",
  "p02",
  "p03",
  "p04",
  "p05",
  "p06",
  "p07",
  "p08",
  "p09",
  "p10",
  "p11",
  "p12",
  "p13",
  "p14",
];
const probeStatus = Object.fromEntries(probeIds.map((id) => [id, results[id]?.status ?? "not_yet_run"]));

const facts = {
  generated_from: "fixtures/scenarios, packages/laytime/test/external, probes/results, runs",
  scenario_sha: scenarioSha,
  engine_external_match: {
    n: ext.n,
    m: ext.m,
    mismatches: ext.outcomes
      .filter((o) => !o.match)
      .map((o) => ({ id: o.id, reason: o.mismatchReason ?? o.diffs.join("; ") })),
  },
  scenarios: scenarios.length,
  scenario_outcomes: scenarios.map((s) => ({
    id: s.id,
    divergences: s.divergences,
    money_at_stake_usd: s.moneyAtStakeCents / 100,
    questions_asked: s.questionsAsked,
    nor_valid: s.norValid,
    status: s.status,
    off_unresolved_at_claim_stage: s.counterfactualOff.unresolvedAtClaimStage,
    on_surfaced_before_sailing: s.on.surfaced,
  })),
  divergences_found: scenarios.reduce((n, s) => n + s.divergences, 0),
  divergences_with_money: scenarios.reduce((n, s) => n + s.divergencesWithMoney, 0),
  questions_asked: scenarios.reduce((n, s) => n + s.questionsAsked, 0),
  facts_reconciled: scenarios.reduce((n, s) => n + s.factsReconciled, 0),
  counterfactual: {
    off_one_chat_thread: {
      surfaced_before_sailing: 0,
      left_for_the_claims_desk: scenarios.reduce((n, s) => n + s.counterfactualOff.unresolvedAtClaimStage, 0),
    },
    on_hawser: {
      surfaced_before_sailing: scenarios.reduce((n, s) => n + s.on.surfaced, 0),
      questions_asked: scenarios.reduce((n, s) => n + s.on.asked, 0),
      priced: scenarios.reduce((n, s) => n + s.on.priced, 0),
    },
  },

  signatures: latest ? latest.signatures.filter((s: any) => s.digest === latest.finalDigest).length : 0,
  run_bundle: latest
    ? { file: bundles[bundles.length - 1], mode: latest.provenance.mode, label: latest.provenance.label }
    : null,
  reconciler_variations: {
    seed: 1,
    variations: 20,
    events: var1.events,
    false_divergences: var1.falseDivergences,
    missed_divergences: var1.missedDivergences,
    abstained_ambiguous: var1.abstainedAmbiguous,
    robustness_seeds: 300,
    robustness_events: events300,
    robustness_false_divergences: fp300,
    robustness_missed_divergences: fn300,
    robustness_abstained_ambiguous: abstained300,
  },
  false_divergences: var1.falseDivergences,
  missed_divergences: var1.missedDivergences,
  lease_failover_seconds: results.b6
    ? round1(median(results.b6.observed.trials.map((t: any) => t.failoverSeconds)))
    : null,
  lease_failover_raw_seconds: results.p06 ? round1(results.p06.observed.medianSeconds) : null,
  silent_rewrite_detect_seconds: results.b4
    ? round1(median(results.b4.observed.trials.map((t: any) => t.detectSeconds)))
    : null,
  break_cases_passed: ran.filter((v) => v === true).length,
  break_cases_run: ran.length,
  break_cases_total: 11,
  break_cases_detail: passes,
  ws_ping_interval_s: results.p01?.observed?.heartbeatIntervalSeconds ?? null,
  probes: probeStatus,
  run_date:
    Object.values(results)
      .map((r: any) => String(r.ranAt).slice(0, 10))
      .sort()
      .pop() ?? null,
  switch_core_version: results.p01?.switchVersion ?? null,
  environment: results.p01?.environment ?? null,
  external_examples_total: loadExternal().length,
};

const text = `${JSON.stringify(facts, null, 2)}\n`;
if (process.argv.includes("--check")) {
  const current = readFileSync("docs/FACTS.json", "utf8");
  if (current !== text) {
    console.error("docs/FACTS.json is stale. Run: pnpm facts");
    process.exit(1);
  }
  console.log("docs/FACTS.json is current");
} else {
  writeFileSync("docs/FACTS.json", text);
  console.log("wrote docs/FACTS.json");
}
