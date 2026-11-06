import { describe, expect, it } from "vitest";
import { reconcile } from "../src/reconcile";
import type { LogEntry } from "../src/types";
import { brakeTerms } from "./fixtures";

const entry = (
  party: LogEntry["party"],
  kind: LogEntry["kind"],
  localTime: string,
  zone: string | null,
  ref = "msg:1",
  reason?: string,
): LogEntry => ({
  party,
  kind,
  localTime,
  zone,
  source: { type: "message", ref },
  enteredBy: `${party}-agent`,
  ...(reason ? { reason } : {}),
});

const Z = "Europe/Berlin";

describe("reconcile", () => {
  it("marks agreeing logs OBSERVED and raises no divergence", () => {
    const r = reconcile(
      [
        entry("vessel", "ALL_FAST", "2026-11-16 09:12", Z),
        entry("agency", "ALL_FAST", "2026-11-16 09:14", Z),
      ],
      brakeTerms,
      "NONE",
    );
    expect(r.divergences).toEqual([]);
    expect(r.agreed[0]?.verdict).toBe("OBSERVED");
  });

  it("uses a tolerance of zero for the NOR: one minute apart is a divergence and always asked", () => {
    const r = reconcile(
      [
        entry("vessel", "NOR_TENDERED", "2026-11-13 16:41", Z),
        entry("agency", "NOR_TENDERED", "2026-11-13 16:50", Z),
      ],
      brakeTerms,
      "NONE",
    );
    expect(r.divergences).toHaveLength(1);
    expect(r.divergences[0]?.spreadMin).toBe(9);
    expect(r.divergences[0]?.ask?.party).toBe("vessel");
    expect(r.agreed[0]?.verdict).toBe("REVIEW");
  });

  it("S1: the 11:00 versus 14:50 anchoring gap moves no money under an invalid NOR, so nobody is asked", () => {
    const entries = [
      entry("vessel", "NOR_TENDERED", "2026-11-13 10:00", Z, "photo:1"),
      entry("agency", "NOR_TENDERED", "2026-11-13 10:00", Z, "msg:1"),
      entry("agency", "ANCHORED", "2026-11-13 11:00", Z, "msg:2"),
      entry("vessel", "ANCHORED", "2026-11-13 14:50", Z, "photo:2"),
      entry("agency", "COMPLETED", "2026-11-19 08:00", Z, "msg:3"),
      entry("vessel", "COMPLETED", "2026-11-19 08:00", Z, "photo:3"),
    ];
    const r = reconcile(entries, brakeTerms, "NONE");
    const d = r.divergences.find((x) => x.kind === "ANCHORED");
    expect(d?.spreadMin).toBe(230);
    expect(d?.moneyAtStakeCents).toBe(0);
    expect(d?.ask).toBeNull();
  });

  it("S5: a weather stoppage logged by one party only moves USD 5,000 at 20,000 a day and is asked", () => {
    const terms = {
      ...brakeTerms,
      laytimeAllowedMin: 0,
      demurrageCentsPerDay: 2_000_000,
      onceOnDemurrage: false,
    };
    const entries = [
      entry("vessel", "ANCHORED", "2026-11-13 14:00", Z, "photo:1"),
      entry("vessel", "NOR_TENDERED", "2026-11-13 16:41", Z, "photo:2"),
      entry("agency", "NOR_TENDERED", "2026-11-13 16:41", Z, "msg:1"),
      entry("agency", "COMPLETED", "2026-11-16 16:00", Z, "msg:2"),
      entry("agency", "STOPPAGE_START", "2026-11-16 10:00", Z, "msg:3", "weather"),
      entry("agency", "STOPPAGE_END", "2026-11-16 16:00", Z, "msg:4", "weather"),
    ];
    const r = reconcile(entries, terms, "NONE");
    // single-party stoppage: no spread between parties, so it is not a divergence, but the logs carry one source each
    expect(r.divergences).toEqual([]);
    const withBoth = reconcile(
      [
        ...entries,
        entry("vessel", "STOPPAGE_START", "2026-11-16 10:00", Z, "photo:3", "weather"),
        entry("vessel", "STOPPAGE_END", "2026-11-16 10:30", Z, "photo:4", "weather"),
      ],
      terms,
      "NONE",
    );
    const end = withBoth.divergences.find((x) => x.kind === "STOPPAGE_END");
    expect(end?.spreadMin).toBe(330);
    expect(end?.moneyAtStakeCents).toBe(458_333);
    expect(end?.ask?.party).toBe("agency");
  });

  it("abstains on a time with no zone and does not place it", () => {
    const r = reconcile([entry("vessel", "NOR_TENDERED", "2026-11-13 16:41", null)], brakeTerms, "NONE");
    expect(r.abstentions).toHaveLength(1);
    expect(r.agreed).toEqual([]);
    expect(r.missingCritical).toContain("NOR_TENDERED");
  });

  it("converts ship's time (UTC+03:00) and local time to the same instant", () => {
    const r = reconcile(
      [
        entry("vessel", "ALL_FAST", "2026-11-16 11:12", "UTC+03:00"),
        entry("agency", "ALL_FAST", "2026-11-16 09:12", Z),
      ],
      brakeTerms,
      "NONE",
    );
    // 11:12 at +3 is 08:12Z; 09:12 Berlin (+1) is 08:12Z
    expect(r.divergences).toEqual([]);
  });

  it("flags a missing source as REVIEW even when the times agree", () => {
    const r = reconcile([entry("vessel", "ALL_FAST", "2026-11-16 09:12", Z, "")], brakeTerms, "NONE");
    expect(r.agreed[0]?.verdict).toBe("REVIEW");
  });
});
