"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Search, User } from "lucide-react";

import { CartBadge } from "@/components/storefront/CartBadge";

type NavLink = { label: string; href: string };

export function StorefrontHeader({
  slug,
  storeName,
  logo,
  headerStyle,
  cartCount,
  loggedIn,
  navLinks,
}: {
  slug: string;
  storeName: string;
  logo: string | null;
  headerStyle: string;
  cartCount: number;
  loggedIn: boolean;
  navLinks: NavLink[];
}) {
  const [open, setOpen] = useState(false);
  const centered = headerStyle === "centered";
  const minimal = headerStyle === "minimal";

  const brand = (
    <Link href={`/shop/${slug}`} className="flex items-center gap-2.5" aria-label={`${storeName} home`}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-8 w-8 rounded-lg object-cover" />
      ) : (
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[15px] font-bold"
          style={{ background: "var(--sf-primary)", color: "#fff" }}
          aria-hidden
        >
          {storeName.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="text-[17px] font-semibold tracking-tight" style={{ color: "var(--sf-text)" }}>
        {storeName}
      </span>
    </Link>
  );

  const nav = (
    <nav aria-label="Store navigation" className={minimal ? "hidden" : "hidden items-center gap-1 md:flex"}>
      {navLinks.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors hover:opacity-75"
          style={{ color: "var(--sf-text-dim)" }}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );

  const actions = (
    <div className="flex items-center gap-1">
      <Link
        href={`/shop/${slug}/products`}
        aria-label="Search products"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:opacity-80"
        style={{ color: "var(--sf-text)" }}
      >
        <Search size={19} aria-hidden />
      </Link>
      <Link
        href={loggedIn ? "/account" : `/login?next=/shop/${slug}`}
        aria-label={loggedIn ? "My account" : "Sign in"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:opacity-80"
        style={{ color: "var(--sf-text)" }}
      >
        <User size={19} aria-hidden />
      </Link>
      <CartBadge slug={slug} initialCount={cartCount} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full md:hidden"
        style={{ color: "var(--sf-text)" }}
      >
        {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
      </button>
    </div>
  );

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{ borderColor: "var(--sf-line)", background: "color-mix(in srgb, var(--sf-bg) 88%, transparent)" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {centered ? (
          <div className="flex flex-col items-center gap-1 py-3">
            <div className="flex w-full items-center justify-between">
              <span className="w-10 md:w-40" aria-hidden />
              {brand}
              {actions}
            </div>
            {nav}
          </div>
        ) : (
          <div className="flex h-16 items-center justify-between gap-4">
            {brand}
            {nav}
            {actions}
          </div>
        )}
      </div>
      {open ? (
        <nav
          aria-label="Mobile navigation"
          className="border-t px-4 py-3 md:hidden"
          style={{ borderColor: "var(--sf-line)", background: "var(--sf-bg)" }}
        >
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-[14px] font-medium"
              style={{ color: "var(--sf-text)" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
