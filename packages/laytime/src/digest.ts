import { canonical } from "./canonical";
import { sha256Hex } from "./sha256";

export interface SofVersion {
  callId: string;
  termsSha: string;
  events: unknown[];
  remarks: unknown[];
  sourceFingerprints: Record<string, string>;
  version: number;
}

export const fullSha = (v: unknown): string => sha256Hex(canonical(v));

/** First 8 hex characters, upper case, of the SHA-256 of the canonical Statement of Facts version. */
export const sofDigest = (sof: SofVersion): string => fullSha(sof).slice(0, 8).toUpperCase();
