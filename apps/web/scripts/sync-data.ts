/**
 * Copies the evidence the site shows from the repository root into apps/web/data, so the Vercel build needs nothing
 * outside the app folder. `--check` fails when the copies are stale.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, "..");
const root = resolve(app, "../..");
const check = process.argv.includes("--check");

const plan: Array<{ from: string; to: string }> = [];
const add = (from: string, to: string) => plan.push({ from, to });

add(join(root, "docs/FACTS.json"), join(app, "data/facts.json"));
for (const f of existsSync(join(root, "runs")) ? readdirSync(join(root, "runs")) : []) {
  if (f.endsWith(".json")) add(join(root, "runs", f), join(app, "data/runs", f));
  if (f.endsWith(".pdf")) add(join(root, "runs", f), join(app, "public/data/runs", f));
}
const latest = new Map<string, string>();
for (const f of existsSync(join(root, "probes/results")) ? readdirSync(join(root, "probes/results")) : []) {
  if (!f.endsWith(".json") || f.endsWith(".local.json")) continue;
  const id = f.split("-")[0] as string;
  if (!latest.has(id) || f > (latest.get(id) as string)) latest.set(id, f);
}
for (const f of latest.values()) add(join(root, "probes/results", f), join(app, "data/probes", f));

let stale = 0;
if (!check) {
  for (const d of ["data/runs", "data/probes", "public/data/runs"]) {
    rmSync(join(app, d), { recursive: true, force: true });
    mkdirSync(join(app, d), { recursive: true });
  }
}
for (const p of plan) {
  if (check) {
    if (!existsSync(p.to) || !readFileSync(p.to).equals(readFileSync(p.from))) {
      console.error(`stale: ${p.to}`);
      stale++;
    }
  } else {
    mkdirSync(dirname(p.to), { recursive: true });
    copyFileSync(p.from, p.to);
  }
}
if (check && stale) process.exit(1);
console.log(`${check ? "checked" : "synced"} ${plan.length} files`);
