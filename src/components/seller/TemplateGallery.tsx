"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Eye, LayoutTemplate, Plus, Sparkles, X } from "lucide-react";

import { api } from "@/lib/client/api";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/seller/ui";
import { TemplateThumbHero } from "@/components/seller/TemplateThumbHero";

type Template = {
  id: string;
  name: string;
  description: string | null;
  tier: string;
  priceCents: number;
  industry: string | null;
  previewColor: string | null;
  isCustom: boolean;
  purchased: boolean;
  heroStyle?: string;
  motionPreset?: string;
  layoutMode?: string;
  visualProfile?: string | null;
};

export function TemplateGallery({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [filter, setFilter] = useState<"all" | "FREE" | "PAID" | "CUSTOM">("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [preview, setPreview] = useState<Template | null>(null);

  const industries = Array.from(
    new Set(templates.map((t) => t.industry).filter((i): i is string => Boolean(i)))
  ).sort();

  const shown = templates.filter((t) => {
    if (filter !== "all" && t.tier !== filter) return false;
    if (industryFilter !== "all" && t.industry !== industryFilter) return false;
    return true;
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api<{ templates: Template[] }>(`/api/store/${storeId}/templates`);
    setLoading(false);
    if (res.ok) setTemplates(res.data.templates);
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function applyTemplate(template: Template) {
    setBusy(template.id);
    setError(null);

    if (template.tier === "PAID" && !template.purchased) {
      const purchase = await api(`/api/store/${storeId}/templates`, {
        method: "POST",
        body: { action: "purchase", templateId: template.id },
      });
      if (!purchase.ok) {
        setError(purchase.error);
        setBusy(null);
        return;
      }
    }

    const res = await api(`/api/store/${storeId}/templates`, {
      method: "POST",
      body: { action: "apply", templateId: template.id },
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function saveCustom() {
    if (!saveName.trim()) return;
    setBusy("save");
    setError(null);
    const res = await api(`/api/store/${storeId}/templates`, {
      method: "POST",
      body: { action: "save", name: saveName.trim() },
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaveOpen(false);
    setSaveName("");
    load();
  }

  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <LayoutTemplate size={16} className="text-copper" />
            Storefront templates
          </div>
          <p className="mt-1 text-[13px] text-ink-dim">
            Preview shows the real design — click <strong className="text-ink">Apply</strong> to switch your live store.
            Templates differ in hero animation, colors, and category styling.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setSaveOpen(true)}>
          <Plus size={14} /> Save as template
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(["all", "FREE", "PAID", "CUSTOM"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg border px-3 py-1 text-[12px] font-medium transition-colors ${
              filter === f ? "border-copper text-copper" : "border-line text-ink-dim hover:text-ink"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {industries.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Category</span>
          <button
            type="button"
            onClick={() => setIndustryFilter("all")}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              industryFilter === "all" ? "border-copper text-copper" : "border-line text-ink-dim hover:text-ink"
            }`}
          >
            All
          </button>
          {industries.map((ind) => (
            <button
              key={ind}
              type="button"
              onClick={() => setIndustryFilter(ind)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                industryFilter === ind ? "border-copper text-copper" : "border-line text-ink-dim hover:text-ink"
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <div className="mb-4"><Alert kind="error">{error}</Alert></div> : null}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border border-line bg-base" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => (
            <div
              key={t.id}
              className="flex flex-col overflow-hidden rounded-xl border border-line bg-base"
            >
              <div className="relative h-28 overflow-hidden">
                <TemplateThumbHero
                  heroStyle={t.layoutMode === "code" ? "hologram" : t.heroStyle}
                  motionPreset={t.motionPreset}
                  previewColor={t.previewColor ?? "#E8A33D"}
                  tier={t.tier}
                />
                <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                  <span
                    className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ background: t.previewColor ?? "#E8A33D", color: "#0C0A09" }}
                  >
                    {t.tier}
                  </span>
                  {t.motionPreset === "premium" ? (
                    <span className="rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      3D
                    </span>
                  ) : null}
                  {t.motionPreset !== "none" ? (
                    <span className="rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      Animated
                    </span>
                  ) : null}
                  {t.layoutMode === "code" ? (
                    <span className="rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      Code
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-3">
                <div className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
                  {t.tier === "PAID" ? <Crown size={13} className="text-copper" /> : null}
                  {t.name}
                </div>
                <p className="mt-1 flex-1 text-[12px] leading-relaxed text-ink-faint">
                  {t.description ?? (t.isCustom ? "Your saved design" : "")}
                </p>
                  {t.industry ? (
                    <span className="sf-template-industry-pill mt-1.5 w-fit">{t.industry}</span>
                  ) : null}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  {t.tier === "PAID" && !t.purchased ? (
                    <span className="text-[12px] font-medium text-copper">
                      {formatMoney(t.priceCents, "USD")}
                    </span>
                  ) : t.tier === "PAID" ? (
                    <span className="flex items-center gap-1 text-[11px] text-ink-faint">
                      <Check size={12} /> Owned
                    </span>
                  ) : (
                    <span className="text-[11px] text-ink-faint">Free</span>
                  )}
                  <div className="flex gap-1.5">
                    <Button
                      className="!px-3 !py-1.5 text-[12px]"
                      variant="secondary"
                      onClick={() => setPreview(t)}
                    >
                      <Eye size={13} /> Preview
                    </Button>
                    <Button
                      className="!px-3 !py-1.5 text-[12px]"
                      loading={busy === t.id}
                      onClick={() => applyTemplate(t)}
                    >
                      {t.tier === "PAID" && !t.purchased ? "Get & apply" : "Apply"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title="Save custom template">
        <p className="mb-3 text-[13px] text-ink-dim">
          Saves your current theme, colors, banner, testimonials, and FAQ as a reusable template.
        </p>
        <Input
          label="Template name"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          placeholder="My brand look"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setSaveOpen(false)}>
            Cancel
          </Button>
          <Button loading={busy === "save"} onClick={saveCustom}>
            <Sparkles size={14} /> Save template
          </Button>
        </div>
      </Modal>

      {preview ? (
        <div className="fixed inset-0 z-[110] flex flex-col bg-base">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold text-ink">{preview.name}</p>
              <p className="text-[12px] text-ink-faint">
                Live preview with your store name, logo, and products — nothing is changed until you apply.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {preview.tier === "PAID" && !preview.purchased ? (
                <span className="text-[12px] font-medium text-copper">
                  {formatMoney(preview.priceCents, "USD")}
                </span>
              ) : null}
              <Button
                className="!px-3 !py-1.5 text-[12px]"
                loading={busy === preview.id}
                onClick={() => {
                  const t = preview;
                  setPreview(null);
                  applyTemplate(t);
                }}
              >
                {preview.tier === "PAID" && !preview.purchased ? "Get & apply" : "Apply template"}
              </Button>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-full p-2 text-ink-dim hover:bg-hover hover:text-ink"
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <iframe
            title={`Preview ${preview.name}`}
            src={`/preview/store/${storeId}/${preview.id}?embed=1`}
            className="min-h-0 flex-1 border-0 bg-base2"
          />
        </div>
      ) : null}
    </div>
  );
}
