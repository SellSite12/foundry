 
// Local cron worker — calls internal cron endpoints on an interval.
// Usage: node scripts/cron-runner.mjs
// Production: use system cron / Kubernetes CronJob instead.

import { readFile } from "fs/promises";
import path from "path";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const INTERVAL_MS = Number(process.env.CRON_INTERVAL_MS ?? 60_000);

async function loadEnv() {
  try {
    const raw = await readFile(path.join(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)="?([^"\n]+)"?/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}

async function tick() {
  const secret = process.env.CRON_SECRET;
  const headers = {
    ...(secret ? { authorization: `Bearer ${secret}` } : {}),
  };

  for (const endpoint of ["/api/internal/cron/jobs", "/api/internal/cron/abandoned-carts"]) {
    try {
      const res = await fetch(`${BASE}${endpoint}`, { method: "POST", headers });
      const json = await res.json().catch(() => null);
      console.log(`[cron] ${endpoint} → ${res.status}`, json?.data ?? "");
    } catch (error) {
      console.error(`[cron] ${endpoint} failed:`, error.message);
    }
  }
}

await loadEnv();
console.log(`Cron runner started — ${BASE} every ${INTERVAL_MS / 1000}s`);
await tick();
setInterval(tick, INTERVAL_MS);
