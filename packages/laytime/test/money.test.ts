import { describe, expect, it } from "vitest";
import { centsForMinutes, formatUsd, roundHalfUp } from "../src/money";

describe("money", () => {
  it("prices 3 h 50 min of counting time at USD 12,500 per day as USD 1,996.53", () => {
    const cents = centsForMinutes(230, 12500 * 100);
    expect(cents).toBe(199653);
    expect(formatUsd(cents)).toBe("USD 1,996.53");
  });
  it("one minute at USD 12,500 per day is 868.06 cents", () => {
    expect((12500 * 100) / 1440).toBeCloseTo(868.0555, 3);
    expect(centsForMinutes(1, 1_250_000)).toBe(868);
  });
  it("rounds half up", () => {
    expect(roundHalfUp(1, 2)).toBe(1);
    expect(roundHalfUp(1, 3)).toBe(0);
    expect(roundHalfUp(5, 2)).toBe(3);
  });
  it("one full day is the daily rate", () => {
    expect(centsForMinutes(1440, 1_250_000)).toBe(1_250_000);
  });
  it("rejects non-integers", () => {
    expect(() => centsForMinutes(1.5, 100)).toThrow();
  });
});
