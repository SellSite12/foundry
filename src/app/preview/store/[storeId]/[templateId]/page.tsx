import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import {
  publicProductWhere,
  PUBLIC_PRODUCT_CARD_SELECT,
} from "@/lib/shop/storefront";
import { parseSnapshot } from "@/lib/templates/theme";
import { snapshotToPreviewTheme } from "@/lib/templates/preview";
import { TemplatePreviewContent } from "@/components/seller/TemplatePreviewContent";
import { TemplatePreviewFrame } from "@/components/seller/TemplatePreviewFrame";

export const metadata = { title: "Template preview" };

export default async function StandaloneTemplatePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string; templateId: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { storeId, templateId } = await params;
  const { embed } = await searchParams;
  const access = await getStoreAccess(storeId, "settings");
  if (!access) notFound();

  const template = await db.storefrontTemplate.findUnique({ where: { id: templateId } });
  if (!template) notFound();
  if (template.storeId && template.storeId !== storeId) notFound();

  const snapshot = parseSnapshot(template.snapshotJson);
  const theme = snapshotToPreviewTheme(snapshot, storeId);
  const { store } = access;

  const [products, collections] = await Promise.all([
    db.product.findMany({
      where: publicProductWhere(storeId),
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: PUBLIC_PRODUCT_CARD_SELECT,
    }),
    db.collection.findMany({
      where: { storeId },
      take: 6,
      include: { _count: { select: { products: true } } },
    }),
  ]);

  const content = (
    <TemplatePreviewContent
      store={{
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo: store.logo,
        businessEmail: store.businessEmail,
        phone: store.phone,
      }}
      theme={theme}
      products={products}
      collections={collections}
    />
  );

  if (embed === "1") {
    return <div className="min-h-screen">{content}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-base">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <Link
          href={`/store/${storeId}/storefront`}
          className="text-[13px] text-ink-dim hover:text-copper"
        >
          ← Back to storefront
        </Link>
        <span className="text-[13px] font-medium text-ink">{template.name}</span>
      </div>
      <div className="flex flex-1 flex-col" style={{ minHeight: "calc(100vh - 52px)" }}>
        <TemplatePreviewFrame
          badge={
            <span className="rounded-md bg-copper-soft px-2 py-0.5 text-[11px] font-semibold text-copper">
              {template.tier}
            </span>
          }
        >
          {content}
        </TemplatePreviewFrame>
      </div>
    </div>
  );
}
