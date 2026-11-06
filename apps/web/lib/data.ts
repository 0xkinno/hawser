import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { type RunBundle, effectiveEntries, parseLog, reconcile } from "@hawser/laytime";
import type { LogEntry, Party } from "@hawser/laytime";

const dir = (p: string) => join(process.cwd(), p);

export interface ProbeResult {
  id: string;
  question: string;
  status: "observed" | "partial" | "not_runnable_here";
  summary: string;
  ranAt: string;
  switchVersion: string;
  environment: string;
  caveats?: string[];
}

export const facts = (): Record<string, any> => JSON.parse(readFileSync(dir("data/facts.json"), "utf8"));

export function bundleFiles(): string[] {
  return readdirSync(dir("data/runs"))
    .filter((f) => f.endsWith(".json"))
    .sort();
}
export const bundleIdOf = (file: string) => file.replace(/\.json$/, "");
export function bundles(): Array<{ id: string; file: string; bundle: RunBundle }> {
  return bundleFiles().map((f) => ({
    id: bundleIdOf(f),
    file: f,
    bundle: JSON.parse(readFileSync(dir(`data/runs/${f}`), "utf8")) as RunBundle,
  }));
}
export function bundle(id: string): { id: string; file: string; bundle: RunBundle } | undefined {
  return bundles().find((b) => b.id === id);
}
export function pdfFor(id: string, b: RunBundle): string | undefined {
  const name = `sof-${b.callId}-${b.finalDigest}.pdf`;
  return readdirSync(dir("public/data/runs")).includes(name) ? `/data/runs/${name}` : undefined;
}
export function probes(): ProbeResult[] {
  return readdirSync(dir("data/probes"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(dir(`data/probes/${f}`), "utf8")) as ProbeResult)
    .sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
}

/** The latest content of each company log in a bundle, parsed with the same code the Timekeeper uses. */
export function lanes(b: RunBundle) {
  const latest = new Map<string, RunBundle["docs"][number]>();
  for (const d of b.docs)
    if (!latest.has(d.party) || d.revision > (latest.get(d.party)?.revision ?? 0)) latest.set(d.party, d);
  const entries: LogEntry[] = [];
  const perParty: Record<string, LogEntry[]> = { vessel: [], agency: [], charterer: [] };
  for (const [party, d] of latest) {
    const parsed = parseLog(d.content, party as Party);
    const eff = effectiveEntries(parsed);
    perParty[party] = eff;
    entries.push(...eff);
  }
  const last = b.sofVersions[b.sofVersions.length - 1];
  const rec = reconcile(entries, b.terms, last?.norDecision ?? "NONE");
  return { perParty, reconciled: rec, nor: last?.norDecision ?? "NONE" };
}
