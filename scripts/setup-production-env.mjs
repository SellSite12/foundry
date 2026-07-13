 
// Generates production secrets and writes/updates .env
// Usage: node scripts/setup-production-env.mjs

import { readFile, writeFile } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";

const ENV_PATH = path.join(process.cwd(), ".env");

function secret() {
  return randomBytes(32).toString("hex");
}

const REQUIRED = {
  INTERNAL_SECRET: secret(),
  CRON_SECRET: secret(),
  INTEGRATION_ENCRYPTION_KEY: secret(),
  METRICS_SECRET: secret(),
  APP_VERSION: "1.0.0",
  NODE_ENV: "development",
};

let existing = "";
try {
  existing = await readFile(ENV_PATH, "utf8");
} catch {
  existing = await readFile(path.join(process.cwd(), ".env.example"), "utf8");
}

const lines = existing.split("\n");
const keys = new Set(Object.keys(REQUIRED));
const out = [];

for (const line of lines) {
  const match = line.match(/^([A-Z_]+)=/);
  if (match && keys.has(match[1])) {
    out.push(`${match[1]}="${REQUIRED[match[1]]}"`);
    keys.delete(match[1]);
  } else {
    out.push(line);
  }
}

for (const [k, v] of Object.entries(REQUIRED)) {
  if (keys.has(k)) out.push(`${k}="${v}"`);
}

await writeFile(ENV_PATH, out.filter((l, i, a) => i < a.length - 1 || l.trim()).join("\n") + "\n");
console.log("Updated .env with production secrets (INTERNAL_SECRET, CRON_SECRET, etc.)");
console.log("APP_VERSION set to 1.0.0");
