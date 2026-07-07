import { db } from "@/lib/db";

/** Normalizes a Host header value to a bare hostname (no port). */
export function normalizeHost(host: string | null): string | null {
  if (!host) return null;
  return host.split(":")[0].trim().toLowerCase() || null;
}

/** The primary app hostname from APP_URL (e.g. localhost or app.foundry.com). */
export function appHostname(): string {
  try {
    return new URL(process.env.APP_URL ?? "http://localhost:3000").hostname.toLowerCase();
  } catch {
    return "localhost";
  }
}

/** True when the request host is a custom domain (not the platform host). */
export function isCustomDomainHost(host: string | null): boolean {
  const h = normalizeHost(host);
  if (!h) return false;
  const app = appHostname();
  return h !== app && h !== "localhost" && h !== "127.0.0.1";
}

/** Resolves a custom domain to a live store slug, or null if unknown. */
export async function resolveSlugFromHost(host: string): Promise<string | null> {
  const normalized = normalizeHost(host);
  if (!normalized) return null;

  const store = await db.store.findFirst({
    where: {
      customDomain: normalized,
      status: "ACTIVE",
      onboardingDone: true,
    },
    select: { slug: true },
  });
  return store?.slug ?? null;
}
