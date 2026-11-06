import Link from "next/link";
import { GlowCard } from "../components/GlowCard";
import {
  BoardingQr,
  HawserLine,
  LaytimeDial,
  LeaseKey,
  LockedDoc,
  RoomDiagram,
  ShipSilhouette,
  SignalFlags,
  SofCard,
} from "../components/art";
import { bundles, facts } from "../lib/data";

export default function Landing() {
  const f = facts();
  const first = bundles()[0];
  const callHref = first ? `/call/${first.id}` : "/judge";
  const video = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL;
  return (
    <>
      <section className="hero" aria-labelledby="h">
        <div className="art" aria-hidden="true">
          <ShipSilhouette width="100%" height="100%" style={{ color: "var(--ink)", opacity: 0.8 }} />
          <HawserLine width="100%" style={{ position: "absolute", left: 0, bottom: "8%" }} />
        </div>
        <div className="wrap">
          <div className="copy">
            <div className="label">Flip the Switch · Track 01</div>
            <h1 id="h" className="display" data-qa="headline" style={{ marginTop: 14 }}>
              Every minute in port, <em>agreed</em> before she sails.
            </h1>
            <p className="lede">
              HAWSER puts a ship's master, a port agent and a charterer, and their three AI agents, in one
              Switch room. Each company keeps its own log. One clock counts. All three sign.
            </p>
            <div className="cta">
              <Link className="btn primary" href={callHref} data-qa="cta-call">
                Open the port call
              </Link>
              {video ? (
                <a className="btn" href={video}>
                  Watch the 2-minute demo
                </a>
              ) : (
                <Link className="btn" href={`${callHref}?tour=1`}>
                  Take the guided tour
                </Link>
              )}
            </div>
            <Link href="/judge" className="boarding" aria-label="Judge walk, sixty seconds">
              <BoardingQr aria-hidden="true" />
              <span>
                <strong>Boarding pass for judges</strong>
                <br />A sixty second walk through a recorded call.
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="block" aria-labelledby="moment">
        <div className="wrap">
          <div className="label">The moment</div>
          <h2 id="moment" className="display" style={{ marginTop: 10 }}>
            Friday, 16:41, off Brake.
          </h2>
          <p className="lede">
            The same event, written three ways, by three people who each have money on a different side of the
            minute.
          </p>
          <div className="grid3" style={{ marginTop: 28 }}>
            <GlowCard>
              <div className="label">Master, Telegram</div>
              <p className="bubble">NOR tendered 16:41 SMT</p>
            </GlowCard>
            <GlowCard>
              <div className="label">Port agent, Slack</div>
              <p className="bubble">NOR rcvd 16:50</p>
            </GlowCard>
            <GlowCard>
              <div className="label">Charterer, email</div>
              <p className="bubble">noted</p>
            </GlowCard>
          </div>
          <p className="cap" style={{ marginTop: 14 }}>
            One event. Three books. USD 12,500 a day. Fictional people and companies. The charter terms are
            modelled on the facts of{" "}
            <a href="https://caselaw.nationalarchives.gov.uk/ewhc/comm/2026/950">
              Trans Trade RK SA v Sebat Shipping and Trading Company [2026] EWHC 950 (Comm)
            </a>
            , where about USD 840,000 of discharge port demurrage at Brake did not survive on appeal.
          </p>
        </div>
      </section>

      <section id="room" className="block" aria-labelledby="room-h">
        <div className="wrap">
          <div className="label">The room</div>
          <h2 id="room-h" className="display" style={{ marginTop: 10 }}>
            Three companies. One Switch room. No trust required.
          </h2>
          <p className="lede">
            Every agent answers only to its own owner. Every company log is a room document that only its own
            agent can write, and Switch enforces that, not us. The Timekeeper is an agent with no model that
            holds one exclusive role.
          </p>
          <GlowCard style={{ marginTop: 28, padding: 12 }}>
            <RoomDiagram width="100%" height="auto" />
          </GlowCard>
          <div className="grid3" style={{ marginTop: 18 }}>
            <GlowCard>
              <LockedDoc width={36} aria-hidden="true" />
              <h3>Author locked logs</h3>
              <p>
                Another agent's edit is refused by the server with a 403. Observed on a live Switch server,
                probe P03.
              </p>
            </GlowCard>
            <GlowCard>
              <LeaseKey width={48} aria-hidden="true" />
              <h3>One clock at a time</h3>
              <p>
                Role lease with a standby. Takeover after a crash measured at {f.lease_failover_seconds}{" "}
                seconds, digest identical afterwards.
              </p>
            </GlowCard>
            <GlowCard>
              <SignalFlags width="100%" aria-hidden="true" />
              <h3>Each side refuses the others</h3>
              <p>Addressing policy per owner. A stranger gets Switch's visible refusal, not a silent drop.</p>
            </GlowCard>
          </div>
        </div>
      </section>

      <section id="how" className="block" aria-labelledby="how-h">
        <div className="wrap">
          <div className="label">How it works</div>
          <h2 id="how-h" className="display" style={{ marginTop: 10 }}>
            Log. Reconcile. Ask. Sign.
          </h2>
          <div className="steps" style={{ marginTop: 28 }}>
            <div>
              <div className="label">1 Log</div>
              <p>
                Each agent appends to its own company log, with a source for every time: a photo, a message, a
                quay check.
              </p>
            </div>
            <div>
              <div className="label">2 Reconcile</div>
              <p>
                The Timekeeper compares the logs in UTC, prices every disagreement, and abstains on a time
                with no zone.
              </p>
            </div>
            <div>
              <div className="label">3 Ask</div>
              <p>It asks only the one person a fact binds. A casual "noted" is never an acceptance.</p>
            </div>
            <div>
              <div className="label">4 Sign</div>
              <p>Signatures bind to an exact digest and an enrolled identity. A silent rewrite voids them.</p>
            </div>
          </div>
          <p className="cap" style={{ marginTop: 14 }}>
            Agents read and explain. The Timekeeper counts. People sign.
          </p>
        </div>
      </section>

      <section id="proof" className="block" aria-labelledby="proof-h">
        <div className="wrap">
          <div className="label">Proof</div>
          <h2 id="proof-h" className="display" style={{ marginTop: 10 }}>
            Measured, with the misses published.
          </h2>
          <div className="grid4" style={{ marginTop: 28 }}>
            <GlowCard>
              <div className="bigfig">
                {f.engine_external_match.n}
                <small> of {f.engine_external_match.m}</small>
              </div>
              <div className="cap">published worked examples the laytime engine reproduces</div>
            </GlowCard>
            <GlowCard>
              <div className="bigfig">
                {f.break_cases_passed}
                <small> of {f.break_cases_run}</small>
              </div>
              <div className="cap">
                break cases held on a live Switch server ({f.break_cases_total - f.break_cases_run} not
                runnable here)
              </div>
            </GlowCard>
            <GlowCard>
              <div className="bigfig">
                {f.silent_rewrite_detect_seconds}
                <small> s</small>
              </div>
              <div className="cap">median to detect a silent rewrite of a company log</div>
            </GlowCard>
            <GlowCard>
              <div className="bigfig">
                {f.lease_failover_seconds}
                <small> s</small>
              </div>
              <div className="cap">median for the standby clock to take over after a crash</div>
            </GlowCard>
          </div>
          <p style={{ marginTop: 18 }}>
            Reconciler on {f.reconciler_variations.robustness_events.toLocaleString("en")} generated events:{" "}
            {f.reconciler_variations.robustness_false_divergences} false divergences,{" "}
            {f.reconciler_variations.robustness_missed_divergences} missed,{" "}
            {f.reconciler_variations.robustness_abstained_ambiguous} abstained on a wall-clock time that did
            not name one instant. An earlier version guessed those and produced 77 false divergences; that
            defect is in the <Link href="/findings">findings</Link>.
          </p>
          <p className="cap">
            Run on switch-core {f.switch_core_version} on {f.run_date}. {f.environment} Figures come from{" "}
            <span className="mono">docs/FACTS.json</span>, generated from the evidence in the repository.
          </p>
          <p>
            <Link className="btn" href="/findings">
              See the probe matrix
            </Link>
          </p>
        </div>
      </section>

      <section className="block" aria-labelledby="art-h">
        <div className="wrap grid2" style={{ alignItems: "center" }}>
          <div>
            <div className="label">The artifact</div>
            <h2 id="art-h" className="display" style={{ marginTop: 10 }}>
              A document the industry already signs.
            </h2>
            <p className="lede">
              A Statement of Facts and laytime time sheet in PDF, with three signatures bound to one digest.
              Anyone can recompute it offline.
            </p>
            <p style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link className="btn primary" href="/verify">
                Verify a run in your browser
              </Link>
              <LaytimeDial width={64} aria-hidden="true" />
            </p>
          </div>
          <GlowCard style={{ transform: "rotate(-2deg)" }}>
            <SofCard width="100%" height="auto" />
          </GlowCard>
        </div>
      </section>

      <section className="block" aria-labelledby="judges-h">
        <div className="wrap">
          <div className="label">For judges</div>
          <h2 id="judges-h" className="display" style={{ marginTop: 10 }}>
            Sixty seconds, or a clean clone.
          </h2>
          <ol className="lede">
            <li>Open the port call and read the three logs on one time axis.</li>
            <li>See one disagreement priced, and "noted" recorded as not accepted.</li>
            <li>See three signatures on one digest and download the PDF.</li>
          </ol>
          <pre
            className="msg mono"
            style={{ overflowX: "auto" }}
          >{`git clone https://github.com/0xkinno/hawser && cd hawser
pnpm i && pnpm test && pnpm verify runs/${first?.file ?? "<bundle>.json"}`}</pre>
          <p>
            <Link className="btn" href="/judge">
              The full judge path
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
