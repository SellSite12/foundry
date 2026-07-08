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
    description: "Versatile warm dark theme — works for any store getting started.",
    industry: "All categories",
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
      motionPreset: "subtle",
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
    name: "Boutique Light",
    slug: "light-minimal",
    description: "Airy boutique layout for fashion, gifts, and lifestyle brands.",
    industry: "Fashion & Apparel",
    previewColor: "#C4A484",
    snapshot: {
      primaryColor: "#8B6F5C",
      accentColor: "#C4A484",
      mode: "light",
      font: "serif",
      headerStyle: "centered",
      footerStyle: "slim",
      cardStyle: "borderless",
      buttonStyle: "pill",
      motionPreset: "subtle",
      bannerHeading: "Curated for you",
      bannerSubheading: "Timeless pieces for everyday elegance.",
      sections: [
        { type: "featured_products", title: "New arrivals", limit: 8 },
        { type: "featured_collections", title: "Shop the look", limit: 4 },
        { type: "testimonials", title: "Customer love" },
      ],
    },
  },
  {
    name: "Artisan Kitchen",
    slug: "bakery-warm",
    description: "Warm sunrise hero with rising steam — perfect for bakeries, cafés, and food brands.",
    industry: "Food & Beverage",
    previewColor: "#E85D04",
    snapshot: {
      primaryColor: "#E85D04",
      accentColor: "#F48C06",
      mode: "light",
      font: "serif",
      headerStyle: "centered",
      footerStyle: "full",
      cardStyle: "rounded",
      buttonStyle: "pill",
      heroStyle: "sunrise",
      motionPreset: "subtle",
      bannerHeading: "Baked with love",
      bannerSubheading: "Fresh from our kitchen to your table — order for pickup or delivery.",
      sections: [
        { type: "featured_products", title: "Today's favorites", limit: 6 },
        { type: "testimonials", title: "What locals say" },
        { type: "faq", title: "Ordering FAQ" },
      ],
      faq: [
        { question: "Do you offer same-day pickup?", answer: "Yes — order by 2pm for same-day pickup." },
        { question: "Do you cater events?", answer: "We do! Contact us for custom catering menus." },
      ],
    },
  },
  {
    name: "Glow Ritual",
    slug: "beauty-glow",
    description: "Soft bokeh lights and rose tones for skincare, cosmetics, and wellness.",
    industry: "Beauty & Cosmetics",
    previewColor: "#E8A0BF",
    snapshot: {
      primaryColor: "#DB7093",
      accentColor: "#E8A0BF",
      mode: "light",
      font: "sans",
      headerStyle: "centered",
      footerStyle: "full",
      cardStyle: "rounded",
      buttonStyle: "pill",
      heroStyle: "bokeh",
      motionPreset: "subtle",
      bannerHeading: "Your glow, elevated",
      bannerSubheading: "Clean formulas. Visible results. A ritual you'll actually love.",
      sections: [
        { type: "featured_products", title: "Bestsellers", limit: 6 },
        { type: "testimonials", title: "Real results" },
        { type: "rich_text", title: "Our promise", body: "Cruelty-free, transparent ingredients, and formulas dermatologist-tested for sensitive skin." },
      ],
    },
  },
  {
    name: "Code Terminal",
    slug: "tech-mono",
    description: "Holographic grid hero for SaaS, plugins, templates, and digital downloads.",
    industry: "Software & Digital",
    previewColor: "#3B82F6",
    snapshot: {
      primaryColor: "#3B82F6",
      accentColor: "#06B6D4",
      mode: "dark",
      font: "mono",
      headerStyle: "minimal",
      footerStyle: "slim",
      cardStyle: "rounded",
      buttonStyle: "rounded",
      heroStyle: "hologram",
      motionPreset: "subtle",
      bannerHeading: "Ship faster",
      bannerSubheading: "Production-ready tools for developers who hate boilerplate.",
      sections: [
        { type: "featured_products", title: "Popular downloads", limit: 6 },
        { type: "faq", title: "Licensing FAQ" },
      ],
      faq: [
        { question: "What license do I get?", answer: "All products include a commercial license for unlimited projects." },
        { question: "Are updates included?", answer: "Yes — lifetime updates on every purchase." },
      ],
    },
  },
  {
    name: "Home Haven",
    slug: "home-haven",
    description: "Marble textures and warm neutrals for furniture, décor, and home goods.",
    industry: "Home & Decor",
    previewColor: "#A68A64",
    snapshot: {
      primaryColor: "#8B7355",
      accentColor: "#C4A77D",
      mode: "light",
      font: "serif",
      headerStyle: "classic",
      footerStyle: "full",
      cardStyle: "borderless",
      buttonStyle: "rounded",
      heroStyle: "marble",
      motionPreset: "subtle",
      bannerHeading: "Elevate your space",
      bannerSubheading: "Handpicked home pieces that make every room feel intentional.",
      sections: [
        { type: "featured_collections", title: "Shop by room", limit: 4 },
        { type: "featured_products", title: "Featured pieces", limit: 8 },
      ],
    },
  },
  {
    name: "Pulse Fit",
    slug: "fitness-fresh",
    description: "Orbiting energy rings for gyms, supplements, and activewear brands.",
    industry: "Health & Fitness",
    previewColor: "#22C55E",
    snapshot: {
      primaryColor: "#22C55E",
      accentColor: "#16A34A",
      mode: "dark",
      font: "sans",
      headerStyle: "minimal",
      footerStyle: "slim",
      cardStyle: "rounded",
      buttonStyle: "pill",
      heroStyle: "orbit",
      motionPreset: "subtle",
      bannerHeading: "Train harder",
      bannerSubheading: "Gear and supplements built for athletes who don't settle.",
      sections: [
        { type: "featured_products", title: "Top picks", limit: 8 },
        { type: "testimonials", title: "Athlete approved" },
      ],
    },
  },
  {
    name: "Paw & Co",
    slug: "pet-corner",
    description: "Playful aurora gradients for pet food, toys, and accessories.",
    industry: "Pet Supplies",
    previewColor: "#F59E0B",
    snapshot: {
      primaryColor: "#F59E0B",
      accentColor: "#F97316",
      mode: "light",
      font: "sans",
      headerStyle: "centered",
      footerStyle: "full",
      cardStyle: "rounded",
      buttonStyle: "pill",
      heroStyle: "aurora",
      motionPreset: "subtle",
      bannerHeading: "Happy pets, happy life",
      bannerSubheading: "Premium nutrition and toys your furry family will obsess over.",
      sections: DEFAULT_SECTIONS,
    },
  },
];

const PAID_STOREFRONT: typeof FREE_STOREFRONT = [
  {
    name: "Runway Luxe",
    slug: "luxury-noir",
    description: "Flowing marble veins, gold shimmer type, and 3D tilt cards — haute couture energy.",
    industry: "Fashion & Apparel",
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
      heroStyle: "marble",
      motionPreset: "premium",
      announcementEnabled: true,
      announcementText: "Complimentary shipping on orders over $150",
      bannerHeading: "The new collection",
      bannerSubheading: "Limited runway pieces. Sculpted silhouettes. Crafted for those who lead, not follow.",
      sections: [
        { type: "featured_products", title: "Signature pieces", limit: 4 },
        { type: "testimonials", title: "From our clients" },
        { type: "rich_text", title: "The atelier", body: "Every garment is cut, draped, and finished by hand in our studio — heirlooms from the first wear." },
      ],
      testimonials: [
        { author: "Elena R.", quote: "The packaging alone felt like opening a jewel box.", rating: 5 },
        { author: "Marcus T.", quote: "My customers think we hired a luxury agency.", rating: 5 },
      ],
    },
  },
  {
    name: "Goldsmith",
    slug: "goldsmith",
    description: "Twin rotating spotlights and velvet-dark backdrop for fine jewelry and watches.",
    industry: "Jewelry & Watches",
    previewColor: "#D4AF37",
    snapshot: {
      primaryColor: "#D4AF37",
      accentColor: "#B8860B",
      mode: "dark",
      font: "serif",
      headerStyle: "minimal",
      footerStyle: "slim",
      cardStyle: "borderless",
      buttonStyle: "pill",
      heroStyle: "spotlight",
      motionPreset: "premium",
      announcementEnabled: true,
      announcementText: "Complimentary gift wrapping on all orders",
      bannerHeading: "Timeless by design",
      bannerSubheading: "Hand-set stones and precious metals — each piece tells a story worth keeping.",
      sections: [
        { type: "featured_products", title: "Signature collection", limit: 4 },
        { type: "testimonials", title: "Heirloom stories" },
        { type: "rich_text", title: "Craftsmanship", body: "Every piece is inspected under magnification and arrives in a presentation box worthy of the moment." },
      ],
      testimonials: [
        { author: "Sarah L.", quote: "The engagement ring presentation made us both cry.", rating: 5 },
      ],
    },
  },
  {
    name: "Glow Lab",
    slug: "glow-lab",
    description: "Drifting bokeh orbs and glass cards for premium skincare and wellness brands.",
    industry: "Skincare & Wellness",
    previewColor: "#F472B6",
    snapshot: {
      primaryColor: "#EC4899",
      accentColor: "#F9A8D4",
      mode: "light",
      font: "sans",
      headerStyle: "centered",
      footerStyle: "full",
      cardStyle: "rounded",
      buttonStyle: "pill",
      heroStyle: "bokeh",
      motionPreset: "premium",
      bannerHeading: "Science meets ritual",
      bannerSubheading: "Clinical-grade actives in formulas so luxurious, you'll never skip a step.",
      sections: [
        { type: "featured_products", title: "The routine", limit: 6 },
        { type: "testimonials", title: "Before & after stories" },
        { type: "faq", title: "Ingredients & care" },
      ],
      testimonials: [
        { author: "Mia C.", quote: "My skin has never looked this good — customers DM me asking what I use.", rating: 5 },
        { author: "Dr. Kim", quote: "Finally a storefront as polished as the formulas inside.", rating: 5 },
      ],
    },
  },
  {
    name: "Farm & Table",
    slug: "farm-table",
    description: "Rising steam, golden sunrise glow, and warm typography for gourmet food brands.",
    industry: "Gourmet Food",
    previewColor: "#DC2626",
    snapshot: {
      primaryColor: "#DC2626",
      accentColor: "#F97316",
      mode: "light",
      font: "serif",
      headerStyle: "centered",
      footerStyle: "full",
      cardStyle: "rounded",
      buttonStyle: "pill",
      heroStyle: "sunrise",
      motionPreset: "premium",
      announcementEnabled: true,
      announcementText: "Free shipping on orders over $75",
      bannerHeading: "From farm to your table",
      bannerSubheading: "Small-batch ingredients, honest sourcing, and flavors that taste like memory.",
      sections: [
        { type: "featured_products", title: "Seasonal picks", limit: 8 },
        { type: "testimonials", title: "Food lovers say" },
        { type: "rich_text", title: "Our sourcing", body: "We partner with 12 local farms and roast, jar, and ship everything within 48 hours of production." },
      ],
    },
  },
  {
    name: "Iron Pulse",
    slug: "iron-pulse",
    description: "3D orbital rings and pulsing energy core for supplements and performance gear.",
    industry: "Fitness & Sports",
    previewColor: "#22D3EE",
    snapshot: {
      primaryColor: "#22D3EE",
      accentColor: "#06B6D4",
      mode: "dark",
      font: "sans",
      headerStyle: "minimal",
      footerStyle: "slim",
      cardStyle: "rounded",
      buttonStyle: "pill",
      heroStyle: "orbit",
      motionPreset: "premium",
      announcementEnabled: true,
      announcementText: "⚡ Launch week — 20% off all performance gear",
      bannerHeading: "Unleash your potential",
      bannerSubheading: "Engineered for PRs. Trusted by athletes who train before the sun comes up.",
      sections: [
        { type: "featured_products", title: "Performance essentials", limit: 8 },
        { type: "testimonials", title: "Athlete tested" },
        { type: "faq", title: "Supplement guide" },
      ],
      testimonials: [
        { author: "Coach Rivera", quote: "My athletes actually buy from the store now — it looks legit.", rating: 5 },
      ],
    },
  },
  {
    name: "Street Drop",
    slug: "neon-pop",
    description: "Dual neon grid floors, shimmer headlines, and cyberpunk glow for streetwear drops.",
    industry: "Streetwear & Sneakers",
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
      announcementText: "⚡ DROP LIVE — limited stock",
      bannerHeading: "THE DROP",
      bannerSubheading: "Exclusive releases every Friday. Once they're gone, they're gone forever.",
      sections: [
        { type: "featured_products", title: "Latest drop", limit: 12 },
        { type: "faq", title: "Drop rules" },
      ],
      faq: [
        { question: "When do drops go live?", answer: "Every Friday at 12pm EST. Turn on notifications." },
        { question: "Do you restock?", answer: "Rarely — most pieces are one-and-done limited runs." },
      ],
    },
  },
  {
    name: "Code Forge",
    slug: "code-forge",
    description: "Holographic sheen and scan-line grid for SaaS, APIs, and digital product launches.",
    industry: "SaaS & Digital Products",
    previewColor: "#6366F1",
    snapshot: {
      primaryColor: "#6366F1",
      accentColor: "#22D3EE",
      mode: "dark",
      font: "mono",
      headerStyle: "minimal",
      footerStyle: "slim",
      cardStyle: "rounded",
      buttonStyle: "rounded",
      heroStyle: "hologram",
      motionPreset: "premium",
      bannerHeading: "Build the future",
      bannerSubheading: "Ship production-ready tools in hours, not months. Your stack, supercharged.",
      sections: [
        { type: "featured_products", title: "Top downloads", limit: 6 },
        { type: "testimonials", title: "Developer reviews" },
        { type: "faq", title: "Licensing" },
      ],
      testimonials: [
        { author: "DevRel Weekly", quote: "The only digital storefront that looks as good as the product.", rating: 5 },
      ],
    },
  },
  {
    name: "Artist Prism",
    slug: "artist-prism",
    description: "Rotating color prisms and iridescent motion for art prints, ceramics, and handmade goods.",
    industry: "Art & Handmade",
    previewColor: "#A855F7",
    snapshot: {
      primaryColor: "#A855F7",
      accentColor: "#F472B6",
      mode: "dark",
      font: "serif",
      headerStyle: "centered",
      footerStyle: "full",
      cardStyle: "borderless",
      buttonStyle: "pill",
      heroStyle: "prism",
      motionPreset: "premium",
      bannerHeading: "Made by hand",
      bannerSubheading: "Original works from the studio — each piece carries the artist's fingerprint.",
      sections: [
        { type: "featured_products", title: "From the studio", limit: 8 },
        { type: "testimonials", title: "Collector stories" },
        { type: "rich_text", title: "About the work", body: "Every piece is one-of-a-kind or from a numbered edition of 50 or fewer." },
      ],
    },
  },
  {
    name: "Vogue Edit",
    slug: "editorial-magazine",
    description: "Cinematic widescreen hero with film grain and staggered editorial section reveals.",
    industry: "Lifestyle & Editorial",
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
      bannerSubheading: "Bold silhouettes. Editorial layouts. Your story, told like a cover story.",
      sections: [
        { type: "featured_collections", title: "Collections", limit: 6 },
        { type: "featured_products", title: "Editor's picks", limit: 8 },
        { type: "testimonials", title: "Press & praise" },
        { type: "rich_text", title: "Behind the lens", body: "Designed for brands that treat every product drop like a magazine cover." },
      ],
      testimonials: [
        { author: "Vogue Daily", quote: "A storefront that feels like flipping through a lookbook.", rating: 5 },
      ],
    },
  },
  {
    name: "Living Space",
    slug: "obsidian-depth",
    description: "Layered 3D parallax with floating particles for furniture and interior design brands.",
    industry: "Furniture & Interiors",
    previewColor: "#78716C",
    snapshot: {
      primaryColor: "#78716C",
      accentColor: "#A8A29E",
      mode: "dark",
      font: "serif",
      headerStyle: "minimal",
      footerStyle: "slim",
      cardStyle: "borderless",
      buttonStyle: "rounded",
      heroStyle: "depth",
      motionPreset: "premium",
      announcementEnabled: true,
      announcementText: "Free white-glove delivery this month",
      bannerHeading: "Rooms that breathe",
      bannerSubheading: "Sculptural furniture and curated décor — designed to be lived in, not just looked at.",
      sections: [
        { type: "featured_products", title: "Statement pieces", limit: 6 },
        { type: "featured_collections", title: "Shop by room", limit: 4 },
        { type: "rich_text", title: "Design philosophy", body: "We believe great interiors start with one piece you absolutely love — then build around it." },
      ],
    },
  },
  {
    name: "Wonder Kids",
    slug: "wonder-kids",
    description: "Playful aurora gradients and bouncy 3D cards for toys, kids' clothing, and baby brands.",
    industry: "Toys & Kids",
    previewColor: "#FBBF24",
    snapshot: {
      primaryColor: "#FBBF24",
      accentColor: "#F472B6",
      mode: "light",
      font: "sans",
      headerStyle: "centered",
      footerStyle: "full",
      cardStyle: "rounded",
      buttonStyle: "pill",
      heroStyle: "aurora",
      motionPreset: "premium",
      bannerHeading: "Where imaginations grow",
      bannerSubheading: "Safe, joyful products that spark creativity and make bedtime easier.",
      sections: [
        { type: "featured_products", title: "Parent favorites", limit: 8 },
        { type: "testimonials", title: "Happy families" },
        { type: "faq", title: "Safety & materials" },
      ],
      testimonials: [
        { author: "Jess T.", quote: "My kids ask to visit our store page — that's never happened before.", rating: 5 },
      ],
    },
  },
  {
    name: "Aurora Studio",
    slug: "aurora-drift",
    description: "Triple aurora blobs in deep 3D space with mouse parallax — for creators and premium brands.",
    industry: "Creators & Brands",
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
      bannerHeading: "Create without limits",
      bannerSubheading: "An immersive storefront with living color, soft 3D motion, and parallax depth.",
      sections: [
        { type: "featured_products", title: "Curated for you", limit: 8 },
        { type: "testimonials", title: "Loved by creators" },
        { type: "faq", title: "Questions" },
      ],
      testimonials: [
        { author: "Sasha K.", quote: "Customers literally said wow when they opened our store.", rating: 5 },
        { author: "Devon P.", quote: "The motion is stunning without being distracting.", rating: 5 },
      ],
    },
  },
];

const PAID_PRICES: Record<string, number> = {
  "luxury-noir": 3900,
  goldsmith: 4900,
  "glow-lab": 4900,
  "farm-table": 3900,
  "iron-pulse": 4900,
  "neon-pop": 5900,
  "code-forge": 5900,
  "artist-prism": 4900,
  "editorial-magazine": 6900,
  "obsidian-depth": 6900,
  "wonder-kids": 3900,
  "aurora-drift": 5900,
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

/** Visual profiles make each category feel distinct across the whole page, not just the hero. */
const VISUAL_PROFILE_BY_SLUG: Record<string, string> = {
  "classic-copper": "general",
  "light-minimal": "fashion",
  "bakery-warm": "food",
  "beauty-glow": "beauty",
  "tech-mono": "tech",
  "home-haven": "home",
  "fitness-fresh": "fitness",
  "pet-corner": "kids",
  "luxury-noir": "fashion",
  goldsmith: "jewelry",
  "glow-lab": "beauty",
  "farm-table": "food",
  "iron-pulse": "fitness",
  "neon-pop": "streetwear",
  "code-forge": "tech",
  "artist-prism": "art",
  "editorial-magazine": "editorial",
  "obsidian-depth": "home",
  "wonder-kids": "kids",
  "aurora-drift": "art",
};

function enrichSnapshot(slug: string, snapshot: ThemeSnapshot): ThemeSnapshot {
  return {
    ...snapshot,
    visualProfile: snapshot.visualProfile ?? VISUAL_PROFILE_BY_SLUG[slug] ?? "general",
  };
}

export async function ensurePlatformTemplates() {
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
        snapshotJson: JSON.stringify(enrichSnapshot(t.slug, t.snapshot)),
        isPublished: true,
      },
      update: {
        name: t.name,
        description: t.description,
        industry: t.industry,
        previewColor: t.previewColor,
        snapshotJson: JSON.stringify(enrichSnapshot(t.slug, t.snapshot)),
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
        snapshotJson: JSON.stringify(enrichSnapshot(t.slug, t.snapshot)),
        isPublished: true,
      },
      update: {
        name: t.name,
        description: t.description,
        priceCents: PAID_PRICES[t.slug] ?? 2900,
        industry: t.industry,
        previewColor: t.previewColor,
        snapshotJson: JSON.stringify(enrichSnapshot(t.slug, t.snapshot)),
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
