import { NextRequest } from "next/server";

import { ApiError, ok, parseBody, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { notifyAdminsNewTicket } from "@/lib/support/notify";
import { createSupportTicketSchema } from "@/lib/validation/templates";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const user = await requireUser();
  const access = await getStoreAccess(storeId);
  if (!access) return ok({ tickets: [] });

  const tickets = await db.supportTicket.findMany({
    where: { userId: user.id, storeId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      store: { select: { name: true } },
    },
  });

  return ok({
    tickets: tickets.map((t) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      lastMessage: t.messages[0]?.body ?? null,
    })),
  });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const user = await requireUser();
  const access = await getStoreAccess(storeId);
  if (!access) throw new ApiError("Store not found", 404);

  const data = await parseBody(req, createSupportTicketSchema);

  const ticket = await db.supportTicket.create({
    data: {
      userId: user.id,
      storeId,
      subject: data.subject,
      priority: data.priority ?? "NORMAL",
      messages: {
        create: {
          authorId: user.id,
          body: data.body,
          isStaff: false,
        },
      },
    },
    include: { store: { select: { name: true } } },
  });

  await notifyAdminsNewTicket({
    ticketId: ticket.id,
    subject: data.subject,
    userName: user.name,
    userEmail: user.email,
    storeName: ticket.store?.name,
    body: data.body,
  });

  return ok({ ticket: { id: ticket.id, subject: ticket.subject } });
});
