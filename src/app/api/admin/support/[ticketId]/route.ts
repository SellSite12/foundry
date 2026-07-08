import { NextRequest } from "next/server";

import { ApiError, ok, parseBody, withErrorHandling } from "@/lib/api";
import { requireAdmin } from "@/lib/admin/access";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { notifyUserTicketReply } from "@/lib/support/notify";
import { adminTicketPatchSchema, supportReplySchema } from "@/lib/validation/templates";

export const GET = withErrorHandling(async (_req, { params }) => {
  const user = await requireUser();
  const { ticketId } = await params;

  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      store: { select: { id: true, name: true, slug: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, role: true } } },
      },
    },
  });

  if (!ticket) throw new ApiError("Ticket not found", 404);
  if (user.role !== "ADMIN" && ticket.userId !== user.id) {
    throw new ApiError("Forbidden", 403);
  }

  return ok({
    ticket: {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt.toISOString(),
      user: ticket.user,
      store: ticket.store,
      messages: ticket.messages.map((m) => ({
        id: m.id,
        body: m.body,
        isStaff: m.isStaff,
        authorName: m.author?.name ?? (m.isStaff ? "Foundry Support" : "Customer"),
        createdAt: m.createdAt.toISOString(),
      })),
    },
  });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  await requireAdmin();
  const { ticketId } = await params;
  const data = await parseBody(req, adminTicketPatchSchema);

  const ticket = await db.supportTicket.update({
    where: { id: ticketId },
    data,
    select: { id: true, status: true, priority: true },
  });

  return ok({ ticket });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const user = await requireUser();
  const { ticketId } = await params;
  const data = await parseBody(req, supportReplySchema);
  const isStaff = user.role === "ADMIN";

  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!ticket) throw new ApiError("Ticket not found", 404);
  if (!isStaff && ticket.userId !== user.id) throw new ApiError("Forbidden", 403);

  await db.supportTicketMessage.create({
    data: {
      ticketId,
      authorId: user.id,
      body: data.body,
      isStaff,
    },
  });

  await db.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: isStaff ? "WAITING" : "OPEN",
      updatedAt: new Date(),
    },
  });

  if (isStaff) {
    await notifyUserTicketReply({
      to: ticket.user.email,
      userName: ticket.user.name,
      subject: ticket.subject,
      body: data.body,
      ticketId,
    });
  }

  return ok({ sent: true });
});
