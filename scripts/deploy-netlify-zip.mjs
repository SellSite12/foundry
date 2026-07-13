 
// Trigger a production Netlify build from the linked Git repo (runs netlify-build.mjs on Netlify).
// Usage: node scripts/deploy-netlify-zip.mjs
//
// Note: POST /deploys with a zip uploads static files only — it does NOT run the build command.
// Always use the builds API so @netlify/plugin-nextjs can compile Next.js.

import { readFile } from "fs/promises";
import path from "path";
import os from "os";

const SITE_ID = "364782a9-b1d0-4ba6-ad85-f2bfcd86575d";
const BUILD_CMD = "node scripts/netlify-build.mjs";

async function getNetlifyToken() {
  const configPath = path.join(os.homedir(), "AppData", "Roaming", "netlify", "Config", "config.json");
  const raw = await readFile(configPath, "utf8");
  const config = JSON.parse(raw);
  const entry = Object.values(config.users ?? {})[0];
  const token = entry?.auth?.token;
  if (!token) throw new Error("Netlify CLI not logged in. Run: netlify login");
  return token;
}

console.log("\n=== Netlify production build (from Git) ===\n");

const token = await getNetlifyToken();
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

const patch = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ build_settings: { cmd: BUILD_CMD, dir: "" } }),
});
if (!patch.ok) {
  console.warn("Could not update build command:", patch.status);
} else {
  console.log("Build command:", BUILD_CMD);
}

const build = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}/builds`, {
  method: "POST",
  headers,
  body: JSON.stringify({ clear_cache: true }),
}).then((r) => r.json());

if (!build.deploy_id) {
  console.error("Build trigger failed:", JSON.stringify(build, null, 2));
  process.exit(1);
}

console.log("\nBuild triggered on Netlify.");
console.log(`Deploy ID: ${build.deploy_id}`);
console.log(`Admin: https://app.netlify.com/sites/hilarious-platypus-d57cfb/deploys/${build.deploy_id}`);
console.log(`Poll: node scripts/wait-netlify-deploy.mjs ${build.deploy_id}\n`);
