/**
 * Promote a user to platform ADMIN by email.
 * Usage: node scripts/promote-admin.mjs user@example.com
 */
import { readFile } from "fs/promises";
import path from "path";
import pg from "pg";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/promote-admin.mjs <email>");
  process.exit(1);
}

let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  try {
    const raw = await readFile(path.join(process.cwd(), ".env"), "utf8");
    const m = raw.match(/^DATABASE_URL="([^"]+)"/m);
    if (m) databaseUrl = m[1];
  } catch {
    // ignore
  }
}
if (!databaseUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
  const res = await client.query(
    `UPDATE "User" SET role = 'ADMIN', status = 'ACTIVE' WHERE email = $1 RETURNING id, email, name, role`,
    [email]
  );
  if (res.rowCount === 0) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }
  const user = res.rows[0];
  console.log(`Promoted ${user.name} <${user.email}> to ADMIN`);
} finally {
  await client.end();
}
