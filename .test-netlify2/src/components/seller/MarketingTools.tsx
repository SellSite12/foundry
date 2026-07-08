"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Gift, Mail, ShoppingCart, Users, Link2 } from "lucide-react";

import { api } from "@/lib/client/api";
import { formatMoney, toCents } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Panel, Modal, StatusBadge } from "@/components/seller/ui";

type GiftCard = {
  id: string;
  code: string;
  initialCents: number;
  balanceCents: number;
  note: string | null;
  createdAt: string;
};
type Campaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  recipientCount: number;
  createdAt: string;
};
type Automation = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
};

/** Growth automations backed by the automation rule engine. */
const FOUNDATIONS = [
  {
    trigger: "CART_ABANDONED",
    name: "Abandoned cart recovery",
    icon: ShoppingCart,
    blurb: "Email shoppers who leave items in their cart. Activates with the Phase 4 storefront.",
  },
  {
    trigger: "REFERRAL_SIGNUP",
    name: "Referral program",
    icon: Users,
    blurb: "Reward customers who bring in new buyers. Activates with Phase 4 checkout.",
  },
  {
    trigger: "AFFILIATE_SALE",
    name: "Affiliate program",
    icon: Link2,
    blurb: "Track and pay commission on affiliate-driven sales. Activates in Phase 4.",
  },
] as const;

export function MarketingTools({
  storeId,
  currency,
  giftCards,
  campaigns,
  automations,
}: {
  storeId: string;
  currency: string;
  giftCards: GiftCard[];
  campaigns: Campaign[];
  automations: Automation[];
}) {
  const router = useRouter();
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftAmount, setGiftAmount] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: "", subject: "", body: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState<string | null>(null);

  async function createGiftCard(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await api<{ giftCard: { code: string } }>(
      `/api/store/${storeId}/giftcards`,
      { method: "POST", body: { initialCents: toCents(giftAmount), note: giftNote || null } }
    );
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setNewCode(res.data.giftCard.code);
    setGiftAmount("");
    setGiftNote("");
    router.refresh();
  }

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await api(`/api/store/${storeId}/campaigns`, {
      method: "POST",
      body: {
        name: campaignForm.name,
        subject: campaignForm.subject,
        body: campaignForm.body || null,
      },
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setCampaignOpen(false);
    setCampaignForm({ name: "", subject: "", body: "" });
    router.refresh();
  }

  async function toggleFoundation(trigger: string, existing?: Automation) {
    if (existing) {
      await api(`/api/store/${storeId}/automations?id=${existing.id}`, {
        method: "PATCH",
        body: { enabled: !existing.enabled },
      });
    } else {
      const def = FOUNDATIONS.find((f) => f.trigger === trigger)!;
      await api(`/api/store/${storeId}/automations`, {
        method: "POST",
        body: { name: def.name, trigger, action: "SEND_EMAIL", enabled: true },
      });
    }
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Gift cards */}
      <Panel
        title="Gift cards"
        actions={
          <Button variant="ghost" onClick={() => setGiftOpen(true)}>
            <Plus size={13} /> Issue
          </Button>
        }
      >
        {giftCards.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <Gift size={18} className="mb-2 text-ink-faint" />
            <p className="text-[13px] text-ink-faint">
              No gift cards issued. Each card gets a unique redeemable code.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {giftCards.slice(0, 6).map((g) => (
              <div key={g.id} className="flex items-center justify-between text-[13px]">
                <div>
                  <code className="fdy-mono text-[12px] text-copper">{g.code}</code>
                  {g.note && <div className="text-[11px] text-ink-faint">{g.note}</div>}
                </div>
                <span className="fdy-mono text-ink">
                  {formatMoney(g.balanceCents, currency)}
                  <span className="text-ink-faint"> / {formatMoney(g.initialCents, currency)}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Campaigns */}
      <Panel
        title="Email campaigns"
        description="Draft and schedule campaigns. Sending pipelines connect in Phase 4."
        actions={
          <Button variant="ghost" onClick={() => setCampaignOpen(true)}>
            <Plus size={13} /> New campaign
          </Button>
        }
      >
        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <Mail size={18} className="mb-2 text-ink-faint" />
            <p className="text-[13px] text-ink-faint">No campaigns yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {campaigns.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-[13px]">
                <div>
                  <div className="font-medium text-ink">{c.name}</div>
                  <div className="text-[11.5px] text-ink-faint">{c.subject}</div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Foundations */}
      {FOUNDATIONS.map((f) => {
        const existing = automations.find((a) => a.trigger === f.trigger);
        const enabled = existing?.enabled ?? false;
        return (
          <Panel key={f.trigger} title={f.name}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-copper-soft text-copper">
                  <f.icon size={16} />
                </div>
                <p className="text-[12.5px] leading-relaxed text-ink-dim">{f.blurb}</p>
              </div>
              <button
                onClick={() => toggleFoundation(f.trigger, existing)}
                role="switch"
                aria-checked={enabled}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  enabled ? "bg-copper" : "bg-hover border border-line-strong"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    enabled ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </Panel>
        );
      })}

      <Modal
        open={giftOpen}
        onClose={() => {
          setGiftOpen(false);
          setNewCode(null);
        }}
        title="Issue gift card"
      >
        {newCode ? (
          <div className="flex flex-col items-center gap-4 py-3 text-center">
            <p className="text-[13px] text-ink-dim">Gift card created. Share this code:</p>
            <code className="fdy-mono fdy-pop rounded-xl bg-copper-soft px-5 py-3 text-[16px] font-bold text-copper">
              {newCode}
            </code>
            <Button variant="secondary" onClick={() => setNewCode(null)}>
              Issue another
            </Button>
          </div>
        ) : (
          <form onSubmit={createGiftCard} className="flex flex-col gap-4" noValidate>
            {error && <Alert kind="error">{error}</Alert>}
            <Input
              label={`Value (${currency})`}
              type="number"
              min="1"
              step="0.01"
              value={giftAmount}
              onChange={(e) => setGiftAmount(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Note (optional)"
              value={giftNote}
              onChange={(e) => setGiftNote(e.target.value)}
              placeholder="Holiday giveaway"
            />
            <Button type="submit" loading={saving} full>
              <Gift size={14} /> Issue gift card
            </Button>
          </form>
        )}
      </Modal>

      <Modal open={campaignOpen} onClose={() => setCampaignOpen(false)} title="New email campaign" wide>
        <form onSubmit={createCampaign} className="flex flex-col gap-4" noValidate>
          {error && <Alert kind="error">{error}</Alert>}
          <Input
            label="Campaign name"
            value={campaignForm.name}
            onChange={(e) => setCampaignForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Email subject"
            value={campaignForm.subject}
            onChange={(e) => setCampaignForm((f) => ({ ...f, subject: e.target.value }))}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-medium text-ink-dim">Body</label>
            <textarea
              value={campaignForm.body}
              onChange={(e) => setCampaignForm((f) => ({ ...f, body: e.target.value }))}
              rows={6}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none"
            />
          </div>
          <Button type="submit" loading={saving} full>
            Save as draft
          </Button>
        </form>
      </Modal>
    </div>
  );
}
