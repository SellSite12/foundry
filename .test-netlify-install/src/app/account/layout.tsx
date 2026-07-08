import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { AccountNav } from "@/components/account/AccountNav";

export const metadata: Metadata = {
  title: { default: "My account — Foundry", template: "%s — Foundry" },
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  return (
    <div className="min-h-screen bg-base text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-base/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/marketplace" className="flex items-center gap-2" aria-label="Foundry marketplace">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-copper text-[15px] font-bold text-white" aria-hidden>
              F
            </span>
            <span className="text-[16px] font-semibold tracking-tight">My account</span>
          </Link>
          <nav className="flex items-center gap-2 text-[13.5px] font-medium" aria-label="Account header">
            <Link href="/marketplace" className="rounded-lg px-3 py-2 text-ink-dim transition-colors hover:text-ink">
              Marketplace
            </Link>
            <Link href="/dashboard" className="rounded-lg border border-line px-3.5 py-2 transition-colors hover:border-copper hover:text-copper">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[220px_1fr]">
        <AccountNav userName={user.name} />
        <main>{children}</main>
      </div>
    </div>
  );
}
