 
// Full launch verification: all phase tests + launch report.
// Usage: node scripts/run-launch.mjs  (server must be running)

import { spawn } from "child_process";
import path from "path";

const BASE = process.env.APP_URL ?? "http://localhost:3000";

const suites = [
  "phase2-test.mjs",
  "phase3-test.mjs",
  "phase4-test.mjs",
  "phase5-test.mjs",
  "phase6-test.mjs",
];

async function waitForHealth(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) {
        console.log(`Server healthy at ${BASE}\n`);
        return true;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.error(`Server not reachable at ${BASE}/api/health`);
  return false;
}

function run(script) {
  return new Promise((resolve) => {
    const p = spawn("node", [path.join("scripts", script)], {
      stdio: "inherit",
      env: { ...process.env, APP_URL: BASE },
      shell: true,
    });
    p.on("close", (code) => resolve(code ?? 1));
  });
}

console.log(`\n=== FOUNDRY FULL LAUNCH VERIFICATION ===\n`);
console.log(`Target: ${BASE}\n`);

if (!(await waitForHealth())) process.exit(1);

let failures = 0;
for (const suite of suites) {
  console.log(`\n--- ${suite} ---\n`);
  const code = await run(suite);
  if (code !== 0) failures++;
}

console.log(`\n--- launch-report.mjs ---\n`);
await run("launch-report.mjs");

console.log(`\n=== DONE: ${failures} suite(s) failed ===\n`);
process.exit(failures > 0 ? 1 : 0);
