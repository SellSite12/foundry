import { notFound } from "next/navigation";

import { getLiveStore, trackVisit } from "@/lib/shop/storefront";
import { TrackOrderForm } from "@/components/storefront/TrackOrderForm";

export const metadata = { title: "Track your order" };

export default async function TrackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) notFound();
  await trackVisit(store.id, `/shop/${slug}/track`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--sf-text)" }}>
        Track your order
      </h1>
      <p className="mt-3 text-[14.5px]" style={{ color: "var(--sf-text-dim)" }}>
        Enter your order number and the email address you used at checkout.
      </p>
      <TrackOrderForm slug={slug} />
    </div>
  );
}
