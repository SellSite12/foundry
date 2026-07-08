/* eslint-disable no-console */
// Writes netlify-env.import for Netlify UI → Import from .env
// Usage: npm run export:netlify-env

import { readFile, writeFile } from "fs/promises";
import path from "path";

const KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "APP_URL",
  "APP_VERSION",
  "INTERNAL_SECRET",
  "CRON_SECRET",
  "INTEGRATION_ENCRYPTION_KEY",
  "METRICS_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "SUPPORT_EMAIL",
];

const OUT = path.join(process.cwd(), "netlify-env.import");

const vars = {};
try {
  const raw = await readFile(path.join(process.cwd(), ".env"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_]+)="([^"]*)"/);
    if (m) vars[m[1]] = m[2];
  }
} catch {
  console.error("No .env file found.");
  process.exit(1);
}

vars.NODE_ENV = "production";
if (!vars.APP_URL?.includes("netlify.app")) {
  console.warn("Warning: APP_URL should be your Netlify URL (https://....netlify.app)");
}

const lines = [];
for (const key of KEYS) {
  const value = vars[key];
  if (value) lines.push(`${key}=${value}`);
}
lines.push("NODE_ENV=production");

await writeFile(OUT, lines.join("\n") + "\n");

console.log(`\nWrote ${OUT}`);
console.log("\nNext steps:");
console.log("  1. Netlify → Site configuration → Environment variables");
console.log("  2. Click \"Import from .env\"");
console.log("  3. Upload the file: netlify-env.import");
console.log("  4. Deploy site\n");
console.log("(netlify-env.import is gitignored — do not commit it)\n");
