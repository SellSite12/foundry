import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { createProductSchema } from "@/lib/validation/seller";
import { uniqueSlug } from "@/lib/seller/slug";
import { getPagination, pageMeta } from "@/lib/seller/pagination";
import { PLAN_DEFS } from "@/lib/plans";
import { trackEvent } from "@/lib/analytics";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "products");

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const status = sp.get("status");
  const { page, take, skip } = getPagination(req);

  const where: Prisma.ProductWhereInput = {
    storeId,
    ...(status ? { status } : { status: { not: "ARCHIVED" } }),
    ...(q && {
      OR: [
        { name: { contains: q } },
        { sku: { contains: q } },
        { tags: { contains: q } },
        { category: { contains: q } },
      ],
    }),
  };

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take,
      skip,
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        _count: { select: { variants: true } },
      },
    }),
  ]);

  return ok({ products, ...pageMeta(total, page) });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { store, user } = await requireStoreAccess(storeId, "products");
  const data = await parseBody(req, createProductSchema);

  // Plan product limits.
  const sub = await db.subscription.findFirst({
    where: { storeId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  const plan = PLAN_DEFS[(sub?.plan ?? "STARTER") as keyof typeof PLAN_DEFS];
  if (plan.limits.products !== null) {
    const count = await db.product.count({ where: { storeId } });
    if (count >= plan.limits.products) {
      return fail(
        `Your ${plan.name} plan allows ${plan.limits.products} products. Upgrade to add more.`,
        403
      );
    }
  }

  const { images, variants, publishAt, ...fields } = data;

  const product = await db.product.create({
    data: {
      ...fields,
      storeId,
      slug: uniqueSlug(data.name),
      currency: store.currency,
      publishAt: publishAt ? new Date(publishAt) : null,
      images: images?.length
        ? {
            create: images.map((img, i) => ({
              url: img.url,
              alt: img.alt ?? null,
              isVideo: img.isVideo ?? false,
              position: img.position ?? i,
            })),
          }
        : undefined,
      variants: variants?.length
        ? {
            create: variants.map((v, i) => ({
              name: v.name,
              options: JSON.stringify(v.options),
              sku: v.sku ?? null,
              barcode: v.barcode ?? null,
              priceCents: v.priceCents ?? null,
              stock: v.stock ?? 0,
              position: v.position ?? i,
            })),
          }
        : undefined,
    },
    include: { images: true, variants: true },
  });

  await trackEvent("product.created", {
    userId: user.id,
    storeId,
    payload: { productId: product.id, name: product.name },
  });

  return ok({ product }, { status: 201 });
});
