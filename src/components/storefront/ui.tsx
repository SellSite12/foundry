import Link from "next/link";

import { formatMoney } from "@/lib/money";
import { ProductCardLink } from "@/components/storefront/ProductCardLink";

/** Price with optional compare-at strikethrough. */
export function Price({
  priceCents,
  compareAtCents,
  currency,
  size = "md",
}: {
  priceCents: number;
  compareAtCents?: number | null;
  currency: string;
  size?: "sm" | "md" | "lg";
}) {
  const cls = size === "lg" ? "text-2xl" : size === "sm" ? "text-[13px]" : "text-[15px]";
  const onSale = compareAtCents != null && compareAtCents > priceCents;
  return (
    <span className={`inline-flex items-baseline gap-2 ${cls}`}>
      <span className="font-semibold" style={{ color: onSale ? "var(--sf-primary)" : "var(--sf-text)" }}>
        {formatMoney(priceCents, currency)}
      </span>
      {onSale ? (
        <s className="text-[0.8em]" style={{ color: "var(--sf-text-dim)" }}>
          {formatMoney(compareAtCents, currency)}
        </s>
      ) : null}
    </span>
  );
}

export function Stars({ average, count, showCount = true }: { average: number | null; count: number; showCount?: boolean }) {
  if (average === null) {
    return showCount ? (
      <span className="text-[12px]" style={{ color: "var(--sf-text-dim)" }}>
        No reviews yet
      </span>
    ) : null;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px]" aria-label={`Rated ${average} out of 5`}>
      <span aria-hidden style={{ color: "var(--sf-primary)", letterSpacing: "1px" }}>
        {"★".repeat(Math.round(average))}
        <span style={{ opacity: 0.25 }}>{"★".repeat(5 - Math.round(average))}</span>
      </span>
      <span style={{ color: "var(--sf-text-dim)" }}>
        {average}{showCount ? ` (${count})` : ""}
      </span>
    </span>
  );
}

export type ProductCardData = {
  name: string;
  slug: string;
  priceCents: number;
  compareAtCents?: number | null;
  currency: string;
  imageUrl: string | null;
  inStock: boolean;
  rating: { average: number | null; count: number };
  storeName?: string;
  storeSlug: string;
};

/** Product card used across storefront + marketplace grids. */
export function ProductCard({ product, showStore = false }: { product: ProductCardData; showStore?: boolean }) {
  return (
    <ProductCardLink
      href={`/shop/${product.storeSlug}/products/${product.slug}`}
      className="sf-product-card group block overflow-hidden border transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2"
      style={{
        borderRadius: "var(--sf-radius)",
        borderColor: "var(--sf-card-border)",
        background: "var(--sf-surface)",
      }}
    >
      <div className="relative aspect-square overflow-hidden" style={{ background: "var(--sf-bg)" }}>
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl" aria-hidden style={{ color: "var(--sf-text-dim)", opacity: 0.4 }}>
            ◇
          </div>
        )}
        {!product.inStock ? (
          <span
            className="absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ background: "var(--sf-surface)", color: "var(--sf-text-dim)", border: "1px solid var(--sf-line)" }}
          >
            Out of stock
          </span>
        ) : product.compareAtCents != null && product.compareAtCents > product.priceCents ? (
          <span
            className="absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: "var(--sf-primary)", color: "#fff" }}
          >
            Sale
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5 p-3.5">
        {showStore && product.storeName ? (
          <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--sf-text-dim)" }}>
            {product.storeName}
          </span>
        ) : null}
        <span className="line-clamp-2 text-[14px] font-medium" style={{ color: "var(--sf-text)" }}>
          {product.name}
        </span>
        <Stars average={product.rating.average} count={product.rating.count} showCount={product.rating.count > 0} />
        <Price priceCents={product.priceCents} compareAtCents={product.compareAtCents} currency={product.currency} size="sm" />
      </div>
    </ProductCardLink>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--sf-text)" }}>
        {title}
      </h2>
      {action}
    </div>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border px-6 py-10 text-center text-[14px]"
      style={{ borderColor: "var(--sf-line)", color: "var(--sf-text-dim)", borderRadius: "var(--sf-radius)" }}
    >
      {children}
    </div>
  );
}
