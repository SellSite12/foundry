import { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { db } from "@/lib/db";
import { ok, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { sha256 } from "@/lib/auth/tokens";
import { SESSION_COOKIE } from "@/lib/constants";

/** Lists the user's active sessions (device history). */
export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const currentHash = raw ? sha256(raw) : null;

  const sessions = await db.session.findMany({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tokenHash: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  return ok({
    sessions: sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      current: s.tokenHash === currentHash,
    })),
  });
});

/** Revokes all sessions except the current one. */
export const DELETE = withErrorHandling(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const currentHash = raw ? sha256(raw) : "";

  const result = await db.session.deleteMany({
    where: { userId: user.id, tokenHash: { not: currentHash } },
  });

  return ok({ revoked: result.count });
});
