import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { computeLaytime } from "../src/engine";
import type { AgreedEvent, NorDecision, Terms } from "../src/types";

export interface ExternalCase {
  id: string;
  modelled: boolean;
  source: { title: string; publisher: string; url: string; accessed: string; location: string };
  publishedAnswer: string;
  terms: Terms;
  nor: NorDecision;
  events: Array<{ kind: AgreedEvent["kind"]; utc: string; reason?: string }>;
  expected: { usedMin?: number; demurrageMin?: number; demurrageCents: number; despatchCents: number };
  mismatchReason?: string;
  note?: string;
}

export interface ExternalOutcome {
  id: string;
  match: boolean;
  modelled: boolean;
  diffs: string[];
  mismatchReason?: string;
}

const dir = join(dirname(fileURLToPath(import.meta.url)), "external");

export function loadExternal(): ExternalCase[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as ExternalCase);
}

export function runCase(c: ExternalCase): ExternalOutcome {
  const events: AgreedEvent[] = c.events.map((e) => ({ ...e, verdict: "OBSERVED", sources: [c.source.url] }));
  const r = computeLaytime(events, c.terms, c.nor);
  const diffs: string[] = [];
  const chk = (name: string, got: number, want: number | undefined) => {
    if (want !== undefined && got !== want) diffs.push(`${name}: engine ${got}, published ${want}`);
  };
  chk("usedMin", r.usedMin, c.expected.usedMin);
  chk("demurrageMin", r.demurrageMin, c.expected.demurrageMin);
  chk("demurrageCents", r.demurrageCents, c.expected.demurrageCents);
  chk("despatchCents", r.despatchCents, c.expected.despatchCents);
  const out: ExternalOutcome = { id: c.id, match: diffs.length === 0, modelled: c.modelled, diffs };
  if (c.mismatchReason) out.mismatchReason = c.mismatchReason;
  return out;
}

export function runExternal(): { n: number; m: number; outcomes: ExternalOutcome[] } {
  const outcomes = loadExternal().map(runCase);
  return { n: outcomes.filter((o) => o.match).length, m: outcomes.length, outcomes };
}
