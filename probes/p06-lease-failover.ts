import { HttpError } from "@hawser/switch-client";
import { Bot, freshRoom, loadWorld, median, sleep, writeResult } from "./lib";

/** Raw measurement: how long after the holder dies does the standby's assume_role succeed. No Timekeeper involved. */
const w = await freshRoom(loadWorld(), "p06");
const room = (w.rooms.desk as { id: string }).id;
const a = await new Bot(w, "timekeeper-a", room).connect();
const b = await new Bot(w, "timekeeper-b", room).connect();
await a.api.op("define_role", { name: "timekeeper", instructions: "hold the clock", exclusive: true });
const seconds: number[] = [];
const trials: unknown[] = [];
let holder = a;
let standby = b;
for (let i = 1; i <= 5; i++) {
  await holder.api.op("assume_role", { role: "timekeeper" });
  let renewing = true;
  const renew = (async () => {
    while (renewing) {
      try {
        await holder.api.renewLease();
      } catch {
        /* the holder is about to be killed */
      }
      await sleep(2000);
    }
  })();
  await sleep(2500);
  let got = 0;
  const t0 = Date.now();
  const poll = (async () => {
    while (!got) {
      try {
        await standby.api.op("assume_role", { role: "timekeeper" });
        got = Date.now();
      } catch (e) {
        if (!(e instanceof HttpError)) throw e;
        await sleep(250);
      }
    }
  })();
  renewing = false;
  await renew;
  holder.socket?.terminate();
  const killedAt = Date.now();
  await Promise.race([poll, sleep(40_000)]);
  const dt = got ? (got - killedAt) / 1000 : -1;
  trials.push({ trial: i, failoverSeconds: dt, pollIntervalMs: 250, killToFirstAttemptMs: killedAt - t0 });
  seconds.push(dt);
  // swap roles: reconnect the dead one as the new standby
  await standby.api.op("release_role").catch(() => undefined);
  const dead = holder;
  const fresh = await new Bot(w, dead.name, room).connect();
  holder = standby;
  standby = fresh;
  await sleep(1500);
}
holder.close();
standby.close();
const ok = seconds.filter((s) => s >= 0);
await writeResult(w, {
  id: "p06",
  question: "Kill timekeeper-a while holding timekeeper. Seconds until assume_role succeeds for B?",
  status: "observed",
  summary: `Median ${median(ok).toFixed(1)} s over ${ok.length} trials (min ${Math.min(...ok).toFixed(1)}, max ${Math.max(...ok).toFixed(1)}). The holder renewed every 2 s; the server's lease TTL is 6 s (room_role_store.LEASE_TTL), so the floor is about 6 s minus the time since the last renewal. The standby polled every 250 ms.`,
  observed: { trials, medianSeconds: median(ok), leaseTtlSecondsFromSource: 6 },
});
