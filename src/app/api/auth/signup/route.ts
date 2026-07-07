import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createAuthToken } from "@/lib/auth/tokens";
import { sendVerificationEmail } from "@/lib/email/mailer";
import { trackEvent } from "@/lib/analytics";
import { createNotification } from "@/lib/notifications";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { name, email, password } = await parseBody(req, signupSchema);

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return fail("An account with this email already exists", 409, {
      email: "An account with this email already exists",
    });
  }

  rateLimit(req, "signup", 10, 15 * 60 * 1000);

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      preferences: { create: {} },
    },
  });

  const rawToken = await createAuthToken(user.id, "EMAIL_VERIFICATION");
  await sendVerificationEmail(user.email, user.name, rawToken);

  // Activate any pending team invites addressed to this email.
  const invites = await db.teamMember.findMany({
    where: { email, status: "INVITED" },
    include: { store: { select: { id: true, name: true } } },
  });
  for (const invite of invites) {
    await db.teamMember.update({
      where: { id: invite.id },
      data: { userId: user.id, status: "ACTIVE", acceptedAt: new Date() },
    });
    await createNotification({
      userId: user.id,
      type: "TEAM",
      title: `You've joined ${invite.store.name}`,
      body: `You have ${invite.role.toLowerCase()} access.`,
      href: `/store/${invite.store.id}`,
    });
  }

  await createNotification({
    userId: user.id,
    type: "SUCCESS",
    title: "Welcome to Foundry",
    body: "Your account is ready. Verify your email to unlock everything.",
    href: "/dashboard/settings",
  });
  await trackEvent("user.signup", { userId: user.id });

  await createSession(user.id);

  return ok(
    { id: user.id, name: user.name, email: user.email },
    { status: 201 }
  );
});
