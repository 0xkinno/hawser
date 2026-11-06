import { type NorDecision, type RunBundle, computeLaytime, fullSha } from "@hawser/laytime";
import type { Call } from "./call";

export interface RoomMessage {
  seq: number;
  sender: string;
  senderName: string;
  kind: string;
  body: string;
  timestamp: number;
}

export interface BundleMeta {
  mode: RunBundle["provenance"]["mode"];
  label: string;
  switchVersion: string;
  commit?: string;
  probes?: unknown;
}

/** Everything needed to recompute the call offline. Bridge-room chat is never included, only desk-room messages. */
export function buildBundle(call: Call, messages: RoomMessage[], meta: BundleMeta, now: Date): RunBundle {
  const view = call.view();
  const last = call.sofHistory[call.sofHistory.length - 1];
  if (!last) throw new Error("cannot export a call that has no Statement of Facts version yet");
  const events = view.r.agreed;
  const l = computeLaytime(events, call.cfg.terms, last.norDecision as NorDecision);
  const prov: RunBundle["provenance"] = {
    mode: meta.mode,
    label: meta.label,
    switchVersion: meta.switchVersion,
  };
  if (meta.commit) prov.commit = meta.commit;
  const bundle: RunBundle = {
    format: "hawser-run/1",
    callId: call.cfg.terms.callId,
    generatedAt: now.toISOString(),
    provenance: prov,
    terms: call.cfg.terms,
    termsSha: fullSha(call.cfg.terms),
    messages,
    docs: call.docHistory.map((d) => ({
      party: d.party,
      revision: d.revision,
      sha: d.sha,
      content: d.content,
    })),
    sofVersions: call.sofHistory.map((v) => ({
      version: v.version,
      digest: v.digest,
      body: v.body,
      norDecision: v.norDecision,
    })),
    signatures: Object.entries(call.signatures).flatMap(([party, s]) =>
      s ? [{ party, sender: s.sender, digest: s.digest, ...(s.remarks ? { remarks: s.remarks } : {}) }] : [],
    ),
    finalDigest: last.digest,
    engine: {
      demurrageCents: l.demurrageCents,
      despatchCents: l.despatchCents,
      usedMin: l.usedMin,
      status: l.status,
    },
  };
  if (meta.probes !== undefined) bundle.probes = meta.probes;
  return bundle;
}
