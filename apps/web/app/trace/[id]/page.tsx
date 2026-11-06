import Link from "next/link";
import { notFound } from "next/navigation";
import { bundle, bundles } from "../../../lib/data";

export function generateStaticParams() {
  return bundles().map((b) => ({ id: b.id }));
}
const TAG = /\[hk:([^\]]+)\]/;

export default async function Trace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = bundle(id);
  if (!item) notFound();
  const b = item.bundle;
  return (
    <div className="wrap desk-head">
      <div className="label">Trace · {b.callId}</div>
      <h1 className="display" style={{ fontSize: "clamp(32px,4.5vw,56px)", marginTop: 8 }}>
        Every card, in the order Switch recorded it.
      </h1>
      <p className="cap">
        Order is the position in the room's history as read back from Switch.{" "}
        {b.provenance.mode === "simulated" ? "Simulated people." : ""}{" "}
        <Link href={`/call/${id}`}>Back to the call</Link>
      </p>
      <div className="scroll-x">
        <table className="t" data-qa="trace-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Sender</th>
              <th>Tag</th>
              <th>Body</th>
            </tr>
          </thead>
          <tbody>
            {b.messages.map((m) => (
              <tr key={m.seq}>
                <td className="mono">{m.seq}</td>
                <td className="mono">{m.senderName}</td>
                <td className="mono">{TAG.exec(m.body)?.[1] ?? ""}</td>
                <td style={{ whiteSpace: "pre-wrap" }}>{m.body.replace(TAG, "").trim()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
