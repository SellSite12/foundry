import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { destroyAllUserSessions } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications";
import { trackEvent } from "@/lib/analytics";

export const POST = withErrorHandling(async (req: NextRequest) => {
  rateLimit(req, "reset-password", 10, 15 * 60 * 1000);

  const { token, password } = await parseBody(req, resetPasswordSchema);

  const userId = await consumeAuthToken(token, "PASSWORD_RESET");
  if (!userId) {
    return fail("This reset link is invalid or has expired.", 400);
  }

  const passwordHash = await hashPassword(password);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });

  // Password changed: revoke every existing session.
  await destroyAllUserSessions(userId);

  await createNotification({
    userId,
    type: "SECURITY",
    title: "Password changed",
    body: "Your password was reset. All sessions have been signed out.",
  });
  await trackEvent("user.password_reset", { userId });

  return ok({ message: "Password updated. You can now sign in." });
});
