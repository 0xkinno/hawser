import { fullSha, sofDigest } from "./digest";
import { computeLaytime } from "./engine";
import { sha256Hex } from "./sha256";
import type { AgreedEvent, NorDecision, Terms } from "./types";

/** The portable record of one port call. Written by the Timekeeper, recomputed offline by `verifyBundle`. */
export interface RunBundle {
  format: "hawser-run/1";
  callId: string;
  generatedAt: string;
  provenance: {
    mode: "live" | "recorded" | "simulated";
    label: string;
    switchVersion: string;
    commit?: string;
  };
  terms: Terms;
  termsSha: string;
  messages: Array<{
    seq: number;
    sender: string;
    senderName: string;
    kind: string;
    body: string;
    timestamp: number;
  }>;
  docs: Array<{ party: string; revision: number; sha: string; content: string }>;
  sofVersions: Array<{
    version: number;
    digest: string;
    body: {
      callId: string;
      termsSha: string;
      events: Array<{ kind: string; utc: string; reason: string | null; verdict: string; sources: string[] }>;
      remarks: unknown[];
      sourceFingerprints: Record<string, string>;
    };
    norDecision: NorDecision;
  }>;
  signatures: Array<{ party: string; sender: string; digest: string; remarks?: string }>;
  finalDigest: string;
  engine: { demurrageCents: number; despatchCents: number; usedMin: number; status: string };
  probes?: unknown;
}

export interface VerifyResult {
  ok: boolean;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
  firstMismatch?: string;
}

/** Recompute every digest, fingerprint and the laytime result from the bundle alone. No keys, no network. */
export function verifyBundle(b: RunBundle): VerifyResult {
  const checks: VerifyResult["checks"] = [];
  const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });

  add(
    "terms sha",
    fullSha(b.terms) === b.termsSha,
    `recomputed ${fullSha(b.terms).slice(0, 8)}, recorded ${b.termsSha.slice(0, 8)}`,
  );
  for (const d of b.docs) {
    const got = sha256Hex(d.content);
    add(
      `document ${d.party} r${d.revision}`,
      got === d.sha,
      `recomputed ${got.slice(0, 8)}, recorded ${d.sha.slice(0, 8)}`,
    );
  }
  for (const v of b.sofVersions) {
    const got = sofDigest({ ...v.body, version: v.version });
    add(`SOF version ${v.version} digest`, got === v.digest, `recomputed ${got}, recorded ${v.digest}`);
    add(
      `SOF version ${v.version} terms`,
      v.body.termsSha === b.termsSha,
      "terms fingerprint bound into the digest",
    );
  }
  const last = b.sofVersions[b.sofVersions.length - 1];
  add("final digest is the last version", !!last && last.digest === b.finalDigest, `final ${b.finalDigest}`);
  const onFinal = b.signatures.filter((s) => s.digest === b.finalDigest);
  add(
    "signatures bind the final digest",
    b.signatures.every((s) => s.digest === b.finalDigest),
    `${onFinal.length} of ${b.signatures.length} on the final digest`,
  );
  if (last) {
    const events: AgreedEvent[] = last.body.events.map((e) => ({
      kind: e.kind as AgreedEvent["kind"],
      utc: e.utc,
      verdict: e.verdict as AgreedEvent["verdict"],
      sources: e.sources,
      ...(e.reason ? { reason: e.reason } : {}),
    }));
    const r = computeLaytime(events, b.terms, last.norDecision);
    add(
      "laytime recomputes",
      r.demurrageCents === b.engine.demurrageCents &&
        r.despatchCents === b.engine.despatchCents &&
        r.usedMin === b.engine.usedMin &&
        r.status === b.engine.status,
      `recomputed ${r.status} used ${r.usedMin} demurrage ${r.demurrageCents} despatch ${r.despatchCents}; recorded ${b.engine.status} used ${b.engine.usedMin} demurrage ${b.engine.demurrageCents} despatch ${b.engine.despatchCents}`,
    );
  }
  const bad = checks.find((c) => !c.ok);
  return bad ? { ok: false, checks, firstMismatch: `${bad.name}: ${bad.detail}` } : { ok: true, checks };
}
