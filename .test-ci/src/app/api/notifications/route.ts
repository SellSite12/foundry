import { NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { ok, parseBody, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.notification.count({
      where: { userId: user.id, readAt: null },
    }),
  ]);

  return ok({ notifications, unreadCount });
});

const markReadSchema = z.object({
  ids: z.array(z.string().min(1)).max(100).optional(), // omitted = mark all
});

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const { ids } = await parseBody(req, markReadSchema);

  const result = await db.notification.updateMany({
    where: {
      userId: user.id, // scoping to the owner prevents cross-user writes
      readAt: null,
      ...(ids ? { id: { in: ids } } : {}),
    },
    data: { readAt: new Date() },
  });

  return ok({ marked: result.count });
});
