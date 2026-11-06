#!/usr/bin/env node
// Builds scripts/competitors.hashes from reference/competitors.txt so CI can reject
// competitor names without any name being committed.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "reference", "competitors.txt");
const out = join(root, "scripts", "competitors.hashes");

export const sha = (s) => createHash("sha256").update(s).digest("hex");
export const tokens = (s) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

if (!existsSync(src)) {
  console.error("reference/competitors.txt not found; nothing written");
  process.exit(1);
}
const lines = readFileSync(src, "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));
const hashes = new Set();
for (const line of lines) {
  if (line.startsWith("~")) {
    hashes.add(`s:${sha(`s:${line.slice(1)}`)}`);
  } else {
    hashes.add(`c:${sha(`c:${tokens(line).join(" ")}`)}`);
  }
}
writeFileSync(out, `${[...hashes].sort().join("\n")}\n`);
console.log(`wrote ${hashes.size} hashes to scripts/competitors.hashes`);
