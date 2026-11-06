import { facts, probes } from "../../lib/data";

export const metadata = { title: "Findings on Switch: HAWSER" };

const label = (s: string) =>
  s === "observed" ? "observed" : s === "partial" ? "partly observed" : "not run here";

export default function Findings() {
  const ps = probes();
  const f = facts();
  return (
    <div className="wrap desk-head">
      <div className="label">Findings on Switch</div>
      <h1 className="display" style={{ fontSize: "clamp(36px,5vw,64px)", marginTop: 8 }}>
        What we observed, with the date and the server.
      </h1>
      <p className="lede">
        The questions were written down before the probes ran. Every row below is a result from a script in
        the repository, not a claim from the documentation. Surprises are kept.
      </p>
      <div className="banner" style={{ marginTop: 16 }}>
        Run on switch-core {f.switch_core_version} on {f.run_date}. {f.environment} A row marked "not run
        here" needs the real Codespace server or a real messaging app.
      </div>
      <div className="scroll-x" style={{ marginTop: 24 }}>
        <table className="t" data-qa="probe-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Question</th>
              <th>Status</th>
              <th>Observed</th>
            </tr>
          </thead>
          <tbody>
            {ps.map((p) => (
              <tr key={p.id}>
                <td className="mono">{p.id.toUpperCase()}</td>
                <td>{p.question}</td>
                <td>
                  <span
                    className={`pill ${p.status === "observed" ? "observed" : p.status === "partial" ? "review" : "notobs"}`}
                  >
                    {label(p.status)}
                  </span>
                </td>
                <td>
                  {p.summary}
                  {p.caveats?.map((c) => (
                    <div key={c} className="cap">
                      Caveat: {c}
                    </div>
                  ))}
                  <div className="cap">{p.ranAt.slice(0, 10)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="display" style={{ fontSize: 32, marginTop: 40 }}>
        Not yet run
      </h2>
      <ul>
        {Object.entries(f.probes as Record<string, string>)
          .filter(([, s]) => s === "not_yet_run")
          .map(([id]) => (
            <li key={id}>
              <span className="mono">{id.toUpperCase()}</span>: needs a real messaging app (Slack or Telegram)
              and is reported as not yet run.
            </li>
          ))}
      </ul>
    </div>
  );
}
