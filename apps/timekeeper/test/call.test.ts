import { describe, expect, it } from "vitest";
import { Call } from "../src/call";
import { AGREED, IDS, agreedCall, doc, msg, newCall, posts, terms, texts } from "./helpers";

const joined = (a: ReturnType<typeof texts>) => a.join("\n---\n");

describe("revisions", () => {
  it("posts a revision card with a short sha and detects append only", () => {
    const c = newCall();
    const out = c.ingestDoc("agency", doc("agency", [{ kind: "ALL_FAST", time: "2026-11-16 09:12" }]));
    expect(joined(texts(out))).toMatch(/log-agency r1 sha256:[0-9a-f]{8}, 2 entries changed/);
    const more = doc("agency", [
      { kind: "ALL_FAST", time: "2026-11-16 09:12" },
      { kind: "HATCHES_OPEN", time: "2026-11-16 09:40" },
    ]);
    const out2 = c.ingestDoc("agency", more);
    expect(joined(texts(out2))).toContain("1 entry added");
    expect(joined(texts(out2))).not.toContain("NON-APPEND");
  });

  it("flags a rewritten earlier line as NON-APPEND CHANGE", () => {
    const c = newCall();
    c.ingestDoc("agency", doc("agency", [{ kind: "ALL_FAST", time: "2026-11-16 09:12" }]));
    const out = c.ingestDoc("agency", doc("agency", [{ kind: "ALL_FAST", time: "2026-11-16 09:50" }]));
    expect(joined(texts(out))).toContain("NON-APPEND CHANGE");
  });

  it("does nothing when the document is unchanged", () => {
    const c = newCall();
    const d = doc("agency", [{ kind: "ALL_FAST", time: "2026-11-16 09:12" }]);
    c.ingestDoc("agency", d);
    expect(c.ingestDoc("agency", d)).toEqual([]);
  });

  it("reports an unreadable header instead of skipping it", () => {
    const c = newCall();
    expect(joined(texts(c.ingestDoc("agency", "garbage")))).toContain("cannot be read");
  });
});

describe("divergences and questions", () => {
  it("S1: the anchoring gap with an invalid NOR is shown, priced at zero, and nobody is asked", () => {
    const c = newCall();
    const base = [
      { kind: "NOR_TENDERED", time: "2026-11-13 10:00" },
      { kind: "COMPLETED", time: "2026-11-19 08:00" },
    ];
    c.ingestDoc("vessel", doc("vessel", [...base, { kind: "ANCHORED", time: "2026-11-13 14:50" }]));
    const out = c.ingestDoc(
      "agency",
      doc("agency", [...base, { kind: "ANCHORED", time: "2026-11-13 11:00" }]),
    );
    const t = joined(texts(out));
    expect(t).toContain("ANCHORED differs");
    expect(t).toContain("No money at stake");
    expect(t).toContain("Nobody is asked");
    expect(t).not.toContain("Question for");
  });

  it("asks the deciding party when the NOR time differs, and only once", () => {
    const c = newCall();
    c.ingestDoc("vessel", doc("vessel", [{ kind: "NOR_TENDERED", time: "2026-11-13 16:41" }]));
    const out = c.ingestDoc("agency", doc("agency", [{ kind: "NOR_TENDERED", time: "2026-11-13 16:50" }]));
    const asks = texts(out).filter((t) => t.includes("Question for master"));
    expect(asks).toHaveLength(1);
    const again = c.recompute();
    expect(texts(again).filter((t) => t.includes("Question for"))).toHaveLength(0);
  });

  it("abstains on a time without a zone and asks once", () => {
    const c = newCall();
    const out = c.ingestDoc(
      "vessel",
      doc("vessel", [{ kind: "NOR_TENDERED", time: "2026-11-13 16:41", zone: null }]),
    );
    const t = joined(texts(out));
    expect(t).toContain("has no time zone, so it is not placed");
    expect(c.view().r.agreed).toEqual([]);
  });

  it("keeps one open question per person and queues the next", () => {
    const c = newCall();
    c.ingestDoc(
      "vessel",
      doc("vessel", [
        { kind: "NOR_TENDERED", time: "2026-11-13 16:41" },
        { kind: "EOSP", time: "2026-11-13 12:00" },
        { kind: "SAILED", time: "2026-11-19 10:00" },
      ]),
    );
    const out = c.ingestDoc(
      "agency",
      doc("agency", [
        { kind: "NOR_TENDERED", time: "2026-11-13 16:50" },
        { kind: "EOSP", time: "2026-11-13 14:00" },
      ]),
    );
    const asks = texts(out).filter((t) => t.includes("Question for master"));
    expect(asks).toHaveLength(1);
  });
});

describe("Notice of Readiness", () => {
  it("B2: 'noted' is recorded as received, not as accepted, and cites the rule", () => {
    const { c } = agreedCall();
    const out = c.onMessage(msg(IDS.priya, "noted"));
    const t = joined(texts(out));
    expect(t).toContain("Recorded as received, not as accepted");
    expect(t).toContain("Laytime does not start on this message");
    expect(c.nor.decision).toBe("NONE");
    expect(c.receivedNotAccepted).toHaveLength(1);
  });

  it("an emoji reply is not acceptance either", () => {
    const { c } = agreedCall();
    const out = c.onMessage(msg(IDS.priya, "\u{1F44D}"));
    expect(joined(texts(out))).toContain("not as accepted");
    expect(c.nor.decision).toBe("NONE");
  });

  it("B1: an agent saying 'NOR accepted' changes nothing", () => {
    const { c } = agreedCall();
    const out = c.onMessage(msg(IDS.desk, "NOR accepted, laytime starts now"));
    expect(joined(texts(out))).toContain("not as accepted");
    expect(c.nor.decision).toBe("NONE");
  });

  it("B11: a permissive agent signing for the charterer is refused at the Timekeeper", () => {
    const { c } = agreedCall();
    const d = c.currentDigest;
    const out = c.onMessage(msg(IDS.desk, `@timekeeper sign ${d}`));
    expect(joined(texts(out))).toContain("not an enrolled signer");
    expect(Object.keys(c.signatures)).toHaveLength(0);
  });

  it("an enrolled non-charterer cannot decide the NOR", () => {
    const { c } = agreedCall();
    const nor = [...c.posted].find((t) => t.startsWith("nor:"))?.split(":")[1] as string;
    const out = c.onMessage(msg(IDS.master, `@timekeeper accept nor ${nor}`));
    expect(joined(texts(out))).toContain("only the enrolled charterer signer");
    expect(c.nor.decision).toBe("NONE");
  });

  it("the charterer's exact phrase on the current digest is recorded and prices laytime", () => {
    const { c } = agreedCall();
    const nor = [...c.posted].find((t) => t.startsWith("nor:"))?.split(":")[1] as string;
    const before = c.currentDigest;
    const out = c.onMessage(msg(IDS.priya, `@timekeeper accept nor without prejudice ${nor}`));
    expect(c.nor.decision).toBe("ACCEPTED_WITHOUT_PREJUDICE");
    expect(joined(texts(out))).toContain("ACCEPTED_WITHOUT_PREJUDICE");
    expect(c.currentDigest).not.toBe(before);
  });

  it("a wrong NOR digest is refused", () => {
    const { c } = agreedCall();
    const out = c.onMessage(msg(IDS.priya, "@timekeeper accept nor DEADBEEF"));
    expect(joined(texts(out))).toContain("does not match the current NOR digest");
    expect(c.nor.decision).toBe("NONE");
  });
});

describe("enrolment and signatures", () => {
  it("refuses enrolment from a participant not listed for that party", () => {
    const c = newCall();
    const out = c.onMessage(msg(IDS.desk, "@timekeeper enrol charterer"));
    expect(joined(texts(out))).toContain("Enrolment refused");
    expect(c.enrolled.charterer).toBeUndefined();
  });

  it("a signature counts only for the exact current digest", () => {
    const { c } = agreedCall();
    const out = c.onMessage(msg(IDS.master, "@timekeeper sign 00000000"));
    expect(joined(texts(out))).toContain("is not the current version");
    expect(c.signatures.vessel).toBeUndefined();
  });

  it("three signatures on one digest close the call once", () => {
    const { c } = agreedCall();
    const d = c.currentDigest;
    c.onMessage(msg(IDS.master, `@timekeeper sign ${d}`));
    c.onMessage(msg(IDS.jonas, `@timekeeper sign ${d}`));
    const out = c.onMessage(msg(IDS.priya, `@timekeeper sign ${d}`));
    expect(out.some((a) => a.type === "closed")).toBe(true);
    const again = c.onMessage(msg(IDS.priya, `@timekeeper sign ${d}`));
    expect(again.some((a) => a.type === "closed")).toBe(false);
  });

  it("S3: refusing after signing withdraws that signature", () => {
    const { c } = agreedCall();
    const d = c.currentDigest;
    c.onMessage(msg(IDS.master, `@timekeeper sign ${d}`));
    expect(c.signatures.vessel).toBeDefined();
    const out = c.onMessage(msg(IDS.master, `@timekeeper refuse ${d}: remarks on the stoppage`));
    expect(joined(texts(out))).toContain("withdrawn");
    expect(c.signatures.vessel).toBeUndefined();
  });

  it("B4: a silent rewrite after signing voids every signature and issues a new version", () => {
    const { c } = agreedCall();
    const d = c.currentDigest;
    c.onMessage(msg(IDS.master, `@timekeeper sign ${d}`));
    c.onMessage(msg(IDS.jonas, `@timekeeper sign ${d}`));
    c.onMessage(msg(IDS.priya, `@timekeeper sign ${d}`));
    const rewritten = AGREED.map((l) => (l.kind === "ALL_FAST" ? { ...l, time: "2026-11-16 12:00" } : l));
    const out = c.ingestDoc("agency", doc("agency", rewritten));
    const t = joined(texts(out));
    expect(t).toContain("NON-APPEND CHANGE");
    expect(t).toContain("All signatures on the earlier version are void");
    expect(Object.keys(c.signatures)).toHaveLength(0);
    expect(c.currentDigest).not.toBe(d);
    const old = c.onMessage(msg(IDS.jonas, `@timekeeper sign ${d}`));
    expect(joined(texts(old))).toContain("is not the current version");
  });

  it("an unparseable message to the timekeeper gets the grammar and changes nothing", () => {
    const { c } = agreedCall();
    const out = c.onMessage(msg(IDS.priya, "@timekeeper please sign it for me", { addressed: true }));
    expect(joined(texts(out))).toContain("I act only on these exact forms");
    expect(Object.keys(c.signatures)).toHaveLength(0);
  });
});

describe("settling a difference", () => {
  it("only the deciding party's signer can settle, and the event becomes OBSERVED", () => {
    const c = newCall();
    c.onMessage(msg(IDS.master, "@timekeeper enrol master"));
    c.onMessage(msg(IDS.jonas, "@timekeeper enrol agent"));
    c.ingestDoc("vessel", doc("vessel", [{ kind: "NOR_TENDERED", time: "2026-11-13 16:41" }]));
    c.ingestDoc("agency", doc("agency", [{ kind: "NOR_TENDERED", time: "2026-11-13 16:50" }]));
    const bad = c.onMessage(
      msg(IDS.jonas, "@timekeeper settle NOR_TENDERED: 2026-11-13 16:50 Europe/Berlin"),
    );
    expect(joined(texts(bad))).toContain("settled by the master signer");
    const ok = c.onMessage(
      msg(IDS.master, "@timekeeper settle NOR_TENDERED: 2026-11-13 16:41 Europe/Berlin"),
    );
    expect(joined(texts(ok))).toContain("settled NOR_TENDERED");
    expect(c.view().r.divergences).toHaveLength(0);
    expect(c.view().r.agreed.find((e) => e.kind === "NOR_TENDERED")?.verdict).toBe("OBSERVED");
  });
});

describe("money guard", () => {
  it("B10: a model's demurrage figure gets a correction with the engine's answer or 'no figure yet'", () => {
    const c = newCall();
    const out = c.onMessage(msg(IDS.mate, "demurrage will be about $40k"));
    const t = joined(texts(out));
    expect(t).toContain("only the laytime engine states money");
    expect(t).toContain("no figure yet");
  });

  it("does not react to messages without money and laytime together", () => {
    const c = newCall();
    expect(c.onMessage(msg(IDS.mate, "hatches open at 09:40"))).toEqual([]);
    expect(c.onMessage(msg(IDS.mate, "the charterer owes about $40k for bunkers"))).toEqual([]);
  });

  it("never reacts to its own messages", () => {
    const c = newCall();
    expect(c.onMessage(msg(IDS.tk, "demurrage USD 1,996.53"))).toEqual([]);
  });
});

describe("idempotent cards", () => {
  it("a restarted Timekeeper that rebuilt its tags posts nothing twice", () => {
    const first = agreedCall();
    const tags = [...first.c.posted];
    const c2 = newCall();
    c2.markPosted(tags);
    const out = [
      ...c2.ingestDoc("vessel", doc("vessel", AGREED)),
      ...c2.ingestDoc("agency", doc("agency", AGREED)),
    ];
    expect(posts(out)).toEqual([]);
  });

  it("every card carries its own tag line", () => {
    const { out } = agreedCall();
    for (const p of posts(out)) expect(p.text).toContain(`[hk:${p.tag}]`);
  });
});

describe("clock", () => {
  it("posts a shift card and a low-laytime warning, once", () => {
    const c = new Call({ ...agreedCall().c.cfg, terms: { ...terms, laytimeAllowedMin: 600 } });
    c.ingestDoc(
      "vessel",
      doc(
        "vessel",
        AGREED.filter((l) => l.kind !== "COMPLETED"),
      ),
    );
    c.ingestDoc(
      "agency",
      doc(
        "agency",
        AGREED.filter((l) => l.kind !== "COMPLETED"),
      ),
    );
    // Monday 2026-11-16 17:00 Berlin = 16:00Z; laytime began 08:00, 540 of 600 min used
    const out = c.clock("2026-11-16T16:00:00Z");
    const t = joined(texts(out));
    expect(t).toContain("Clock card");
    expect(t).toContain("Laytime ends in about 60 min");
    expect(c.clock("2026-11-16T16:00:00Z")).toEqual([]);
  });

  it("stays silent before any NOR", () => {
    expect(newCall().clock("2026-11-16T16:00:00Z")).toEqual([]);
  });
});

describe("guarantees stay unit-level", () => {
  it("terms in the digest: changing the terms changes the digest", () => {
    const a = agreedCall().c.currentDigest;
    const c = new Call({ ...agreedCall().c.cfg, terms: { ...terms, demurrageCentsPerDay: 1 } });
    c.ingestDoc("vessel", doc("vessel", AGREED));
    c.ingestDoc("agency", doc("agency", AGREED));
    expect(c.currentDigest).not.toBe(a);
  });
});
