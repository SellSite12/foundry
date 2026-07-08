import { NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { generateContent } from "@/lib/ai/generate";

const draftSchema = z.object({
  kind: z.string(),
  prompt: z.string().optional(),
  targetType: z.string().optional(),
  targetId: z.string().optional(),
});

const publishSchema = z.object({
  id: z.string(),
});

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "ai");

  const status = req.nextUrl.searchParams.get("status") ?? "PENDING";
  const drafts = await db.aiDraft.findMany({
    where: { storeId, status },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return ok({ drafts });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { user } = await requireStoreAccess(storeId, "ai");
  const data = await parseBody(req, draftSchema);

  const content = await generateContent({
    kind: data.kind,
    storeId,
    prompt: data.prompt,
    targetType: data.targetType,
    targetId: data.targetId,
  });

  const draft = await db.aiDraft.create({
    data: {
      storeId,
      userId: user.id,
      kind: data.kind,
      prompt: data.prompt,
      targetType: data.targetType,
      targetId: data.targetId,
      content,
      status: "PENDING",
    },
  });
  return ok({ draft }, { status: 201 });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { user } = await requireStoreAccess(storeId, "ai");
  const data = await parseBody(req, publishSchema);

  const draft = await db.aiDraft.findFirst({ where: { id: data.id, storeId, status: "PENDING" } });
  if (!draft) return fail("Draft not found", 404);

  if (draft.targetType === "product" && draft.targetId) {
    if (draft.kind === "product_description") {
      await db.product.update({ where: { id: draft.targetId }, data: { description: draft.content } });
    } else if (draft.kind === "seo_title") {
      await db.product.update({ where: { id: draft.targetId }, data: { seoTitle: draft.content } });
    } else if (draft.kind === "seo_description") {
      await db.product.update({ where: { id: draft.targetId }, data: { seoDescription: draft.content } });
    }
  }

  await db.aiDraft.update({
    where: { id: draft.id },
    data: { status: "PUBLISHED" },
  });

  return ok({ published: true });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "ai");
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing id", 400);

  await db.aiDraft.updateMany({
    where: { id, storeId },
    data: { status: "DISCARDED" },
  });
  return ok({ discarded: true });
});
