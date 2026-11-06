import { VerifyClient } from "../../components/VerifyClient";
import { bundles } from "../../lib/data";

export const metadata = { title: "Verify a run: HAWSER" };

export default function Verify() {
  const items = bundles().map((b) => ({ id: b.id, bundle: b.bundle }));
  return (
    <div className="wrap desk-head">
      <div className="label">Verify</div>
      <h1 className="display" style={{ fontSize: "clamp(36px,5vw,64px)", marginTop: 8 }}>
        Recompute the call yourself.
      </h1>
      <p className="lede">
        A run bundle holds the terms, every company log at each fingerprint, every Statement of Facts version
        with its digest, the signatures and the engine result. This page recomputes all of it in your browser
        and shows PASS or the first mismatch.
      </p>
      <div style={{ marginTop: 24 }}>
        <VerifyClient items={items} />
      </div>
      <p className="cap" style={{ marginTop: 24 }}>
        The same check runs offline with <span className="mono">pnpm verify runs/&lt;bundle&gt;.json</span>,
        with no keys and no network.
      </p>
    </div>
  );
}
