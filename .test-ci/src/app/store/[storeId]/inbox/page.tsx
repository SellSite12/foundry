import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PageHeader } from "@/components/seller/ui";
import { InboxManager } from "@/components/seller/InboxManager";

export const metadata = { title: "Inbox" };

export default async function InboxPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "inbox");
  if (!access) notFound();

  const [conversations, customers] = await Promise.all([
    db.conversation.findMany({
      where: { storeId },
      orderBy: { updatedAt: "desc" },
      include: {
        customer: { select: { name: true, email: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    }),
    db.customer.findMany({
      where: { storeId },
      orderBy: { name: "asc" },
      take: 200,
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Inbox"
        description="Conversations with your customers. Customer-initiated messages arrive with the Phase 4 storefront."
      />
      <InboxManager
        storeId={storeId}
        customers={customers}
        conversations={conversations.map((c) => ({
          id: c.id,
          subject: c.subject,
          status: c.status,
          customerName: c.customer?.name ?? null,
          customerEmail: c.customer?.email ?? null,
          updatedAt: c.updatedAt.toISOString(),
          messages: c.messages.map((m) => ({
            id: m.id,
            from: m.from,
            authorName: m.authorName,
            body: m.body,
            createdAt: m.createdAt.toISOString(),
          })),
        }))}
      />
    </div>
  );
}
