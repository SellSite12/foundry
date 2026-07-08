"use client";

import { useState } from "react";
import { MailWarning } from "lucide-react";

import { api } from "@/lib/client/api";

export function VerifyEmailBanner() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function resend() {
    setState("sending");
    const result = await api("/api/auth/resend-verification", {
      method: "POST",
      body: {},
    });
    if (result.ok) {
      setState("sent");
    } else {
      setError(result.error);
      setState("error");
    }
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[rgba(232,163,61,0.3)] bg-[rgba(232,163,61,0.07)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[#E8A33D]">
        <MailWarning size={16} className="mt-0.5 shrink-0" />
        <span>
          Your email address isn&apos;t verified yet. Check your inbox for the
          confirmation link.
        </span>
      </div>
      {state === "sent" ? (
        <span className="shrink-0 text-[12.5px] text-[#86EFAC]">
          Verification email sent.
        </span>
      ) : state === "error" ? (
        <span className="shrink-0 text-[12.5px] text-[#FCA5A5]">{error}</span>
      ) : (
        <button
          onClick={resend}
          disabled={state === "sending"}
          className="shrink-0 self-start rounded-full border border-[rgba(232,163,61,0.4)] px-3.5 py-1.5 text-[12.5px] font-medium text-[#E8A33D] transition-colors hover:bg-[rgba(232,163,61,0.1)] disabled:opacity-50 sm:self-auto"
        >
          {state === "sending" ? "Sending…" : "Resend email"}
        </button>
      )}
    </div>
  );
}
