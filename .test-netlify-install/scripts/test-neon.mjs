import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { readFile } from "fs/promises";

async function loadEnv() {
  const raw = await readFile(".env", "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_]+)="?([^"\n]+)"?/);
    if (m) process.env[m[1]] = m[2];
  }
}

await loadEnv();
neonConfig.webSocketConstructor = ws;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL missing");
const adapter = new PrismaNeon({ connectionString: databaseUrl });
const db = new PrismaClient({ adapter });

try {
  const tables = await db.$queryRaw`
    SELECT COUNT(*)::int AS n FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `;
  const users = await db.user.count();
  console.log("Neon connected OK");
  console.log("Tables:", tables[0]?.n ?? 0);
  console.log("Users:", users);
} catch (error) {
  console.error("Neon connection failed:", error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await db.$disconnect();
}
