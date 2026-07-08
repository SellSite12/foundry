import { NextRequest } from "next/server";

import { ok, withErrorHandling } from "@/lib/api";
import { requireAdmin } from "@/lib/admin/access";
import { db } from "@/lib/db";

export const GET = withErrorHandling(async (req: NextRequest) => {
  await requireAdmin();
  const status = new URL(req.url).searchParams.get("status");

  const tickets = await db.supportTicket.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true, email: true } },
      store: { select: { id: true, name: true, slug: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
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
      user: t.user,
      store: t.store,
      lastMessage: t.messages[0]?.body ?? null,
    })),
  });
});
