"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-base">
      <p className="text-6xl font-bold text-copper mb-2">404</p>
      <h1 className="text-xl font-semibold text-ink mb-2">Page not found</h1>
      <p className="text-sm text-ink-dim mb-6 max-w-md">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center px-5 py-2.5 rounded-full bg-gradient-to-br from-[#E8A33D] to-[#B85C2E] text-[#0C0A09] font-semibold text-sm"
      >
        Back to home
      </Link>
    </main>
  );
}
