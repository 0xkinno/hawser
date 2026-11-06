import { DateTime } from "luxon";
import { hm, isWorkingDay, isWorkingMinute } from "./calendar";
import { centsForMinutes } from "./money";
import { norValidity } from "./nor";
import type { AgreedEvent, NorDecision, Terms } from "./types";

export interface LedgerRow {
  fromUtc: string;
  toUtc: string;
  counts: boolean;
  why: string;
}

export interface LaytimeResult {
  status: "COUNTED" | "NOT_TRIGGERED";
  reasons: string[];
  commencedUtc?: string;
  endUtc?: string;
  usedMin: number;
  allowedMin: number;
  onDemurrageFromUtc?: string;
  demurrageMin: number;
  demurrageCents: number;
  despatchCents: number;
  ledger: LedgerRow[];
}

interface Stoppage {
  from: DateTime;
  to: DateTime;
  reason: string;
  excepted: boolean;
}

const utcIso = (t: DateTime): string => t.toUTC().toISO({ suppressMilliseconds: true }) as string;

/** Next working day at the stated time. A day counts as a working day per isWorkingDay. */
export function commencement(norUtc: string, terms: Terms): DateTime {
  const nor = DateTime.fromISO(norUtc, { zone: "utc" }).setZone(terms.portZone);
  if (terms.commencement.kind === "hours_after_nor") return nor.plus({ hours: terms.commencement.hours });
  let d = nor.plus({ days: 1 }).startOf("day");
  for (let guard = 0; !isWorkingDay(d, terms); guard++) {
    if (guard > 400) throw new Error("no working day found within 400 days: check the holidays list");
    d = d.plus({ days: 1 });
  }
  const at = hm(terms.commencement.at);
  return d.set({ hour: Math.floor(at / 60), minute: at % 60 });
}

/** Pair STOPPAGE_START with the next STOPPAGE_END in time order. An unpaired event is an error, never guessed. */
export function pairStoppages(events: AgreedEvent[], terms: Terms): Stoppage[] {
  const marks = events
    .filter((e) => e.kind === "STOPPAGE_START" || e.kind === "STOPPAGE_END")
    .map((e) => ({ e, t: DateTime.fromISO(e.utc, { zone: "utc" }).setZone(terms.portZone) }))
    .sort((a, b) => a.t.toMillis() - b.t.toMillis());
  const out: Stoppage[] = [];
  let open: { e: AgreedEvent; t: DateTime } | undefined;
  for (const m of marks) {
    if (m.e.kind === "STOPPAGE_START") {
      if (open) throw new Error(`stoppage starting ${open.e.utc} has no end before the next stoppage starts`);
      open = m;
    } else {
      if (!open) throw new Error(`stoppage end ${m.e.utc} has no start`);
      const reason = open.e.reason ?? "unspecified";
      out.push({ from: open.t, to: m.t, reason, excepted: terms.exceptedStoppages.includes(reason) });
      open = undefined;
    }
  }
  if (open) throw new Error(`stoppage starting ${open.e.utc} has no end`);
  return out;
}

function pushLedger(ledger: LedgerRow[], t: DateTime, counts: boolean, why: string): void {
  const next = utcIso(t.plus({ minutes: 1 }));
  const last = ledger[ledger.length - 1];
  if (last && last.counts === counts && last.why === why && last.toUtc === utcIso(t)) last.toUtc = next;
  else ledger.push({ fromUtc: utcIso(t), toUtc: next, counts, why });
}

/**
 * Minute resolution, integers only. Despatch is on a "laytime saved" basis: saved minutes at the despatch rate.
 * The NOR decision matters only when the engine reads the NOR as invalid: without explicit acceptance, laytime is not triggered.
 */
export function computeLaytime(events: AgreedEvent[], terms: Terms, nor: NorDecision): LaytimeResult {
  const v = norValidity(events, terms);
  const base: LaytimeResult = {
    status: "NOT_TRIGGERED",
    reasons: v.reasons,
    usedMin: 0,
    allowedMin: terms.laytimeAllowedMin,
    demurrageMin: 0,
    demurrageCents: 0,
    despatchCents: 0,
    ledger: [],
  };
  const norEv = events.find((e) => e.kind === "NOR_TENDERED");
  const end = events.find((e) => e.kind === "COMPLETED");
  if (!norEv || !end) return { ...base, reasons: [...v.reasons, "missing NOR or completion"] };
  const accepted = nor === "ACCEPTED" || nor === "ACCEPTED_WITHOUT_PREJUDICE";
  if (!v.valid && !accepted) {
    return {
      ...base,
      reasons: [
        ...v.reasons,
        "invalid NOR and no explicit acceptance recorded: laytime not triggered under these facts",
      ],
    };
  }
  if (nor === "REJECTED" && v.valid) {
    return {
      ...base,
      reasons: ["NOR rejected by the charterer: laytime not triggered until a valid notice is accepted"],
    };
  }
  const start = commencement(norEv.utc, terms);
  const stop = DateTime.fromISO(end.utc, { zone: "utc" }).setZone(terms.portZone);
  const stoppages = pairStoppages(events, terms);
  let used = 0;
  let dem = 0;
  // With no laytime allowed, demurrage runs from the first counted minute.
  let onDemFrom: DateTime | undefined = terms.laytimeAllowedMin === 0 ? start : undefined;
  const ledger: LedgerRow[] = [];
  for (let t = start; t < stop; t = t.plus({ minutes: 1 })) {
    const onDem = onDemFrom !== undefined;
    const sp = stoppages.find((s) => t >= s.from && t < s.to);
    let counts: boolean;
    let why: string;
    if (onDem && terms.onceOnDemurrage) {
      counts = true;
      why = "on demurrage (once on demurrage, always on demurrage)";
    } else {
      const w = isWorkingMinute(t, terms);
      counts = w.counts && !sp?.excepted;
      why = sp?.excepted ? `excepted: ${sp.reason}` : w.why;
    }
    if (counts) {
      if (onDem) dem++;
      else {
        used++;
        if (used === terms.laytimeAllowedMin) onDemFrom = t.plus({ minutes: 1 });
      }
    }
    pushLedger(ledger, t, counts, why);
  }
  const demurrageCents = centsForMinutes(dem, terms.demurrageCentsPerDay);
  const savedMin = Math.max(0, terms.laytimeAllowedMin - used);
  const despatchCents = onDemFrom ? 0 : centsForMinutes(savedMin, terms.despatchCentsPerDay);
  const reasons = v.valid ? [] : [...v.reasons, `counted only because the NOR decision is ${nor}`];
  const result: LaytimeResult = {
    status: "COUNTED",
    reasons,
    commencedUtc: utcIso(start),
    endUtc: utcIso(stop),
    usedMin: used,
    allowedMin: terms.laytimeAllowedMin,
    demurrageMin: dem,
    demurrageCents,
    despatchCents,
    ledger,
  };
  if (onDemFrom) result.onDemurrageFromUtc = utcIso(onDemFrom);
  return result;
}

/** Two columns for a NOR whose validity is in question. The legal call is for people and counsel. */
export function bothScenarios(events: AgreedEvent[], terms: Terms) {
  const v = norValidity(events, terms);
  return {
    norValid: v.valid,
    norReasons: v.reasons,
    validAsAccepted: computeLaytime(events, terms, "ACCEPTED"),
    invalidNotAccepted: computeLaytime(events, terms, "NONE"),
  };
}
