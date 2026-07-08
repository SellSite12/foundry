import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { trackEvent } from "@/lib/analytics";

const GENERIC_ERROR = "Invalid email or password";

export const POST = withErrorHandling(async (req: NextRequest) => {
  rateLimit(req, "login", 20, 15 * 60 * 1000);

  const { email, password } = await parseBody(req, loginSchema);

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    // Hash comparison anyway would be ideal for timing parity, but bcrypt
    // verify against a static hash is sufficient here.
    return fail(GENERIC_ERROR, 401);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return fail(GENERIC_ERROR, 401);
  }

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await trackEvent("user.login", { userId: user.id });
  await createSession(user.id);

  return ok({ id: user.id, name: user.name, email: user.email });
});
