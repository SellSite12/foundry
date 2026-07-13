 
// Connect Foundry to Neon Postgres and apply migrations.
//
// 1. Create a project at https://console.neon.tech
// 2. Copy both connection strings (pooled + direct) from Connect
// 3. Add to .env:
//      DATABASE_URL="postgresql://...@ep-xxx-pooler....neon.tech/neondb?sslmode=require"
//      DIRECT_URL="postgresql://...@ep-xxx....neon.tech/neondb?sslmode=require"
// 4. Run: npm run setup:neon

import { readFile, writeFile } from "fs/promises";
import { spawn } from "child_process";
import path from "path";

const ENV_PATH = path.join(process.cwd(), ".env");

async function loadEnvFile() {
  try {
    const raw = await readFile(ENV_PATH, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)="?([^"\n]+)"?/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    console.error("No .env file found. Copy .env.example to .env first.");
    process.exit(1);
  }
}

function requireNeonUrl(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name} in .env`);
    process.exit(1);
  }
  if (!value.startsWith("postgresql://") && !value.startsWith("postgres://")) {
    console.error(`${name} must be a PostgreSQL connection string`);
    process.exit(1);
  }
  if (!value.includes("neon.tech")) {
    console.warn(`Warning: ${name} does not look like a Neon URL`);
  }
  return value;
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

async function upsertEnv(keys) {
  let lines = [];
  try {
    lines = (await readFile(ENV_PATH, "utf8")).split("\n");
  } catch {}

  const present = new Set();
  const out = lines.map((line) => {
    const m = line.match(/^([A-Z_]+)=/);
    if (m && keys[m[1]] !== undefined) {
      present.add(m[1]);
      return `${m[1]}="${keys[m[1]]}"`;
    }
    return line;
  });

  for (const [k, v] of Object.entries(keys)) {
    if (!present.has(k)) out.push(`${k}="${v}"`);
  }

  await writeFile(ENV_PATH, out.filter((l, i, a) => i < a.length - 1 || l.trim()).join("\n") + "\n");
}

await loadEnvFile();

const databaseUrl = requireNeonUrl("DATABASE_URL");
const directUrl = process.env.DIRECT_URL ?? databaseUrl.replace("-pooler", "");

if (!process.env.DIRECT_URL) {
  console.log("DIRECT_URL not set — deriving non-pooler URL from DATABASE_URL");
  process.env.DIRECT_URL = directUrl;
  await upsertEnv({ DIRECT_URL: directUrl });
}

if (!databaseUrl.includes("-pooler") && databaseUrl.includes("neon.tech")) {
  console.warn(
    "Tip: use the pooled connection string (-pooler in hostname) for DATABASE_URL at runtime."
  );
}

console.log("\n=== Neon setup ===\n");
console.log("DATABASE_URL:", databaseUrl.replace(/:([^:@/]+)@/, ":****@"));
console.log("DIRECT_URL:  ", directUrl.replace(/:([^:@/]+)@/, ":****@"));
console.log("\nApplying migrations...\n");

await run("npx", ["prisma", "generate"]);
await run("npx", ["prisma", "migrate", "deploy"]);

console.log("\nNeon connected. Schema is up to date.");
console.log("Add the same DATABASE_URL and DIRECT_URL to Netlify environment variables.\n");
