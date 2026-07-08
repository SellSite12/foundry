/** Resolves the Postgres URL from Netlify Neon extension or manual env vars. */
export function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.NETLIFY_DATABASE_URL?.trim() ||
    process.env.NETLIFY_DB_URL?.trim() ||
    undefined
  );
}

/** Maps Netlify/Neon extension vars onto DATABASE_URL for Prisma CLI and client. */
export function ensureDatabaseUrlEnv(): string | undefined {
  const url = resolveDatabaseUrl();
  if (!url) return undefined;
  if (!process.env.DATABASE_URL?.trim()) {
    process.env.DATABASE_URL = url;
  }
  if (!process.env.DIRECT_URL?.trim()) {
    process.env.DIRECT_URL = url.includes("-pooler") ? url.replace("-pooler", "") : url;
  }
  return url;
}
