"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Bell,
  Settings,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/stores", label: "Stores", icon: Store },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors ${
              active
                ? "bg-[rgba(232,163,61,0.1)] font-medium text-[#E8A33D]"
                : "text-[#B8AFA0] hover:bg-[rgba(255,255,255,0.03)] hover:text-[#EFE9DF]"
            }`}
          >
            <item.icon size={17} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* desktop */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[rgba(232,163,61,0.1)] bg-[#111011] px-4 py-6 lg:flex">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <div className="fdy-display flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[#E8A33D] to-[#B85C2E] font-bold text-[#0C0A09]">
            F
          </div>
          <span className="fdy-display text-[15px] font-semibold text-[#EFE9DF]">
            Foundry
          </span>
        </Link>
        <NavLinks />
        <div className="fdy-mono mt-auto px-2 text-[10px] text-[#7A7266]">
          PHASE 2 · ACCOUNTS
        </div>
      </aside>

      {/* mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-5 left-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#E8A33D] text-[#0C0A09] shadow-lg lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-[rgba(232,163,61,0.15)] bg-[#111011] px-4 py-6">
            <div className="mb-8 flex items-center justify-between px-2">
              <span className="fdy-display text-[15px] font-semibold text-[#EFE9DF]">
                Foundry
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-[#B8AFA0]"
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
