import { buildProductsGridHtml, renderCodeTemplate, stripScriptsFromHtml, type CodeTemplateContext } from "@/lib/templates/code";
import { CodeStorefrontScripts } from "@/components/storefront/CodeStorefrontScripts";

type Product = {
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

type Props = {
  store: {
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;
    industry: string | null;
  };
  html: string;
  css: string;
  js: string;
  products: Product[];
  heroHeading?: string | null;
  heroSubheading?: string | null;
};

export function CodeStorefrontView({ store, html, css, js, products, heroHeading, heroSubheading }: Props) {
  const ctx: CodeTemplateContext = {
    store,
    industry: store.industry,
    productsGridHtml: buildProductsGridHtml(products, store.slug),
    collectionsHtml: "",
    heroHeading: heroHeading ?? store.name,
    heroSubheading: heroSubheading ?? store.description ?? "",
  };

  const rendered = renderCodeTemplate(stripScriptsFromHtml(html), ctx);

  return (
    <div className="code-storefront-root min-h-[60vh]">
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <div dangerouslySetInnerHTML={{ __html: rendered }} />
      <CodeStorefrontScripts js={js} />
    </div>
  );
}
