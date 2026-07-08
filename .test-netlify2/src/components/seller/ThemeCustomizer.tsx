"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Monitor, Tablet, Smartphone, ExternalLink, Check } from "lucide-react";

import { api } from "@/lib/client/api";

type Theme = {
  primaryColor: string;
  accentColor: string;
  mode: string;
  font: string;
  headerStyle: string;
  footerStyle: string;
  cardStyle: string;
  buttonStyle: string;
  announcementText: string | null;
  announcementEnabled: boolean;
  bannerUrl: string | null;
  bannerHeading: string | null;
  bannerSubheading: string | null;
};

type Testimonial = { author: string; quote: string; rating?: number };
type FaqEntry = { question: string; answer: string };

const DEVICE_WIDTHS = { desktop: "100%", tablet: "768px", mobile: "390px" } as const;
type Device = keyof typeof DEVICE_WIDTHS;

const input =
  "w-full rounded-lg border border-line bg-base px-3 py-2 text-[13.5px] text-ink outline-none focus:border-copper";
const label = "mb-1 block text-[12.5px] font-medium text-ink";
const group = "border-b border-line pb-5 pt-5 first:pt-0 last:border-b-0";

function OptionRow({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: [string, string][];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className={label}>{title}</span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={title}>
        {options.map(([key, text]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value === key}
            onClick={() => onChange(key)}
            className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              value === key ? "border-copper text-copper" : "border-line text-ink-dim hover:text-ink"
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ThemeCustomizer({
  storeId,
  storeSlug,
  initialTheme,
  initialTestimonials,
  initialFaq,
}: {
  storeId: string;
  storeSlug: string;
  initialTheme: Theme;
  initialTestimonials: Testimonial[];
  initialFaq: FaqEntry[];
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [faq, setFaq] = useState<FaqEntry[]>(initialFaq);
  const [device, setDevice] = useState<Device>("desktop");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirst = useRef(true);

  const reloadPreview = useCallback(() => {
    iframeRef.current?.contentWindow?.location.reload();
  }, []);

  // Debounced instant save: every change persists, then refreshes the preview.
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      setError(null);
      const res = await api(`/api/store/${storeId}/theme`, {
        method: "PATCH",
        body: {
          primaryColor: theme.primaryColor,
          accentColor: theme.accentColor,
          mode: theme.mode,
          font: theme.font,
          headerStyle: theme.headerStyle,
          footerStyle: theme.footerStyle,
          cardStyle: theme.cardStyle,
          buttonStyle: theme.buttonStyle,
          announcementText: theme.announcementText,
          announcementEnabled: theme.announcementEnabled,
          bannerUrl: theme.bannerUrl,
          bannerHeading: theme.bannerHeading,
          bannerSubheading: theme.bannerSubheading,
          testimonials: testimonials.filter((t) => t.author.trim() && t.quote.trim()),
          faq: faq.filter((f) => f.question.trim() && f.answer.trim()),
        },
      });
      setSaving(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSavedAt(Date.now());
      reloadPreview();
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [theme, testimonials, faq, storeId, reloadPreview]);

  const set = <K extends keyof Theme>(key: K, value: Theme[K]) =>
    setTheme((t) => ({ ...t, [key]: value }));

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      {/* Controls */}
      <div className="fdy-scrollbar max-h-[calc(100vh-180px)] overflow-y-auto rounded-2xl border border-line bg-surface px-5 xl:sticky xl:top-20">
        {/* Colors */}
        <section className={group} aria-label="Colors">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-ink-dim">Colors</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={label}>Primary</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  aria-label="Primary color"
                  className="h-9 w-9 cursor-pointer rounded-lg border border-line bg-transparent"
                />
                <input
                  value={theme.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  aria-label="Primary color hex"
                  className={input}
                />
              </div>
            </div>
            <div>
              <span className={label}>Accent</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.accentColor}
                  onChange={(e) => set("accentColor", e.target.value)}
                  aria-label="Accent color"
                  className="h-9 w-9 cursor-pointer rounded-lg border border-line bg-transparent"
                />
                <input
                  value={theme.accentColor}
                  onChange={(e) => set("accentColor", e.target.value)}
                  aria-label="Accent color hex"
                  className={input}
                />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <OptionRow
              title="Storefront mode"
              options={[["dark", "Dark"], ["light", "Light"]]}
              value={theme.mode}
              onChange={(v) => set("mode", v)}
            />
          </div>
        </section>

        {/* Typography & layout */}
        <section className={group} aria-label="Typography and layout">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-ink-dim">Typography & layout</h3>
          <div className="space-y-3">
            <OptionRow
              title="Font"
              options={[["sans", "Sans"], ["serif", "Serif"], ["mono", "Mono"]]}
              value={theme.font}
              onChange={(v) => set("font", v)}
            />
            <OptionRow
              title="Header style"
              options={[["classic", "Classic"], ["centered", "Centered"], ["minimal", "Minimal"]]}
              value={theme.headerStyle}
              onChange={(v) => set("headerStyle", v)}
            />
            <OptionRow
              title="Footer style"
              options={[["full", "Full"], ["slim", "Slim"]]}
              value={theme.footerStyle}
              onChange={(v) => set("footerStyle", v)}
            />
            <OptionRow
              title="Product cards"
              options={[["rounded", "Rounded"], ["square", "Square"], ["borderless", "Borderless"]]}
              value={theme.cardStyle}
              onChange={(v) => set("cardStyle", v)}
            />
            <OptionRow
              title="Buttons"
              options={[["rounded", "Rounded"], ["pill", "Pill"], ["square", "Square"]]}
              value={theme.buttonStyle}
              onChange={(v) => set("buttonStyle", v)}
            />
          </div>
        </section>

        {/* Announcement bar */}
        <section className={group} aria-label="Announcement bar">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-ink-dim">Announcement bar</h3>
          <label className="mb-3 flex items-center gap-2 text-[13px] text-ink">
            <input
              type="checkbox"
              checked={theme.announcementEnabled}
              onChange={(e) => set("announcementEnabled", e.target.checked)}
            />
            Show announcement bar
          </label>
          <input
            value={theme.announcementText ?? ""}
            onChange={(e) => set("announcementText", e.target.value || null)}
            placeholder="Free shipping on orders over $50!"
            aria-label="Announcement text"
            className={input}
          />
        </section>

        {/* Hero banner */}
        <section className={group} aria-label="Hero banner">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-ink-dim">Promotional banner</h3>
          <div className="space-y-3">
            <div>
              <span className={label}>Heading</span>
              <input
                value={theme.bannerHeading ?? ""}
                onChange={(e) => set("bannerHeading", e.target.value || null)}
                placeholder="Summer collection is here"
                className={input}
              />
            </div>
            <div>
              <span className={label}>Subheading</span>
              <input
                value={theme.bannerSubheading ?? ""}
                onChange={(e) => set("bannerSubheading", e.target.value || null)}
                placeholder="Fresh drops, limited stock."
                className={input}
              />
            </div>
            <div>
              <span className={label}>Banner image URL (optional)</span>
              <input
                value={theme.bannerUrl ?? ""}
                onChange={(e) => set("bannerUrl", e.target.value || null)}
                placeholder="Upload in Files, then paste the URL"
                className={input}
              />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className={group} aria-label="Testimonials">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-ink-dim">Testimonials</h3>
          <div className="space-y-3">
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-xl border border-line p-3">
                <input
                  value={t.author}
                  onChange={(e) =>
                    setTestimonials((arr) => arr.map((x, j) => (j === i ? { ...x, author: e.target.value } : x)))
                  }
                  placeholder="Customer name"
                  aria-label={`Testimonial ${i + 1} author`}
                  className={input}
                />
                <textarea
                  value={t.quote}
                  onChange={(e) =>
                    setTestimonials((arr) => arr.map((x, j) => (j === i ? { ...x, quote: e.target.value } : x)))
                  }
                  placeholder="What they said…"
                  rows={2}
                  aria-label={`Testimonial ${i + 1} quote`}
                  className={`${input} mt-2`}
                />
                <div className="mt-2 flex items-center justify-between">
                  <select
                    value={t.rating ?? 5}
                    onChange={(e) =>
                      setTestimonials((arr) =>
                        arr.map((x, j) => (j === i ? { ...x, rating: parseInt(e.target.value, 10) } : x))
                      )
                    }
                    aria-label={`Testimonial ${i + 1} rating`}
                    className="rounded-lg border border-line bg-base px-2 py-1 text-[12.5px] text-ink"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} star{n === 1 ? "" : "s"}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setTestimonials((arr) => arr.filter((_, j) => j !== i))}
                    className="text-[12px] font-medium text-danger hover:opacity-80"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {testimonials.length < 12 ? (
              <button
                type="button"
                onClick={() => setTestimonials((arr) => [...arr, { author: "", quote: "", rating: 5 }])}
                className="w-full rounded-lg border border-dashed border-line py-2 text-[12.5px] font-medium text-ink-dim hover:border-copper hover:text-copper"
              >
                + Add testimonial
              </button>
            ) : null}
          </div>
        </section>

        {/* FAQ */}
        <section className={group} aria-label="FAQ">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-ink-dim">FAQ</h3>
          <div className="space-y-3">
            {faq.map((f, i) => (
              <div key={i} className="rounded-xl border border-line p-3">
                <input
                  value={f.question}
                  onChange={(e) => setFaq((arr) => arr.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))}
                  placeholder="Question"
                  aria-label={`FAQ ${i + 1} question`}
                  className={input}
                />
                <textarea
                  value={f.answer}
                  onChange={(e) => setFaq((arr) => arr.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))}
                  placeholder="Answer"
                  rows={2}
                  aria-label={`FAQ ${i + 1} answer`}
                  className={`${input} mt-2`}
                />
                <button
                  type="button"
                  onClick={() => setFaq((arr) => arr.filter((_, j) => j !== i))}
                  className="mt-2 text-[12px] font-medium text-danger hover:opacity-80"
                >
                  Remove
                </button>
              </div>
            ))}
            {faq.length < 30 ? (
              <button
                type="button"
                onClick={() => setFaq((arr) => [...arr, { question: "", answer: "" }])}
                className="w-full rounded-lg border border-dashed border-line py-2 text-[12.5px] font-medium text-ink-dim hover:border-copper hover:text-copper"
              >
                + Add FAQ entry
              </button>
            ) : null}
          </div>
        </section>
      </div>

      {/* Live preview */}
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1" role="radiogroup" aria-label="Preview device">
            {(
              [
                ["desktop", Monitor, "Desktop"],
                ["tablet", Tablet, "Tablet"],
                ["mobile", Smartphone, "Mobile"],
              ] as const
            ).map(([key, Icon, text]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={device === key}
                onClick={() => setDevice(key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                  device === key ? "bg-copper/15 text-copper" : "text-ink-dim hover:text-ink"
                }`}
              >
                <Icon size={14} aria-hidden />
                {text}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12.5px] font-medium" role="status" aria-live="polite">
              {saving ? (
                <span className="text-ink-dim">Saving…</span>
              ) : error ? (
                <span className="text-danger">{error}</span>
              ) : savedAt ? (
                <span className="flex items-center gap-1 text-success"><Check size={13} aria-hidden /> Saved</span>
              ) : null}
            </span>
            <a
              href={`/shop/${storeSlug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-ink-dim transition-colors hover:border-copper hover:text-copper"
            >
              <ExternalLink size={13} aria-hidden />
              Open storefront
            </a>
          </div>
        </div>

        <div className="flex justify-center overflow-hidden rounded-2xl border border-line bg-base2 p-3">
          <iframe
            ref={iframeRef}
            src={`/shop/${storeSlug}`}
            title="Storefront live preview"
            className="h-[calc(100vh-240px)] min-h-[480px] rounded-xl border border-line bg-white transition-all duration-300"
            style={{ width: DEVICE_WIDTHS[device], maxWidth: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
