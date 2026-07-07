import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/constants";
import { isCustomDomainHost, normalizeHost } from "@/lib/shop/domain";
import { config as appConfig } from "@/lib/config";
import { generateRequestId, REQUEST_ID_HEADER } from "@/lib/observability/request-id";

// Edge proxy (Next 16's replacement for middleware) can't query the
// database, so it does a fast cookie-presence check for routing UX. Real
// session validation happens server-side in layouts/pages (getCurrentUser)
// and API routes (requireUser) — a forged cookie gets past this redirect
// but never past the data layer.
//
// Custom domains: when the Host header is not the platform hostname, the
// proxy asks the internal domain resolver and rewrites to /shop/[slug]/…

const PROTECTED_PREFIXES = ["/dashboard", "/store", "/onboarding", "/account"];
const AUTH_ONLY_FOR_GUESTS = ["/login", "/signup", "/forgot-password"];
const SKIP_DOMAIN_PREFIXES = [
  "/api",
  "/_next",
  "/uploads",
  "/dashboard",
  "/store",
  "/onboarding",
  "/account",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/marketplace",
  "/shop",
];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSessionCookie = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  // Custom domain → storefront rewrite
  const host = normalizeHost(req.headers.get("host"));
  if (
    host &&
    isCustomDomainHost(host) &&
    !SKIP_DOMAIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    try {
      const resolveUrl = new URL("/api/internal/domain", req.nextUrl.origin);
      resolveUrl.searchParams.set("host", host);
      const res = await fetch(resolveUrl.toString(), {
        headers: { "x-foundry-internal": appConfig.internalSecret },
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: { slug?: string } };
        const slug = json.data?.slug;
        if (slug) {
          const url = req.nextUrl.clone();
          url.pathname = `/shop/${slug}${pathname === "/" ? "" : pathname}`;
          return NextResponse.rewrite(url);
        }
      }
    } catch {
      // fall through — unknown custom domain shows the platform 404
    }
  }

  if (
    PROTECTED_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    ) &&
    !hasSessionCookie
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_ONLY_FOR_GUESTS.includes(pathname) && hasSessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({
    headers: { [REQUEST_ID_HEADER]: generateRequestId() },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
