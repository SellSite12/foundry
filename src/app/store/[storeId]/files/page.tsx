import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PageHeader } from "@/components/seller/ui";
import { FilesManager } from "@/components/seller/FilesManager";
import { PLAN_DEFS } from "@/lib/plans";

export const metadata = { title: "Files" };

export default async function FilesPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ folder?: string; q?: string }>;
}) {
  const { storeId } = await params;
  const sp = await searchParams;
  const access = await getStoreAccess(storeId, "media");
  if (!access) notFound();

  const folder = sp.folder;
  const q = sp.q?.trim();

  const [files, folderRows, usage, sub] = await Promise.all([
    db.mediaFile.findMany({
      where: {
        storeId,
        ...(folder && { folder }),
        ...(q && { name: { contains: q } }),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.mediaFile.findMany({
      where: { storeId },
      select: { folder: true },
      distinct: ["folder"],
    }),
    db.mediaFile.aggregate({ where: { storeId }, _sum: { sizeBytes: true } }),
    db.subscription.findFirst({
      where: { storeId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const plan = PLAN_DEFS[(sub?.plan ?? "STARTER") as keyof typeof PLAN_DEFS];

  return (
    <div>
      <PageHeader
        title="Files"
        description="Your media library — images, videos, PDFs, and documents."
      />
      <FilesManager
        storeId={storeId}
        files={files.map((f) => ({
          id: f.id,
          name: f.name,
          folder: f.folder,
          mimeType: f.mimeType,
          sizeBytes: f.sizeBytes,
          url: f.url,
          createdAt: f.createdAt.toISOString(),
        }))}
        folders={folderRows.map((f) => f.folder).sort()}
        activeFolder={folder ?? ""}
        q={q ?? ""}
        usedBytes={usage._sum.sizeBytes ?? 0}
        limitBytes={plan.limits.storageMb * 1024 * 1024}
        planName={plan.name}
      />
    </div>
  );
}
