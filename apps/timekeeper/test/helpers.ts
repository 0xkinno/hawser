import type { Party, Terms } from "@hawser/laytime";
import { type Action, Call, type IncomingMessage } from "../src/call";
import { logHeader } from "../src/logdoc";

export const terms: Terms = {
  callId: "call-test",
  portZone: "Europe/Berlin",
  laytimeAllowedMin: 1440,
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

export const IDS = {
  master: "@switch-user-master:t",
  jonas: "@switch-user-jonas:t",
  priya: "@switch-user-priya:t",
  mate: "@switch-agent-mate:t",
  desk: "@switch-agent-desk:t",
  tk: "@switch-agent-tk:t",
};

export function newCall(): Call {
  return new Call({
    terms,
    participants: { vessel: [IDS.master], agency: [IDS.jonas], charterer: [IDS.priya] },
    selfIds: [IDS.tk],
  });
}

export interface Line {
  kind: string;
  time: string;
  ref?: string;
  zone?: string | null;
  reason?: string;
}

export function doc(party: Party, lines: Line[], call = terms.callId): string {
  const body = lines.map((l, i) =>
    JSON.stringify({
      seq: i + 1,
      kind: l.kind,
      localTime: l.time,
      zone: l.zone === undefined ? "Europe/Berlin" : l.zone,
      ...(l.reason ? { reason: l.reason } : {}),
      source: { type: "message", ref: l.ref ?? `${party}:${i + 1}` },
      enteredBy: `${party}-agent`,
    }),
  );
  return [logHeader(party, call), ...body].join("\n");
}

export const AGREED: Line[] = [
  { kind: "ANCHORED", time: "2026-11-13 14:00" },
  { kind: "NOR_TENDERED", time: "2026-11-13 16:41" },
  { kind: "ALL_FAST", time: "2026-11-16 09:12" },
  { kind: "COMPLETED", time: "2026-11-18 10:00" },
];

export const posts = (a: Action[]) =>
  a.filter((x): x is Extract<Action, { type: "post" }> => x.type === "post");
export const texts = (a: Action[]) => posts(a).map((p) => p.text);

let n = 0;
export const msg = (sender: string, body: string, over: Partial<IncomingMessage> = {}): IncomingMessage => ({
  sender,
  senderName: sender,
  body,
  addressed: false,
  messageId: `m${++n}`,
  room: "desk",
  ...over,
});

/** A call with all three parties agreeing on every critical event, three people enrolled. */
export function agreedCall() {
  const c = newCall();
  const out: Action[] = [];
  out.push(...c.ingestDoc("vessel", doc("vessel", AGREED)));
  out.push(...c.ingestDoc("agency", doc("agency", AGREED)));
  out.push(...c.ingestDoc("charterer", doc("charterer", [])));
  out.push(...c.onMessage(msg(IDS.master, "@timekeeper enrol master")));
  out.push(...c.onMessage(msg(IDS.jonas, "@timekeeper enrol agent")));
  out.push(...c.onMessage(msg(IDS.priya, "@timekeeper enrol charterer")));
  return { c, out };
}
