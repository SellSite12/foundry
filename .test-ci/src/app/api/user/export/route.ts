import { db } from "@/lib/db";
import { ok, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { systemLog } from "@/lib/observability/logger";

/** GDPR-style data portability — exports all user-owned data as JSON. */
export const GET = withErrorHandling(async () => {
  const user = await requireUser();

  const [
    profile,
    preferences,
    sessions,
    stores,
    orders,
    addresses,
    paymentMethods,
    notifications,
    reviews,
    consentRecords,
    teamMemberships,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
    db.userPreferences.findUnique({ where: { userId: user.id } }),
    db.session.findMany({
      where: { userId: user.id },
      select: { id: true, ipAddress: true, userAgent: true, createdAt: true, expiresAt: true },
    }),
    db.store.findMany({
      where: { ownerId: user.id },
      select: { id: true, name: true, slug: true, createdAt: true },
    }),
    db.order.findMany({
      where: { customerId: user.id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        createdAt: true,
        storeId: true,
      },
    }),
    db.address.findMany({ where: { userId: user.id } }),
    db.paymentMethod.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        cardBrand: true,
        cardLast4: true,
        expMonth: true,
        expYear: true,
        createdAt: true,
      },
    }),
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.review.findMany({
      where: { userId: user.id },
      select: { id: true, rating: true, title: true, body: true, createdAt: true },
    }),
    db.consentRecord.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.teamMember.findMany({
      where: { userId: user.id },
      select: { storeId: true, role: true, status: true, createdAt: true },
    }),
  ]);

  await systemLog({
    level: "info",
    category: "system",
    message: "user.data_export",
    userId: user.id,
  });

  return ok({
    exportedAt: new Date().toISOString(),
    profile,
    preferences,
    sessions,
    stores,
    orders,
    addresses,
    paymentMethods,
    notifications,
    reviews,
    consentRecords,
    teamMemberships,
  });
});
