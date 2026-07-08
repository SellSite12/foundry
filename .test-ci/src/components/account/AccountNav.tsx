"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, MapPin, CreditCard, Heart, Star, Settings } from "lucide-react";

const LINKS = [
  { href: "/account", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wallet", label: "Payment methods", icon: CreditCard },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/reviews", label: "My reviews", icon: Star },
  { href: "/settings", label: "Account settings", icon: Settings },
];

export function AccountNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside aria-label="Account navigation">
      <p className="px-3 text-[13px] text-ink-dim">Signed in as</p>
      <p className="mb-4 truncate px-3 text-[15px] font-semibold text-ink">{userName}</p>
      <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                active ? "bg-copper/12 text-copper" : "text-ink-dim hover:bg-hover hover:text-ink"
              }`}
            >
              <Icon size={16} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
