import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getLiveStore } from "@/lib/shop/storefront";
import { getOrCreateTheme, themeCssVars } from "@/lib/shop/theme";
import { getActiveCart } from "@/lib/shop/cart";
import { getCurrentUser } from "@/lib/auth/session";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";
import { StorefrontAmbient } from "@/components/storefront/StorefrontAmbient";
import "@/app/shop/storefront-effects.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) return { title: "Store not found" };
  return {
    title: { default: store.name, template: `%s — ${store.name}` },
    description: store.description ?? `Shop ${store.name} online.`,
  };
}

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) notFound();

  const [theme, cart, user] = await Promise.all([
    getOrCreateTheme(store.id),
    getActiveCart(store.id),
    getCurrentUser(),
  ]);

  const cartCount =
    cart?.items.filter((i) => !i.savedForLater).reduce((s, i) => s + i.quantity, 0) ?? 0;

  const navLinks = [
    { label: "Home", href: `/shop/${slug}` },
    { label: "Products", href: `/shop/${slug}/products` },
    { label: "About", href: `/shop/${slug}/about` },
    { label: "FAQ", href: `/shop/${slug}/faq` },
    { label: "Contact", href: `/shop/${slug}/contact` },
  ];

  return (
    <div
      className="relative flex min-h-screen flex-col"
      data-sf-hero={theme.heroStyle ?? "classic"}
      data-sf-motion={theme.motionPreset ?? "none"}
      style={{
        ...themeCssVars(theme),
        background: "var(--sf-bg)",
        color: "var(--sf-text)",
        fontFamily: "var(--sf-font)",
      }}
    >
      <StorefrontAmbient
        heroStyle={theme.heroStyle ?? "classic"}
        motionPreset={theme.motionPreset ?? "none"}
        primaryColor={theme.primaryColor}
        accentColor={theme.accentColor}
      />
      {theme.announcementEnabled && theme.announcementText ? (
        <p
          className="px-4 py-2 text-center text-[12.5px] font-medium"
          style={{ background: "var(--sf-primary)", color: "#fff" }}
          role="status"
        >
          {theme.announcementText}
        </p>
      ) : null}

      <StorefrontHeader
        slug={slug}
        storeName={store.name}
        logo={store.logo}
        headerStyle={theme.headerStyle}
        cartCount={cartCount}
        loggedIn={Boolean(user)}
        navLinks={navLinks}
      />

      <main id="main" className="relative z-[1] flex-1">{children}</main>

      <StorefrontFooter
        slug={slug}
        storeName={store.name}
        description={store.description}
        footerStyle={theme.footerStyle}
        businessEmail={store.businessEmail}
        phone={store.phone}
      />
    </div>
  );
}
