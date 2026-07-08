import { cookies, headers } from "next/headers";
import { cache } from "react";

import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_DAYS } from "@/lib/constants";
import { generateRawToken, sha256 } from "@/lib/auth/tokens";

const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: string;
  status: string;
  emailVerified: Date | null;
  createdAt: Date;
};

/** Creates a DB session and sets the session cookie. */
export async function createSession(userId: string): Promise<void> {
  const raw = generateRawToken();
  const hdrs = await headers();

  await db.session.create({
    data: {
      tokenHash: sha256(raw),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      ipAddress:
        hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: hdrs.get("user-agent"),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

/** Destroys the current session (DB row + cookie). */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;

  if (raw) {
    await db.session.deleteMany({ where: { tokenHash: sha256(raw) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Revokes every session for a user (e.g. after a password change). */
export async function destroyAllUserSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}

/**
 * Resolves the currently authenticated user from the session cookie.
 * Cached per-request so layouts, pages, and API handlers can all call it.
 * Returns null for anonymous or expired sessions.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: sha256(raw) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (session.user.status === "SUSPENDED") return null;

  return session.user;
});

/** Like getCurrentUser but throws a 401-style error for API routes. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "UnauthorizedError";
  }
}
