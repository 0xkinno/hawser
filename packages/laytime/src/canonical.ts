/** Canonical JSON: object keys sorted, no whitespace. The bytes are what gets hashed. */
export function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .filter((k) => o[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`)
      .join(",")}}`;
  }
  if (v === undefined) throw new Error("canonical: undefined is not representable");
  return JSON.stringify(v);
}
