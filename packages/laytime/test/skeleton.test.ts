import { describe, expect, it } from "vitest";
import { PACKAGE } from "../src/index";

describe("workspace skeleton", () => {
  it("resolves the laytime package", () => {
    expect(PACKAGE).toBe("@hawser/laytime");
  });
});
