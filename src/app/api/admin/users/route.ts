import { NextRequest } from "next/server";

import { ok, withErrorHandling } from "@/lib/api";
import { requireAdmin } from "@/lib/admin/access";
import { db } from "@/lib/db";

export const GET = withErrorHandling(async (req: NextRequest) => {
  await requireAdmin();
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  const status = new URL(req.url).searchParams.get("status");

  const users = await db.user.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      emailVerified: true,
      lastLoginAt: true,
      createdAt: true,
      _count: { select: { stores: true, orders: true } },
    },
  });

  return ok({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      emailVerified: u.emailVerified?.toISOString() ?? null,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      storeCount: u._count.stores,
      orderCount: u._count.orders,
    })),
  });
});
