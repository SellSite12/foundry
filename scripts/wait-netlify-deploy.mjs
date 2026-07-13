 
import { readFile } from "fs/promises";
import path from "path";
import os from "os";

const deployId = process.argv[2];
if (!deployId) {
  console.error("Usage: node scripts/wait-netlify-deploy.mjs <deployId>");
  process.exit(1);
}

async function getNetlifyToken() {
  const configPath = path.join(os.homedir(), "AppData", "Roaming", "netlify", "Config", "config.json");
  const raw = await readFile(configPath, "utf8");
  return Object.values(JSON.parse(raw).users ?? {})[0]?.auth?.token;
}

const token = await getNetlifyToken();
const start = Date.now();

while (Date.now() - start < 600000) {
  const res = await fetch(`https://api.netlify.com/api/v1/deploys/${deployId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const d = await res.json();
  const state = d.state;
  console.log(`[${new Date().toLocaleTimeString()}] state=${state} ${d.error_message ?? ""}`);
  if (state === "ready") {
    console.log(`\nLive: ${d.ssl_url ?? d.deploy_ssl_url}`);
    process.exit(0);
  }
  if (state === "error") {
    console.error("\nDeploy failed:", d.error_message);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 15000));
}

console.error("Timed out waiting for deploy");
process.exit(1);
