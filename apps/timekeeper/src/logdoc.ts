import type { LogEntry, Party } from "@hawser/laytime";
import { z } from "zod";

const KINDS = [
  "EOSP",
  "ARRIVED",
  "ANCHORED",
  "NOR_TENDERED",
  "FREE_PRATIQUE",
  "ANCHOR_AWEIGH",
  "ALL_FAST",
  "HATCHES_OPEN",
  "COMMENCED",
  "STOPPAGE_START",
  "STOPPAGE_END",
  "COMPLETED",
  "DOCS_ON_BOARD",
  "SAILED",
  "CORRECTION",
] as const;

const entrySchema = z.object({
  seq: z.number().int().positive(),
  kind: z.enum(KINDS),
  localTime: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/),
  zone: z.string().min(1).nullable(),
  reason: z.string().optional(),
  corrects: z.number().int().positive().optional(),
  source: z.object({ type: z.enum(["photo", "message", "document", "quay_check"]), ref: z.string() }),
  enteredBy: z.string().min(1),
});

export type RawEntry = z.infer<typeof entrySchema>;

export interface ParsedLog {
  party: Party;
  callId: string;
  lines: string[];
  entries: RawEntry[];
  errors: string[];
}

export const LOG_HEADER = /^HAWSER LOG v1 \| party=(vessel|agency|charterer) \| call=(\S+)\s*$/;

export function logHeader(party: Party, callId: string): string {
  return `HAWSER LOG v1 | party=${party} | call=${callId}`;
}

export function formatEntry(e: RawEntry): string {
  return JSON.stringify(e);
}

/** Parse a company log document. Malformed lines are reported, never skipped silently. */
export function parseLog(content: string, expectParty?: Party): ParsedLog {
  const lines = content.split("\n").filter((l) => l.trim() !== "");
  const errors: string[] = [];
  const head = LOG_HEADER.exec(lines[0] ?? "");
  if (!head)
    throw new Error(
      `log document has no valid header line: ${JSON.stringify((lines[0] ?? "").slice(0, 80))}`,
    );
  const party = head[1] as Party;
  if (expectParty && party !== expectParty)
    throw new Error(`log header says party=${party}, expected ${expectParty}`);
  const entries: RawEntry[] = [];
  lines.slice(1).forEach((l, i) => {
    try {
      const parsed = entrySchema.safeParse(JSON.parse(l));
      if (parsed.success) entries.push(parsed.data);
      else
        errors.push(
          `line ${i + 2}: ${parsed.error.issues.map((x) => `${x.path.join(".")} ${x.message}`).join("; ")}`,
        );
    } catch {
      errors.push(`line ${i + 2}: not valid JSON`);
    }
  });
  const seqs = entries.map((e) => e.seq);
  seqs.forEach((s, i) => {
    if (i > 0 && s <= (seqs[i - 1] as number)) errors.push(`seq ${s} is not increasing`);
  });
  return { party, callId: head[2] as string, lines: lines.slice(1), entries, errors };
}

/**
 * Entries that count as facts: a CORRECTION replaces the entry whose seq it names.
 * A correction carries the corrected kind in `reason` as "kind=<KIND>" so the replaced line keeps its meaning visible.
 */
export function effectiveEntries(log: ParsedLog): LogEntry[] {
  const replaced = new Set<number>();
  const out: LogEntry[] = [];
  for (const e of log.entries)
    if (e.kind === "CORRECTION" && e.corrects !== undefined) replaced.add(e.corrects);
  for (const e of log.entries) {
    if (e.kind === "CORRECTION") {
      const m = /kind=([A-Z_]+)/.exec(e.reason ?? "");
      const original = log.entries.find((x) => x.seq === e.corrects);
      const kind = (m?.[1] ?? original?.kind) as LogEntry["kind"] | undefined;
      if (!kind) continue;
      const le: LogEntry = {
        party: log.party,
        kind,
        localTime: e.localTime,
        zone: e.zone,
        source: e.source,
        enteredBy: e.enteredBy,
      };
      const why = (e.reason ?? "").replace(/kind=[A-Z_]+\s*/, "").trim() || original?.reason;
      if (why) le.reason = why;
      out.push(le);
      continue;
    }
    if (replaced.has(e.seq)) continue;
    const le: LogEntry = {
      party: log.party,
      kind: e.kind as LogEntry["kind"],
      localTime: e.localTime,
      zone: e.zone,
      source: e.source,
      enteredBy: e.enteredBy,
    };
    if (e.reason) le.reason = e.reason;
    out.push(le);
  }
  return out;
}
