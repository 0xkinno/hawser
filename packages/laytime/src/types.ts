export type EventKind =
  | "EOSP"
  | "ARRIVED"
  | "ANCHORED"
  | "NOR_TENDERED"
  | "FREE_PRATIQUE"
  | "ANCHOR_AWEIGH"
  | "ALL_FAST"
  | "HATCHES_OPEN"
  | "COMMENCED"
  | "STOPPAGE_START"
  | "STOPPAGE_END"
  | "COMPLETED"
  | "DOCS_ON_BOARD"
  | "SAILED";

export type Party = "vessel" | "agency" | "charterer";
export type Working = "SHINC" | "SHEX" | "SSHEX";
export type NorDecision = "ACCEPTED" | "ACCEPTED_WITHOUT_PREJUDICE" | "REJECTED" | "NONE";
export type Verdict = "OBSERVED" | "REVIEW" | "NOT_OBSERVED";

export interface Terms {
  callId: string;
  /** IANA zone of the port, for example "Europe/Berlin". */
  portZone: string;
  /** Laytime allowed, integer minutes. */
  laytimeAllowedMin: number;
  /** Demurrage rate, integer cents per day. */
  demurrageCentsPerDay: number;
  /** Despatch rate, integer cents per day, 0 if none. */
  despatchCentsPerDay: number;
  working: Working;
  /** SSHEX style: Saturday counts until this port-local time, for example "12:00". Absent means Saturday does not count. */
  saturdayEndsAt?: string;
  /** Optional Friday cut-off, port local, for example "17:00". Time from then to midnight does not count. */
  weekdayEndsAt?: string;
  /** Port-zone dates, "2026-12-25". */
  holidays: string[];
  norWindow: {
    weekdays: number[];
    from: string;
    to: string;
    saturday?: { from: string; to: string };
  };
  commencement: { kind: "next_working_day_at"; at: string } | { kind: "hours_after_nor"; hours: number };
  norRequiresArrival: boolean;
  norRequiresFreePratique: boolean;
  /** Stoppage reasons that do not count, for example ["weather", "shifting"]. */
  exceptedStoppages: string[];
  onceOnDemurrage: boolean;
  moneyQuestionThresholdCents: number;
  /** Tolerance in minutes for non-critical events. Defaults to 5. */
  toleranceMin?: number;
  /** Clause provenance for fixtures. */
  sourceUrl?: string;
}

export interface LogEntry {
  party: Party;
  kind: EventKind;
  /** As written, "2026-11-13 16:41". */
  localTime: string;
  /** IANA zone, "UTC+02:00", or null. Null means abstain. */
  zone: string | null;
  /** For stoppages. */
  reason?: string;
  source: { type: "photo" | "message" | "document" | "quay_check"; ref: string };
  /** Agent name. */
  enteredBy: string;
}

export interface AgreedEvent {
  kind: EventKind;
  /** ISO 8601 in UTC. */
  utc: string;
  reason?: string;
  verdict: Verdict;
  sources: string[];
}
