import { notFound } from "next/navigation";

import { getLiveStore, trackVisit } from "@/lib/shop/storefront";
import { getOrCreateTheme, parseFaq } from "@/lib/shop/theme";
import { EmptyNote } from "@/components/storefront/ui";

export const metadata = { title: "FAQ" };

export default async function FaqPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) notFound();
  await trackVisit(store.id, `/shop/${slug}/faq`);

  const theme = await getOrCreateTheme(store.id);
  const faq = parseFaq(theme);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--sf-text)" }}>
        Frequently asked questions
      </h1>
      <div className="mt-8 space-y-3">
        {faq.length === 0 ? (
          <EmptyNote>
            No FAQ published yet. Have a question? Reach out via the contact page.
          </EmptyNote>
        ) : (
          faq.map((f, i) => (
            <details
              key={i}
              className="border p-5"
              style={{ borderRadius: "var(--sf-radius)", borderColor: "var(--sf-card-border)", background: "var(--sf-surface)" }}
            >
              <summary className="cursor-pointer text-[15px] font-semibold" style={{ color: "var(--sf-text)" }}>
                {f.question}
              </summary>
              <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed" style={{ color: "var(--sf-text-dim)" }}>
                {f.answer}
              </p>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
