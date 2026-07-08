/* eslint-disable no-console */
// Link Netlify site to GitHub repo and trigger cloud build.
// Usage: node scripts/trigger-netlify-build.mjs [owner/repo] [branch]

import { readFile } from "fs/promises";
import path from "path";
import os from "os";

const SITE_ID = "364782a9-b1d0-4ba6-ad85-f2bfcd86575d";
const repo = process.argv[2] ?? "vincentvalerio71/foundry";
const branch = process.argv[3] ?? "master";

async function getNetlifyToken() {
  const configPath = path.join(os.homedir(), "AppData", "Roaming", "netlify", "Config", "config.json");
  const raw = await readFile(configPath, "utf8");
  const entry = Object.values(JSON.parse(raw).users ?? {})[0];
  const token = entry?.auth?.token;
  if (!token) throw new Error("Netlify CLI not logged in");
  return token;
}

const token = await getNetlifyToken();
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

// Update site build settings + repo link (requires GitHub connected to Netlify account)
const patchRes = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({
    build_settings: {
      cmd: "npm run build:netlify",
      dir: "",
      provider: "github",
      repo_path: repo,
      repo_branch: branch,
      repo_type: "git",
      public_repo: true,
    },
  }),
});

const patch = await patchRes.json().catch(() => ({}));
console.log("PATCH site:", patchRes.status, patch.message ?? patch.name ?? "");

const buildRes = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}/builds`, {
  method: "POST",
  headers,
  body: JSON.stringify({ clear_cache: true }),
});

const build = await buildRes.json().catch(() => ({}));
if (!buildRes.ok) {
  console.error("Build trigger failed:", buildRes.status, JSON.stringify(build, null, 2));
  process.exit(1);
}

console.log("Build triggered:", build.id);
console.log(`https://app.netlify.com/sites/hilarious-platypus-d57cfb/deploys/${build.deploy_id ?? build.id}`);
