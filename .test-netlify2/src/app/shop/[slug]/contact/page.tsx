import { notFound } from "next/navigation";

import { getLiveStore, trackVisit } from "@/lib/shop/storefront";
import { getStorePage } from "@/lib/shop/pages";
import { ContactForm } from "@/components/storefront/ContactForm";

export const metadata = { title: "Contact" };

export default async function ContactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) notFound();
  await trackVisit(store.id, `/shop/${slug}/contact`);

  const page = await getStorePage(store, "contact");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--sf-text)" }}>{page.title}</h1>
      <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed" style={{ color: "var(--sf-text-dim)" }}>
        {page.content}
      </p>
      {store.businessEmail || store.phone ? (
        <div className="mt-6 flex flex-wrap gap-6 text-[14px]" style={{ color: "var(--sf-text-dim)" }}>
          {store.businessEmail ? (
            <a href={`mailto:${store.businessEmail}`} className="hover:opacity-75" style={{ color: "var(--sf-primary)" }}>
              {store.businessEmail}
            </a>
          ) : null}
          {store.phone ? <span>{store.phone}</span> : null}
        </div>
      ) : null}
      <ContactForm slug={slug} />
    </div>
  );
}
