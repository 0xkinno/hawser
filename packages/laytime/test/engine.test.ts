import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { bothScenarios, commencement, computeLaytime, pairStoppages } from "../src/engine";
import { brakeTerms, ev } from "./fixtures";

// Friday 2026-11-13. Berlin is UTC+1 in November.
const fridayNor = [ev("ANCHORED", "2026-11-13T14:00:00Z"), ev("NOR_TENDERED", "2026-11-13T15:41:00Z")];

describe("commencement", () => {
  it("SSHEX with no Saturday work: Friday evening NOR starts Monday 08:00 port time", () => {
    const c = commencement("2026-11-13T15:41:00Z", brakeTerms);
    expect(c.toFormat("ccc yyyy-MM-dd HH:mm")).toBe("Mon 2026-11-16 08:00");
  });
  it("SHEX counts Saturday as a working day", () => {
    const c = commencement("2026-11-13T15:41:00Z", { ...brakeTerms, working: "SHEX" });
    expect(c.toFormat("ccc HH:mm")).toBe("Sat 08:00");
  });
  it("skips a Monday holiday", () => {
    const c = commencement("2026-11-13T15:41:00Z", { ...brakeTerms, holidays: ["2026-11-16"] });
    expect(c.toFormat("ccc yyyy-MM-dd")).toBe("Tue 2026-11-17");
  });
  it("hours_after_nor adds hours", () => {
    const c = commencement("2026-11-13T15:41:00Z", {
      ...brakeTerms,
      commencement: { kind: "hours_after_nor", hours: 6 },
    });
    expect(c.toUTC().toISO()).toBe("2026-11-13T21:41:00.000Z");
  });
});

describe("computeLaytime", () => {
  it("Paranagua shape: Saturday NOR on arrival, laytime from Monday, weekend on the owner's side", () => {
    // The charter here allows a Saturday NOR window so the notice is valid.
    const terms = {
      ...brakeTerms,
      norWindow: { ...brakeTerms.norWindow, saturday: { from: "00:00", to: "24:00" } },
    };
    const events = [
      ev("ARRIVED", "2026-11-14T07:00:00Z"),
      ev("NOR_TENDERED", "2026-11-14T07:30:00Z"),
      ev("COMPLETED", "2026-11-16T07:00:00Z"),
    ];
    const r = computeLaytime(events, terms, "NONE");
    expect(r.status).toBe("COUNTED");
    expect(
      DateTime.fromISO(r.commencedUtc as string)
        .setZone("Europe/Berlin")
        .toFormat("ccc HH:mm"),
    ).toBe("Mon 08:00");
    expect(r.usedMin).toBe(0);
    expect(r.demurrageCents).toBe(0);
  });

  it("charges demurrage after the allowance, once on demurrage always on demurrage", () => {
    const terms = { ...brakeTerms, laytimeAllowedMin: 1440 };
    const events = [...fridayNor, ev("COMPLETED", "2026-11-19T07:00:00Z")]; // Thu 08:00 Berlin
    // Mon 08:00 to Thu 08:00 Berlin = 3 days = 4320 min, 1440 allowed, 2880 on demurrage
    const r = computeLaytime(events, terms, "NONE");
    expect(r.status).toBe("COUNTED");
    expect(r.usedMin).toBe(1440);
    expect(r.demurrageMin).toBe(2880);
    expect(r.demurrageCents).toBe(2 * 1_250_000);
    expect(r.onDemurrageFromUtc).toBe("2026-11-17T07:00:00Z");
  });

  it("an excepted weather stoppage does not count: USD 5,000 at 20,000 per day for six hours", () => {
    const terms = {
      ...brakeTerms,
      laytimeAllowedMin: 0,
      demurrageCentsPerDay: 2_000_000,
      onceOnDemurrage: false,
    };
    const base = [...fridayNor, ev("COMPLETED", "2026-11-16T15:00:00Z")]; // Mon 08:00..16:00 Berlin = 8 h
    const withRain = [
      ...base,
      ev("STOPPAGE_START", "2026-11-16T09:00:00Z", { reason: "weather" }),
      ev("STOPPAGE_END", "2026-11-16T15:00:00Z", { reason: "weather" }),
    ];
    const noRain = computeLaytime(base, terms, "NONE");
    const rain = computeLaytime(withRain, terms, "NONE");
    expect(noRain.demurrageCents - rain.demurrageCents).toBe(500_000);
  });

  it("a non-excepted stoppage still counts", () => {
    const terms = { ...brakeTerms, laytimeAllowedMin: 0, onceOnDemurrage: false };
    const base = [...fridayNor, ev("COMPLETED", "2026-11-16T15:00:00Z")];
    const sp = [
      ...base,
      ev("STOPPAGE_START", "2026-11-16T09:00:00Z", { reason: "crane breakdown" }),
      ev("STOPPAGE_END", "2026-11-16T10:00:00Z", { reason: "crane breakdown" }),
    ];
    expect(computeLaytime(sp, terms, "NONE").demurrageMin).toBe(
      computeLaytime(base, terms, "NONE").demurrageMin,
    );
  });

  it("despatch is paid on laytime saved when never on demurrage", () => {
    const terms = { ...brakeTerms, laytimeAllowedMin: 1440, despatchCentsPerDay: 625_000 };
    const events = [...fridayNor, ev("COMPLETED", "2026-11-16T19:00:00Z")]; // Mon 08:00..20:00 Berlin = 720 min
    const r = computeLaytime(events, terms, "NONE");
    expect(r.usedMin).toBe(720);
    expect(r.demurrageCents).toBe(0);
    expect(r.despatchCents).toBe(312_500);
  });

  it("Sunday does not count under SSHEX before demurrage", () => {
    const terms = { ...brakeTerms, laytimeAllowedMin: 10 * 1440, onceOnDemurrage: false };
    const events = [
      ev("ANCHORED", "2026-11-19T14:00:00Z"),
      ev("NOR_TENDERED", "2026-11-19T15:41:00Z"), // Thu
      ev("COMPLETED", "2026-11-23T07:00:00Z"), // Mon 08:00 Berlin
    ];
    const r = computeLaytime(events, terms, "NONE");
    // Fri 08:00 to Mon 08:00: Friday counts 24 h, Sat and Sun excluded
    expect(r.usedMin).toBe(1440);
    expect(r.ledger.some((l) => !l.counts && l.why === "Sunday")).toBe(true);
    expect(r.ledger.some((l) => !l.counts && l.why === "Saturday after cut-off")).toBe(true);
  });

  it("an invalid NOR with no acceptance triggers nothing (the Brake rule)", () => {
    const events = [
      ev("NOR_TENDERED", "2026-11-13T09:00:00Z"),
      ev("ANCHORED", "2026-11-13T13:50:00Z"),
      ev("COMPLETED", "2026-11-19T07:00:00Z"),
    ];
    const r = computeLaytime(events, brakeTerms, "NONE");
    expect(r.status).toBe("NOT_TRIGGERED");
    expect(r.demurrageCents).toBe(0);
    expect(r.reasons.join(" ")).toContain("not triggered");
  });

  it("rejection does not count as acceptance", () => {
    const events = [
      ev("NOR_TENDERED", "2026-11-13T09:00:00Z"),
      ev("ANCHORED", "2026-11-13T13:50:00Z"),
      ev("COMPLETED", "2026-11-19T07:00:00Z"),
    ];
    expect(computeLaytime(events, brakeTerms, "REJECTED").status).toBe("NOT_TRIGGERED");
  });

  it("a valid NOR the charterer rejects does not start laytime", () => {
    const events = [...fridayNor, ev("COMPLETED", "2026-11-19T07:00:00Z")];
    expect(computeLaytime(events, brakeTerms, "REJECTED").status).toBe("NOT_TRIGGERED");
  });

  it("explicit acceptance of an invalid NOR counts laytime and says why", () => {
    const events = [
      ev("NOR_TENDERED", "2026-11-13T09:00:00Z"),
      ev("ANCHORED", "2026-11-13T13:50:00Z"),
      ev("COMPLETED", "2026-11-19T07:00:00Z"),
    ];
    const r = computeLaytime(
      events,
      { ...brakeTerms, laytimeAllowedMin: 1440 },
      "ACCEPTED_WITHOUT_PREJUDICE",
    );
    expect(r.status).toBe("COUNTED");
    expect(r.reasons.join(" ")).toContain("counted only because");
  });

  it("missing completion is not triggered, never guessed", () => {
    expect(computeLaytime(fridayNor, brakeTerms, "NONE").status).toBe("NOT_TRIGGERED");
  });

  it("is deterministic", () => {
    const events = [...fridayNor, ev("COMPLETED", "2026-11-19T07:00:00Z")];
    expect(JSON.stringify(computeLaytime(events, brakeTerms, "NONE"))).toBe(
      JSON.stringify(computeLaytime(events, brakeTerms, "NONE")),
    );
  });
});

describe("bothScenarios", () => {
  it("S1 Brake Friday: two columns for an invalid NOR", () => {
    const events = [
      ev("NOR_TENDERED", "2026-11-13T09:00:00Z"),
      ev("ANCHORED", "2026-11-13T13:50:00Z"),
      ev("COMPLETED", "2026-11-19T07:00:00Z"),
    ];
    const b = bothScenarios(events, { ...brakeTerms, laytimeAllowedMin: 1440 });
    expect(b.norValid).toBe(false);
    expect(b.validAsAccepted.status).toBe("COUNTED");
    expect(b.invalidNotAccepted.status).toBe("NOT_TRIGGERED");
    expect(b.validAsAccepted.demurrageCents).toBeGreaterThan(0);
    expect(b.invalidNotAccepted.demurrageCents).toBe(0);
  });
});

describe("pairStoppages", () => {
  it("throws on an unpaired start", () => {
    expect(() => pairStoppages([ev("STOPPAGE_START", "2026-11-16T09:00:00Z")], brakeTerms)).toThrow(/no end/);
  });
  it("throws on an end without a start", () => {
    expect(() => pairStoppages([ev("STOPPAGE_END", "2026-11-16T09:00:00Z")], brakeTerms)).toThrow(/no start/);
  });
});
