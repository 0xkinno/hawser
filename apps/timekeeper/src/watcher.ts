import { fullSha } from "@hawser/laytime";
import { sha256Hex } from "@hawser/laytime";

export interface Revision {
  doc: string;
  revision: number;
  sha: string;
  /** Number of lines whose text differs from, or was added after, the previous revision. */
  changedLines: number;
  nonAppend: boolean;
  changed: boolean;
}

export const contentSha = (content: string): string => sha256Hex(content);

/**
 * Compare a document's new content with what was seen before.
 * Append-only means every previous line is still there, in place, followed only by new lines.
 */
export function diffRevision(
  doc: string,
  prev: { content: string; revision: number } | undefined,
  next: string,
): Revision {
  const sha = contentSha(next);
  if (!prev)
    return {
      doc,
      revision: 1,
      sha,
      changedLines: next.split("\n").filter(Boolean).length,
      nonAppend: false,
      changed: true,
    };
  if (prev.content === next)
    return { doc, revision: prev.revision, sha, changedLines: 0, nonAppend: false, changed: false };
  const a = prev.content.split("\n").filter((l) => l.trim() !== "");
  const b = next.split("\n").filter((l) => l.trim() !== "");
  const keptPrefix = a.length <= b.length && a.every((l, i) => l === b[i]);
  const changedLines = keptPrefix
    ? b.length - a.length
    : Math.max(a.length, b.length) - a.filter((l, i) => l === b[i]).length;
  return { doc, revision: prev.revision + 1, sha, changedLines, nonAppend: !keptPrefix, changed: true };
}

export const shortSha = (sha: string): string => sha.slice(0, 8);

export const fingerprintOf = (v: unknown): string => fullSha(v);
