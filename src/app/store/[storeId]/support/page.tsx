import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Mail, MessageSquare, FileQuestion } from "lucide-react";

import { getStoreAccess } from "@/lib/seller/access";
import { supportEmailAddress } from "@/lib/admin/access";
import { PageHeader, Panel } from "@/components/seller/ui";
import { SupportTicketsPanel } from "@/components/seller/SupportTicketsPanel";

export const metadata = { title: "Support" };

const FAQ = [
  {
    q: "How do storefront orders work?",
    a: "Customers shop at /shop/your-slug, add items to cart, and checkout with card or wallet. Orders feed the same pipeline as manual orders — inventory decrements, payments are recorded, and you get notifications instantly.",
  },
  {
    q: "Why is my conversion rate showing “—”?",
    a: "Conversion rate = paid orders ÷ storefront visitors. Until your storefront receives traffic, there's no denominator — we show a dash instead of inventing a number.",
  },
  {
    q: "How do I add team members?",
    a: "Go to Team members and invite by email. People with existing Foundry accounts get access instantly; others receive an email and are activated the moment they sign up with that address.",
  },
  {
    q: "Where are my uploaded files stored?",
    a: "In development they're stored on the server disk under /uploads and tracked in the database. For production deploys, point the media handler at object storage (S3/R2) — the data model already stores URLs, so no schema change is needed.",
  },
  {
    q: "How do I switch my store to another currency?",
    a: "Settings → Tax, currency & locale. New products and orders use the new currency; existing orders keep the currency they were created with.",
  },
  {
    q: "Can I delete a product that has orders?",
    a: "Products with order history are archived instead of deleted so your order records and reports stay accurate. Products without orders are deleted permanently.",
  },
];

export default async function SupportPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId);
  if (!access) notFound();

  const supportEmail = supportEmailAddress();

  return (
    <div>
      <PageHeader title="Support" description="Answers, docs, and ways to reach us." />

      <div className="mb-5">
        <SupportTicketsPanel storeId={storeId} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <a
          href={`mailto:${supportEmail}`}
          className="fdy-card-hover rounded-2xl border border-line bg-surface p-5"
        >
          <Mail size={18} className="mb-3 text-copper" />
          <div className="text-[14px] font-semibold text-ink">Email support</div>
          <p className="mt-1 text-[12.5px] text-ink-faint">
            {supportEmail} — replies within one business day.
          </p>
        </a>
        <Link
          href={`/store/${storeId}/inbox`}
          className="fdy-card-hover rounded-2xl border border-line bg-surface p-5"
        >
          <MessageSquare size={18} className="mb-3 text-copper" />
          <div className="text-[14px] font-semibold text-ink">Message customers</div>
          <p className="mt-1 text-[12.5px] text-ink-faint">
            Customer conversations live in your Inbox.
          </p>
        </Link>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="fdy-card-hover rounded-2xl border border-line bg-surface p-5"
        >
          <BookOpen size={18} className="mb-3 text-copper" />
          <div className="text-[14px] font-semibold text-ink">Documentation</div>
          <p className="mt-1 text-[12.5px] text-ink-faint">
            Setup, API reference, and deployment guides live in the project README.
          </p>
        </a>
      </div>

      <Panel
        title="Frequently asked questions"
        description="Real answers about how this dashboard behaves."
      >
        <div className="flex flex-col gap-1">
          {FAQ.map((item) => (
            <details key={item.q} className="group border-b border-line py-3 last:border-0">
              <summary className="flex cursor-pointer items-center gap-2.5 text-[13.5px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                <FileQuestion size={14} className="shrink-0 text-copper" />
                {item.q}
              </summary>
              <p className="mt-2 pl-6 text-[13px] leading-relaxed text-ink-dim">{item.a}</p>
            </details>
          ))}
        </div>
      </Panel>
    </div>
  );
}
