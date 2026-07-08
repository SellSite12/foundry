"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-base">
      <p className="text-6xl font-bold text-danger mb-2">!</p>
      <h1 className="text-xl font-semibold text-ink mb-2">Something went wrong</h1>
      <p className="text-sm text-ink-dim mb-6 max-w-md">
        An unexpected error occurred. You can try again or return to the dashboard.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="px-5 py-2.5 rounded-full bg-gradient-to-br from-[#E8A33D] to-[#B85C2E] text-[#0C0A09] font-semibold text-sm"
        >
          Try again
        </button>
        <a href="/dashboard" className="px-5 py-2.5 rounded-full border border-line-strong text-ink text-sm">
          Dashboard
        </a>
      </div>
    </main>
  );
}
