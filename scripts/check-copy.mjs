#!/usr/bin/env node
// House style gate: no emoji, no em or en dashes, no hype words, no competitor names,
// no AI attribution strings. Competitor names are matched through hashes only.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sha = (s) => createHash("sha256").update(s).digest("hex");

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "coverage",
  "reference",
  ".github",
  ".githooks",
  ".data",
  "playwright-report",
  "test-results",
]);
const SKIP_FILES = new Set([
  "scripts/check-copy.mjs",
  "scripts/hash-competitors.mjs",
  "scripts/competitors.hashes",
  "pnpm-lock.yaml",
  "LICENSE",
  ".claude/settings.json",
]);
const SKIP_PREFIXES = ["scripts/test/", "probes/results/", "runs/"];
const EXTS = new Set([
  ".md",
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".yaml",
  ".yml",
  ".txt",
  ".css",
  ".html",
  ".svg",
  ".sh",
]);

const BANNED_WORDS = [
  "revolutionary",
  "seamless",
  "seamlessly",
  "cutting-edge",
  "world-class",
  "game-changing",
  "paradigm",
  "military-grade",
];
const BANNED_STRINGS = ["Co-Authored-By", "Co-authored-by", "Generated with", "Claude-Session"];
const EMOJI = /\p{Extended_Pictographic}/u;
const IGNORE_MARK = "check-copy:ignore";

export function loadHashes(file = join(root, "scripts", "competitors.hashes")) {
  if (!existsSync(file)) return new Set();
  return new Set(
    readFileSync(file, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
  );
}

const lc = (s) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

export function checkText(text, hashes) {
  const problems = [];
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    if (line.includes(IGNORE_MARK)) return;
    const n = i + 1;
    if (EMOJI.test(line)) problems.push({ line: n, msg: "emoji" });
    if (line.includes("\u2014")) problems.push({ line: n, msg: "em dash" });
    if (line.includes("\u2013")) problems.push({ line: n, msg: "en dash" });
    for (const w of BANNED_WORDS) {
      if (new RegExp(`(^|[^a-z])${w}([^a-z]|$)`, "i").test(line))
        problems.push({ line: n, msg: `banned word: ${w}` });
    }
    for (const s of BANNED_STRINGS)
      if (line.includes(s)) problems.push({ line: n, msg: `banned string: ${s}` });
    if (hashes.size > 0) {
      const toks = lc(line);
      for (let a = 0; a < toks.length; a++) {
        for (let len = 1; len <= 4 && a + len <= toks.length; len++) {
          if (hashes.has(`c:${sha(`c:${toks.slice(a, a + len).join(" ")}`)}`)) {
            problems.push({ line: n, msg: "competitor name (hashed match)" });
          }
        }
      }
      for (const raw of line.match(/[A-Za-z0-9]+/g) ?? []) {
        if (hashes.has(`s:${sha(`s:${raw}`)}`))
          problems.push({ line: n, msg: "competitor name (hashed match)" });
      }
    }
  });
  return problems;
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else yield p;
  }
}

export function run() {
  const hashes = loadHashes();
  let failed = 0;
  let files = 0;
  for (const p of walk(root)) {
    const rel = relative(root, p).split("\\").join("/");
    if (SKIP_FILES.has(rel) || SKIP_PREFIXES.some((x) => rel.startsWith(x))) continue;
    if (!EXTS.has(extname(rel))) continue;
    files++;
    for (const pr of checkText(readFileSync(p, "utf8"), hashes)) {
      console.error(`${rel}:${pr.line}: ${pr.msg}`);
      failed++;
    }
  }
  if (hashes.size === 0)
    console.error("warning: scripts/competitors.hashes missing or empty, competitor check skipped");
  if (failed) {
    console.error(`check-copy: ${failed} problem(s) in ${files} files`);
    process.exit(1);
  }
  console.log(`check-copy: ${files} files clean (${hashes.size} competitor hashes loaded)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) run();
