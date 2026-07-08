import { NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { messageSchema } from "@/lib/validation/seller";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId, conversationId } = await params;
  await requireStoreAccess(storeId, "inbox");

  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, storeId },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) return fail("Conversation not found", 404);

  // Opening a conversation marks unread customer messages as read.
  await db.message.updateMany({
    where: { conversationId, from: "CUSTOMER", readAt: null },
    data: { readAt: new Date() },
  });

  return ok({ conversation });
});

/** Sends a reply from the store. */
export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId, conversationId } = await params;
  const { user } = await requireStoreAccess(storeId, "inbox");

  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, storeId },
  });
  if (!conversation) return fail("Conversation not found", 404);

  const data = await parseBody(req, messageSchema);
  const message = await db.message.create({
    data: {
      conversationId,
      from: "STORE",
      authorName: user.name,
      body: data.body,
    },
  });
  await db.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date(), status: "OPEN" },
  });

  return ok({ message }, { status: 201 });
});

const statusSchema = z.object({ status: z.enum(["OPEN", "CLOSED"]) });

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId, conversationId } = await params;
  await requireStoreAccess(storeId, "inbox");

  const { status } = await parseBody(req, statusSchema);
  const result = await db.conversation.updateMany({
    where: { id: conversationId, storeId },
    data: { status },
  });
  if (result.count === 0) return fail("Conversation not found", 404);
  return ok({ status });
});
