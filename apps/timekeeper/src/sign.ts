import type { Party } from "@hawser/laytime";

export type Verb =
  | "sign"
  | "refuse"
  | "accept nor"
  | "accept nor without prejudice"
  | "reject nor"
  | "enrol"
  | "settle";

export interface Command {
  verb: Verb;
  /** 8 upper hex digest, or the party for enrol, or the event kind for settle. */
  arg: string;
  text?: string;
}

const RX =
  /^\s*@?timekeeper\s+(sign|refuse|accept nor without prejudice|accept nor|reject nor|enrol|settle)\s+([0-9A-Fa-f]{8}|master|agent|charterer|[A-Z_]{3,20})\s*(?::\s*(.{1,500}))?\s*$/i;

export const GRAMMAR_HELP =
  "I act only on these exact forms: sign <digest> | sign <digest>: remarks | refuse <digest>: reason | accept nor <digest> | accept nor without prejudice <digest> | reject nor <digest>: reason | enrol master|agent|charterer | settle <EVENT>: YYYY-MM-DD HH:MM zone. Nothing else changes anything.";

export function parseCommand(body: string): Command | null {
  const m = RX.exec(body);
  if (!m) return null;
  const verb = (m[1] as string).toLowerCase().replace(/\s+/g, " ") as Verb;
  let arg = m[2] as string;
  if (verb === "enrol") {
    arg = arg.toLowerCase();
    if (!["master", "agent", "charterer"].includes(arg)) return null;
  } else if (verb === "settle") {
    arg = arg.toUpperCase();
  } else {
    if (!/^[0-9A-Fa-f]{8}$/.test(arg)) return null;
    arg = arg.toUpperCase();
  }
  const cmd: Command = { verb, arg };
  if (m[3]) cmd.text = m[3].trim();
  return cmd;
}

/** True when the text is aimed at the timekeeper, whether or not it parses. */
export const addressesTimekeeper = (body: string, addressed: boolean): boolean =>
  addressed || /(^|\s)@?timekeeper\b/i.test(body);

const CASUAL =
  /^\s*(noted|ok|okay|k|received|roger|ack|acknowledged|thanks|thank you|thx|got it|understood|fine|agreed|yes|yep|sure|sounds good)[\s.!]*$/i;
const ACCEPT_WORDS =
  /\b(nor\s+(is\s+|was\s+)?accepted|accepted\s+nor|we\s+accept|i\s+accept|accept(ed)?\s+(the\s+)?(notice|nor))\b/i;

/** A reply that could be argued as accepting a Notice of Readiness but is not in the grammar. */
export function looksLikeCasualAcceptance(body: string): boolean {
  if (/^\s*[\p{Extended_Pictographic}\s]+$/u.test(body)) return true;
  return CASUAL.test(body) || ACCEPT_WORDS.test(body);
}

export const partyOfRole = (r: string): Party =>
  r === "master" ? "vessel" : r === "agent" ? "agency" : "charterer";
export const roleOfParty = (p: Party): string =>
  p === "vessel" ? "master" : p === "agency" ? "agent" : "charterer";
