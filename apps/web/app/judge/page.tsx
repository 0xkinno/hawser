import Link from "next/link";
import { GlowCard } from "../../components/GlowCard";
import { bundles, facts } from "../../lib/data";

export const metadata = { title: "For judges: HAWSER" };

export default function Judge() {
  const first = bundles()[0];
  const f = facts();
  const call = first ? `/call/${first.id}` : "/";
  return (
    <div className="wrap desk-head">
      <div className="label">For judges</div>
      <h1 className="display" style={{ fontSize: "clamp(36px,5vw,64px)", marginTop: 8 }}>
        Sixty seconds, three minutes, ten minutes.
      </h1>
      <div className="grid3" style={{ marginTop: 28 }}>
        <GlowCard>
          <div className="label">60 seconds</div>
          <ol>
            <li>
              Open <Link href={call}>the port call</Link>.
            </li>
            <li>Read the three logs on one axis and the priced difference.</li>
            <li>See "noted" recorded as not accepted.</li>
            <li>See three signatures on one digest. Download the PDF.</li>
          </ol>
        </GlowCard>
        <GlowCard>
          <div className="label">3 minutes</div>
          <ol>
            <li>Press "Replay the call" and watch it card by card.</li>
            <li>
              Open <Link href="/findings">the findings</Link>: the cross-company edit refused by Switch, the
              rewrite after signing voiding signatures, the lease failover.
            </li>
            <li>Each links to its probe result.</li>
          </ol>
        </GlowCard>
        <GlowCard>
          <div className="label">10 minutes</div>
          <pre
            className="mono"
            style={{ whiteSpace: "pre-wrap", fontSize: 13 }}
          >{`git clone https://github.com/0xkinno/hawser
cd hawser && pnpm i
pnpm verify runs/${first?.file ?? "<bundle>.json"}
pnpm test
pnpm facts:check`}</pre>
          <p>
            Offline, no keys. <code>pnpm verify</code> recomputes every digest and the laytime figure.{" "}
            <code>pnpm test</code> runs the engine against published worked examples.
          </p>
        </GlowCard>
      </div>
      <h2 className="display" style={{ fontSize: 32, marginTop: 40 }}>
        Live on a real server, 7 November 2026
      </h2>
      <p className="muted" style={{ maxWidth: 760 }}>
        Switch Console on a Windows laptop drives a switch-core 0.31.0 server in a GitHub Codespace. Slack and
        Telegram are connected as bridges. The three company agents run Claude Code on the Codespace through
        an enrolled agents controller, and both Timekeepers hold and stand by for the exclusive role. These
        are screenshots of that setup.
      </p>
      <div className="grid2 live-shots" style={{ marginTop: 18 }}>
        {(
          [
            [
              "slack-desk",
              1400,
              656,
              "Slack desk room: agency-clerk, charter-desk and ship-mate join and greet",
            ],
            ["telegram-bridge", 810, 870, "Telegram bridge room: ship-mate added for the master"],
            [
              "gateway-agents",
              1400,
              656,
              "Switch Gateway: three managed Claude Code agents running on the Codespace",
            ],
            ["console-home", 1400, 788, "Switch Console: Slack and Telegram connected, accounts linked"],
          ] as const
        ).map(([src, w, h, alt]) => (
          <figure key={src} className="live-shot">
            <img src={`/live/${src}.webp`} alt={alt} width={w} height={h} />
            <figcaption className="cap">{alt}</figcaption>
          </figure>
        ))}
      </div>
      <GlowCard>
        <div className="label">Track 3, Best Core Contribution</div>
        <p style={{ marginTop: 8 }}>
          <a href="https://github.com/sandbox-quantum/switch/pull/1672">sandbox-quantum/switch#1672</a> adds
          SMS through Twilio as a Switch messaging platform (issue #796): signed webhooks, an allow-list in
          both directions, bounded replies and 99 new tests. It is open, the CLA is signed, and it is not
          merged.
        </p>
      </GlowCard>
      <h2 className="display" style={{ fontSize: 32, marginTop: 40 }}>
        What is live, recorded and simulated
      </h2>
      <div className="scroll-x" tabIndex={0} role="region" aria-label="Scrollable table">
        <table className="t">
          <thead>
            <tr>
              <th>Part</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Switch server, agents, rooms, role lease, documents</td>
              <td>
                Live: a real switch-core {f.switch_core_version}, run for the probes and the break campaign on{" "}
                {f.run_date}. {f.environment}
              </td>
            </tr>
            <tr>
              <td>The three people in the recorded call</td>
              <td>
                The bundled run on the call page is simulated: stand-in agents, labelled there. The live setup
                above has real people in Slack and Telegram; its run bundle is added when the signed call
                completes.
              </td>
            </tr>
            <tr>
              <td>Company agents' words</td>
              <td>Scripted in the break campaign. The attack messages were not generated by a model.</td>
            </tr>
            <tr>
              <td>Laytime engine</td>
              <td>
                Live code, checked against {f.engine_external_match.m} published worked examples (
                {f.engine_external_match.n} reproduced,{" "}
                {f.engine_external_match.m - f.engine_external_match.n} recorded mismatch).
              </td>
            </tr>
            <tr>
              <td>This website</td>
              <td>Reads recorded run bundles. It does not talk to a Switch server.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
