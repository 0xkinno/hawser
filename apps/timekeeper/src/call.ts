import {
  type AgreedEvent,
  type NorDecision,
  type ParsedLog,
  type Party,
  type ReconcileResult,
  type Terms,
  bothScenarios,
  computeLaytime,
  decidingParty,
  effectiveEntries,
  formatUsd,
  fullSha,
  norValidity,
  parseLog,
  parseLogTime,
  reconcile,
  sofDigest,
} from "@hawser/laytime";
import { DateTime } from "luxon";

import { pairsMoneyWithLaytime } from "./moneyGuard";
import {
  GRAMMAR_HELP,
  addressesTimekeeper,
  looksLikeCasualAcceptance,
  parseCommand,
  partyOfRole,
  roleOfParty,
} from "./sign";
import { diffRevision, shortSha } from "./watcher";

export type Room = "desk" | "bridge" | "both";

export type Action =
  | { type: "post"; room: Room; tag: string; text: string }
  | { type: "closed"; digest: string; version: number };

export interface IncomingMessage {
  sender: string;
  senderName: string;
  body: string;
  addressed: boolean;
  messageId: string;
  room: "desk" | "bridge";
}

export interface CallConfig {
  terms: Terms;
  /** Participant ids listed for each party. Enrolment is accepted only from these. */
  participants: Record<Party, string[]>;
  /** The Timekeeper's own participant ids. Never treated as people. */
  selfIds: string[];
  /** The Timekeeper's own display names, for sender ids not known in advance. */
  selfNames?: string[];
}

interface DocState {
  content: string;
  revision: number;
  sha: string;
  parsed: ParsedLog | undefined;
}

interface Signature {
  sender: string;
  digest: string;
  remarks?: string;
}

const PARTIES: Party[] = ["vessel", "agency", "charterer"];
const tagLine = (tag: string) => `[hk:${tag}]`;

export const fmtUtc = (utc: string, zone: string): string =>
  `${DateTime.fromISO(utc, { zone: "utc" }).setZone(zone).toFormat("yyyy-MM-dd HH:mm")} ${zone} (${DateTime.fromISO(utc, { zone: "utc" }).toFormat("HH:mm")}Z)`;

export class Call {
  docs: Partial<Record<Party, DocState>> = {};
  enrolled: Partial<Record<Party, string>> = {};
  settlements = new Map<string, { utc: string; by: string }>();
  nor: { decision: NorDecision; by?: string; digest?: string; reason?: string } = { decision: "NONE" };
  receivedNotAccepted: Array<{ messageId: string; sender: string; body: string }> = [];
  signatures: Partial<Record<Party, Signature>> = {};
  refusals: Array<{ party: Party; digest: string; reason: string }> = [];
  version = 0;
  lastContentSha = "";
  currentDigest = "";
  /** Every document revision and Statement of Facts version seen, for the audit bundle. */
  docHistory: Array<{ party: Party; revision: number; sha: string; content: string }> = [];
  sofHistory: Array<{
    version: number;
    digest: string;
    body: ReturnType<Call["sofBody"]>;
    norDecision: NorDecision;
  }> = [];
  private open = new Map<Party, string>();
  private queue: Array<{ party: Party; key: string; text: string }> = [];
  readonly posted = new Set<string>();
  readonly closedDigests = new Set<string>();

  constructor(readonly cfg: CallConfig) {}

  /** Tags already present in the room, rebuilt on start so a restart never repeats a card. */
  markPosted(tags: Iterable<string>) {
    for (const t of tags) this.posted.add(t);
  }

  private post(out: Action[], room: Room, tag: string, text: string) {
    if (this.posted.has(tag)) return;
    this.posted.add(tag);
    out.push({ type: "post", room, tag, text: `${text}\n${tagLine(tag)}` });
  }

  private zone() {
    return this.cfg.terms.portZone;
  }

  // ---------------------------------------------------------------- documents

  /** A company log document was read. Returns the cards to post. */
  ingestDoc(party: Party, content: string): Action[] {
    const out: Action[] = [];
    const prev = this.docs[party];
    const rev = diffRevision(
      `log-${party}`,
      prev && { content: prev.content, revision: prev.revision },
      content,
    );
    if (!rev.changed) return out;
    let parsed: ParsedLog | undefined;
    try {
      parsed = parseLog(content, party);
    } catch (e) {
      this.post(
        out,
        "desk",
        `logbad:${party}:${rev.sha.slice(0, 8)}`,
        `log-${party} cannot be read: ${(e as Error).message}. Its entries are not used until it is fixed.`,
      );
    }
    this.docs[party] = { content, revision: rev.revision, sha: rev.sha, parsed };
    this.docHistory.push({ party, revision: rev.revision, sha: rev.sha, content });
    const docName = `log-${party === "vessel" ? "vessel" : party === "agency" ? "agency" : "charterer"}`;
    const note = rev.nonAppend
      ? "NON-APPEND CHANGE: an earlier line was altered or removed."
      : `${rev.changedLines} entr${rev.changedLines === 1 ? "y" : "ies"} added.`;
    this.post(
      out,
      "desk",
      `rev:${docName}:r${rev.revision}:${shortSha(rev.sha)}`,
      `${docName} r${rev.revision} sha256:${shortSha(rev.sha)}, ${rev.changedLines} entr${rev.changedLines === 1 ? "y" : "ies"} changed. ${note}`,
    );
    if (parsed && parsed.errors.length > 0) {
      this.post(
        out,
        "desk",
        `logerr:${party}:${shortSha(rev.sha)}`,
        `${docName} has ${parsed.errors.length} unreadable line(s), not used: ${parsed.errors.slice(0, 3).join(" | ")}`,
      );
    }
    out.push(...this.recompute());
    return out;
  }

  // ------------------------------------------------------------------ facts

  private reconciled(): ReconcileResult {
    const entries = PARTIES.flatMap((p) => {
      const d = this.docs[p];
      return d?.parsed ? effectiveEntries(d.parsed) : [];
    });
    const r = reconcile(entries, this.cfg.terms, this.nor.decision);
    const agreed: AgreedEvent[] = r.agreed.map((e) => ({ ...e }));
    const divergences = r.divergences.filter((d) => {
      const s = this.settlements.get(d.key) ?? this.settlements.get(d.kind);
      if (!s) return true;
      const ev = agreed.find((a) => a.kind === d.kind);
      if (ev) {
        ev.utc = s.utc;
        ev.verdict = "OBSERVED";
        ev.sources = [...ev.sources, `settled:${s.by}`];
      }
      return false;
    });
    return { ...r, agreed, divergences };
  }

  private norInfo(r: ReconcileResult) {
    const nor = r.agreed.find((e) => e.kind === "NOR_TENDERED");
    if (!nor) return undefined;
    const v = norValidity(r.agreed, this.cfg.terms);
    const digest = fullSha({
      callId: this.cfg.terms.callId,
      norUtc: nor.utc,
      valid: v.valid,
      reasons: v.reasons,
      termsSha: fullSha(this.cfg.terms),
    })
      .slice(0, 8)
      .toUpperCase();
    return { nor, v, digest };
  }

  /** Everything the SOF digest binds. The version number is added separately. */
  sofBody(r: ReconcileResult) {
    return {
      callId: this.cfg.terms.callId,
      termsSha: fullSha(this.cfg.terms),
      events: r.agreed.map((e) => ({
        kind: e.kind,
        utc: e.utc,
        reason: e.reason ?? null,
        verdict: e.verdict,
        sources: [...e.sources].sort(),
      })),
      remarks: [{ norDecision: this.nor.decision, by: this.nor.by ?? null }],
      sourceFingerprints: Object.fromEntries(
        PARTIES.flatMap((p) => (this.docs[p] ? [[`log-${p}`, this.docs[p]?.sha ?? ""]] : [])),
      ),
    };
  }

  view() {
    const r = this.reconciled();
    return {
      r,
      nor: this.norInfo(r),
      body: this.sofBody(r),
      digest: this.currentDigest,
      version: this.version,
    };
  }

  private freeAndPostQueued(out: Action[], activeKeys: Set<string>) {
    for (const [party, key] of [...this.open]) {
      if (!activeKeys.has(key)) this.open.delete(party);
    }
    for (const q of [...this.queue]) {
      if (!activeKeys.has(q.key)) {
        this.queue = this.queue.filter((x) => x !== q);
        continue;
      }
      if (!this.open.has(q.party)) {
        this.open.set(q.party, q.key);
        this.queue = this.queue.filter((x) => x !== q);
        this.post(out, "desk", `ask:${q.key}`, q.text);
      }
    }
  }

  private ask(out: Action[], party: Party, key: string, text: string) {
    if (this.posted.has(`ask:${key}`)) return;
    if (this.open.has(party) && this.open.get(party) !== key) {
      if (!this.queue.some((q) => q.key === key)) this.queue.push({ party, key, text });
      return;
    }
    this.open.set(party, key);
    this.post(out, "desk", `ask:${key}`, text);
  }

  recompute(): Action[] {
    const out: Action[] = [];
    const r = this.reconciled();
    const z = this.zone();
    const active = new Set<string>();

    for (const a of r.abstentions) {
      const key = `abstain:${a.party}:${a.kind}:${a.localTime}`;
      active.add(key);
      this.ask(
        out,
        a.party,
        key,
        a.reason.startsWith("no zone")
          ? `Question for ${roleOfParty(a.party)}: your ${a.kind} at ${a.localTime} has no time zone, so it is not placed. Is that ship's time with its UTC offset, or port local time (${z})? Correct the line in your log with the zone.`
          : `Question for ${roleOfParty(a.party)}: your ${a.kind} at ${a.localTime} is not placed: ${a.reason}. Correct the line in your log with the zone written as an offset, for example UTC+01:00.`,
      );
    }
    for (const d of r.divergences) {
      const claimsHash = fullSha(d.claims.map((c) => [c.party, c.utc])).slice(0, 6);
      const claimText = d.claims.map((c) => `${roleOfParty(c.party)} ${fmtUtc(c.utc, z)}`).join("; ");
      const money =
        d.moneyAtStakeCents > 0
          ? `Money at stake under the stated terms: ${formatUsd(d.moneyAtStakeCents)}.`
          : "No money at stake under the stated terms.";
      this.post(
        out,
        "desk",
        `div:${d.key}:${claimsHash}`,
        `${d.kind} differs: ${claimText}. Spread ${d.spreadMin} min. ${money} ${d.ask ? "A decision is needed." : "Nobody is asked."}`,
      );
      if (d.ask) {
        const key = `${d.key}:${claimsHash}`;
        active.add(key);
        this.ask(
          out,
          d.ask.party,
          key,
          `Question for ${roleOfParty(d.ask.party)}: ${d.kind} is logged differently (${claimText}). Which is right? Reply: @timekeeper settle ${d.kind}: YYYY-MM-DD HH:MM zone`,
        );
      }
    }
    this.freeAndPostQueued(out, active);

    const ni = this.norInfo(r);
    if (ni) {
      const verdictText = ni.v.valid
        ? "valid under the stated terms"
        : `not valid under the stated terms: ${ni.v.reasons.join("; ")}`;
      this.post(
        out,
        "desk",
        `nor:${ni.digest}`,
        `Notice of Readiness at ${fmtUtc(ni.nor.utc, z)}, read as ${verdictText}. This is the engine's reading, not a legal conclusion. Recorded decision: ${this.nor.decision}. To decide, the charterer replies: @timekeeper accept nor ${ni.digest} | accept nor without prejudice ${ni.digest} | reject nor ${ni.digest}: reason`,
      );
    }

    const bodyNoVersion = this.sofBody(r);
    const contentSha = fullSha(bodyNoVersion);
    const changed = contentSha !== this.lastContentSha;
    const allLogs = PARTIES.every((p) => this.docs[p]?.parsed !== undefined);
    const complete = r.missingCritical.length === 0 && allLogs;
    if (changed && (complete || Object.keys(this.signatures).length > 0)) {
      this.lastContentSha = contentSha;
      const hadSignatures = Object.keys(this.signatures).length > 0;
      this.version += 1;
      this.currentDigest = sofDigest({ ...bodyNoVersion, version: this.version });
      this.sofHistory.push({
        version: this.version,
        digest: this.currentDigest,
        body: bodyNoVersion,
        norDecision: this.nor.decision,
      });
      if (hadSignatures) {
        this.signatures = {};
        this.post(
          out,
          "both",
          `void:v${this.version}:${this.currentDigest}`,
          `A source changed after signing. All signatures on the earlier version are void. Version ${this.version} has digest ${this.currentDigest}. Everyone signs again.`,
        );
      }
      this.post(out, "both", `sof:v${this.version}:${this.currentDigest}`, this.sofSummary(r, ni?.v));
    } else if (changed) {
      this.lastContentSha = contentSha;
    }
    return out;
  }

  private sofSummary(r: ReconcileResult, nv?: { valid: boolean; reasons: string[] }): string {
    const z = this.zone();
    const review = r.agreed.filter((e) => e.verdict === "REVIEW").length;
    const lines = [
      `Statement of Facts version ${this.version}, digest ${this.currentDigest}. ${r.agreed.length} events, ${review} on REVIEW.`,
    ];
    if (nv && !nv.valid && this.nor.decision === "NONE") {
      const b = bothScenarios(r.agreed, this.cfg.terms);
      lines.push(
        `Laytime, NOR as accepted: ${b.validAsAccepted.status === "COUNTED" ? `demurrage ${formatUsd(b.validAsAccepted.demurrageCents)}, despatch ${formatUsd(b.validAsAccepted.despatchCents)}` : "not counted"}. NOR invalid and not accepted: laytime not triggered. The legal call is for people and counsel.`,
      );
    } else {
      const l = computeLaytime(r.agreed, this.cfg.terms, this.nor.decision);
      lines.push(
        l.status === "COUNTED"
          ? `Laytime used ${l.usedMin} of ${l.allowedMin} min. Demurrage ${formatUsd(l.demurrageCents)}, despatch ${formatUsd(l.despatchCents)}.`
          : `Laytime not triggered: ${l.reasons.join("; ")}.`,
      );
    }
    lines.push(
      `Times in ${z}. To sign: @timekeeper sign ${this.currentDigest} (add : remarks), or refuse ${this.currentDigest}: reason.`,
    );
    return lines.join("\n");
  }

  // --------------------------------------------------------------- messages

  private party(sender: string): Party | undefined {
    return PARTIES.find((p) => this.enrolled[p] === sender);
  }

  onMessage(m: IncomingMessage): Action[] {
    const out: Action[] = [];
    if (this.cfg.selfIds.includes(m.sender) || this.cfg.selfNames?.includes(m.senderName)) return out;
    const cmd = parseCommand(m.body);
    const aimed = addressesTimekeeper(m.body, m.addressed);
    const reply = (text: string, kind = "reply") => this.post(out, m.room, `${kind}:${m.messageId}`, text);

    if (cmd) {
      switch (cmd.verb) {
        case "enrol": {
          const party = partyOfRole(cmd.arg);
          const listed = this.cfg.participants[party].some(
            (e) => e === m.sender || e === `name:${m.senderName}`,
          );
          if (!listed) {
            reply(
              `Enrolment refused: ${m.senderName} is not listed for the ${cmd.arg} side of this call. Nothing recorded.`,
            );
          } else if (this.enrolled[party] && this.enrolled[party] !== m.sender) {
            reply(`Enrolment refused: the ${cmd.arg} side already has an enrolled signer. Nothing recorded.`);
          } else {
            this.enrolled[party] = m.sender;
            reply(`Enrolled ${m.senderName} as ${cmd.arg} signer for this call.`, "enrol");
          }
          break;
        }
        case "sign":
        case "refuse": {
          const party = this.party(m.sender);
          if (!party) {
            reply(
              `Refused: ${m.senderName} is not an enrolled signer. Enrol first with @timekeeper enrol master|agent|charterer. Nothing recorded.`,
            );
            break;
          }
          if (cmd.arg !== this.currentDigest) {
            reply(
              `Refused: ${cmd.arg} is not the current version. The current digest is ${this.currentDigest || "none yet"}. Nothing recorded.`,
            );
            break;
          }
          if (cmd.verb === "refuse") {
            this.refusals.push({ party, digest: cmd.arg, reason: cmd.text ?? "" });
            delete this.signatures[party];
            reply(
              `${roleOfParty(party)} refused version ${this.version} (${cmd.arg}): ${cmd.text ?? "no reason given"}. Any signature from this side is withdrawn.`,
              "refuse",
            );
            break;
          }
          const sig: Signature = { sender: m.sender, digest: cmd.arg };
          if (cmd.text) sig.remarks = cmd.text;
          this.signatures[party] = sig;
          const have = PARTIES.filter((p) => this.signatures[p]).length;
          reply(
            `${roleOfParty(party)} signed version ${this.version} (${cmd.arg})${cmd.text ? ` with remarks: ${cmd.text}` : ""}. ${have} of 3 signatures.`,
            "sign",
          );
          if (have === 3 && !this.closedDigests.has(this.currentDigest)) {
            this.closedDigests.add(this.currentDigest);
            this.post(
              out,
              "both",
              `closed:${this.currentDigest}`,
              `Port call closed: version ${this.version}, digest ${this.currentDigest}, three signatures.`,
            );
            out.push({ type: "closed", digest: this.currentDigest, version: this.version });
          }
          break;
        }
        case "accept nor":
        case "accept nor without prejudice":
        case "reject nor": {
          const ni = this.norInfo(this.reconciled());
          if (this.party(m.sender) !== "charterer") {
            reply(
              `Refused: only the enrolled charterer signer can decide on a Notice of Readiness, and ${m.senderName} is not that person. Recorded as received, not as accepted.`,
            );
            this.receivedNotAccepted.push({ messageId: m.messageId, sender: m.sender, body: m.body });
            break;
          }
          if (!ni || cmd.arg !== ni.digest) {
            reply(
              `Refused: ${cmd.arg} does not match the current NOR digest ${ni?.digest ?? "none yet"}. Nothing recorded.`,
            );
            break;
          }
          this.nor = {
            decision:
              cmd.verb === "accept nor"
                ? "ACCEPTED"
                : cmd.verb === "reject nor"
                  ? "REJECTED"
                  : "ACCEPTED_WITHOUT_PREJUDICE",
            by: m.sender,
            digest: ni.digest,
            ...(cmd.text ? { reason: cmd.text } : {}),
          };
          reply(
            `Charterer decision recorded on NOR ${ni.digest}: ${this.nor.decision}${cmd.text ? ` (${cmd.text})` : ""}.`,
            "nordec",
          );
          out.push(...this.recompute());
          break;
        }
        case "settle": {
          const r = this.reconciled();
          const d = r.divergences.find((x) => x.kind === cmd.arg);
          if (!d) {
            reply(`Refused: there is no open difference on ${cmd.arg}. Nothing recorded.`);
            break;
          }
          const decider = decidingParty(d.kind);
          if (this.party(m.sender) !== decider) {
            reply(`Refused: ${d.kind} is settled by the ${roleOfParty(decider)} signer. Nothing recorded.`);
            break;
          }
          const mt = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\s+(\S+)$/.exec(cmd.text ?? "");
          if (!mt) {
            reply(
              "Refused: give the time as YYYY-MM-DD HH:MM zone, for example 2026-11-13 16:41 Europe/Berlin. Nothing recorded.",
            );
            break;
          }
          let utc: string;
          try {
            utc = parseLogTime(mt[1] as string, mt[2] as string)
              .toUTC()
              .toISO({ suppressMilliseconds: true }) as string;
          } catch (e) {
            reply(`Refused: ${(e as Error).message}. Nothing recorded.`);
            break;
          }
          this.settlements.set(d.key, { utc, by: roleOfParty(decider) });
          reply(`${roleOfParty(decider)} settled ${d.kind} at ${fmtUtc(utc, this.zone())}.`, "settle");
          out.push(...this.recompute());
          break;
        }
      }
      return out;
    }

    const hasNorCard = [...this.posted].some((t) => t.startsWith("nor:"));
    if (hasNorCard && looksLikeCasualAcceptance(m.body)) {
      const ni = this.norInfo(this.reconciled());
      this.receivedNotAccepted.push({ messageId: m.messageId, sender: m.sender, body: m.body });
      const d = ni?.digest ?? "<digest>";
      this.post(
        out,
        m.room,
        `rna:${m.messageId}`,
        `Recorded as received, not as accepted. Laytime does not start on this message. To decide, reply: @timekeeper accept nor ${d} | accept nor without prejudice ${d} | reject nor ${d}: reason`,
      );
      return out;
    }
    if (aimed) {
      reply(GRAMMAR_HELP, "help");
      return out;
    }
    if (pairsMoneyWithLaytime(m.body)) {
      const r = this.reconciled();
      const l = computeLaytime(r.agreed, this.cfg.terms, this.nor.decision);
      const figure =
        l.status === "COUNTED"
          ? `The engine's figure for the current facts: demurrage ${formatUsd(l.demurrageCents)}, despatch ${formatUsd(l.despatchCents)}, subject to open review items.`
          : `There is no figure yet: ${l.reasons[l.reasons.length - 1] ?? "laytime is not triggered"}.`;
      this.post(
        out,
        m.room,
        `money:${m.messageId}`,
        `Correction: only the laytime engine states money, and ${m.senderName}'s figure is not used. ${figure}`,
      );
    }
    return out;
  }

  // ------------------------------------------------------------------ clock

  /** Shift change and low-laytime cards. Pure in `now`, so a restart or a failover repeats nothing (tags). */
  clock(nowUtc: string): Action[] {
    const out: Action[] = [];
    const r = this.reconciled();
    if (!r.agreed.some((e) => e.kind === "NOR_TENDERED")) return out;
    const z = this.zone();
    const provisional: AgreedEvent[] = [
      ...r.agreed.filter((e) => e.kind !== "COMPLETED"),
      { kind: "COMPLETED", utc: nowUtc, verdict: "OBSERVED", sources: ["clock"] },
    ];
    if (r.agreed.some((e) => e.kind === "COMPLETED")) return out;
    const l = computeLaytime(provisional, this.cfg.terms, this.nor.decision);
    if (l.status !== "COUNTED") return out;
    const now = DateTime.fromISO(nowUtc, { zone: "utc" }).setZone(z);
    const shift = now.hour >= 20 ? 20 : now.hour >= 8 ? 8 : -1;
    if (shift >= 0) {
      this.post(
        out,
        "desk",
        `clock:${now.toFormat("yyyy-MM-dd")}-${shift}`,
        `Clock card, shift change ${now.toFormat("yyyy-MM-dd")} ${String(shift).padStart(2, "0")}:00 ${z}. Laytime used ${l.usedMin} of ${l.allowedMin} min${l.onDemurrageFromUtc ? `, on demurrage since ${fmtUtc(l.onDemurrageFromUtc, z)}` : ""}. Demurrage so far ${formatUsd(l.demurrageCents)} under the stated terms.`,
      );
    }
    const left = l.allowedMin - l.usedMin;
    if (!l.onDemurrageFromUtc && left > 0 && left <= 120) {
      this.post(
        out,
        "desk",
        `clockwarn:${this.cfg.terms.callId}`,
        `Laytime ends in about ${left} min. After that, demurrage runs at the charter rate.`,
      );
    }
    return out;
  }
}
