import { readFileSync, readdirSync } from "node:fs";
import {
  type LogEntry,
  type NorDecision,
  type Terms,
  bothScenarios,
  computeLaytime,
  reconcile,
} from "@hawser/laytime";
import { DateTime } from "luxon";

export interface Scenario {
  id: string;
  title: string;
  shapedOn: string;
  tests: string;
  terms: Terms;
  decision: NorDecision;
  logs: LogEntry[];
  expected: Record<string, unknown>;
}

export const loadScenarios = (): Scenario[] =>
  readdirSync("fixtures/scenarios")
    .filter((d) => d.startsWith("S"))
    .sort()
    .map((d) => JSON.parse(readFileSync(`fixtures/scenarios/${d}/scenario.json`, "utf8")) as Scenario);

export interface ScenarioOutcome {
  id: string;
  divergences: number;
  divergencesWithMoney: number;
  moneyAtStakeCents: number;
  questionsAsked: number;
  askedParties: string[];
  abstentions: number;
  norValid: boolean;
  factsReconciled: number;
  factsOnReview: number;
  status: string;
  /** What one chat thread carries to the claims desk: every disagreement and every unsettled notice, with no one asked. */
  counterfactualOff: { unresolvedAtClaimStage: number; moneyAtStakeCents: number; norLeftAmbiguous: boolean };
  /** What HAWSER put in front of the right person before sailing. */
  on: { surfaced: number; asked: number; priced: number };
}

export function runScenario(s: Scenario): ScenarioOutcome {
  const r = reconcile(s.logs, s.terms, s.decision);
  const both = bothScenarios(r.agreed, s.terms);
  const l = computeLaytime(r.agreed, s.terms, s.decision);
  const money = r.divergences.reduce((m, d) => Math.max(m, d.moneyAtStakeCents), 0);
  const asked = r.divergences.filter((d) => d.ask);
  const askedAbstain = r.abstentions.length;
  return {
    id: s.id,
    divergences: r.divergences.length,
    divergencesWithMoney: r.divergences.filter((d) => d.moneyAtStakeCents > 0).length,
    moneyAtStakeCents: money,
    questionsAsked: asked.length + askedAbstain,
    askedParties: asked.map((d) => d.ask?.party as string),
    abstentions: askedAbstain,
    norValid: both.norValid,
    factsReconciled: r.agreed.filter((e) => e.verdict === "OBSERVED").length,
    factsOnReview: r.agreed.filter((e) => e.verdict === "REVIEW").length,
    status: l.status,
    counterfactualOff: {
      unresolvedAtClaimStage: r.divergences.length + r.abstentions.length + (both.norValid ? 0 : 1),
      moneyAtStakeCents: money,
      norLeftAmbiguous: !both.norValid && s.decision === "NONE",
    },
    on: {
      surfaced: r.divergences.length + r.abstentions.length + (both.norValid ? 0 : 1),
      asked: asked.length + askedAbstain,
      priced: r.divergences.length,
    },
  };
}

// ------------------------------------------------------------------ seeded variations

/** Small deterministic generator (mulberry32) so the same seed always gives the same variations. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ZONES = ["Europe/Berlin", "UTC+03:00", "America/Sao_Paulo", "Asia/Singapore", "UTC"];
const KINDS_TOL5 = ["ALL_FAST", "HATCHES_OPEN", "EOSP", "COMPLETED"] as const;

export interface VariationResult {
  seeds: number;
  events: number;
  expectedFlags: number;
  falseDivergences: number;
  missedDivergences: number;
  /** Events where a wall-clock time was ambiguous or missing, so the reconciler abstained and asked instead of guessing. */
  abstainedAmbiguous: number;
  misses: Array<{
    variation: number;
    kind: string;
    truthNoiseMin: number;
    zoneA: string;
    zoneB: string;
    localA: string;
    localB: string;
    why: string;
  }>;
  falses: Array<{
    variation: number;
    kind: string;
    truthNoiseMin: number;
    zoneA: string;
    zoneB: string;
    localA: string;
    localB: string;
    why: string;
  }>;
}

/**
 * Twenty variations. Each has events whose true UTC instants are known. Two parties log the same instant plus a known
 * noise, written in two different zones, some around the Berlin clock change. Ground truth: flag when the noise exceeds
 * the tolerance (0 min for the NOR, 5 min otherwise). Count what the reconciler flags that it should not, and misses.
 */
export function runVariations(seed = 1, n = 20): VariationResult {
  const rand = rng(seed);
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)] as T;
  const res: VariationResult = {
    seeds: n,
    events: 0,
    expectedFlags: 0,
    falseDivergences: 0,
    missedDivergences: 0,
    abstainedAmbiguous: 0,
    misses: [],
    falses: [],
  };
  const terms = JSON.parse(readFileSync("fixtures/terms/brake.json", "utf8")) as Terms;
  const noisesTol5 = [0, 0, 3, 5, 6, 12, 40];
  const noisesNor = [0, 0, 1, 10];
  for (let v = 1; v <= n; v++) {
    const zoneA = pick(ZONES);
    const zoneB = pick(ZONES);
    const day = pick([24, 25, 26, 27, 13, 16]);
    const month = day >= 24 ? 10 : 11;
    const entries: LogEntry[] = [];
    const truth: Array<{ kind: string; noise: number; tol: number; localA: string; localB: string }> = [];
    const kinds: string[] = ["NOR_TENDERED", pick(KINDS_TOL5), pick(KINDS_TOL5)];
    kinds.forEach((kind, i) => {
      if (kinds.indexOf(kind) !== i) return;
      const hour = pick([0, 1, 2, 3, 9, 14, 16]);
      const minute = Math.floor(rand() * 60);
      const base = DateTime.utc(2026, month, day, hour, minute);
      const noise = kind === "NOR_TENDERED" ? pick(noisesNor) : pick(noisesTol5);
      const tol = kind === "NOR_TENDERED" ? 0 : 5;
      const a = base.setZone(zoneA).toFormat("yyyy-MM-dd HH:mm");
      const b = base.plus({ minutes: noise }).setZone(zoneB).toFormat("yyyy-MM-dd HH:mm");
      const mk = (party: LogEntry["party"], t: string, z: string): LogEntry => ({
        party,
        kind: kind as LogEntry["kind"],
        localTime: t,
        zone: z,
        source: { type: "message", ref: `${party}:${kind}` },
        enteredBy: party,
      });
      entries.push(mk("vessel", a, zoneA), mk("agency", b, zoneB));
      truth.push({ kind, noise, tol, localA: a, localB: b });
    });
    const r = reconcile(entries, terms, "NONE");
    const flagged = new Set(r.divergences.map((d) => d.kind));
    const abstained = new Set(r.abstentions.map((a) => a.kind));
    for (const t of truth) {
      res.events++;
      const should = Math.abs(t.noise) > t.tol;
      if (abstained.has(t.kind as LogEntry["kind"])) {
        res.abstainedAmbiguous++;
        if (should) res.expectedFlags--;
        continue;
      }
      const did = flagged.has(t.kind as LogEntry["kind"]);
      if (should) res.expectedFlags++;
      const row = {
        variation: v,
        kind: t.kind,
        truthNoiseMin: t.noise,
        zoneA,
        zoneB,
        localA: t.localA,
        localB: t.localB,
      };
      if (should && !did) {
        res.missedDivergences++;
        res.misses.push({ ...row, why: "noise above tolerance but not flagged" });
      }
      if (!should && did) {
        res.falseDivergences++;
        res.falses.push({ ...row, why: "flagged although the true instants agree within tolerance" });
      }
    }
  }
  return res;
}
