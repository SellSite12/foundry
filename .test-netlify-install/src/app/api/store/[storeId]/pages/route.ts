import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { updateStorePageSchema } from "@/lib/validation/shop";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "settings");

  const pages = await db.storePage.findMany({
    where: { storeId },
    orderBy: { slug: "asc" },
  });
  return ok({ pages });
});

/** Creates or updates a storefront content page (about/contact/privacy/terms). */
export const PUT = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "settings");

  const data = await parseBody(req, updateStorePageSchema);
  const page = await db.storePage.upsert({
    where: { storeId_slug: { storeId, slug: data.slug } },
    create: { storeId, slug: data.slug, title: data.title, content: data.content ?? null },
    update: { title: data.title, content: data.content ?? null },
  });
  return ok({ page });
});
