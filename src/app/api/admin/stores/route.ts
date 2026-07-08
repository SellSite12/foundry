import { NextRequest } from "next/server";

import { ok, withErrorHandling } from "@/lib/api";
import { requireAdmin } from "@/lib/admin/access";
import { db } from "@/lib/db";

export const GET = withErrorHandling(async (req: NextRequest) => {
  await requireAdmin();
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  const status = new URL(req.url).searchParams.get("status");

  const stores = await db.store.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { orders: true, products: true } },
    },
  });

  return ok({
    stores: stores.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      status: s.status,
      owner: s.owner,
      onboardingDone: s.onboardingDone,
      createdAt: s.createdAt.toISOString(),
      orderCount: s._count.orders,
      productCount: s._count.products,
    })),
  });
});
