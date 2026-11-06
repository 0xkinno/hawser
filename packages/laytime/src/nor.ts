import { DateTime } from "luxon";
import { hm } from "./calendar";
import type { AgreedEvent, Terms } from "./types";

const at = (utc: string, zone: string) => DateTime.fromISO(utc, { zone: "utc" }).setZone(zone);

/**
 * Is the Notice of Readiness valid under the stated terms?
 * This is the engine's reading of the terms, not a legal conclusion. Callers show both scenarios when it is false.
 */
export function norValidity(events: AgreedEvent[], terms: Terms): { valid: boolean; reasons: string[] } {
  const nor = events.find((e) => e.kind === "NOR_TENDERED");
  if (!nor) return { valid: false, reasons: ["no NOR recorded"] };
  const t = at(nor.utc, terms.portZone);
  const reasons: string[] = [];
  const mins = t.hour * 60 + t.minute;
  const w = terms.norWindow;
  const inWeekday = w.weekdays.includes(t.weekday) && mins >= hm(w.from) && mins < hm(w.to);
  const inSat = t.weekday === 6 && !!w.saturday && mins >= hm(w.saturday.from) && mins < hm(w.saturday.to);
  if (!inWeekday && !inSat) reasons.push(`NOR at ${t.toFormat("ccc HH:mm")} is outside the NOR window`);
  if (terms.holidays.includes(t.toISODate() as string)) reasons.push("NOR on a port holiday");
  const norMs = DateTime.fromISO(nor.utc).toMillis();
  if (terms.norRequiresArrival) {
    const arrivals = events
      .filter((e) => e.kind === "ARRIVED" || e.kind === "ANCHORED")
      .map((e) => DateTime.fromISO(e.utc).toMillis());
    const first = arrivals.length ? Math.min(...arrivals) : undefined;
    if (first === undefined)
      reasons.push("no arrival recorded, so the vessel is not shown to be an arrived ship");
    else if (first > norMs) reasons.push("NOR tendered before the vessel had arrived");
  }
  if (terms.norRequiresFreePratique) {
    const fp = events.find((e) => e.kind === "FREE_PRATIQUE");
    if (!fp || DateTime.fromISO(fp.utc).toMillis() > norMs) reasons.push("NOR tendered before free pratique");
  }
  return { valid: reasons.length === 0, reasons };
}
