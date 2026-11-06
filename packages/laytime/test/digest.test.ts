import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { canonical } from "../src/canonical";
import { fullSha, sofDigest } from "../src/digest";
import { sha256Hex } from "../src/sha256";

describe("sha256", () => {
  it("matches node:crypto on assorted inputs", () => {
    for (const s of [
      "",
      "abc",
      "HAWSER",
      "x".repeat(55),
      "x".repeat(56),
      "x".repeat(64),
      "x".repeat(1000),
      "åß中",
    ]) {
      expect(sha256Hex(s)).toBe(createHash("sha256").update(s).digest("hex"));
    }
  });
});

describe("canonical", () => {
  it("sorts keys and is whitespace free", () => {
    expect(canonical({ b: 1, a: [2, { d: 1, c: 2 }] })).toBe('{"a":[2,{"c":2,"d":1}],"b":1}');
  });
  it("is independent of key insertion order", () => {
    expect(canonical({ a: 1, b: 2 })).toBe(canonical({ b: 2, a: 1 }));
  });
  it("refuses undefined", () => {
    expect(() => canonical([undefined])).toThrow();
  });
});

describe("sofDigest", () => {
  const sof = {
    callId: "c",
    termsSha: "t",
    events: [{ k: 1 }],
    remarks: [],
    sourceFingerprints: { a: "1" },
    version: 1,
  };
  it("is 8 upper hex characters", () => {
    expect(sofDigest(sof)).toMatch(/^[0-9A-F]{8}$/);
  });
  it("changes when the version changes", () => {
    expect(sofDigest({ ...sof, version: 2 })).not.toBe(sofDigest(sof));
  });
  it("equals the node crypto digest of the canonical form", () => {
    expect(sofDigest(sof)).toBe(
      createHash("sha256").update(canonical(sof)).digest("hex").slice(0, 8).toUpperCase(),
    );
    expect(fullSha(sof)).toHaveLength(64);
  });
});
