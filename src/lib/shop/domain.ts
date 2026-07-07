import { db } from "@/lib/db";

import { normalizeHost } from "./domain-host";

export { appHostname, isCustomDomainHost, normalizeHost } from "./domain-host";

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
