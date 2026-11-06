import type { DateTime } from "luxon";
import { parseLogTime } from "./calendar";
import { computeLaytime } from "./engine";
import type { AgreedEvent, EventKind, LogEntry, NorDecision, Party, Terms, Verdict } from "./types";

export interface Claim {
  party: Party;
  utc: string;
  source: string;
}

export interface Divergence {
  key: string;
  kind: EventKind;
  claims: Claim[];
  spreadMin: number;
  moneyAtStakeCents: number;
  verdict: Verdict;
  /** Who decides: the party whose own act the event is. Null when nobody needs to be asked. */
  ask: { party: Party; why: string } | null;
}

export interface Abstention {
  party: Party;
  kind: EventKind;
  localTime: string;
  reason: string;
}

export interface ReconcileResult {
  agreed: AgreedEvent[];
  divergences: Divergence[];
  abstentions: Abstention[];
  missingCritical: EventKind[];
}

/** NOR_TENDERED, EOSP, ANCHORED, SAILED belong to the vessel; quay events to the agency. */
const DECIDER: Record<EventKind, Party> = {
  EOSP: "vessel",
  ARRIVED: "vessel",
  ANCHORED: "vessel",
  NOR_TENDERED: "vessel",
  FREE_PRATIQUE: "agency",
  ANCHOR_AWEIGH: "vessel",
  ALL_FAST: "agency",
  HATCHES_OPEN: "agency",
  COMMENCED: "agency",
  STOPPAGE_START: "agency",
  STOPPAGE_END: "agency",
  COMPLETED: "agency",
  DOCS_ON_BOARD: "agency",
  SAILED: "vessel",
};

const CRITICAL = new Set<EventKind>(["NOR_TENDERED", "FREE_PRATIQUE", "ALL_FAST", "COMPLETED"]);

export const decidingParty = (k: EventKind): Party => DECIDER[k];
export const isCritical = (k: EventKind, terms: Terms): boolean =>
  CRITICAL.has(k) && (k !== "FREE_PRATIQUE" || terms.norRequiresFreePratique);

const iso = (t: DateTime) => t.toUTC().toISO({ suppressMilliseconds: true }) as string;
const minutesBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 60000);
const net = (events: AgreedEvent[], terms: Terms, nor: NorDecision) => {
  const r = computeLaytime(events, terms, nor);
  return r.demurrageCents - r.despatchCents;
};

/**
 * Normalise every party's entries to UTC (abstaining on a missing zone), group by event, and price every disagreement.
 * Tolerance is 0 minutes for the NOR and terms.toleranceMin (default 5) for everything else.
 * Money at stake is the difference in net demurrage between the earliest and the latest claim for that event.
 */
export function reconcile(entries: LogEntry[], terms: Terms, nor: NorDecision): ReconcileResult {
  const abstentions: Abstention[] = [];
  const parsed: Array<{ e: LogEntry; utc: string; key: string }> = [];
  const occurrence = new Map<string, number>();
  const ordered = [...entries];
  const resolved = ordered.flatMap((e) => {
    if (e.zone === null || e.zone === "") {
      abstentions.push({
        party: e.party,
        kind: e.kind,
        localTime: e.localTime,
        reason: "no zone given: time not placed, ask once",
      });
      return [];
    }
    return [{ e, t: parseLogTime(e.localTime, e.zone) }];
  });
  resolved.sort((a, b) => a.t.toMillis() - b.t.toMillis());
  for (const { e, t } of resolved) {
    const base = `${e.party}:${e.kind}`;
    const n = occurrence.get(base) ?? 0;
    occurrence.set(base, n + 1);
    const key = e.kind === "STOPPAGE_START" || e.kind === "STOPPAGE_END" ? `${e.kind}#${n}` : e.kind;
    parsed.push({ e, utc: iso(t), key });
  }
  const groups = new Map<string, typeof parsed>();
  for (const p of parsed) groups.set(p.key, [...(groups.get(p.key) ?? []), p]);

  const tolOf = (k: EventKind) => (k === "NOR_TENDERED" ? 0 : (terms.toleranceMin ?? 5));
  const baseline: AgreedEvent[] = [];
  const meta: Array<{ key: string; kind: EventKind; claims: Claim[]; verdict: Verdict; spread: number }> = [];
  for (const [key, group] of groups) {
    const first = group[0] as (typeof parsed)[number];
    const kind = first.e.kind;
    const claims: Claim[] = group.map((g) => ({ party: g.e.party, utc: g.utc, source: g.e.source.ref }));
    const times = claims.map((c) => c.utc).sort();
    const spread = minutesBetween(times[0] as string, times[times.length - 1] as string);
    const decider = claims.find((c) => c.party === DECIDER[kind]);
    const chosen = decider?.utc ?? (times[0] as string);
    const hasSource = group.every((g) => g.e.source.ref.trim() !== "");
    const verdict: Verdict = spread <= tolOf(kind) && hasSource ? "OBSERVED" : "REVIEW";
    const reason = group.find((g) => g.e.reason)?.e.reason;
    const ev: AgreedEvent = { kind, utc: chosen, verdict, sources: claims.map((c) => c.source) };
    if (reason) ev.reason = reason;
    baseline.push(ev);
    meta.push({ key, kind, claims, verdict, spread });
  }

  const divergences: Divergence[] = [];
  for (const [idx, m] of meta.entries()) {
    if (m.spread <= tolOf(m.kind)) continue;
    const times = m.claims.map((c) => c.utc).sort();
    const withTime = (utc: string) => baseline.map((e, i) => (i === idx ? { ...e, utc } : e));
    const lo = net(withTime(times[0] as string), terms, nor);
    const hi = net(withTime(times[times.length - 1] as string), terms, nor);
    const money = Math.abs(hi - lo);
    const critical = isCritical(m.kind, terms);
    const ask =
      critical || money >= terms.moneyQuestionThresholdCents
        ? {
            party: DECIDER[m.kind],
            why: critical
              ? "legally critical event"
              : `moves money by at least the threshold (${money} cents)`,
          }
        : null;
    divergences.push({
      key: m.key,
      kind: m.kind,
      claims: m.claims,
      spreadMin: m.spread,
      moneyAtStakeCents: money,
      verdict: "REVIEW",
      ask,
    });
  }

  const present = new Set(parsed.map((p) => p.e.kind));
  const missingCritical = (["NOR_TENDERED", "ALL_FAST", "COMPLETED"] as EventKind[])
    .concat(terms.norRequiresFreePratique ? (["FREE_PRATIQUE"] as EventKind[]) : [])
    .filter((k) => !present.has(k));
  baseline.sort((a, b) => Date.parse(a.utc) - Date.parse(b.utc));
  return { agreed: baseline, divergences, abstentions, missingCritical };
}
