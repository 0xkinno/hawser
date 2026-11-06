import { describe, expect, it } from "vitest";
import { loadScenarios, runScenario, runVariations } from "../scenarios";

describe("scenarios", () => {
  const all = loadScenarios();
  it("has six, each labelled fictional and shaped on a named source", () => {
    expect(all.map((s) => s.id)).toEqual(["S1", "S2", "S3", "S4", "S5", "S6"]);
    for (const s of all) {
      expect(s.shapedOn.length).toBeGreaterThan(20);
    }
  });
  const by = (id: string) => runScenario(all.find((s) => s.id === id) as (typeof all)[number]);

  it("S1: anchoring gap is flagged, priced at zero, nobody asked, NOR read as invalid and laytime not triggered", () => {
    const o = by("S1");
    expect(o.divergences).toBe(1);
    expect(o.moneyAtStakeCents).toBe(0);
    expect(o.questionsAsked).toBe(0);
    expect(o.norValid).toBe(false);
    expect(o.status).toBe("NOT_TRIGGERED");
    expect(o.counterfactualOff.norLeftAmbiguous).toBe(true);
  });
  it("S2: Saturday arrival counts from Monday 08:00 with the weekend on the owner's side", () => {
    const o = by("S2");
    expect(o.status).toBe("COUNTED");
    expect(o.divergences).toBe(0);
  });
  it("S3: counts with an accepted NOR and no differences", () => {
    expect(by("S3").status).toBe("COUNTED");
  });
  it("S4: a nine minute difference on the NOR time is asked of the master", () => {
    const o = by("S4");
    expect(o.divergences).toBe(1);
    expect(o.askedParties).toEqual(["vessel"]);
  });
  it("S5: the stoppage end difference is worth exactly USD 5,000 and asked of the agency", () => {
    const o = by("S5");
    expect(o.moneyAtStakeCents).toBe(500_000);
    expect(o.askedParties).toEqual(["agency"]);
  });
  it("S6: a time with no zone is not placed, and ship's time UTC+03:00 matches port time", () => {
    const o = by("S6");
    expect(o.abstentions).toBe(1);
    expect(o.divergences).toBe(0);
  });
});

describe("seeded variations", () => {
  it("is deterministic for a seed", () => {
    expect(JSON.stringify(runVariations(1, 20))).toBe(JSON.stringify(runVariations(1, 20)));
  });
  it("does not guess across the repeated hour: 300 seeds give no false divergence and no miss", () => {
    let fp = 0;
    let fn = 0;
    let abstained = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const r = runVariations(seed, 20);
      fp += r.falseDivergences;
      fn += r.missedDivergences;
      abstained += r.abstainedAmbiguous;
    }
    expect(fp).toBe(0);
    expect(fn).toBe(0);
    expect(abstained).toBeGreaterThan(0);
  });
  it("reports both error directions with their detail", () => {
    const r = runVariations(1, 20);
    expect(r.events).toBeGreaterThan(30);
    expect(r.misses.length).toBe(r.missedDivergences);
    expect(r.falses.length).toBe(r.falseDivergences);
  });
});
