# Foundry Backup Script
# Creates timestamped backups of the SQLite database and upload/report directories.
# Usage: node scripts/backup.mjs

import { mkdir, copyFile, readdir, stat } from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const BACKUP_DIR = path.join(ROOT, "var", "backups");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  let entries;
  try {
    entries = await readdir(src, { withFileTypes: true });
  } catch {
    return 0;
  }
  let count = 0;
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) count += await copyDir(s, d);
    else {
      await copyFile(s, d);
      count++;
    }
  }
  return count;
}

async function main() {
  const target = path.join(BACKUP_DIR, stamp);
  await mkdir(target, { recursive: true });

  const dbPath = path.join(ROOT, "prisma", "dev.db");
  try {
    await copyFile(dbPath, path.join(target, "dev.db"));
    console.log("Database backed up");
  } catch {
    console.warn("No dev.db found — set DATABASE_URL for your environment");
  }

  const uploads = await copyDir(path.join(ROOT, "var", "uploads"), path.join(target, "uploads"));
  const reports = await copyDir(path.join(ROOT, "var", "reports"), path.join(target, "reports"));

  const manifest = {
    createdAt: new Date().toISOString(),
    uploads,
    reports,
    version: process.env.APP_VERSION ?? "0.2.0",
  };

  const { writeFile } = await import("fs/promises");
  await writeFile(path.join(target, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`Backup complete: ${target}`);
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
