import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser, destroySession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { deleteAccountSchema } from "@/lib/validation/auth";
import { trackEvent } from "@/lib/analytics";

/**
 * Permanently deletes the authenticated user's account. Requires password
 * re-confirmation. Related rows (sessions, tokens, preferences, stores,
 * notifications, …) are removed via cascading deletes in the schema.
 */
export const DELETE = withErrorHandling(async (req: NextRequest) => {
  rateLimit(req, "delete-account", 5, 15 * 60 * 1000);

  const sessionUser = await requireUser();
  const { password } = await parseBody(req, deleteAccountSchema);

  const user = await db.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
  });

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return fail("Password is incorrect", 400, {
      password: "Password is incorrect",
    });
  }

  await trackEvent("user.account_deleted", {
    payload: { email: user.email },
  });

  await destroySession();
  await db.user.delete({ where: { id: user.id } });

  return ok({ message: "Account deleted." });
});
