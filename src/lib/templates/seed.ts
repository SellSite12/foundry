import { db } from "@/lib/db";
import type { ThemeSnapshot } from "@/lib/templates/theme";
import { DEFAULT_SECTIONS } from "@/lib/shop/theme";
import { button, emailShell } from "@/lib/email/mailer";

const FREE_STOREFRONT: Array<{
  name: string;
  slug: string;
  description: string;
  industry?: string;
  previewColor: string;
  snapshot: ThemeSnapshot;
}> = [
  {
    name: "Classic Copper",
    slug: "classic-copper",
    description: "Warm dark theme with copper accents — the Foundry default.",
    previewColor: "#E8A33D",
    snapshot: {
      primaryColor: "#E8A33D",
      accentColor: "#B85C2E",
      mode: "dark",
      font: "sans",
      headerStyle: "classic",
      footerStyle: "full",
      cardStyle: "rounded",
      buttonStyle: "rounded",
      announcementEnabled: false,
      bannerHeading: "Welcome to our store",
      bannerSubheading: "Quality products, shipped fast.",
      sections: DEFAULT_SECTIONS,
      testimonials: [
        { author: "Alex M.", quote: "Fast shipping and great quality.", rating: 5 },
        { author: "Jordan K.", quote: "Exactly what I was looking for.", rating: 5 },
      ],
      faq: [
        { question: "How long does shipping take?", answer: "Most orders ship within 2 business days." },
        { question: "What is your return policy?", answer: "30-day returns on unused items." },
      ],
    },
  },
  {
    name: "Light Minimal",
    slug: "light-minimal",
    description: "Clean white storefront with subtle borders and centered header.",
    previewColor: "#4A7C59",
    snapshot: {
      primaryColor: "#4A7C59",
      accentColor: "#2D5A3D",
      mode: "light",
      font: "sans",
      headerStyle: "centered",
      footerStyle: "slim",
      cardStyle: "borderless",
      buttonStyle: "pill",
      motionPreset: "subtle",
      bannerHeading: "Simple. Beautiful. Yours.",
      bannerSubheading: "Curated essentials for everyday life.",
      sections: DEFAULT_SECTIONS,
    },
  },
  {
    name: "Bold Serif",
    slug: "bold-serif",
    description: "Editorial feel with serif typography and square cards.",
    previewColor: "#8B4513",
    snapshot: {
      primaryColor: "#8B4513",
      accentColor: "#5C2E0A",
      mode: "dark",
      font: "serif",
      headerStyle: "classic",
      footerStyle: "full",
      cardStyle: "square",
      buttonStyle: "square",
      bannerHeading: "Crafted with care",
      bannerSubheading: "Stories behind every product.",
      sections: DEFAULT_SECTIONS,
    },
  },
  {
    name: "Tech Mono",
    slug: "tech-mono",
    description: "Developer-friendly monospace look for digital products.",
    previewColor: "#3B82F6",
    snapshot: {
      primaryColor: "#3B82F6",
      accentColor: "#1D4ED8",
      mode: "dark",
      font: "mono",
      headerStyle: "minimal",
      footerStyle: "slim",
      cardStyle: "rounded",
      buttonStyle: "rounded",
      heroStyle: "aurora",
      motionPreset: "subtle",
      bannerHeading: "Ship faster",
      bannerSubheading: "Tools built for builders.",
      sections: [
        { type: "featured_products", title: "Popular downloads", limit: 6 },
        { type: "faq", title: "FAQ" },
      ],
    },
  },
  {
    name: "Bakery Warm",
    slug: "bakery-warm",
    description: "Inviting warm tones for food & beverage brands.",
    industry: "Food & Beverage",
    previewColor: "#D97706",
    snapshot: {
      primaryColor: "#D97706",
      accentColor: "#B45309",
      mode: "light",
      font: "serif",
      headerStyle: "centered",
      footerStyle: "full",
      cardStyle: "rounded",
      buttonStyle: "pill",
      bannerHeading: "Baked fresh daily",
      bannerSubheading: "Order online for pickup or delivery.",
      sections: DEFAULT_SECTIONS,
    },
  },
  {
    name: "Beauty Glow",
    slug: "beauty-glow",
    description: "Soft rose and cream palette for beauty & wellness.",
    industry: "Beauty & Cosmetics",
    previewColor: "#DB7093",
    snapshot: {
      primaryColor: "#DB7093",
      accentColor: "#C71585",
      mode: "light",
      font: "sans",
      headerStyle: "centered",
      footerStyle: "full",
      cardStyle: "rounded",
      buttonStyle: "pill",
      bannerHeading: "Glow from within",
      bannerSubheading: "Clean ingredients, real results.",
      sections: DEFAULT_SECTIONS,
    },
  },
];

const PAID_STOREFRONT: typeof FREE_STOREFRONT = [
  {
    name: "Luxury Noir",
    slug: "luxury-noir",
    description: "Rotating gold spotlight, 3D depth, and glowing product cards — haute couture energy.",
    previewColor: "#C9A227",
    snapshot: {
      primaryColor: "#C9A227",
      accentColor: "#8B7355",
      mode: "dark",
      font: "serif",
      headerStyle: "minimal",
      footerStyle: "slim",
      cardStyle: "borderless",
      buttonStyle: "pill",
      heroStyle: "spotlight",
      motionPreset: "premium",
      announcementEnabled: true,
      announcementText: "Complimentary shipping on orders over $150",
      bannerHeading: "The collection",
      bannerSubheading: "Limited editions. Timeless design. Crafted for those who notice the details.",
      sections: [
        { type: "featured_products", title: "Signature pieces", limit: 4 },
        { type: "testimonials", title: "From our clients" },
        { type: "rich_text", title: "Our atelier", body: "Every piece is sculpted, finished, and inspected by hand — heirlooms from the first wear." },
      ],
      testimonials: [
        { author: "Elena R.", quote: "The packaging alone felt like opening a jewel box.", rating: 5 },
        { author: "Marcus T.", quote: "Understated luxury. Exactly what my brand needed.", rating: 5 },
      ],
    },
  },
  {
    name: "Editorial Magazine",
    slug: "editorial-magazine",
    description: "Cinematic widescreen hero, film grain, and staggered section reveals — like a fashion spread.",
    previewColor: "#E63946",
    snapshot: {
      primaryColor: "#1A1A1A",
      accentColor: "#E63946",
      mode: "light",
      font: "serif",
      headerStyle: "classic",
      footerStyle: "full",
      cardStyle: "square",
      buttonStyle: "square",
      heroStyle: "cinematic",
      motionPreset: "cinematic",
      bannerHeading: "The new season",
      bannerSubheading: "Bold silhouettes. Editorial layouts. Your story, told beautifully.",
      sections: [
        { type: "featured_collections", title: "Collections", limit: 6 },
        { type: "featured_products", title: "Editor's picks", limit: 8 },
        { type: "testimonials", title: "Press & praise" },
        { type: "rich_text", title: "Behind the lens", body: "Designed for brands that treat every product drop like a cover story." },
      ],
      testimonials: [
        { author: "Vogue Daily", quote: "A storefront that feels like flipping through a lookbook.", rating: 5 },
      ],
    },
  },
  {
    name: "Neon Pop",
    slug: "neon-pop",
    description: "3D neon grid floor, shimmer headlines, and cyberpunk glow — built for drops and streetwear.",
    previewColor: "#00FF88",
    snapshot: {
      primaryColor: "#00FF88",
      accentColor: "#FF00AA",
      mode: "dark",
      font: "mono",
      headerStyle: "minimal",
      footerStyle: "slim",
      cardStyle: "rounded",
      buttonStyle: "pill",
      heroStyle: "neon-grid",
      motionPreset: "premium",
      announcementEnabled: true,
      announcementText: "⚡ Drop live — limited stock",
      bannerHeading: "NEW DROP",
      bannerSubheading: "Exclusive releases every Friday. Once they're gone, they're gone.",
      sections: [
        { type: "featured_products", title: "Latest drop", limit: 12 },
        { type: "faq", title: "Drop FAQ" },
      ],
      faq: [
        { question: "When do drops go live?", answer: "Every Friday at 12pm EST. Turn on notifications so you never miss one." },
        { question: "Do you restock?", answer: "Rarely — most pieces are one-and-done limited runs." },
      ],
    },
  },
  {
    name: "Aurora Drift",
    slug: "aurora-drift",
    description: "Floating aurora blobs in 3D space with parallax depth — mesmerizing and premium.",
    previewColor: "#7C3AED",
    snapshot: {
      primaryColor: "#7C3AED",
      accentColor: "#06B6D4",
      mode: "dark",
      font: "sans",
      headerStyle: "centered",
      footerStyle: "full",
      cardStyle: "rounded",
      buttonStyle: "pill",
      heroStyle: "aurora",
      motionPreset: "premium",
      bannerHeading: "Drift into color",
      bannerSubheading: "An immersive shopping experience with living gradients and soft 3D motion.",
      sections: [
        { type: "featured_products", title: "Curated for you", limit: 8 },
        { type: "testimonials", title: "Loved by creators" },
        { type: "faq", title: "Questions" },
      ],
      testimonials: [
        { author: "Sasha K.", quote: "Customers literally said wow when they opened our store.", rating: 5 },
        { author: "Devon P.", quote: "The animations are smooth without being distracting.", rating: 5 },
      ],
    },
  },
  {
    name: "Obsidian Depth",
    slug: "obsidian-depth",
    description: "Layered 3D parallax hero with floating elements and dramatic product tilt on hover.",
    previewColor: "#6366F1",
    snapshot: {
      primaryColor: "#6366F1",
      accentColor: "#EC4899",
      mode: "dark",
      font: "sans",
      headerStyle: "minimal",
      footerStyle: "slim",
      cardStyle: "borderless",
      buttonStyle: "rounded",
      heroStyle: "depth",
      motionPreset: "premium",
      announcementEnabled: true,
      announcementText: "Free express shipping this week",
      bannerHeading: "Built in layers",
      bannerSubheading: "Depth, dimension, and motion — a storefront that feels alive.",
      sections: [
        { type: "featured_products", title: "Highlights", limit: 6 },
        { type: "featured_collections", title: "Explore", limit: 4 },
        { type: "rich_text", title: "Why depth matters", body: "Premium brands don't look flat. This template gives your products room to breathe in 3D space." },
      ],
    },
  },
];

const PAID_PRICES: Record<string, number> = {
  "luxury-noir": 2900,
  "editorial-magazine": 3900,
  "neon-pop": 4900,
  "aurora-drift": 5900,
  "obsidian-depth": 6900,
};

type EmailSeed = {
  tier: "FREE" | "PAID";
  kind: "TRANSACTIONAL" | "MARKETING";
  slug: string;
  name: string;
  subject: string;
  preheader: string;
  html: string;
  text: string;
  priceCents?: number;
};

function emailContent(title: string, paragraphs: string[], cta?: { label: string; href: string }) {
  const html = [
    `<p style="margin:0 0 14px;">Hi {{customer.name}},</p>`,
    ...paragraphs.map((p) => `<p style="margin:0 0 14px;">${p}</p>`),
    cta ? button(cta.href, cta.label) : "",
  ].join("");
  const text = paragraphs.map((p) => p.replace(/<[^>]+>/g, "")).join("\n\n");
  return { html, text };
}

const EMAIL_TEMPLATES: EmailSeed[] = [
  {
    tier: "FREE",
    kind: "TRANSACTIONAL",
    slug: "order-confirmation",
    name: "Order confirmation",
    subject: "{{store.name}} — order #{{order.number}} confirmed",
    preheader: "Your order is confirmed",
    ...emailContent(
      "Order confirmed",
      [
        "Thanks for shopping with <strong>{{store.name}}</strong>!",
        "Your order <strong>#{{order.number}}</strong> is confirmed. Total: <strong>{{order.total}}</strong>.",
      ],
      { label: "View order", href: "{{order.url}}" }
    ),
  },
  {
    tier: "FREE",
    kind: "TRANSACTIONAL",
    slug: "shipping-update",
    name: "Shipping update",
    subject: "{{store.name}} — your order has shipped",
    preheader: "Your package is on the way",
    ...emailContent("Your order has shipped", [
      "Good news — your order <strong>#{{order.number}}</strong> from <strong>{{store.name}}</strong> is on its way.",
      "{{order.tracking}}",
    ]),
  },
  {
    tier: "FREE",
    kind: "MARKETING",
    slug: "welcome-newsletter",
    name: "Welcome newsletter",
    subject: "Welcome to {{store.name}}",
    preheader: "Thanks for subscribing",
    ...emailContent(
      "Welcome!",
      [
        "We're glad you're here. <strong>{{store.name}}</strong> is your new favorite place to shop.",
        "Browse our latest products and enjoy exclusive offers.",
      ],
      { label: "Shop now", href: "{{store.url}}" }
    ),
  },
  {
    tier: "FREE",
    kind: "MARKETING",
    slug: "sale-promo",
    name: "Sale promotion",
    subject: "{{store.name}} — limited-time sale",
    preheader: "Don't miss out",
    ...emailContent(
      "Sale ends soon",
      [
        "For a limited time, save on select items at <strong>{{store.name}}</strong>.",
        "Use code <strong>{{discount.code}}</strong> at checkout.",
      ],
      { label: "Shop the sale", href: "{{store.url}}" }
    ),
  },
  {
    tier: "PAID",
    kind: "MARKETING",
    slug: "product-launch",
    name: "Product launch",
    subject: "Introducing something new from {{store.name}}",
    preheader: "Be the first to see it",
    priceCents: 1900,
    ...emailContent(
      "Something new is here",
      [
        "We've been working on this for months — and it's finally ready.",
        "Be among the first to experience our latest launch from <strong>{{store.name}}</strong>.",
      ],
      { label: "See the launch", href: "{{store.url}}" }
    ),
  },
  {
    tier: "PAID",
    kind: "MARKETING",
    slug: "abandoned-cart-premium",
    name: "Abandoned cart (premium)",
    subject: "You left something behind at {{store.name}}",
    preheader: "Complete your order",
    priceCents: 1500,
    ...emailContent(
      "Still thinking it over?",
      [
        "Your cart at <strong>{{store.name}}</strong> is waiting for you.",
        "Items sell out fast — complete your order before they're gone.",
      ],
      { label: "Complete checkout", href: "{{cart.url}}" }
    ),
  },
];

let seeded = false;

export async function ensurePlatformTemplates() {
  if (seeded) return;
  seeded = true;

  for (const t of FREE_STOREFRONT) {
    await db.storefrontTemplate.upsert({
      where: { slug: t.slug },
      create: {
        name: t.name,
        slug: t.slug,
        description: t.description,
        tier: "FREE",
        industry: t.industry,
        previewColor: t.previewColor,
        snapshotJson: JSON.stringify(t.snapshot),
        isPublished: true,
      },
      update: {
        name: t.name,
        description: t.description,
        previewColor: t.previewColor,
        snapshotJson: JSON.stringify(t.snapshot),
        isPublished: true,
      },
    });
  }

  for (const t of PAID_STOREFRONT) {
    await db.storefrontTemplate.upsert({
      where: { slug: t.slug },
      create: {
        name: t.name,
        slug: t.slug,
        description: t.description,
        tier: "PAID",
        priceCents: PAID_PRICES[t.slug] ?? 2900,
        industry: t.industry,
        previewColor: t.previewColor,
        snapshotJson: JSON.stringify(t.snapshot),
        isPublished: true,
      },
      update: {
        name: t.name,
        description: t.description,
        priceCents: PAID_PRICES[t.slug] ?? 2900,
        previewColor: t.previewColor,
        snapshotJson: JSON.stringify(t.snapshot),
        isPublished: true,
      },
    });
  }

  for (const t of EMAIL_TEMPLATES) {
    const existing = await db.emailTemplate.findFirst({
      where: { storeId: null, slug: t.slug },
    });
    const bodyHtml = emailShell("{{title}}", t.html, "{{store.name}}");
    if (existing) {
      await db.emailTemplate.update({
        where: { id: existing.id },
        data: {
          name: t.name,
          subject: t.subject,
          preheader: t.preheader,
          bodyHtml,
          bodyText: t.text,
          priceCents: t.priceCents ?? 0,
        },
      });
    } else {
      await db.emailTemplate.create({
        data: {
          storeId: null,
          tier: t.tier,
          kind: t.kind,
          slug: t.slug,
          name: t.name,
          subject: t.subject,
          preheader: t.preheader,
          bodyHtml,
          bodyText: t.text,
          priceCents: t.priceCents ?? 0,
          isDefault: t.slug === "order-confirmation",
        },
      });
    }
  }
}
