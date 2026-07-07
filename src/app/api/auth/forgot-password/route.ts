import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, parseBody, withErrorHandling } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { createAuthToken } from "@/lib/auth/tokens";
import { sendPasswordResetEmail } from "@/lib/email/mailer";

export const POST = withErrorHandling(async (req: NextRequest) => {
  rateLimit(req, "forgot-password", 5, 15 * 60 * 1000);

  const { email } = await parseBody(req, forgotPasswordSchema);

  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    const rawToken = await createAuthToken(user.id, "PASSWORD_RESET");
    await sendPasswordResetEmail(user.email, user.name, rawToken);
  }

  // Always respond identically so the endpoint can't be used to
  // enumerate which emails have accounts.
  return ok({
    message: "If an account exists for that email, a reset link has been sent.",
  });
});
