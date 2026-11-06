import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap desk-head">
      <h1 className="display" style={{ fontSize: 48 }}>
        That page is not on the chart.
      </h1>
      <p className="lede">The recorded runs, the verifier and the findings are all one click away.</p>
      <p>
        <Link className="btn primary" href="/">
          Back to HAWSER
        </Link>
      </p>
    </div>
  );
}
