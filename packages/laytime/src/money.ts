/** Half-up integer division. Stated rule: amounts are rounded half-up to the cent. */
export const roundHalfUp = (num: number, den: number): number => Math.floor((num * 2 + den) / (den * 2));

export const MINUTES_PER_DAY = 1440;

/** Cents owed for `minutes` at `centsPerDay`, rounded half-up to the cent. */
export function centsForMinutes(minutes: number, centsPerDay: number): number {
  if (!Number.isInteger(minutes) || !Number.isInteger(centsPerDay)) {
    throw new Error("centsForMinutes needs integer minutes and integer cents per day");
  }
  return roundHalfUp(minutes * centsPerDay, MINUTES_PER_DAY);
}

export function formatUsd(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}USD ${whole}.${String(abs % 100).padStart(2, "0")}`;
}
