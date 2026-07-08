import { notFound } from "next/navigation";

import { getLiveStore, trackVisit } from "@/lib/shop/storefront";
import { getStorePage } from "@/lib/shop/pages";

export const metadata = { title: "Terms of Service" };

export default async function TermsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) notFound();
  await trackVisit(store.id, `/shop/${slug}/terms`);

  const page = await getStorePage(store, "terms");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--sf-text)" }}>{page.title}</h1>
      <p className="mt-6 whitespace-pre-line text-[15px] leading-relaxed" style={{ color: "var(--sf-text-dim)" }}>
        {page.content}
      </p>
    </div>
  );
}
