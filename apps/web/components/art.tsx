import type React from "react";
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { title?: string };
const base = (title: string | undefined, fallback: string, p: P) => {
  const { title: _t, ...rest } = p;
  return { role: "img" as const, "aria-label": title ?? fallback, ...rest };
};

/** Brass bollard with a hawser in a figure-eight, one continuous stroke. */
export function Bollard(p: P) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...base(p.title, "HAWSER bollard mark", p)}
    >
      <title>{p.title ?? "HAWSER bollard mark"}</title>
      <path
        d="M22 54h20M24 54V40c0-3 2-4 2-8s-2-5-2-8a8 8 0 0 1 16 0c0 3-2 4-2 8s2 5 2 8v14"
        stroke="var(--brass)"
      />
      <path d="M12 18c10 2 26 14 40 12M12 30c14-2 28-14 40-12M12 18c-4 6-4 12 0 12" />
    </svg>
  );
}

/** The signature line: from the ship to the bollard. */
export function HawserLine(p: P) {
  return (
    <svg
      viewBox="0 0 800 160"
      fill="none"
      {...base(p.title, "A mooring line running from a ship to a bollard", p)}
    >
      <title>{p.title ?? "A mooring line running from a ship to a bollard"}</title>
      <path
        className="hawser-path"
        d="M20 30 C 180 120, 300 10, 420 80 S 640 130, 760 100"
        stroke="var(--brass)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="768" cy="100" r="6" fill="var(--ink)" />
    </svg>
  );
}

export function ShipSilhouette(p: P) {
  return (
    <svg
      viewBox="0 0 900 300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinejoin="round"
      {...base(p.title, "Bulk carrier line drawing", p)}
    >
      <title>{p.title ?? "Bulk carrier line drawing"}</title>
      <path d="M40 220h790l-60 50H110z" />
      <path d="M110 220v-24h620v24" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${160 + i * 110} 196v-22h80v22M${160 + i * 110} 174h80`} />
      ))}
      <path d="M730 196v-60h70v60M740 136v-34h50v34M752 102V70h26v32" />
      <path d="M40 220c-10-6-14-14-14-22" />
      <path
        d="M0 282c60 8 120-8 180 0s120 8 180 0 120-8 180 0 120 8 180 0 120-8 180 0"
        stroke="var(--brass)"
      />
    </svg>
  );
}

export function LaytimeDial({
  used = 0.7,
  demurrage = 0.25,
  ...p
}: P & { used?: number; demurrage?: number }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  return (
    <svg
      viewBox="0 0 140 140"
      fill="none"
      {...base(p.title, `Laytime dial: ${Math.round(used * 100)} percent used`, p)}
    >
      <title>{p.title ?? `Laytime dial: ${Math.round(used * 100)} percent used`}</title>
      <circle cx="70" cy="70" r={R} stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <circle
        cx="70"
        cy="70"
        r={R}
        stroke="var(--brass)"
        strokeWidth="6"
        strokeDasharray={`${C * used} ${C}`}
        transform="rotate(-90 70 70)"
        strokeLinecap="butt"
      />
      <circle
        cx="70"
        cy="70"
        r={R}
        stroke="var(--signal)"
        strokeWidth="6"
        strokeDasharray={`${C * demurrage} ${C}`}
        strokeDashoffset={-C * used}
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="76" textAnchor="middle" fontFamily="var(--mono)" fontSize="14" fill="currentColor">
        {Math.round(used * 100)}%
      </text>
    </svg>
  );
}

export function SofCard(p: P) {
  return (
    <svg
      viewBox="0 0 220 280"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      {...base(p.title, "Statement of Facts with three signature stamps", p)}
    >
      <title>{p.title ?? "Statement of Facts with three signature stamps"}</title>
      <rect x="10" y="10" width="200" height="260" rx="6" fill="var(--card)" />
      <path d="M26 36h110M26 52h168" stroke="var(--brass)" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <path
          key={`row-${i}`}
          d={`M26 ${76 + i * 18}h40M80 ${76 + i * 18}h50M144 ${76 + i * 18}h50`}
          opacity="0.6"
        />
      ))}
      {["master", "agent", "charterer"].map((r, i) => (
        <g key={r} transform={`translate(${26 + i * 62} 226) rotate(-4)`}>
          <rect width="54" height="26" rx="5" stroke="var(--ink)" strokeWidth="1.5" />
          <text x="27" y="17" textAnchor="middle" fontFamily="var(--mono)" fontSize="8" fill="currentColor">
            {r}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function SignalFlags(p: P) {
  const flags = ["#ff5b1f", "#0f1c2e", "#f5f0e6", "#22d3e6", "#a8834a", "#0f1c2e", "#ff5b1f"];
  return (
    <svg viewBox="0 0 280 28" {...base(p.title, "A strip of signal flags", p)}>
      <title>{p.title ?? "A strip of signal flags"}</title>
      {flags.map((c, i) => (
        <path key={i + c} d={`M${i * 40 + 4} 4h32v20h-32z`} fill={c} stroke="var(--ink)" strokeWidth="1" />
      ))}
    </svg>
  );
}

export function LockedDoc(p: P) {
  return (
    <svg
      viewBox="0 0 48 56"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...base(p.title, "Document only its own agent can write", p)}
    >
      <title>{p.title ?? "Document only its own agent can write"}</title>
      <path d="M8 4h24l8 8v40H8z" />
      <path d="M14 22h20M14 30h20" opacity="0.6" />
      <rect x="22" y="36" width="18" height="14" rx="2" fill="var(--paper)" stroke="var(--brass)" />
      <path d="M26 36v-4a5 5 0 0 1 10 0v4" stroke="var(--brass)" />
    </svg>
  );
}

export function LeaseKey(p: P) {
  return (
    <svg
      viewBox="0 0 56 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...base(p.title, "Exclusive role lease", p)}
    >
      <title>{p.title ?? "Exclusive role lease"}</title>
      <circle cx="12" cy="16" r="8" stroke="var(--brass)" />
      <path d="M20 16h30M42 16v8M48 16v6" />
    </svg>
  );
}

/** One Switch room, three companies, each document locked to its own agent. */
export function RoomDiagram(p: P) {
  const company = (x: number, name: string, agent: string, doc: string) => (
    <g transform={`translate(${x} 0)`}>
      <rect x="0" y="40" width="200" height="86" rx="12" fill="var(--card)" stroke="var(--brass)" />
      <text
        x="100"
        y="64"
        textAnchor="middle"
        fontFamily="var(--sans)"
        fontWeight="600"
        fontSize="13"
        fill="currentColor"
      >
        {name}
      </text>
      <text x="100" y="84" textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill="currentColor">
        {agent}
      </text>
      <path d="M100 126v34" stroke="currentColor" />
      <g transform="translate(78 160)">
        <rect width="44" height="52" rx="6" fill="var(--card)" stroke="currentColor" />
        <path d="M10 14h24M10 24h24" stroke="currentColor" opacity="0.5" />
        <rect x="14" y="30" width="16" height="14" rx="2" fill="var(--paper)" stroke="var(--brass)" />
        <path d="M18 30v-3a4 4 0 0 1 8 0v3" fill="none" stroke="var(--brass)" />
      </g>
      <text x="100" y="232" textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill="currentColor">
        {doc}
      </text>
      <text x="100" y="248" textAnchor="middle" fontFamily="var(--sans)" fontSize="11" fill="var(--slate)">
        only its own agent can write
      </text>
    </g>
  );
  return (
    <svg
      viewBox="0 0 720 360"
      fill="none"
      {...base(
        p.title,
        "One Switch room shared by three companies, each log locked to its own agent, with the Timekeeper holding an exclusive role",
        p,
      )}
    >
      <title>{p.title ?? "One Switch room shared by three companies"}</title>
      <rect x="4" y="4" width="712" height="352" rx="18" stroke="var(--ink)" strokeDasharray="2 6" />
      <text
        x="20"
        y="26"
        fontFamily="var(--sans)"
        fontWeight="600"
        fontSize="12"
        fill="var(--brass-ink)"
        letterSpacing="2"
      >
        ONE SWITCH ROOM
      </text>
      {company(20, "Shipowner", "ship-mate", "log-vessel")}
      {company(260, "Port agency", "agency-clerk", "log-agency")}
      {company(500, "Charterer", "charter-desk", "log-charterer")}
      <g transform="translate(200 292)">
        <rect width="320" height="52" rx="12" fill="var(--ink)" />
        <text x="160" y="22" textAnchor="middle" fontFamily="var(--mono)" fontSize="12" fill="var(--paper)">
          timekeeper, exclusive role
        </text>
        <text x="160" y="40" textAnchor="middle" fontFamily="var(--sans)" fontSize="11" fill="var(--paper)">
          no model. counts. people sign.
        </text>
      </g>
    </svg>
  );
}

export function BoardingQr(p: P) {
  const cells: React.ReactElement[] = [];
  let s = 7;
  for (let y = 0; y < 9; y++)
    for (let x = 0; x < 9; x++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      if (s % 3 === 0 || (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5))
        cells.push(
          <rect key={`${x}-${y}`} x={x * 6 + 4} y={y * 6 + 4} width="5" height="5" fill="currentColor" />,
        );
    }
  return (
    <svg viewBox="0 0 62 62" {...base(p.title, "Link to the judge walk", p)}>
      <title>{p.title ?? "Link to the judge walk"}</title>
      {cells}
    </svg>
  );
}
