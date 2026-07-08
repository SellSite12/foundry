"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Code2, Eye, Play, Save } from "lucide-react";

import { api } from "@/lib/client/api";
import { CODE_TEMPLATE_STARTERS } from "@/lib/templates/code";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/seller/ui";

type Tab = "html" | "css" | "js" | "guide";

const MERGE_TAGS = [
  "{{store.name}}",
  "{{store.slug}}",
  "{{store.description}}",
  "{{store.logo}}",
  "{{industry}}",
  "{{hero.heading}}",
  "{{hero.subheading}}",
  "{{products.grid}}",
  "{{collections.block}}",
];

export function TemplateCodeStudio({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("html");
  const [html, setHtml] = useState(CODE_TEMPLATE_STARTERS.blank.html);
  const [css, setCss] = useState(CODE_TEMPLATE_STARTERS.blank.css);
  const [js, setJs] = useState("");
  const [name, setName] = useState("My coded template");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadCurrent = useCallback(async () => {
    const res = await api<{ code: { html: string; css: string; js: string } | null }>(
      `/api/store/${storeId}/templates/code`
    );
    if (res.ok && res.data.code) {
      setHtml(res.data.code.html);
      setCss(res.data.code.css);
      setJs(res.data.code.js);
    }
  }, [storeId]);

  useEffect(() => {
    if (open) loadCurrent();
  }, [open, loadCurrent]);

  function loadStarter(key: string) {
    const s = CODE_TEMPLATE_STARTERS[key];
    if (!s) return;
    setHtml(s.html);
    setCss(s.css);
    setJs(s.js);
    setName(s.name);
  }

  async function applyLive() {
    setBusy("apply");
    setError(null);
    const res = await api(`/api/store/${storeId}/templates`, {
      method: "POST",
      body: { action: "apply-code", html, css, js },
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
    setOpen(false);
  }

  async function saveTemplate() {
    if (!name.trim()) return;
    setBusy("save");
    setError(null);
    const res = await api(`/api/store/${storeId}/templates`, {
      method: "POST",
      body: { action: "save-code", name: name.trim(), html, css, js },
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function openPreview() {
    setBusy("preview");
    setError(null);
    const res = await api<{ previewUrl: string }>(`/api/store/${storeId}/templates/code`, {
      method: "POST",
      body: { html, css, js },
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setPreviewUrl(res.data.previewUrl);
  }

  const editorValue = tab === "html" ? html : tab === "css" ? css : tab === "js" ? js : "";
  const setEditorValue =
    tab === "html" ? setHtml : tab === "css" ? setCss : tab === "js" ? setJs : () => {};

  return (
    <>
      <div className="mb-5 rounded-2xl border border-copper/30 bg-gradient-to-br from-copper/10 via-base to-base p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <Code2 size={16} className="text-copper" />
              Code your own template
            </div>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-dim">
              Write HTML, CSS, and JavaScript for a fully custom storefront. Use merge tags like{" "}
              <code className="text-copper">{"{{store.name}}"}</code> and{" "}
              <code className="text-copper">{"{{products.grid}}"}</code> — preview live, then apply.
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Code2 size={14} /> Open code studio
          </Button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Template code studio" xl>
        <div className="flex flex-col gap-4 lg:min-h-[70vh]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Starters</span>
            {Object.entries(CODE_TEMPLATE_STARTERS).map(([key, s]) => (
              <button
                key={key}
                type="button"
                onClick={() => loadStarter(key)}
                className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-medium text-ink-dim hover:border-copper hover:text-copper"
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1 border-b border-line pb-2">
            {(["html", "css", "js", "guide"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-1 text-[12px] font-medium uppercase ${
                  tab === t ? "bg-copper-soft text-copper" : "text-ink-dim hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {error ? <Alert kind="error">{error}</Alert> : null}

          {tab === "guide" ? (
            <div className="rounded-xl border border-line bg-base2 p-4 text-[13px] leading-relaxed text-ink-dim">
              <p className="mb-3 text-ink">
                <strong>Merge tags</strong> — replaced with your real store data when previewing or live:
              </p>
              <ul className="mb-4 grid gap-1 sm:grid-cols-2">
                {MERGE_TAGS.map((tag) => (
                  <li key={tag}>
                    <code className="text-copper">{tag}</code>
                  </li>
                ))}
              </ul>
              <p>
                <strong>HTML</strong> — your page structure. No <code>&lt;script&gt;</code> tags; use the JS tab
                instead.
              </p>
              <p className="mt-2">
                <strong>CSS</strong> — full control over layout, animations, and 3D transforms.
              </p>
              <p className="mt-2">
                <strong>JavaScript</strong> — runs after load. Use for counters, parallax, scroll effects, etc.
              </p>
            </div>
          ) : (
            <textarea
              value={editorValue}
              onChange={(e) => setEditorValue(e.target.value)}
              spellCheck={false}
              className="min-h-[320px] flex-1 resize-y rounded-xl border border-line bg-[#0d0c0b] p-4 font-mono text-[13px] leading-relaxed text-[#e8e4dc] outline-none focus:border-copper"
              aria-label={`${tab} editor`}
            />
          )}

          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
            <Input
              label="Template name (when saving)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" loading={busy === "preview"} onClick={openPreview}>
                <Eye size={14} /> Preview
              </Button>
              <Button variant="secondary" loading={busy === "save"} onClick={saveTemplate}>
                <Save size={14} /> Save template
              </Button>
              <Button loading={busy === "apply"} onClick={applyLive}>
                <Play size={14} /> Apply live
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {previewUrl ? (
        <div className="fixed inset-0 z-[120] flex flex-col bg-base">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-[14px] font-semibold text-ink">Code preview</span>
            <Button variant="secondary" className="!px-3 !py-1.5 text-[12px]" onClick={() => setPreviewUrl(null)}>
              Close
            </Button>
          </div>
          <iframe title="Code template preview" src={previewUrl} className="min-h-0 flex-1 border-0" />
        </div>
      ) : null}
    </>
  );
}
