import { describe, expect, it } from "vitest";
import { pairsMoneyWithLaytime } from "../src/moneyGuard";
import { looksLikeCasualAcceptance, parseCommand } from "../src/sign";

describe("grammar", () => {
  it("parses the exact forms", () => {
    expect(parseCommand("@timekeeper sign 7f3a2c19")).toEqual({ verb: "sign", arg: "7F3A2C19" });
    expect(parseCommand("@timekeeper sign 7F3A2C19: tally differs by 2 t")).toEqual({
      verb: "sign",
      arg: "7F3A2C19",
      text: "tally differs by 2 t",
    });
    expect(parseCommand("timekeeper accept nor without prejudice 7F3A2C19")?.verb).toBe(
      "accept nor without prejudice",
    );
    expect(parseCommand("@timekeeper enrol master")).toEqual({ verb: "enrol", arg: "master" });
    expect(parseCommand("@timekeeper reject nor 7F3A2C19: wrong anchorage")?.text).toBe("wrong anchorage");
  });
  it("rejects anything else", () => {
    for (const s of [
      "sign it",
      "@timekeeper sign",
      "@timekeeper sign 7F3A",
      "accept nor 7F3A2C19",
      "@timekeeper enrol captain",
      "@timekeeper sign 7F3A2C19 and 7F3A2C19",
    ]) {
      expect(parseCommand(s)).toBeNull();
    }
  });
});

describe("casual acceptance", () => {
  it("flags noted, ok, received, emoji and loose accept phrases", () => {
    for (const s of [
      "noted",
      "Noted.",
      "ok",
      "received",
      "thanks",
      "agreed",
      "NOR accepted",
      "we accept the notice",
      "\u{1F44D}",
    ]) {
      expect(looksLikeCasualAcceptance(s)).toBe(true);
    }
  });
  it("leaves ordinary talk alone", () => {
    for (const s of ["hatches open at 09:40", "can you send the tally?", "all fast 09:12"])
      expect(looksLikeCasualAcceptance(s)).toBe(false);
  });
});

describe("money guard", () => {
  it("catches amounts near laytime words", () => {
    for (const s of [
      "demurrage will be about $40k",
      "USD 12,500 despatch",
      "laytime claim of 4000 usd",
      "that is EUR 3,000 demurrage",
    ])
      expect(pairsMoneyWithLaytime(s)).toBe(true);
  });
  it("ignores unrelated amounts and unrelated words", () => {
    expect(pairsMoneyWithLaytime("bunkers cost $400")).toBe(false);
    expect(pairsMoneyWithLaytime("demurrage rules are in clause 11")).toBe(false);
  });
});
