 
// Prints Netlify launch checklist and validates local .env.
// Usage: node scripts/setup-netlify.mjs

import { readFile } from "fs/promises";
import path from "path";

const ENV_PATH = path.join(process.cwd(), ".env");

const REQUIRED = [
  "APP_URL",
  "INTERNAL_SECRET",
  "CRON_SECRET",
  "INTEGRATION_ENCRYPTION_KEY",
  "METRICS_SECRET",
];

// Database: DATABASE_URL or Netlify Neon extension (NETLIFY_DATABASE_URL)

const EMAIL_ONE_OF = ["RESEND_API_KEY", "SMTP_HOST"];

async function loadEnv() {
  const vars = {};
  try {
    const raw = await readFile(ENV_PATH, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)="?([^"\n]*)"?/);
      if (m && m[2]) vars[m[1]] = m[2];
    }
  } catch {}
  return vars;
}

const env = await loadEnv();

console.log("\n=== FOUNDRY NETLIFY LAUNCH CHECKLIST ===\n");

let missing = 0;
for (const key of REQUIRED) {
  const ok = Boolean(env[key]);
  console.log(`  ${ok ? "✓" : "✗"} ${key}`);
  if (!ok) missing++;
}

const hasDb = Boolean(env.DATABASE_URL || env.NETLIFY_DATABASE_URL || env.NETLIFY_DB_URL);
console.log(`  ${hasDb ? "✓" : "✗"} DATABASE_URL or NETLIFY_DATABASE_URL (Neon extension)`);
if (!hasDb) missing++;

const hasEmail = EMAIL_ONE_OF.some((k) => env[k]);
console.log(`  ${hasEmail ? "✓" : "✗"} RESEND_API_KEY or SMTP_* (transactional email)`);
if (!hasEmail) missing++;

console.log(`\n  Auto-set by netlify.toml: UPLOAD_STORE=blobs, NODE_ENV=production`);
console.log(`  Auto-derived at build: DIRECT_URL from DATABASE_URL (if omitted)`);
console.log(`  Auto-set by Netlify: URL (use as APP_URL if unset)\n`);

if (missing === 0) {
  console.log("Local .env looks complete. Copy these vars to Netlify → Environment variables.\n");
} else {
  console.log(`${missing} item(s) missing locally. Fill .env before copying to Netlify.\n`);
}

console.log("Netlify build command: npm run build:netlify");
console.log("Scheduled functions: cron-jobs (every minute), cron-abandoned-carts (hourly)");
console.log("Uploads: Netlify Blobs (foundry-uploads store)\n");

console.log("After first deploy, verify:");
console.log("  GET https://YOUR-SITE.netlify.app/api/health");
console.log("  GET https://YOUR-SITE.netlify.app/api/ready\n");

process.exit(missing > 0 ? 1 : 0);
