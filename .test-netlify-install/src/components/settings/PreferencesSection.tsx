"use client";

import { useState } from "react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { api } from "@/lib/client/api";

type Prefs = {
  theme: string;
  timezone: string;
  language: string;
  emailNotifications: boolean;
  marketingEmails: boolean;
};

const THEME_OPTIONS = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
];

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-[13.5px] font-medium text-[#EFE9DF]">
          {label}
        </span>
        <span className="mt-0.5 block text-[12.5px] text-[#7A7266]">
          {description}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[#E8A33D]" : "bg-[rgba(255,255,255,0.1)]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

export function PreferencesSection({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const result = await api("/api/user/preferences", {
      method: "PATCH",
      body: prefs,
    });

    if (result.ok) {
      setSaved(true);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <Card title="Preferences" description="How Foundry looks and talks to you.">
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        {saved && <Alert kind="success">Preferences saved.</Alert>}

        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-medium text-[#B8AFA0]">Theme</span>
          <div className="flex gap-2">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, theme: opt.value }))}
                className={`rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors ${
                  prefs.theme === opt.value
                    ? "bg-[#E8A33D] text-[#0C0A09]"
                    : "border border-[rgba(232,163,61,0.15)] text-[#B8AFA0] hover:text-[#EFE9DF]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pref-timezone"
              className="text-[12.5px] font-medium text-[#B8AFA0]"
            >
              Timezone
            </label>
            <input
              id="pref-timezone"
              value={prefs.timezone}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, timezone: e.target.value }))
              }
              className="w-full rounded-xl border border-[rgba(232,163,61,0.1)] bg-[#18140F] px-3.5 py-2.5 text-[14px] text-[#EFE9DF] outline-none focus:border-[rgba(232,163,61,0.45)]"
              placeholder="America/Los_Angeles"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pref-language"
              className="text-[12.5px] font-medium text-[#B8AFA0]"
            >
              Language
            </label>
            <select
              id="pref-language"
              value={prefs.language}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, language: e.target.value }))
              }
              className="w-full rounded-xl border border-[rgba(232,163,61,0.1)] bg-[#18140F] px-3.5 py-2.5 text-[14px] text-[#EFE9DF] outline-none focus:border-[rgba(232,163,61,0.45)]"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-[rgba(232,163,61,0.08)] pt-5">
          <Toggle
            checked={prefs.emailNotifications}
            onChange={(v) => setPrefs((p) => ({ ...p, emailNotifications: v }))}
            label="Email notifications"
            description="Order activity, security alerts, and account updates."
          />
          <Toggle
            checked={prefs.marketingEmails}
            onChange={(v) => setPrefs((p) => ({ ...p, marketingEmails: v }))}
            label="Product updates"
            description="Occasional emails about new Foundry features."
          />
        </div>

        <div>
          <Button type="submit" loading={loading}>
            Save preferences
          </Button>
        </div>
      </form>
    </Card>
  );
}
