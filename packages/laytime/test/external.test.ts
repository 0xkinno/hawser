import { describe, expect, it } from "vitest";
import { loadExternal, runCase, runExternal } from "./external-run";

describe("external worked examples", () => {
  const cases = loadExternal();

  it("has at least 8 transcribed cases, each with a source URL and access date", () => {
    expect(cases.length).toBeGreaterThanOrEqual(8);
    for (const c of cases) {
      expect(c.source.url).toMatch(/^https:\/\//);
      expect(c.source.accessed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  for (const c of cases.filter((x) => x.modelled)) {
    it(`reproduces the published answer: ${c.id}`, () => {
      expect(runCase(c).diffs).toEqual([]);
    });
  }

  for (const c of cases.filter((x) => !x.modelled)) {
    it(`known mismatch stays recorded with its reason: ${c.id}`, () => {
      const o = runCase(c);
      expect(o.match).toBe(false);
      expect(c.mismatchReason).toBeTruthy();
    });
  }

  it("reports n of m", () => {
    const { n, m } = runExternal();
    expect(n).toBe(m - cases.filter((x) => !x.modelled).length);
  });
});
