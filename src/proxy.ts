import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/constants";
import { generateRequestId, REQUEST_ID_HEADER } from "@/lib/observability/request-id";

const PROTECTED_PREFIXES = ["/dashboard", "/store", "/onboarding", "/account"];
const AUTH_ONLY_FOR_GUESTS = ["/login", "/signup", "/forgot-password"];

/** Lightweight auth routing proxy. Custom-domain rewrites run in /api/internal/domain at runtime. */
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSessionCookie = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
