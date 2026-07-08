import Link from "next/link";
import { notFound } from "next/navigation";
import { TicketPercent, Gift, Mail, Zap } from "lucide-react";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { formatMoney } from "@/lib/money";
import { PageHeader, Panel, StatCard } from "@/components/seller/ui";
import { MarketingTools } from "@/components/seller/MarketingTools";

export const metadata = { title: "Marketing" };

export default async function MarketingPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "marketing");
  if (!access) notFound();
  const currency = access.store.currency;

  const [discountCount, giftCards, campaigns, automations] = await Promise.all([
    db.discount.count({ where: { storeId, status: "ACTIVE" } }),
    db.giftCard.findMany({ where: { storeId }, orderBy: { createdAt: "desc" } }),
    db.emailCampaign.findMany({ where: { storeId }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.automationRule.findMany({ where: { storeId } }),
  ]);

  const giftBalance = giftCards.reduce((s, g) => s + g.balanceCents, 0);
  const base = `/store/${storeId}`;

  return (
    <div>
      <PageHeader
        title="Marketing"
        description="Discounts, gift cards, campaigns, and growth automations."
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active discounts"
          value={discountCount}
          icon={<TicketPercent size={15} className="text-copper" />}
        />
        <StatCard
          label="Gift cards issued"
          value={giftCards.length}
          sub={`${formatMoney(giftBalance, currency)} outstanding`}
          icon={<Gift size={15} className="text-copper" />}
        />
        <StatCard
          label="Email campaigns"
          value={campaigns.length}
          icon={<Mail size={15} className="text-copper" />}
        />
        <StatCard
          label="Automations"
          value={automations.filter((a) => a.enabled).length}
          sub={`${automations.length} total`}
          icon={<Zap size={15} className="text-copper" />}
        />
      </div>

      <div className="mb-5">
        <Panel
          title="Discounts & coupons"
          description="Codes, automatic discounts, and bundles."
          actions={
            <Link href={`${base}/discounts`} className="text-[12px] text-copper hover:underline">
              Manage discounts →
            </Link>
          }
        >
          <p className="text-[13px] text-ink-dim">
            {discountCount === 0
              ? "No active discounts. Create codes and automatic discounts from the Discounts page."
              : `${discountCount} active discount${discountCount === 1 ? "" : "s"} ready to apply to orders.`}
          </p>
        </Panel>
      </div>

      <MarketingTools
        storeId={storeId}
        currency={currency}
        giftCards={giftCards.map((g) => ({
          id: g.id,
          code: g.code,
          initialCents: g.initialCents,
          balanceCents: g.balanceCents,
          note: g.note,
          createdAt: g.createdAt.toISOString(),
        }))}
        campaigns={campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          subject: c.subject,
          status: c.status,
          recipientCount: c.recipientCount,
          createdAt: c.createdAt.toISOString(),
        }))}
        automations={automations.map((a) => ({
          id: a.id,
          name: a.name,
          trigger: a.trigger,
          action: a.action,
          enabled: a.enabled,
        }))}
      />
    </div>
  );
}
