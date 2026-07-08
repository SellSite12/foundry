import { NextRequest } from "next/server";

import { ok, fail, withErrorHandling } from "@/lib/api";
import { resolveSlugFromHost } from "@/lib/shop/domain";

/**
 * Resolves a custom domain hostname to a store slug. Used by the edge
 * proxy for rewrites — not a public API (localhost + internal header).
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const host = req.nextUrl.searchParams.get("host");
  if (!host) return fail("Missing host", 400);

  const internal = req.headers.get("x-foundry-internal");
  const allowed =
    internal === (process.env.INTERNAL_SECRET ?? "foundry-dev-internal") ||
    req.nextUrl.hostname === "localhost" ||
    req.nextUrl.hostname === "127.0.0.1";

  if (!allowed) return fail("Forbidden", 403);

  const slug = await resolveSlugFromHost(host);
  if (!slug) return fail("Unknown domain", 404);
  return ok({ slug });
});
