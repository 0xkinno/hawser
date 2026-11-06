/** pnpm verify runs/<bundle>.json : recompute every digest, fingerprint and the laytime result offline. No keys, no network. */
import { readFileSync } from "node:fs";
import { type RunBundle, verifyBundle } from "@hawser/laytime";

const file = process.argv[2];
if (!file) {
  console.error("usage: pnpm verify runs/<bundle>.json");
  process.exit(2);
}
const bundle = JSON.parse(readFileSync(file, "utf8")) as RunBundle;
const r = verifyBundle(bundle);
console.log(
  `${bundle.callId}  (${bundle.provenance.mode}: ${bundle.provenance.label}, switch-core ${bundle.provenance.switchVersion})`,
);
for (const c of r.checks) console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}  ${c.ok ? "" : c.detail}`);
console.log(
  r.ok
    ? `VERIFIED: ${r.checks.length} checks, final digest ${bundle.finalDigest}`
    : `MISMATCH: ${r.firstMismatch}`,
);
process.exit(r.ok ? 0 : 1);
