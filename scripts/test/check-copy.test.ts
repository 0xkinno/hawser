import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain ESM script without types
import { checkText } from "../check-copy.mjs";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const hashes = new Set([`c:${sha("c:zebrafish")}`, `s:${sha("s:Mirage")}`]);

describe("check-copy", () => {
  it("passes clean text", () => {
    expect(checkText("Plain calm sentence about a ship.", hashes)).toEqual([]);
  });
  it("rejects em and en dashes", () => {
    expect(checkText("a \u2014 b", hashes)).toHaveLength(1);
    expect(checkText("a \u2013 b", hashes)).toHaveLength(1);
  });
  it("rejects emoji", () => {
    expect(checkText("done \u{1F680}", hashes)).toHaveLength(1);
  });
  it("rejects hype words", () => {
    expect(checkText("A seamless flow", hashes)).toHaveLength(1);
    expect(checkText("cutting-edge tooling", hashes)).toHaveLength(1);
  });
  it("rejects attribution strings", () => {
    expect(checkText("Generated with a tool", hashes)).toHaveLength(1);
  });
  it("matches competitor names by hash only", () => {
    expect(checkText("we saw Zebrafish once", hashes)).toHaveLength(1);
    expect(checkText("a Mirage appears", hashes)).toHaveLength(1);
    expect(checkText("a mirage appears", hashes)).toEqual([]);
  });
  it("honours the ignore marker", () => {
    expect(checkText("seamless check-copy:ignore", hashes)).toEqual([]);
  });
});
