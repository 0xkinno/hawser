import { verifyBundle } from "@hawser/laytime";
import { NextResponse } from "next/server";
import { bundles, facts } from "../../../lib/data";

export const dynamic = "force-static";

/** The headline, recomputed from the bundles on request, next to the generated facts. */
export function GET() {
  const runs = bundles().map(({ id, bundle: b }) => {
    const v = verifyBundle(b);
    return {
      id,
      mode: b.provenance.mode,
      ok: v.ok,
      checks: v.checks.length,
      finalDigest: b.finalDigest,
      signatures: b.signatures.length,
      demurrageCents: b.engine.demurrageCents,
    };
  });
  const f = facts();
  return NextResponse.json({
    runs,
    allVerified: runs.every((r) => r.ok),
    facts: {
      engine_external_match: f.engine_external_match,
      break_cases_passed: f.break_cases_passed,
      break_cases_run: f.break_cases_run,
      lease_failover_seconds: f.lease_failover_seconds,
      silent_rewrite_detect_seconds: f.silent_rewrite_detect_seconds,
      run_date: f.run_date,
      switch_core_version: f.switch_core_version,
    },
  });
}
