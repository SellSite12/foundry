import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/session";
import { MarketplaceSearch } from "@/components/storefront/MarketplaceSearch";

export const metadata: Metadata = {
  title: { default: "Marketplace — Foundry", template: "%s — Foundry Marketplace" },
  description: "Browse products from independent sellers on Foundry.",
};

export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-base text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-base/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/marketplace" className="flex shrink-0 items-center gap-2" aria-label="Foundry marketplace home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-copper text-[15px] font-bold text-white" aria-hidden>
              F
            </span>
            <span className="hidden text-[16px] font-semibold tracking-tight sm:block">Marketplace</span>
          </Link>

          <div className="flex-1">
            <MarketplaceSearch />
          </div>

          <nav aria-label="Marketplace navigation" className="flex shrink-0 items-center gap-2 text-[13.5px] font-medium">
            <Link href="/marketplace/search" className="hidden rounded-lg px-3 py-2 text-ink-dim transition-colors hover:text-ink md:block">
              Browse
            </Link>
            {user ? (
              <>
                <Link href="/account" className="rounded-lg px-3 py-2 text-ink-dim transition-colors hover:text-ink">
                  My orders
                </Link>
                <Link href="/dashboard" className="rounded-lg border border-line px-3.5 py-2 transition-colors hover:border-copper hover:text-copper">
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login?next=/marketplace" className="rounded-lg px-3 py-2 text-ink-dim transition-colors hover:text-ink">
                  Sign in
                </Link>
                <Link href="/signup" className="rounded-lg bg-copper px-3.5 py-2 text-white transition-opacity hover:opacity-90">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Map storefront CSS vars onto the app theme so shared cards render natively here. */}
      <main
        className="flex-1"
        style={
          {
            "--sf-primary": "var(--fdy-copper)",
            "--sf-accent": "var(--fdy-copper-deep)",
            "--sf-bg": "var(--fdy-base)",
            "--sf-surface": "var(--fdy-surface)",
            "--sf-text": "var(--fdy-text)",
            "--sf-text-dim": "var(--fdy-text-dim)",
            "--sf-line": "var(--fdy-line)",
            "--sf-radius": "14px",
            "--sf-btn-radius": "10px",
            "--sf-card-border": "var(--fdy-line)",
          } as React.CSSProperties
        }
      >
        {children}
      </main>

      <footer className="mt-16 border-t border-line py-8 text-center text-[13px] text-ink-dim">
        <p>
          © {new Date().getFullYear()} Foundry — every store on this marketplace is independently owned.{" "}
          <Link href="/signup" className="text-copper hover:opacity-80">Open your own store</Link>
        </p>
      </footer>
    </div>
  );
}
