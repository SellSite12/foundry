/* eslint-disable no-console */
// One-shot: import Netlify env vars, link site, trigger production deploy.
// Requires: netlify CLI logged in (`netlify login`)
// Usage: node scripts/complete-launch.mjs

import { readFile } from "fs/promises";
import { spawn } from "child_process";
import path from "path";

const SITE = "hilarious-platypus-d57cfb";
const ENV_FILE = path.join(process.cwd(), "netlify-env.import");

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: true, ...opts });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function ensureEnvFile() {
  try {
    await readFile(ENV_FILE, "utf8");
  } catch {
    console.log("Generating netlify-env.import...");
    await run("npm", ["run", "export:netlify-env"]);
  }
}

console.log("\n=== Foundry launch: Netlify env + deploy ===\n");

await ensureEnvFile();

console.log(`Linking site ${SITE}...`);
await run("netlify", ["link", "--name", SITE]);

console.log("Importing environment variables...");
await run("netlify", ["env:import", ENV_FILE]);

console.log("Triggering production deploy...");
await run("netlify", ["deploy", "--build", "--prod"]);

console.log("\nDone. Check:");
console.log(`  https://${SITE}.netlify.app/api/health`);
console.log(`  https://${SITE}.netlify.app/signup\n`);
