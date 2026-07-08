import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { getLiveStore } from "@/lib/shop/storefront";
import { contactSchema } from "@/lib/validation/shop";
import { rateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";

/** Storefront contact form → store inbox conversation + seller notification. */
export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  rateLimit(req, "contact", 5, 60_000);
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) return fail("Store not found", 404);

  const data = await parseBody(req, contactSchema);
  const email = data.email.toLowerCase();

  const customer = await db.customer.upsert({
    where: { storeId_email: { storeId: store.id, email } },
    create: { storeId: store.id, email, name: data.name },
    update: {},
  });

  const conversation = await db.conversation.create({
    data: {
      storeId: store.id,
      customerId: customer.id,
      subject: data.subject,
      messages: {
        create: { from: "CUSTOMER", authorName: data.name, body: data.message },
      },
    },
  });

  await createNotification({
    userId: store.ownerId,
    type: "CUSTOMER",
    title: `New message: ${data.subject}`,
    body: `${data.name} <${email}>`,
    href: `/store/${store.id}/inbox`,
  });

  return ok({ conversationId: conversation.id }, { status: 201 });
});
