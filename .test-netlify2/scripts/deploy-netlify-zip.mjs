/* eslint-disable no-console */
// Zip source and deploy to Netlify (cloud Linux build).
// Usage: node scripts/deploy-netlify-zip.mjs

import { readFile, stat, rm } from "fs/promises";
import { spawn } from "child_process";
import path from "path";
import os from "os";

const SITE_ID = "364782a9-b1d0-4ba6-ad85-f2bfcd86575d";
const PS1 = path.join(process.cwd(), "scripts", "create-deploy-zip.ps1");

async function getNetlifyToken() {
  const configPath = path.join(os.homedir(), "AppData", "Roaming", "netlify", "Config", "config.json");
  const raw = await readFile(configPath, "utf8");
  const config = JSON.parse(raw);
  const entry = Object.values(config.users ?? {})[0];
  const token = entry?.auth?.token;
  if (!token) throw new Error("Netlify CLI not logged in. Run: netlify login");
  return token;
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "inherit"] });
    let out = "";
    child.stdout?.on("data", (d) => { out += d.toString(); });
    child.on("close", (code) => {
      if (code === 0) resolve(out.trim());
      else reject(new Error(`${cmd} failed (${code})`));
    });
  });
}

console.log("\n=== Netlify zip deploy (cloud build) ===\n");

console.log("Creating zip...");
const zipPath = await run("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", PS1]);
const { size } = await stat(zipPath);
console.log(`Zip ready: ${(size / 1024 / 1024).toFixed(1)} MB (${zipPath})`);

const token = await getNetlifyToken();
const zipBytes = await readFile(zipPath);
const res = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}/deploys`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/zip",
  },
  body: zipBytes,
});

const json = await res.json().catch(() => ({}));
await rm(zipPath, { force: true }).catch(() => {});

if (!res.ok) {
  console.error("Deploy failed:", res.status, JSON.stringify(json, null, 2));
  process.exit(1);
}

console.log("\nDeploy uploaded to Netlify.");
console.log(`Deploy ID: ${json.id}`);
console.log(`Admin: https://app.netlify.com/sites/hilarious-platypus-d57cfb/deploys/${json.id}`);
console.log(`Poll: node scripts/wait-netlify-deploy.mjs ${json.id}\n`);
