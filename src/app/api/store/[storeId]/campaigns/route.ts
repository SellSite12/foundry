import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { campaignSchema } from "@/lib/validation/seller";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");

  const campaigns = await db.emailCampaign.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
  return ok({ campaigns });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");
  const data = await parseBody(req, campaignSchema);

  const campaign = await db.emailCampaign.create({
    data: {
      storeId,
      name: data.name,
      subject: data.subject,
      preheader: data.preheader ?? null,
      body: data.body ?? null,
      status: data.status ?? "DRAFT",
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
    },
  });
  return ok({ campaign }, { status: 201 });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing campaign id", 400);

  const data = await parseBody(req, campaignSchema.partial());
  const result = await db.emailCampaign.updateMany({
    where: { id, storeId },
    data: {
      ...data,
      scheduledAt:
        data.scheduledAt !== undefined
          ? data.scheduledAt
            ? new Date(data.scheduledAt)
            : null
          : undefined,
    },
  });
  if (result.count === 0) return fail("Campaign not found", 404);

  const campaign = await db.emailCampaign.findUnique({ where: { id } });
  return ok({ campaign });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing campaign id", 400);

  const result = await db.emailCampaign.deleteMany({ where: { id, storeId } });
  if (result.count === 0) return fail("Campaign not found", 404);
  return ok({ deleted: true });
});
