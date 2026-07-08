import { db } from "@/lib/db";
import { ok, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";

/** All reviews written by the signed-in buyer, across storefronts. */
export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const reviews = await db.review.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      status: true,
      reply: true,
      createdAt: true,
      product: {
        select: { name: true, slug: true, store: { select: { name: true, slug: true } } },
      },
    },
  });
  return ok({ reviews });
});
