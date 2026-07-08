import { NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { generateWebhookSecret } from "@/lib/webhooks/delivery";

const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
});

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "developer");

  const webhooks = await db.webhook.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    include: {
      deliveries: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  return ok({ webhooks });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { role } = await requireStoreAccess(storeId, "developer");
  if (role !== "OWNER" && role !== "ADMIN") return fail("Forbidden", 403);

  const data = await parseBody(req, webhookSchema);
  const secret = generateWebhookSecret();

  const webhook = await db.webhook.create({
    data: {
      storeId,
      url: data.url,
      events: data.events.join(","),
      secret,
    },
  });
  return ok({ webhook, secret }, { status: 201 });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { role } = await requireStoreAccess(storeId, "developer");
  if (role !== "OWNER" && role !== "ADMIN") return fail("Forbidden", 403);

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing id", 400);
  await db.webhook.deleteMany({ where: { id, storeId } });
  return ok({ deleted: true });
});
