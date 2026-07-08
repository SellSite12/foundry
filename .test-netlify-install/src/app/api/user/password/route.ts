import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser, createSession, destroyAllUserSessions } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { changePasswordSchema } from "@/lib/validation/auth";
import { createNotification } from "@/lib/notifications";

export const POST = withErrorHandling(async (req: NextRequest) => {
  rateLimit(req, "change-password", 10, 15 * 60 * 1000);

  const sessionUser = await requireUser();
  const { currentPassword, newPassword } = await parseBody(
    req,
    changePasswordSchema
  );

  const user = await db.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
  });

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return fail("Current password is incorrect", 400, {
      currentPassword: "Current password is incorrect",
    });
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  // Revoke every session (including this one), then issue a fresh one so
  // the user stays signed in here but everywhere else is logged out.
  await destroyAllUserSessions(user.id);
  await createSession(user.id);

  await createNotification({
    userId: user.id,
    type: "SECURITY",
    title: "Password changed",
    body: "Your password was changed. Other sessions have been signed out.",
  });

  return ok({ message: "Password updated." });
});
