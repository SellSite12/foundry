"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/client/api";

const STORAGE_KEY = "foundry_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    setVisible(true);
  }, []);

  async function accept(all: boolean) {
    localStorage.setItem(STORAGE_KEY, all ? "all" : "essential");
    setVisible(false);
    await api("/api/consent", {
      method: "POST",
      body: { type: "cookies", granted: true },
    });
    if (all) {
      await api("/api/consent", {
        method: "POST",
        body: { type: "analytics", granted: true },
      });
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6"
    >
      <div className="max-w-3xl mx-auto rounded-xl border border-line-strong bg-surface p-4 md:p-5 shadow-lg">
        <p className="text-sm text-ink mb-3">
          Foundry uses essential cookies for authentication and optional analytics cookies to improve
          the platform. You can change preferences anytime in Settings.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => accept(true)}
            className="px-4 py-2 rounded-full bg-gradient-to-br from-[#E8A33D] to-[#B85C2E] text-[#0C0A09] text-sm font-semibold"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={() => accept(false)}
            className="px-4 py-2 rounded-full border border-line-strong text-ink text-sm"
          >
            Essential only
          </button>
        </div>
      </div>
    </div>
  );
}
