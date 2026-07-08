/* eslint-disable no-console */
// Fix Netlify build cmd and trigger production deploy.
import { readFile } from "fs/promises";
import path from "path";
import os from "os";

const SITE = "364782a9-b1d0-4ba6-ad85-f2bfcd86575d";
const CMD = "node scripts/netlify-build.mjs";

const token = Object.values(
  JSON.parse(await readFile(path.join(os.homedir(), "AppData/Roaming/netlify/Config/config.json"), "utf8")).users ?? {}
)[0]?.auth?.token;

const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

const patch = await fetch(`https://api.netlify.com/api/v1/sites/${SITE}`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ build_settings: { cmd: CMD, dir: "" } }),
  signal: AbortSignal.timeout(60000),
});
console.log("Set build cmd:", patch.status, CMD);

const build = await fetch(`https://api.netlify.com/api/v1/sites/${SITE}/builds`, {
  method: "POST",
  headers,
  body: JSON.stringify({ clear_cache: true }),
}).then((r) => r.json());

if (!build.deploy_id) {
  console.error("Build trigger failed:", build);
  process.exit(1);
}

console.log("Deploy:", build.deploy_id);
console.log(`https://app.netlify.com/sites/hilarious-platypus-d57cfb/deploys/${build.deploy_id}`);

// Poll
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 15000));
  const d = await fetch(`https://api.netlify.com/api/v1/deploys/${build.deploy_id}`, { headers }).then((r) => r.json());
  console.log(`[${new Date().toLocaleTimeString()}] ${d.state} ${d.error_message ?? ""}`);
  if (d.state === "ready") {
    const health = await fetch("https://hilarious-platypus-d57cfb.netlify.app/api/health");
    console.log("Health:", health.status, await health.text());
    process.exit(health.ok ? 0 : 1);
  }
  if (d.state === "error") process.exit(1);
}
console.error("Timed out");
process.exit(2);
