import { NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { ok, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { chatWithAssistant } from "@/lib/ai/insights";

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  threadId: z.string().optional(),
});

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  const { user } = await requireStoreAccess(storeId, "ai");

  const threads = await db.aiThread.findMany({
    where: { storeId, userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } },
  });
  return ok({ threads });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { user } = await requireStoreAccess(storeId, "ai");
  const data = await parseBody(req, chatSchema);

  const result = await chatWithAssistant({
    storeId,
    userId: user.id,
    threadId: data.threadId,
    message: data.message,
  });

  return ok(result);
});
