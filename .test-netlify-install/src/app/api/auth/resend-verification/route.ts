import { NextRequest } from "next/server";

import { ok, fail, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/auth/session";
import { createAuthToken } from "@/lib/auth/tokens";
import { sendVerificationEmail } from "@/lib/email/mailer";

export const POST = withErrorHandling(async (req: NextRequest) => {
  assertSameOrigin(req);
  rateLimit(req, "resend-verification", 3, 15 * 60 * 1000);

  const user = await requireUser();
  if (user.emailVerified) {
    return fail("Your email is already verified.", 400);
  }

  const rawToken = await createAuthToken(user.id, "EMAIL_VERIFICATION");
  await sendVerificationEmail(user.email, user.name, rawToken);

  return ok({ message: "Verification email sent." });
});
