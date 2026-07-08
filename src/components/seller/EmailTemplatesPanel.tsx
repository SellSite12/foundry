"use client";

import { useCallback, useEffect, useState } from "react";
import { Crown, Mail, Plus } from "lucide-react";

import { api } from "@/lib/client/api";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Modal, StatusBadge } from "@/components/seller/ui";

type EmailTemplate = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  kind: string;
  subject: string;
  preheader: string | null;
  priceCents: number;
  isCustom: boolean;
};

type EmailStatus = {
  configured: boolean;
  provider: string;
  fromAddress: string;
  supportAddress: string;
  transactionalReady: boolean;
  marketingReady: boolean;
  notes: string[];
};

export function EmailTemplatesPanel({ storeId }: { storeId: string }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    kind: "MARKETING",
    subject: "",
    bodyHtml: "<p>Hi {{customer.name}},</p><p>Your message here.</p>",
    fromTemplateId: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [tplRes, statusRes] = await Promise.all([
      api<{ templates: EmailTemplate[] }>(`/api/store/${storeId}/email-templates`),
      api<{ email: EmailStatus }>(`/api/store/${storeId}/email/status`),
    ]);
    setLoading(false);
    if (tplRes.ok) setTemplates(tplRes.data.templates);
    if (statusRes.ok) setStatus(statusRes.data.email);
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function createTemplate() {
    setSaving(true);
    setError(null);
    const res = await api(`/api/store/${storeId}/email-templates`, {
      method: "POST",
      body: {
        name: form.name,
        kind: form.kind,
        subject: form.subject,
        bodyHtml: form.bodyHtml,
        fromTemplateId: form.fromTemplateId || undefined,
      },
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setCreateOpen(false);
    setForm({ name: "", kind: "MARKETING", subject: "", bodyHtml: "<p>Hi {{customer.name}},</p><p>Your message here.</p>", fromTemplateId: "" });
    load();
  }

  function startFromTemplate(t: EmailTemplate) {
    setForm({
      name: `${t.name} (copy)`,
      kind: t.kind,
      subject: t.subject,
      bodyHtml: "<p>Hi {{customer.name}},</p><p>Customize your message here.</p>",
      fromTemplateId: t.id,
    });
    setCreateOpen(true);
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <Mail size={16} className="text-copper" />
            Email templates
          </div>
          <p className="mt-1 text-[13px] text-ink-dim">
            Free and premium layouts for order emails and marketing campaigns.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Create template
        </Button>
      </div>

      {status ? (
        <div className="mb-4 rounded-xl border border-line bg-base p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status.configured ? "ACTIVE" : "PAUSED"} />
            <span className="text-[13px] text-ink">
              Email via <strong>{status.provider}</strong>
            </span>
            <span className="text-[12px] text-ink-faint">From: {status.fromAddress}</span>
          </div>
          <ul className="mt-2 space-y-1 text-[12px] text-ink-dim">
            {status.notes.map((n) => (
              <li key={n}>• {n}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <div className="mb-4"><Alert kind="error">{error}</Alert></div> : null}

      {loading ? (
        <div className="h-24 animate-pulse rounded-xl border border-line bg-base" />
      ) : (
        <div className="grid gap-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-base px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
                  {t.tier === "PAID" ? <Crown size={13} className="text-copper" /> : null}
                  {t.name}
                  <span className="rounded-md bg-surface px-1.5 py-0.5 text-[10px] uppercase text-ink-faint">
                    {t.kind}
                  </span>
                  {t.isCustom ? (
                    <span className="rounded-md bg-copper-soft px-1.5 py-0.5 text-[10px] text-copper">
                      Custom
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[12px] text-ink-faint">{t.subject}</p>
              </div>
              <div className="flex items-center gap-2">
                {t.tier === "PAID" ? (
                  <span className="text-[12px] text-copper">{formatMoney(t.priceCents, "USD")}</span>
                ) : null}
                {!t.isCustom ? (
                  <Button className="!px-3 !py-1.5 text-[12px]" variant="secondary" onClick={() => startFromTemplate(t)}>
                    Use as base
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create email template">
        <div className="flex flex-col gap-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="{{store.name}} — your subject" />
          <div>
            <label className="mb-1 block text-[12.5px] font-medium text-ink-dim">Kind</label>
            <select
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value })}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none"
            >
              <option value="MARKETING">Marketing</option>
              <option value="TRANSACTIONAL">Transactional</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[12.5px] font-medium text-ink-dim">Body (HTML)</label>
            <textarea
              value={form.bodyHtml}
              onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
              rows={6}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 font-mono text-[13px] text-ink outline-none"
            />
            <p className="mt-1 text-[11px] text-ink-faint">
              Variables: {"{{store.name}}"}, {"{{customer.name}}"}, {"{{order.number}}"}, {"{{order.total}}"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button loading={saving} onClick={createTemplate}>Save template</Button>
        </div>
      </Modal>
    </div>
  );
}
