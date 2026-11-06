import { resolve } from "node:path";
import { Timekeeper } from "./service";

const need = (k: string): string => {
  const v = process.env[k];
  if (!v) throw new Error(`missing required environment variable ${k}`);
  return v;
};

const which = (process.env.HAWSER_TIMEKEEPER_ID ?? "a").toLowerCase();
if (which !== "a" && which !== "b") throw new Error("HAWSER_TIMEKEEPER_ID must be a or b");
const U = which.toUpperCase();

const log = (msg: string, extra?: unknown) =>
  console.log(
    `${new Date().toISOString()} [timekeeper-${which}] ${msg}${extra === undefined ? "" : ` ${JSON.stringify(extra)}`}`,
  );

const tk = new Timekeeper({
  switchUrl: need("SWITCH_URL"),
  agentName: `timekeeper-${which}`,
  agentId: need(`TIMEKEEPER_${U}_AGENT_ID`),
  apiKey: need(`TIMEKEEPER_${U}_API_KEY`),
  deskRoomId: need("HAWSER_DESK_ROOM_ID"),
  ...(process.env.HAWSER_BRIDGE_ROOM_ID ? { bridgeRoomId: process.env.HAWSER_BRIDGE_ROOM_ID } : {}),
  dataDir: resolve(process.env.HAWSER_DATA_DIR ?? ".data"),
  configPath: resolve(process.env.HAWSER_CALL_CONFIG ?? "fixtures/call-config.json"),
  pollMs: Number(process.env.HAWSER_POLL_MS ?? 20_000),
  clockMs: Number(process.env.HAWSER_CLOCK_MS ?? 60_000),
  provenance: {
    mode: (process.env.HAWSER_PROVENANCE_MODE as "live" | "recorded" | "simulated" | undefined) ?? "live",
    label: process.env.HAWSER_PROVENANCE_LABEL ?? "live Switch server",
  },
  version: process.env.HAWSER_SWITCH_VERSION ?? "unknown",
  log,
});

process.on("SIGTERM", () => {
  log("SIGTERM, stopping");
  tk.stop();
  process.exit(0);
});
process.on("SIGINT", () => {
  tk.stop();
  process.exit(0);
});
process.on("uncaughtException", (e) => {
  log("uncaught exception", String(e));
  process.exit(1);
});

log("starting");
await tk.start();
