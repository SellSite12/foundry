import type { StoreTheme } from "@prisma/client";

import {
  parseFaq,
  parseSections,
  parseTestimonials,
  themeCssVars,
  type ThemeSection,
} from "@/lib/shop/theme";
import { ratingSummary } from "@/lib/shop/storefront";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";
import { StorefrontHero } from "@/components/storefront/StorefrontHero";
import { StorefrontAmbient } from "@/components/storefront/StorefrontAmbient";
import { ProductCard, SectionHeading, EmptyNote, Stars } from "@/components/storefront/ui";
import "@/app/shop/storefront-effects.css";

type ProductCard = {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  images: { url: string }[];
  trackInventory: boolean;
  stock: number;
  reviews: { rating: number }[];
};

type CollectionCard = {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
};

type StoreInfo = {
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  businessEmail: string | null;
  phone: string | null;
};

export function TemplatePreviewContent({
  store,
  theme,
  products,
  collections,
}: {
  store: StoreInfo;
  theme: StoreTheme;
  products: ProductCard[];
  collections: CollectionCard[];
}) {
  const sections = parseSections(theme);
  const testimonials = parseTestimonials(theme);
  const faq = parseFaq(theme);
  const slug = store.slug;
  const navLinks = [
    { label: "Home", href: "#" },
    { label: "Products", href: "#" },
    { label: "About", href: "#" },
    { label: "FAQ", href: "#" },
    { label: "Contact", href: "#" },
  ];

  return (
    <div
      className="relative flex min-h-full flex-col"
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
        >
          {theme.announcementText}
        </p>
      ) : null}

      <StorefrontHeader
        slug={slug}
        storeName={store.name}
        logo={store.logo}
        headerStyle={theme.headerStyle}
        cartCount={0}
        loggedIn={false}
        navLinks={navLinks}
      />

      <main className="relative z-[1] flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <StorefrontHero
            slug={slug}
            storeName={store.name}
            heroStyle={theme.heroStyle ?? "classic"}
            motionPreset={theme.motionPreset ?? "none"}
            bannerUrl={theme.bannerUrl}
            bannerHeading={theme.bannerHeading}
            bannerSubheading={theme.bannerSubheading}
          />

          {sections.map((section, i) =>
            renderPreviewSection(section, i, { slug, products, collections, testimonials, faq })
          )}
        </div>
      </main>

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

function renderPreviewSection(
  section: ThemeSection,
  key: number,
  ctx: {
    slug: string;
    products: ProductCard[];
    collections: CollectionCard[];
    testimonials: ReturnType<typeof parseTestimonials>;
    faq: ReturnType<typeof parseFaq>;
  }
) {
  switch (section.type) {
    case "featured_products": {
      const items = ctx.products.slice(0, section.limit ?? 8);
      return (
        <section key={key} className="sf-section mt-12" aria-label={section.title ?? "Featured products"}>
          <SectionHeading title={section.title ?? "Featured products"} />
          {items.length === 0 ? (
            <EmptyNote>Your products will appear here once published.</EmptyNote>
          ) : (
            <div className="sf-product-grid grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard
                  key={p.id}
                  product={{
                    name: p.name,
                    slug: p.slug,
                    priceCents: p.priceCents,
                    compareAtCents: p.compareAtCents,
                    currency: p.currency,
                    imageUrl: p.images[0]?.url ?? null,
                    inStock: !p.trackInventory || p.stock > 0,
                    rating: ratingSummary(p.reviews),
                    storeSlug: ctx.slug,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      );
    }
    case "featured_collections": {
      const items = ctx.collections.slice(0, section.limit ?? 4);
      if (items.length === 0) return null;
      return (
        <section key={key} className="sf-section mt-12" aria-label={section.title ?? "Collections"}>
          <SectionHeading title={section.title ?? "Shop by collection"} />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {items.map((c) => (
              <div
                key={c.id}
                className="flex flex-col justify-between border p-4"
                style={{
                  borderRadius: "var(--sf-radius)",
                  borderColor: "var(--sf-card-border)",
                  background: "var(--sf-surface)",
                  minHeight: "100px",
                }}
              >
                <span className="text-[14px] font-semibold" style={{ color: "var(--sf-text)" }}>
                  {c.name}
                </span>
                <span className="text-[12px]" style={{ color: "var(--sf-text-dim)" }}>
                  {c._count.products} product{c._count.products === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </section>
      );
    }
    case "testimonials": {
      if (ctx.testimonials.length === 0) return null;
      return (
        <section key={key} className="sf-section mt-12" aria-label={section.title ?? "Testimonials"}>
          <SectionHeading title={section.title ?? "What customers say"} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ctx.testimonials.map((t, i) => (
              <figure
                key={i}
                className="flex flex-col gap-2 border p-4"
                style={{
                  borderRadius: "var(--sf-radius)",
                  borderColor: "var(--sf-card-border)",
                  background: "var(--sf-surface)",
                }}
              >
                {t.rating ? <Stars average={t.rating} count={0} showCount={false} /> : null}
                <blockquote className="text-[13px] leading-relaxed" style={{ color: "var(--sf-text)" }}>
                  “{t.quote}”
                </blockquote>
                <figcaption className="text-[12px] font-medium" style={{ color: "var(--sf-text-dim)" }}>
                  — {t.author}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      );
    }
    case "faq": {
      if (ctx.faq.length === 0) return null;
      return (
        <section key={key} className="sf-section mt-12" aria-label={section.title ?? "FAQ"}>
          <SectionHeading title={section.title ?? "Frequently asked questions"} />
          <div className="space-y-2">
            {ctx.faq.slice(0, 4).map((f, i) => (
              <div
                key={i}
                className="border p-3"
                style={{
                  borderRadius: "var(--sf-radius)",
                  borderColor: "var(--sf-card-border)",
                  background: "var(--sf-surface)",
                }}
              >
                <p className="text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>
                  {f.question}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: "var(--sf-text-dim)" }}>
                  {f.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      );
    }
    case "rich_text": {
      if (!section.title && !section.body) return null;
      return (
        <section key={key} className="mt-12 text-center">
          {section.title ? (
            <h2 className="text-lg font-semibold" style={{ color: "var(--sf-text)" }}>
              {section.title}
            </h2>
          ) : null}
          {section.body ? (
            <p
              className="mx-auto mt-2 max-w-2xl whitespace-pre-line text-[13.5px] leading-relaxed"
              style={{ color: "var(--sf-text-dim)" }}
            >
              {section.body}
            </p>
          ) : null}
        </section>
      );
    }
    default:
      return null;
  }
}
