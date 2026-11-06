import { describe, expect, it } from "vitest";
import { norValidity } from "../src/nor";
import { brakeTerms, ev } from "./fixtures";

describe("norValidity", () => {
  it("accepts a Friday 16:41 NOR after arrival", () => {
    // Friday 2026-11-13 16:41 Berlin = 15:41Z
    const events = [ev("ANCHORED", "2026-11-13T14:00:00Z"), ev("NOR_TENDERED", "2026-11-13T15:41:00Z")];
    expect(norValidity(events, brakeTerms)).toEqual({ valid: true, reasons: [] });
  });
  it("rejects a NOR tendered before arrival, as in the Brake facts", () => {
    const events = [ev("NOR_TENDERED", "2026-11-13T09:00:00Z"), ev("ANCHORED", "2026-11-13T13:50:00Z")];
    const r = norValidity(events, brakeTerms);
    expect(r.valid).toBe(false);
    expect(r.reasons.join(" ")).toContain("before the vessel had arrived");
  });
  it("rejects a NOR at 17:00 sharp because the window end is exclusive", () => {
    const events = [ev("ANCHORED", "2026-11-13T10:00:00Z"), ev("NOR_TENDERED", "2026-11-13T16:00:00Z")];
    expect(norValidity(events, brakeTerms).valid).toBe(false);
  });
  it("rejects a Saturday NOR when no Saturday window exists", () => {
    const events = [ev("ANCHORED", "2026-11-14T06:00:00Z"), ev("NOR_TENDERED", "2026-11-14T07:00:00Z")];
    expect(norValidity(events, brakeTerms).reasons.join(" ")).toContain("outside the NOR window");
  });
  it("rejects a NOR on a holiday", () => {
    const t = { ...brakeTerms, holidays: ["2026-11-13"] };
    const events = [ev("ANCHORED", "2026-11-13T10:00:00Z"), ev("NOR_TENDERED", "2026-11-13T12:00:00Z")];
    expect(norValidity(events, t).reasons.join(" ")).toContain("holiday");
  });
  it("needs free pratique first when the terms say so", () => {
    const t = { ...brakeTerms, norRequiresFreePratique: true };
    const events = [ev("ANCHORED", "2026-11-13T10:00:00Z"), ev("NOR_TENDERED", "2026-11-13T12:00:00Z")];
    expect(norValidity(events, t).reasons.join(" ")).toContain("free pratique");
  });
  it("reports a missing NOR", () => {
    expect(norValidity([], brakeTerms).valid).toBe(false);
  });
});
