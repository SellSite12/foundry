import { createHash, randomBytes } from "crypto";

import { db } from "@/lib/db";
import {
  AUTH_TOKEN_TYPES,
  type AuthTokenType,
  EMAIL_VERIFICATION_TTL_HOURS,
  PASSWORD_RESET_TTL_MINUTES,
} from "@/lib/constants";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Creates a single-use auth token for a user. Only the SHA-256 hash is
 * persisted; the raw token goes into the email link. Any previous unused
 * tokens of the same type are invalidated so only the latest link works.
 */
export async function createAuthToken(
  userId: string,
  type: AuthTokenType
): Promise<string> {
  const raw = generateRawToken();
  const ttlMs =
    type === AUTH_TOKEN_TYPES.EMAIL_VERIFICATION
      ? EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000
      : PASSWORD_RESET_TTL_MINUTES * 60 * 1000;

  await db.$transaction([
    db.authToken.deleteMany({ where: { userId, type, usedAt: null } }),
    db.authToken.create({
      data: {
        userId,
        type,
        tokenHash: sha256(raw),
        expiresAt: new Date(Date.now() + ttlMs),
      },
    }),
  ]);

  return raw;
}

/**
 * Validates a raw token and atomically marks it used.
 * Returns the owning userId, or null when invalid/expired/already used.
 */
export async function consumeAuthToken(
  rawToken: string,
  type: AuthTokenType
): Promise<string | null> {
  const tokenHash = sha256(rawToken);

  const token = await db.authToken.findUnique({ where: { tokenHash } });
  if (
    !token ||
    token.type !== type ||
    token.usedAt !== null ||
    token.expiresAt < new Date()
  ) {
    return null;
  }

  // Guard against concurrent use of the same token.
  const updated = await db.authToken.updateMany({
    where: { id: token.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (updated.count === 0) return null;

  return token.userId;
}
