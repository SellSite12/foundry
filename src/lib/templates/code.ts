export type CodeTemplateSnapshot = {
  html: string;
  css: string;
  js: string;
};

export type CodeTemplateContext = {
  store: {
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;
    industry: string | null;
  };
  industry: string | null;
  productsGridHtml: string;
  collectionsHtml: string;
  heroHeading: string;
  heroSubheading: string;
};

const STARTER_CSS = `/* Your storefront — edit freely */
:root {
  --brand: #e8a33d;
  --brand-2: #b85c2e;
  --bg: #0c0a09;
  --text: #f2ede4;
  --muted: #b8afa0;
  --radius: 16px;
}

* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); }

.hero {
  position: relative;
  min-height: 420px;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 3rem 1.5rem;
  overflow: hidden;
  border-radius: var(--radius);
  margin: 1.5rem;
}

.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  opacity: 0.9;
}

.hero-inner { position: relative; z-index: 1; max-width: 640px; }
.hero h1 { font-size: clamp(2rem, 6vw, 3.5rem); margin: 0 0 0.75rem; letter-spacing: -0.03em; }
.hero p { color: rgba(255,255,255,0.88); font-size: 1.05rem; line-height: 1.6; margin: 0 0 1.5rem; }
.eyebrow {
  display: inline-block;
  margin-bottom: 1rem;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.6rem;
  border-radius: 999px;
  background: #fff;
  color: #111;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.2s ease;
}
.btn:hover { transform: scale(1.04); }

.section { padding: 2rem 1.5rem 3rem; max-width: 1200px; margin: 0 auto; }
.section h2 { font-size: 1.5rem; margin: 0 0 1.25rem; }

/* Product grid injected by Foundry */
.foundry-products { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
.foundry-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: var(--radius);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease;
}
.foundry-card:hover { transform: translateY(-4px); }
.foundry-card img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: calc(var(--radius) - 4px); }
`;

export const CODE_TEMPLATE_STARTERS: Record<string, { name: string; industry: string; html: string; css: string; js: string }> = {
  blank: {
    name: "Blank canvas",
    industry: "All categories",
    html: `<section class="hero">
  <div class="hero-inner">
    <span class="eyebrow">{{industry}}</span>
    <h1>{{store.name}}</h1>
    <p>{{store.description}}</p>
    <a class="btn" href="/shop/{{store.slug}}/products">Shop collection →</a>
  </div>
</section>

<section class="section">
  <h2>Featured products</h2>
  {{products.grid}}
</section>`,
    css: STARTER_CSS,
    js: "",
  },
  fashion: {
    name: "Fashion lookbook",
    industry: "Fashion & Apparel",
    html: `<section class="hero fashion-hero">
  <div class="hero-inner">
    <span class="eyebrow">New season</span>
    <h1>{{store.name}}</h1>
    <p>{{hero.subheading}}</p>
    <a class="btn" href="/shop/{{store.slug}}/products">View collection</a>
  </div>
</section>
<section class="section">
  <h2>Editor's picks</h2>
  {{products.grid}}
</section>
{{collections.block}}`,
    css: `${STARTER_CSS}
.fashion-hero::before {
  background: linear-gradient(160deg, #1a1a1a 0%, #c9a227 55%, #8b7355 100%);
}
.fashion-hero h1 { font-family: Georgia, serif; font-weight: 400; }
`,
    js: "",
  },
  food: {
    name: "Artisan food",
    industry: "Food & Beverage",
    html: `<section class="hero food-hero">
  <div class="hero-inner">
    <span class="eyebrow">Fresh today</span>
    <h1>{{store.name}}</h1>
    <p>{{hero.subheading}}</p>
    <a class="btn" href="/shop/{{store.slug}}/products">Order now</a>
  </div>
</section>
<section class="section">
  <h2>Menu favorites</h2>
  {{products.grid}}
</section>`,
    css: `${STARTER_CSS}
:root { --brand: #e85d04; --brand-2: #f48c06; --bg: #1a1008; }
.food-hero::before {
  background: radial-gradient(ellipse at 50% 120%, #f97316, #dc2626 40%, #1a1008 70%);
  animation: pulse 6s ease-in-out infinite;
}
@keyframes pulse { 50% { opacity: 1; transform: scale(1.02); } }
`,
    js: "",
  },
  tech: {
    name: "Dev terminal",
    industry: "Software & Digital",
    html: `<section class="hero tech-hero">
  <div class="hero-inner">
    <span class="eyebrow">v2.0 — now shipping</span>
    <h1>{{store.name}}</h1>
    <p>{{hero.subheading}}</p>
    <a class="btn" href="/shop/{{store.slug}}/products">Browse downloads</a>
  </div>
</section>
<section class="section">
  <h2>// popular</h2>
  {{products.grid}}
</section>`,
    css: `${STARTER_CSS}
:root { --brand: #6366f1; --brand-2: #22d3ee; --bg: #050508; }
body { font-family: ui-monospace, monospace; }
.tech-hero::before {
  background:
    linear-gradient(90deg, transparent 49%, rgba(99,102,241,0.15) 50%, transparent 51%),
    linear-gradient(#050508, #050508);
  background-size: 32px 32px, 100% 100%;
}
`,
    js: "",
  },
};

export const DEFAULT_CODE_TEMPLATE = CODE_TEMPLATE_STARTERS.blank;

/** Replace merge tags in seller HTML. */
export function renderCodeTemplate(html: string, ctx: CodeTemplateContext): string {
  const logo = ctx.store.logo
    ? `<img src="${ctx.store.logo}" alt="${ctx.store.name}" style="max-height:48px;margin-bottom:1rem" />`
    : "";

  return html
    .replaceAll("{{store.name}}", escapeHtml(ctx.store.name))
    .replaceAll("{{store.slug}}", escapeHtml(ctx.store.slug))
    .replaceAll("{{store.description}}", escapeHtml(ctx.store.description ?? ""))
    .replaceAll("{{store.logo}}", logo)
    .replaceAll("{{industry}}", escapeHtml(ctx.industry ?? "Your brand"))
    .replaceAll("{{hero.heading}}", escapeHtml(ctx.heroHeading))
    .replaceAll("{{hero.subheading}}", escapeHtml(ctx.heroSubheading))
    .replaceAll("{{products.grid}}", ctx.productsGridHtml)
    .replaceAll("{{collections.block}}", ctx.collectionsHtml);
}

export function stripScriptsFromHtml(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

export function buildProductsGridHtml(
  products: Array<{
    name: string;
    slug: string;
    priceCents: number;
    currency: string;
    images: { url: string }[];
  }>,
  storeSlug: string
): string {
  if (products.length === 0) {
    return `<p style="opacity:0.6">Your products will appear here once published.</p>`;
  }
  return `<div class="foundry-products">${products
    .slice(0, 12)
    .map((p) => {
      const img = p.images[0]?.url
        ? `<img src="${escapeAttr(p.images[0].url)}" alt="${escapeAttr(p.name)}" loading="lazy" />`
        : `<div style="aspect-ratio:1;background:rgba(255,255,255,0.06);border-radius:12px"></div>`;
      const price = (p.priceCents / 100).toFixed(2);
      return `<a class="foundry-card" href="/shop/${escapeAttr(storeSlug)}/products/${escapeAttr(p.slug)}">${img}<strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.currency)} ${price}</span></a>`;
    })
    .join("")}</div>`;
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function parseCodeFromSnapshot(snapshotJson: string): CodeTemplateSnapshot | null {
  try {
    const parsed = JSON.parse(snapshotJson) as { layoutMode?: string; code?: CodeTemplateSnapshot };
    if (parsed.layoutMode === "code" && parsed.code?.html) {
      return {
        html: parsed.code.html,
        css: parsed.code.css ?? "",
        js: parsed.code.js ?? "",
      };
    }
  } catch {
    // ignore
  }
  return null;
}
