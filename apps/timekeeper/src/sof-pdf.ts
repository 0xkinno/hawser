import {
  type AgreedEvent,
  type LaytimeResult,
  type Terms,
  bothScenarios,
  computeLaytime,
  formatUsd,
} from "@hawser/laytime";
import type { NorDecision } from "@hawser/laytime";
import { DateTime } from "luxon";
import { PDFDocument, type PDFFont, type PDFPage, StandardFonts, rgb } from "pdf-lib";

export interface SofMeta {
  vessel: string;
  port: string;
  cargo: string;
  charterRef: string;
  fictional: boolean;
}

export interface SofInput {
  terms: Terms;
  meta: SofMeta;
  version: number;
  digest: string;
  events: AgreedEvent[];
  norDecision: NorDecision;
  fingerprints: Record<string, string>;
  signatures: Array<{ role: string; name: string; digest: string; remarks?: string }>;
  verifyUrl: string;
}

const INK = rgb(0.06, 0.11, 0.18);
const BRASS = rgb(0.66, 0.51, 0.29);
const GREY = rgb(0.42, 0.45, 0.5);

/** Plain ASCII only: the standard PDF fonts carry no wider character set. */
const ascii = (s: string) => s.replace(/[^\x20-\x7e]/g, "?");

class Writer {
  y = 800;
  page!: PDFPage;
  constructor(
    readonly doc: PDFDocument,
    readonly font: PDFFont,
    readonly bold: PDFFont,
  ) {
    this.newPage();
  }
  newPage() {
    this.page = this.doc.addPage([595, 842]);
    this.y = 800;
  }
  line(
    text: string,
    o: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; gap?: number } = {},
  ) {
    const size = o.size ?? 9;
    if (this.y < 70) this.newPage();
    this.page.drawText(ascii(text), {
      x: o.x ?? 40,
      y: this.y,
      size,
      font: o.bold ? this.bold : this.font,
      color: o.color ?? INK,
    });
    this.y -= o.gap ?? size + 4;
  }
  rule() {
    this.page.drawLine({
      start: { x: 40, y: this.y + 4 },
      end: { x: 555, y: this.y + 4 },
      thickness: 0.6,
      color: BRASS,
    });
    this.y -= 8;
  }
  row(cols: Array<[string, number]>, o: { bold?: boolean; color?: ReturnType<typeof rgb> } = {}) {
    if (this.y < 70) this.newPage();
    let x = 40;
    for (const [t, w] of cols) {
      this.page.drawText(ascii(t).slice(0, Math.floor(w / 4.6)), {
        x,
        y: this.y,
        size: 8,
        font: o.bold ? this.bold : this.font,
        color: o.color ?? INK,
      });
      x += w;
    }
    this.y -= 12;
  }
}

const local = (utc: string, zone: string) =>
  DateTime.fromISO(utc, { zone: "utc" }).setZone(zone).toFormat("yyyy-MM-dd HH:mm");

function ledgerSummary(w: Writer, title: string, r: LaytimeResult, zone: string) {
  w.line(title, { bold: true, size: 10 });
  if (r.status !== "COUNTED") {
    w.line(`Laytime not triggered: ${r.reasons[r.reasons.length - 1] ?? ""}`);
    w.line("", { gap: 4 });
    return;
  }
  w.line(
    `Commenced ${local(r.commencedUtc as string, zone)}, ended ${local(r.endUtc as string, zone)}. Used ${r.usedMin} of ${r.allowedMin} min.`,
  );
  w.line(
    `Demurrage ${formatUsd(r.demurrageCents)} (${r.demurrageMin} min). Despatch ${formatUsd(r.despatchCents)}.`,
  );
  w.row(
    [
      ["From (port time)", 110],
      ["To (port time)", 110],
      ["Counts", 50],
      ["Reason", 240],
    ],
    { bold: true },
  );
  for (const l of r.ledger.slice(0, 60)) {
    w.row([
      [local(l.fromUtc, zone), 110],
      [local(l.toUtc, zone), 110],
      [l.counts ? "yes" : "no", 50],
      [l.why, 240],
    ]);
  }
  if (r.ledger.length > 60)
    w.line(`... ${r.ledger.length - 60} further rows are in the run bundle.`, { color: GREY });
  w.line("", { gap: 6 });
}

/** Statement of Facts in the usual layout, then the laytime time sheet. */
export async function buildSofPdf(i: SofInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold);
  const z = i.terms.portZone;
  w.line("STATEMENT OF FACTS", { size: 16, bold: true, gap: 22 });
  w.line(`HAWSER version ${i.version}   digest ${i.digest}`, { color: BRASS, size: 10 });
  if (i.meta.fictional)
    w.line("Fictional vessel, port and people. A demonstration record, not a real call.", {
      color: GREY,
      size: 8,
    });
  w.rule();
  w.line(`Vessel: ${i.meta.vessel}      Port: ${i.meta.port}`);
  w.line(`Cargo: ${i.meta.cargo}      Charter ref: ${i.meta.charterRef}`);
  w.line(`Call: ${i.terms.callId}      Times shown in ${z} (UTC in brackets)`);
  w.rule();
  w.row(
    [
      ["Event", 120],
      ["Date and time", 100],
      ["UTC", 40],
      ["Verdict", 62],
      ["Sources", 193],
    ],
    { bold: true },
  );
  for (const e of i.events) {
    const t = DateTime.fromISO(e.utc, { zone: "utc" });
    w.row(
      [
        [e.reason ? `${e.kind} (${e.reason})` : e.kind, 120],
        [local(e.utc, z), 100],
        [t.toFormat("HH:mm"), 40],
        [e.verdict.replace("_", " "), 62],
        [e.sources.join(", "), 193],
      ],
      { color: e.verdict === "REVIEW" ? rgb(0.9, 0.35, 0.12) : INK },
    );
  }
  w.line("", { gap: 6 });
  w.rule();
  w.line("Remarks", { bold: true });
  w.line(`Notice of Readiness decision recorded: ${i.norDecision}.`);
  for (const s of i.signatures) if (s.remarks) w.line(`${s.role}: ${s.remarks}`);
  w.line("", { gap: 6 });
  w.rule();
  w.line("Signatures", { bold: true });
  for (const role of ["master", "agent", "charterer"]) {
    const s = i.signatures.find((x) => x.role === role);
    w.line(s ? `${role}: ${s.name}   signed digest ${s.digest}` : `${role}: not signed`, {
      color: s ? INK : GREY,
    });
  }
  w.rule();
  w.line(`Version ${i.version}   Digest ${i.digest}`, { size: 8, color: GREY });
  w.line(
    `Source fingerprints: ${Object.entries(i.fingerprints)
      .map(([k, v]) => `${k} ${v.slice(0, 8)}`)
      .join("  ")}`,
    { size: 8, color: GREY },
  );
  w.line(`Verify: ${i.verifyUrl}`, { size: 8, color: GREY });

  w.newPage();
  w.line("LAYTIME TIME SHEET", { size: 16, bold: true, gap: 22 });
  w.line(
    "Computed by the HAWSER laytime engine. No model states any figure here. Clauses not modelled are listed in the repository.",
    { size: 8, color: GREY },
  );
  w.rule();
  const b = bothScenarios(i.events, i.terms);
  if (!b.norValid && i.norDecision === "NONE") {
    w.line(`The engine reads the Notice of Readiness as not valid: ${b.norReasons.join("; ")}.`);
    w.line("The legal call is for the parties and counsel. Both readings are shown.", { color: GREY });
    w.line("", { gap: 4 });
    ledgerSummary(w, "Column A: NOR valid as accepted", b.validAsAccepted, z);
    ledgerSummary(w, "Column B: NOR invalid and not accepted", b.invalidNotAccepted, z);
  } else {
    ledgerSummary(
      w,
      `Laytime with NOR decision ${i.norDecision}`,
      computeLaytime(i.events, i.terms, i.norDecision),
      z,
    );
  }
  return doc.save();
}
