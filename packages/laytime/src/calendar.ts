import { DateTime } from "luxon";
import type { Terms } from "./types";

/** "HH:MM" to minutes since midnight. */
export function hm(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) throw new Error(`bad time of day: ${JSON.stringify(s)}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Parse a time as written in a log. The zone is an IANA name or "UTC+02:00".
 * A missing zone is never guessed: the caller must abstain before calling this.
 */
export function parseLogTime(localTime: string, zone: string): DateTime {
  const t = DateTime.fromFormat(localTime, "yyyy-MM-dd HH:mm", { zone });
  if (!t.isValid)
    throw new Error(
      `cannot parse ${JSON.stringify(localTime)} in zone ${JSON.stringify(zone)}: ${t.invalidExplanation}`,
    );
  return t;
}

/** Whole-day test used for "next working day". Saturday is a working day under SHEX and under SSHEX only when a cut-off is given. */
export function isWorkingDay(d: DateTime, terms: Terms): boolean {
  if (terms.working === "SHINC") return true;
  if (terms.holidays.includes(d.toISODate() as string)) return false;
  if (d.weekday === 7) return false;
  if (d.weekday === 6 && terms.working === "SSHEX")
    return terms.saturdayEndsAt !== undefined && hm(terms.saturdayEndsAt) > 0;
  return true;
}

/**
 * Does this minute count towards laytime, ignoring stoppages?
 * SHINC: every minute. SHEX: not Sundays or holidays. SSHEX: not Sundays or holidays, and Saturday only until saturdayEndsAt.
 * An optional Friday cut-off applies to SHEX and SSHEX.
 */
export function isWorkingMinute(t: DateTime, terms: Terms): { counts: boolean; why: string } {
  if (terms.working === "SHINC") return { counts: true, why: "SHINC" };
  const date = t.toISODate() as string;
  if (terms.holidays.includes(date)) return { counts: false, why: "holiday" };
  if (t.weekday === 7) return { counts: false, why: "Sunday" };
  const minuteOfDay = t.hour * 60 + t.minute;
  if (terms.working === "SSHEX" && t.weekday === 6) {
    const cut = terms.saturdayEndsAt === undefined ? 0 : hm(terms.saturdayEndsAt);
    if (minuteOfDay >= cut) return { counts: false, why: "Saturday after cut-off" };
  }
  if (t.weekday === 5 && terms.weekdayEndsAt !== undefined && minuteOfDay >= hm(terms.weekdayEndsAt)) {
    return { counts: false, why: "Friday after cut-off" };
  }
  return { counts: true, why: "working time" };
}

export type CheckedTime = { ok: true; t: DateTime } | { ok: false; reason: string };

const FMT = "yyyy-MM-dd HH:mm";

/**
 * Like parseLogTime, but refuses a wall-clock time that does not name exactly one instant in an IANA zone:
 * the repeated hour when clocks go back (two instants) and the skipped hour when they go forward (none).
 * Fixed offsets such as UTC+03:00 are never ambiguous. The caller abstains and asks for the offset.
 */
export function parseLogTimeChecked(localTime: string, zone: string): CheckedTime {
  const t = DateTime.fromFormat(localTime, FMT, { zone });
  if (!t.isValid)
    return { ok: false, reason: `cannot parse ${JSON.stringify(localTime)} in zone ${JSON.stringify(zone)}` };
  if (t.toFormat(FMT) !== localTime)
    return {
      ok: false,
      reason: `${localTime} does not exist in ${zone} (clocks go forward): give the UTC offset`,
    };
  for (const delta of [-3_600_000, 3_600_000]) {
    const other = DateTime.fromMillis(t.toMillis() + delta, { zone });
    if (other.toFormat(FMT) === localTime)
      return {
        ok: false,
        reason: `${localTime} happens twice in ${zone} (clocks go back): give the UTC offset`,
      };
  }
  return { ok: true, t };
}
