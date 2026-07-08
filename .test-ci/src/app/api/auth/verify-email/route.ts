import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { verifyEmailSchema } from "@/lib/validation/auth";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { createNotification } from "@/lib/notifications";
import { trackEvent } from "@/lib/analytics";

export const POST = withErrorHandling(async (req: NextRequest) => {
  rateLimit(req, "verify-email", 10, 15 * 60 * 1000);

  const { token } = await parseBody(req, verifyEmailSchema);

  const userId = await consumeAuthToken(token, "EMAIL_VERIFICATION");
  if (!userId) {
    return fail("This verification link is invalid or has expired.", 400);
  }

  await db.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });

  await createNotification({
    userId,
    type: "SUCCESS",
    title: "Email verified",
    body: "Your email address has been confirmed.",
  });
  await trackEvent("user.email_verified", { userId });

  return ok({ message: "Email verified." });
});
