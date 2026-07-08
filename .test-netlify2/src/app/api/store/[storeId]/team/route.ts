import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { inviteTeamSchema, updateTeamSchema } from "@/lib/validation/seller";
import { PLAN_DEFS } from "@/lib/plans";
import { sendMail } from "@/lib/email/mailer";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  const { store } = await requireStoreAccess(storeId, "team");

  const members = await db.teamMember.findMany({
    where: { storeId, status: { not: "REMOVED" } },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true, image: true } } },
  });

  const owner = await db.user.findUnique({
    where: { id: store.ownerId },
    select: { id: true, name: true, email: true, image: true },
  });

  return ok({ owner, members });
});

/** Invites a teammate by email. Existing Foundry users are activated instantly. */
export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { store, user, role } = await requireStoreAccess(storeId, "team");
  if (role !== "OWNER" && role !== "ADMIN") {
    return fail("Only owners and admins can invite team members", 403);
  }

  const data = await parseBody(req, inviteTeamSchema);

  if (data.email === user.email.toLowerCase()) {
    return fail("You can't invite yourself", 400, { email: "That's you" });
  }
  const ownerUser = await db.user.findUnique({ where: { id: store.ownerId } });
  if (data.email === ownerUser?.email) {
    return fail("The store owner is already a member", 400, { email: "Already the owner" });
  }

  const existing = await db.teamMember.findUnique({
    where: { storeId_email: { storeId, email: data.email } },
  });
  if (existing && existing.status !== "REMOVED") {
    return fail("This person is already on the team", 409, { email: "Already invited" });
  }

  // Seat limits by plan.
  const sub = await db.subscription.findFirst({
    where: { storeId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  const plan = PLAN_DEFS[(sub?.plan ?? "STARTER") as keyof typeof PLAN_DEFS];
  if (plan.limits.teamSeats !== null) {
    const seats = await db.teamMember.count({
      where: { storeId, status: { not: "REMOVED" } },
    });
    if (seats + 1 >= plan.limits.teamSeats + 1) {
      // +1 accounts for the owner's implicit seat
      return fail(
        `Your ${plan.name} plan allows ${plan.limits.teamSeats} team seats. Upgrade to add more.`,
        403
      );
    }
  }

  const invitedUser = await db.user.findUnique({ where: { email: data.email } });

  const member = existing
    ? await db.teamMember.update({
        where: { id: existing.id },
        data: {
          role: data.role,
          permissions: data.permissions ?? null,
          status: invitedUser ? "ACTIVE" : "INVITED",
          userId: invitedUser?.id ?? null,
          invitedById: user.id,
          acceptedAt: invitedUser ? new Date() : null,
        },
      })
    : await db.teamMember.create({
        data: {
          storeId,
          email: data.email,
          role: data.role,
          permissions: data.permissions ?? null,
          status: invitedUser ? "ACTIVE" : "INVITED",
          userId: invitedUser?.id ?? null,
          invitedById: user.id,
          acceptedAt: invitedUser ? new Date() : null,
        },
      });

  if (invitedUser) {
    await db.notification.create({
      data: {
        userId: invitedUser.id,
        type: "TEAM",
        title: `You've been added to ${store.name}`,
        body: `${user.name} added you as ${data.role.toLowerCase()}.`,
        href: `/store/${storeId}`,
      },
    });
  } else {
    await sendMail({
      to: data.email,
      subject: `${user.name} invited you to ${store.name} on Foundry`,
      text: `${user.name} invited you to join ${store.name} as ${data.role.toLowerCase()}.\n\nCreate a Foundry account with this email address to accept:\n\n${process.env.APP_URL ?? "http://localhost:3000"}/signup`,
      html: `<p>${user.name} invited you to join <strong>${store.name}</strong> as ${data.role.toLowerCase()}.</p><p><a href="${process.env.APP_URL ?? "http://localhost:3000"}/signup">Create a Foundry account</a> with this email address to accept.</p>`,
    });
  }

  return ok({ member }, { status: 201 });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { role } = await requireStoreAccess(storeId, "team");
  if (role !== "OWNER" && role !== "ADMIN") {
    return fail("Only owners and admins can change roles", 403);
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing member id", 400);

  const data = await parseBody(req, updateTeamSchema);
  const result = await db.teamMember.updateMany({ where: { id, storeId }, data });
  if (result.count === 0) return fail("Team member not found", 404);

  const member = await db.teamMember.findUnique({ where: { id } });
  return ok({ member });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { storeId } = await params;
  const { role } = await requireStoreAccess(storeId, "team");
  if (role !== "OWNER" && role !== "ADMIN") {
    return fail("Only owners and admins can remove team members", 403);
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing member id", 400);

  const result = await db.teamMember.updateMany({
    where: { id, storeId },
    data: { status: "REMOVED" },
  });
  if (result.count === 0) return fail("Team member not found", 404);
  return ok({ removed: true });
});
