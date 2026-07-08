/* eslint-disable no-console */
// Prisma generate + migrate for Netlify/Neon.
// Build succeeds without DATABASE_URL (generate only). Migrations run when URL is present.

import { readFile, writeFile } from "fs/promises";
import { spawn } from "child_process";
import path from "path";

const PLACEHOLDER =
  "postgresql://build:build@127.0.0.1:5432/build?schema=public";

async function loadEnvFile() {
  try {
    const raw = await readFile(path.join(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)="?([^"\n]+)"?/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}

function resolveDatabaseUrl() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.NETLIFY_DATABASE_URL?.trim() ||
    process.env.NETLIFY_DB_URL?.trim() ||
    null
  );
}

function setupPrismaEnv() {
  const url = resolveDatabaseUrl();
  if (!url) {
    console.warn("\n⚠️  No DATABASE_URL / NETLIFY_DATABASE_URL at build time.");
    console.warn("   → prisma generate will run (placeholder URL)");
    console.warn("   → migrations SKIPPED");
    console.warn("   → Add DATABASE_URL in Netlify env vars for a working site!\n");
    process.env.DATABASE_URL = PLACEHOLDER;
    process.env.DIRECT_URL = PLACEHOLDER;
    return false;
  }

  if (!process.env.DATABASE_URL?.trim()) {
    const source = process.env.NETLIFY_DATABASE_URL
      ? "NETLIFY_DATABASE_URL"
      : process.env.NETLIFY_DB_URL
        ? "NETLIFY_DB_URL"
        : "DATABASE_URL";
    process.env.DATABASE_URL = url;
    console.log(`Using ${source} for Prisma`);
  }

  if (!process.env.DIRECT_URL?.trim()) {
    process.env.DIRECT_URL = url.includes("-pooler") ? url.replace("-pooler", "") : url;
  }
  return true;
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

await loadEnvFile();
const canMigrate = setupPrismaEnv();

await run("npx", ["prisma", "generate"]);

if (canMigrate) {
  try {
    await run("npx", ["prisma", "migrate", "deploy"]);
    console.log("Prisma ready (migrations applied).");
  } catch (err) {
    console.warn("⚠️  prisma migrate deploy failed (continuing if DB already migrated):", err.message);
  }
} else {
  console.log("Prisma client generated (migrations skipped — no DB URL).");
}
