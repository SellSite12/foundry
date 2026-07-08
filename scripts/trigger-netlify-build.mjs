/* eslint-disable no-console */
// Triggers a Netlify cloud build via the REST API (no local symlink step).
// Usage: node scripts/trigger-netlify-build.mjs

import { readFile } from "fs/promises";
import path from "path";
import os from "os";

const SITE_ID = "364782a9-b1d0-4ba6-ad85-f2bfcd86575d";

async function getNetlifyToken() {
  const configPath = path.join(os.homedir(), "AppData", "Roaming", "netlify", "Config", "config.json");
  const raw = await readFile(configPath, "utf8");
  const config = JSON.parse(raw);
  const entry = Object.values(config.users ?? {})[0];
  const token = entry?.auth?.token;
  if (!token) throw new Error("Netlify CLI not logged in. Run: netlify login");
  return token;
}

const token = await getNetlifyToken();
const res = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}/builds`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ clear_cache: true }),
});

const text = await res.text();
if (!res.ok) {
  console.error("Build trigger failed:", res.status, text);
  process.exit(1);
}

console.log("Triggered Netlify cloud build:");
console.log(text);
