"use client";

import { useState } from "react";
import { Heart, Link2, Share2 } from "lucide-react";

import { api } from "@/lib/client/api";

export function WishlistButton({
  productId,
  initialWishlisted,
  loggedIn,
}: {
  productId: string;
  initialWishlisted: boolean;
  loggedIn: boolean;
}) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!loggedIn) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setBusy(true);
    const res = await api<{ wishlisted: boolean }>("/api/account/wishlist", {
      method: "POST",
      body: { productId },
    });
    setBusy(false);
    if (res.ok) setWishlisted(res.data.wishlisted);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={wishlisted}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className="inline-flex items-center gap-2 border px-4 py-2 text-[13px] font-medium transition-colors"
      style={{
        borderRadius: "var(--sf-btn-radius)",
        borderColor: wishlisted ? "var(--sf-primary)" : "var(--sf-line)",
        color: wishlisted ? "var(--sf-primary)" : "var(--sf-text-dim)",
      }}
    >
      <Heart size={15} aria-hidden fill={wishlisted ? "currentColor" : "none"} />
      {wishlisted ? "Saved" : "Save"}
    </button>
  );
}

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fall through to copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 border px-4 py-2 text-[13px] font-medium"
      style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "var(--sf-line)", color: "var(--sf-text-dim)" }}
      aria-label="Share this product"
    >
      {copied ? <Link2 size={15} aria-hidden /> : <Share2 size={15} aria-hidden />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
