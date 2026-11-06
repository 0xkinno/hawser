import { computeLaytime, formatUsd } from "@hawser/laytime";
import type { AgreedEvent } from "@hawser/laytime";
import { DateTime } from "luxon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GlowCard } from "../../../components/GlowCard";
import { type Msg, Replay } from "../../../components/Replay";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { Tour } from "../../../components/Tour";
import { LaytimeDial } from "../../../components/art";
import { bundle, bundles, lanes, pdfFor } from "../../../lib/data";

export function generateStaticParams() {
  return bundles().map((b) => ({ id: b.id }));
}

const ROLE: Record<string, string> = { vessel: "Vessel", agency: "Agency", charterer: "Charterer" };
const TAG = /\[hk:([^\]]+)\]/;

export default async function Call({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = bundle(id);
  if (!item) notFound();
  const b = item.bundle;
  const z = b.terms.portZone;
  const { perParty, reconciled, nor } = lanes(b);
  const last = b.sofVersions[b.sofVersions.length - 1];
  const events: AgreedEvent[] =
    last?.body.events.map((e) => ({
      kind: e.kind as AgreedEvent["kind"],
      utc: e.utc,
      verdict: e.verdict as AgreedEvent["verdict"],
      sources: e.sources,
      ...(e.reason ? { reason: e.reason } : {}),
    })) ?? [];
  const laytime = computeLaytime(events, b.terms, nor);
  const pdf = pdfFor(id, b);
  const local = (utc: string) =>
    DateTime.fromISO(utc, { zone: "utc" }).setZone(z).toFormat("yyyy-MM-dd HH:mm");

  const all = Object.values(perParty).flat();
  const times = all.map((e) =>
    Date.parse(
      e.zone
        ? (DateTime.fromFormat(e.localTime, "yyyy-MM-dd HH:mm", { zone: e.zone }).toUTC().toISO() ?? "")
        : "",
    ),
  );
  const t0 = Math.min(...times.filter(Number.isFinite));
  const t1 = Math.max(...times.filter(Number.isFinite));
  const W = 1000;
  const x = (e: (typeof all)[number]) => {
    const t = DateTime.fromFormat(e.localTime, "yyyy-MM-dd HH:mm", { zone: e.zone ?? "utc" }).toMillis();
    return 120 + ((t - t0) / Math.max(1, t1 - t0)) * (W - 160);
  };
  const days: number[] = [];
  for (
    let d = DateTime.fromMillis(t0, { zone: z }).startOf("day").plus({ days: 1 });
    d.toMillis() < t1;
    d = d.plus({ days: 1 })
  )
    days.push(d.toMillis());
  const lx = (ms: number) => 120 + ((ms - t0) / Math.max(1, t1 - t0)) * (W - 160);

  const messages: Msg[] = b.messages
    .filter((m) => m.kind === "message")
    .map((m, i) => {
      const tag = TAG.exec(m.body)?.[1];
      return {
        n: i + 1,
        who: m.senderName,
        tk: m.senderName.startsWith("timekeeper"),
        text: m.body.replace(TAG, "").trim(),
        ...(tag ? { tag } : {}),
      };
    });
  const norCard = b.messages.find((m) => m.body.includes("[hk:nor:"));

  return (
    <div className="wrap desk-head">
      <div className="label">Port call · {b.callId}</div>
      <h1 className="display" style={{ fontSize: "clamp(36px,5vw,64px)", marginTop: 8 }}>
        MV Saltmarsh Grace at Brake
      </h1>
      <div className="banner" data-tour="banner" data-qa="provenance" style={{ marginTop: 16 }}>
        <strong>
          {b.provenance.mode === "live"
            ? "Recorded live"
            : b.provenance.mode === "simulated"
              ? "Simulated people"
              : "Recorded"}
        </strong>
        : {b.provenance.label}, switch-core {b.provenance.switchVersion}, run on {b.generatedAt.slice(0, 10)}.
        The vessel, port and people are fictional.{" "}
        {b.provenance.mode === "simulated"
          ? "The three people are stand-in agents. A recorded run with people in Slack and Telegram replaces this one."
          : ""}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "16px 0" }}>
        <Tour />
        <ThemeToggle />
        {pdf ? (
          <a className="btn primary" href={pdf} download>
            Download the signed PDF
          </a>
        ) : null}
        <Link className="btn" href="/verify">
          Verify this run
        </Link>
        <Link className="btn" href={`/trace/${id}`}>
          Trace every card
        </Link>
      </div>

      <GlowCard data-tour="lanes" style={{ marginTop: 8 }}>
        <div className="label">Three logs on one time axis, {z}</div>
        <svg
          className="lane-chart"
          viewBox={`0 0 ${W} 260`}
          role="img"
          aria-label="Three company logs on one time axis"
        >
          <title>Three company logs on one time axis</title>
          {days.map((d) => (
            <g key={d}>
              <line x1={lx(d)} x2={lx(d)} y1="20" y2="200" stroke="currentColor" opacity="0.12" />
              <text className="tick" x={lx(d)} y="216" textAnchor="middle">
                {DateTime.fromMillis(d, { zone: z }).toFormat("ccc dd LLL")}
              </text>
            </g>
          ))}
          {(["vessel", "agency", "charterer"] as const).map((p, row) => (
            <g key={p}>
              <text className="lane-label" x="4" y={52 + row * 60}>
                {ROLE[p]}
              </text>
              <line
                x1="116"
                x2={W - 36}
                y1={48 + row * 60}
                y2={48 + row * 60}
                stroke="currentColor"
                opacity="0.25"
              />
              {(perParty[p] ?? []).map((e, i) => {
                const div = reconciled.divergences.find((d) => d.kind === e.kind);
                return (
                  <g key={`${e.kind}-${i}`}>
                    <circle cx={x(e)} cy={48 + row * 60} r="6" fill={div ? "var(--signal)" : "var(--ink)"}>
                      <title>{`${ROLE[p]} ${e.kind} ${e.localTime} ${e.zone ?? "no zone"}${e.reason ? ` (${e.reason})` : ""}`}</title>
                    </circle>
                    <text
                      className="tick"
                      x={x(e)}
                      y={36 + row * 60 - (i % 2) * 0}
                      textAnchor="middle"
                      transform={`rotate(-18 ${x(e)} ${36 + row * 60})`}
                    >
                      {e.kind.replace("_TENDERED", "").replace("_", " ")}
                    </text>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
        <p className="cap">
          Orange dots are events the logs disagree on. Hover or focus a dot for its time, zone and source.
        </p>
      </GlowCard>

      <div className="grid2" style={{ marginTop: 18 }}>
        <GlowCard data-tour="divergence">
          <div className="label">Differences between the logs</div>
          {reconciled.divergences.length === 0 ? (
            <p>No event is logged differently across the three companies.</p>
          ) : (
            reconciled.divergences.map((d) => (
              <div key={d.key} className="pulse-once" style={{ marginTop: 10 }}>
                <p style={{ margin: 0 }}>
                  <span className="pill review">REVIEW</span> <strong>{d.kind}</strong> differs by{" "}
                  {d.spreadMin} min.
                </p>
                <ul>
                  {d.claims.map((c) => (
                    <li key={c.party} className="mono">
                      {ROLE[c.party]} {local(c.utc)}
                    </li>
                  ))}
                </ul>
                <p style={{ margin: 0 }}>
                  Money at stake under the stated terms: <strong>{formatUsd(d.moneyAtStakeCents)}</strong>.{" "}
                  {d.ask
                    ? `Asked of the ${d.ask.party === "vessel" ? "master" : d.ask.party === "agency" ? "agent" : "charterer"}.`
                    : "Nobody was asked."}
                </p>
              </div>
            ))
          )}
          <p className="cap">
            Closed only by the bound person's explicit choice. The final version settled each one.
          </p>
        </GlowCard>
        <GlowCard data-tour="nor">
          <div className="label">Notice of Readiness</div>
          <p style={{ marginTop: 8 }}>
            {norCard ? norCard.body.replace(TAG, "").split("\n")[0] : "No NOR recorded."}
          </p>
          <p>
            Decision on the final version: <span className="pill observed">{nor}</span>
          </p>
          <p className="cap">
            "Noted" is recorded as received, not as accepted. See the transcript for the exact reply.
          </p>
        </GlowCard>
      </div>

      <div className="grid2" style={{ marginTop: 18 }}>
        <GlowCard data-tour="signatures">
          <div className="label">
            Signatures on digest <span className="mono">{b.finalDigest}</span>
          </div>
          <div className="sig" style={{ marginTop: 12 }}>
            {b.signatures.map((s) => (
              <div key={s.party} className="stamp">
                {s.party === "vessel" ? "master" : s.party === "agency" ? "agent" : "charterer"} · {s.digest}
              </div>
            ))}
            {b.signatures.length === 0 ? <p>No signatures recorded.</p> : null}
          </div>
          {b.signatures
            .filter((s) => s.remarks)
            .map((s) => (
              <p key={s.party} className="cap">
                {s.party} remarks: {s.remarks}
              </p>
            ))}
        </GlowCard>
        <GlowCard>
          <div className="label">Laytime</div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <LaytimeDial
              width={110}
              used={Math.min(1, laytime.usedMin / Math.max(1, laytime.allowedMin + laytime.demurrageMin))}
              demurrage={laytime.demurrageMin / Math.max(1, laytime.allowedMin + laytime.demurrageMin)}
            />
            <div>
              <p style={{ margin: 0 }}>
                Used {laytime.usedMin} of {laytime.allowedMin} min.
              </p>
              <p style={{ margin: 0 }}>
                Demurrage <strong>{formatUsd(laytime.demurrageCents)}</strong>.
              </p>
              <p className="cap" style={{ margin: 0 }}>
                Only the engine states money.
              </p>
            </div>
          </div>
        </GlowCard>
      </div>

      <GlowCard data-tour="sof" style={{ marginTop: 18 }}>
        <div className="label">Statement of Facts, version {last?.version}</div>
        <div className="scroll-x">
          <table className="t">
            <thead>
              <tr>
                <th>Event</th>
                <th>Time ({z})</th>
                <th>Verdict</th>
                <th>Sources</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={`${e.kind}-${e.utc}`}>
                  <td>{e.reason ? `${e.kind} (${e.reason})` : e.kind}</td>
                  <td className="mono">{local(e.utc)}</td>
                  <td>
                    <span
                      className={`pill ${e.verdict === "OBSERVED" ? "observed" : e.verdict === "REVIEW" ? "review" : "notobs"}`}
                    >
                      {e.verdict.replace("_", " ")}
                    </span>
                  </td>
                  <td className="mono">{e.sources.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlowCard>

      <GlowCard data-tour="transcript" style={{ marginTop: 18 }}>
        <div className="label">Room transcript</div>
        <Replay messages={messages} label={`Recorded desk room, ${b.generatedAt.slice(0, 10)}.`} />
      </GlowCard>
    </div>
  );
}
