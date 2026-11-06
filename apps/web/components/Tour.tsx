"use client";
import { useCallback, useEffect, useState } from "react";

const STEPS = [
  {
    sel: "[data-tour=banner]",
    text: "This is a recorded run. The banner says what it is, when it ran and on which server.",
  },
  {
    sel: "[data-tour=lanes]",
    text: "Three companies, three logs, one time axis. Each log is a document only its own agent can write.",
  },
  {
    sel: "[data-tour=divergence]",
    text: "Where two logs disagree, the Timekeeper prices the gap in money and asks only the person it binds.",
  },
  {
    sel: "[data-tour=nor]",
    text: "A casual 'noted' is recorded as received, not as accepted. Only an exact phrase on the current digest counts.",
  },
  {
    sel: "[data-tour=signatures]",
    text: "Each signature is bound to the exact version digest and to the person's enrolled Switch identity.",
  },
  { sel: "[data-tour=sof]", text: "The Statement of Facts. Every row shows its verdict and its sources." },
  {
    sel: "[data-tour=transcript]",
    text: "The room transcript, in the order Switch recorded it. Replay it card by card.",
  },
];

export function Tour() {
  const [i, setI] = useState<number | null>(null);
  const close = useCallback(() => {
    for (const n of document.querySelectorAll(".tour-hl")) n.classList.remove("tour-hl");
    setI(null);
  }, []);
  useEffect(() => {
    if (i === null) return;
    for (const n of document.querySelectorAll(".tour-hl")) n.classList.remove("tour-hl");
    const el = document.querySelector(STEPS[i]?.sel ?? "");
    el?.classList.add("tour-hl");
    el?.scrollIntoView({
      block: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setI((x) => (x === null ? x : Math.min(STEPS.length - 1, x + 1)));
      }
      if (e.key === "ArrowLeft") setI((x) => (x === null ? x : Math.max(0, x - 1)));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [i, close]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tour") === "1") setI(0);
    if (new URLSearchParams(window.location.search).get("render") === "1")
      document.body.classList.add("render");
  }, []);
  return (
    <>
      <button type="button" className="btn" onClick={() => setI(0)}>
        Guided tour
      </button>
      {i !== null ? (
        <>
          <div className="tour-dim" aria-hidden="true" />
          <dialog open className="tour-box" aria-label="Guided tour" style={{ color: "var(--ink)" }}>
            <div className="label">
              Step {i + 1} of {STEPS.length}
            </div>
            <p style={{ margin: "6px 0 12px" }}>{STEPS[i]?.text}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn"
                onClick={() => setI(Math.max(0, i - 1))}
                disabled={i === 0}
              >
                Back
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => (i === STEPS.length - 1 ? close() : setI(i + 1))}
              >
                {i === STEPS.length - 1 ? "Finish" : "Next"}
              </button>
              <button type="button" className="btn" onClick={close}>
                Skip
              </button>
            </div>
            <div className="cap" style={{ marginTop: 8 }}>
              Space and the arrow keys move, Escape closes.
            </div>
          </dialog>
        </>
      ) : null}
    </>
  );
}
