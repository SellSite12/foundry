import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { conversationSchema } from "@/lib/validation/seller";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "inbox");

  const status = req.nextUrl.searchParams.get("status");

  const conversations = await db.conversation.findMany({
    where: { storeId, ...(status && { status }) },
    orderBy: { updatedAt: "desc" },
    include: {
      customer: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
  });

  return ok({ conversations });
});

/** Starts a conversation (seller-initiated outreach to a customer). */
export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { user } = await requireStoreAccess(storeId, "inbox");
  const data = await parseBody(req, conversationSchema);

  if (data.customerId) {
    const customer = await db.customer.findFirst({
      where: { id: data.customerId, storeId },
    });
    if (!customer) return fail("Customer not found", 404);
  }

  const conversation = await db.conversation.create({
    data: {
      storeId,
      customerId: data.customerId ?? null,
      subject: data.subject,
      messages: {
        create: { from: "STORE", authorName: user.name, body: data.body },
      },
    },
    include: { messages: true, customer: { select: { name: true, email: true } } },
  });

  return ok({ conversation }, { status: 201 });
});
