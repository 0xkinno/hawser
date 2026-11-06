import type { AgreedEvent, Terms } from "../src/types";

/** Fictional charter recap shaped on the public Brake facts. Port zone Berlin, SSHEX with no Saturday work. */
export const brakeTerms: Terms = {
  callId: "call-saltmarsh-grace-brake",
  portZone: "Europe/Berlin",
  laytimeAllowedMin: 3 * 1440,
  demurrageCentsPerDay: 1_250_000,
  despatchCentsPerDay: 0,
  working: "SSHEX",
  holidays: [],
  norWindow: { weekdays: [1, 2, 3, 4, 5], from: "08:00", to: "17:00" },
  commencement: { kind: "next_working_day_at", at: "08:00" },
  norRequiresArrival: true,
  norRequiresFreePratique: false,
  exceptedStoppages: ["weather"],
  onceOnDemurrage: true,
  moneyQuestionThresholdCents: 25_000,
};

export const ev = (
  kind: AgreedEvent["kind"],
  utc: string,
  extra: Partial<AgreedEvent> = {},
): AgreedEvent => ({
  kind,
  utc,
  verdict: "OBSERVED",
  sources: ["test"],
  ...extra,
});
