import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PageHeader } from "@/components/seller/ui";
import { AiAssistantPanel } from "@/components/seller/AiAssistantPanel";
import { AiDraftsPanel } from "@/components/seller/AiDraftsPanel";

export const metadata = { title: "AI Assistant" };

export default async function AssistantPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "ai");
  if (!access) notFound();

  const drafts = await db.aiDraft.findMany({
    where: { storeId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div>
      <PageHeader
        title="AI Assistant"
        description="Ask questions about performance, generate content, and review drafts before publishing."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <AiAssistantPanel storeId={storeId} />
        <AiDraftsPanel
          storeId={storeId}
          drafts={drafts.map((d) => ({
            id: d.id,
            kind: d.kind,
            content: d.content,
            status: d.status,
            createdAt: d.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
