"use client";
import { type RunBundle, type VerifyResult, verifyBundle } from "@hawser/laytime";
import { useState } from "react";

interface Item {
  id: string;
  bundle: RunBundle;
}

export function VerifyClient({ items }: { items: Item[] }) {
  const [result, setResult] = useState<{ name: string; r: VerifyResult; b: RunBundle } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = (name: string, b: RunBundle) => {
    try {
      setError(null);
      setResult({ name, r: verifyBundle(b), b });
    } catch (e) {
      setResult(null);
      setError(`Could not verify ${name}: ${(e as Error).message}`);
    }
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {items.map((it) => (
          <button key={it.id} type="button" className="btn primary" onClick={() => run(it.id, it.bundle)}>
            Verify the bundled run
          </button>
        ))}
        <label className="btn" style={{ cursor: "pointer" }}>
          Drop or choose a bundle
          <input
            type="file"
            accept="application/json"
            style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                run(f.name, JSON.parse(await f.text()) as RunBundle);
              } catch (err) {
                setResult(null);
                setError(`That file is not a HAWSER run bundle: ${(err as Error).message}`);
              }
            }}
          />
        </label>
      </div>
      <p className="cap" style={{ marginTop: 8 }}>
        Everything is recomputed here in your browser with the same code the Timekeeper uses. Nothing is
        uploaded.
      </p>
      {error ? (
        <p role="alert" className="banner">
          {error}
        </p>
      ) : null}
      {result ? (
        <div style={{ marginTop: 18 }} aria-live="polite" data-qa="verify-result">
          <p>
            <span className={`pill ${result.r.ok ? "observed" : "review"}`}>
              {result.r.ok ? "PASS" : "MISMATCH"}
            </span>{" "}
            <span className="mono">{result.name}</span>{" "}
            <span className="muted">
              ({result.b.provenance.mode}: {result.b.provenance.label})
            </span>
          </p>
          {result.r.ok ? (
            <p>
              All {result.r.checks.length} checks passed. Final digest{" "}
              <span className="mono">{result.b.finalDigest}</span>.
            </p>
          ) : (
            <p>First mismatch: {result.r.firstMismatch}</p>
          )}
          <div className="scroll-x">
            <table className="t">
              <thead>
                <tr>
                  <th>Check</th>
                  <th>Result</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {result.r.checks.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td>
                      <span className={`pill ${c.ok ? "observed" : "review"}`}>{c.ok ? "PASS" : "FAIL"}</span>
                    </td>
                    <td className="mono">{c.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
