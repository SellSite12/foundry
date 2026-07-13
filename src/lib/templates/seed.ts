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
    name: "Ember Core",
    slug: "ember-core",
    description: "Warm copper glow with living aurora light — a confident start for any store.",
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
      heroStyle: "aurora",
      motionPreset: "subtle",
      bannerHeading: "Made to be remembered",
      bannerSubheading: "Quality products, honest prices, and shipping that doesn't keep you waiting.",
      sections: DEFAULT_SECTIONS,
      testimonials: [
        { author: "Alex M.", quote: "Ordered Monday, arrived Wednesday. Instant repeat customer.", rating: 5 },
        { author: "Jordan K.", quote: "Exactly as pictured — better, actually.", rating: 5 },
      ],
      faq: [
        { question: "How long does shipping take?", answer: "Most orders ship within 2 business days." },
        { question: "What is your return policy?", answer: "30-day returns on unused items, no questions asked." },
      ],
    },
  },
  {
    name: "Atelier Blanc",
    slug: "atelier-blanc",
    description: "Gallery-white minimalism with serif headlines for boutiques and lifestyle brands.",
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
      bannerHeading: "Curated, not crowded",
      bannerSubheading: "A small edit of pieces we'd actually wear — restocked seasonally.",
      sections: [
        { type: "featured_products", title: "New arrivals", limit: 8 },
        { type: "featured_collections", title: "Shop the look", limit: 4 },
        { type: "testimonials", title: "Customer love" },
      ],
    },
  },
  {
    name: "Golden Crust",
    slug: "golden-crust",
    description: "Sunrise warmth and rising steam for bakeries, cafés, and food brands.",
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
      bannerHeading: "Out of the oven at 6am",
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
    name: "Dew",
    slug: "dew-glow",
    description: "Soft-focus bokeh light and rose tones for skincare, cosmetics, and wellness.",
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
      bannerHeading: "Skin first. Makeup second.",
      bannerSubheading: "Clean formulas. Visible results. A ritual you'll actually keep.",
      sections: [
        { type: "featured_products", title: "Bestsellers", limit: 6 },
        { type: "testimonials", title: "Real results" },
        { type: "rich_text", title: "Our promise", body: "Cruelty-free, transparent ingredients, and formulas dermatologist-tested for sensitive skin." },
      ],
    },
  },
  {
    name: "Pixel Forge",
    slug: "pixel-forge",
    description: "Holographic grid and monospace type for SaaS, plugins, and digital downloads.",
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
    name: "Nest",
    slug: "nest-loft",
    description: "Marble veining and warm neutrals for furniture, décor, and home goods.",
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
      bannerHeading: "Rooms worth coming home to",
      bannerSubheading: "Handpicked pieces that make every room feel intentional.",
      sections: [
        { type: "featured_collections", title: "Shop by room", limit: 4 },
        { type: "featured_products", title: "Featured pieces", limit: 8 },
      ],
    },
  },
  {
    name: "Velocity",
    slug: "velocity-lab",
    description: "Orbiting energy rings and bold type for gyms, supplements, and activewear.",
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
      bannerHeading: "Earn the result",
      bannerSubheading: "Gear and supplements built for athletes who don't settle.",
      sections: [
        { type: "featured_products", title: "Top picks", limit: 8 },
        { type: "testimonials", title: "Athlete approved" },
      ],
    },
  },
  {
    name: "Wildtail",
    slug: "wildtail",
    description: "Playful aurora color and rounded cards for pet food, toys, and accessories.",
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
      bannerHeading: "Tail-wag guaranteed",
      bannerSubheading: "Premium nutrition and toys your furry family will obsess over.",
      sections: DEFAULT_SECTIONS,
    },
  },
];

const PAID_STOREFRONT: typeof FREE_STOREFRONT = [
  {
    name: "Noir Chrome",
    slug: "noir-chrome",
    description: "Molten liquid-metal hero rendered live in WebGL — high fashion, liquid light.",
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
      heroStyle: "liquid-chrome",
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
    name: "Lumière",
    slug: "lumiere",
    description: "Volumetric light rays pour over your jewelry like a museum vitrine — pure WebGL.",
    industry: "Jewelry & Watches",
    previewColor: "#D4AF37",
    snapshot: {
      primaryColor: "#D4AF37",
      accentColor: "#F5E6C4",
      mode: "dark",
      font: "serif",
      headerStyle: "minimal",
      footerStyle: "slim",
      cardStyle: "borderless",
      buttonStyle: "pill",
      heroStyle: "light-rays",
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
    name: "Silk Ritual",
    slug: "silk-ritual",
    description: "Real flowing silk rendered in WebGL — waves of soft light behind your products.",
    industry: "Skincare & Wellness",
    previewColor: "#F472B6",
    snapshot: {
      primaryColor: "#EC4899",
      accentColor: "#F9A8D4",
      mode: "dark",
      font: "sans",
      headerStyle: "centered",
      footerStyle: "full",
      cardStyle: "rounded",
      buttonStyle: "pill",
      heroStyle: "silk",
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
    name: "Ember Harvest",
    slug: "ember-harvest",
    description: "Golden sunrise glow, rising steam, and 3D tilt cards for gourmet food brands.",
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
    name: "Apex",
    slug: "apex-orbit",
    description: "3D orbital rings, pulsing energy core, and tilt-on-hover cards for performance brands.",
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
    name: "Neon District",
    slug: "neon-district",
    description: "Iridescent oil-slick WebGL backdrop with shimmer type — built for hype drops.",
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
      heroStyle: "iridescence",
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
    name: "Warp Drive",
    slug: "warp-drive",
    description: "Hyperspeed light streaks racing past in WebGL — a launch page that feels like liftoff.",
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
      heroStyle: "hyperspeed",
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
    name: "Prism Atelier",
    slug: "prism-atelier",
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
      testimonials: [
        { author: "Nadia B.", quote: "Framed it the day it arrived. The store itself felt like a gallery.", rating: 5 },
      ],
    },
  },
  {
    name: "First Edition",
    slug: "first-edition",
    description: "Cinematic widescreen hero with film grain and staggered editorial reveals — cover-story energy.",
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
    name: "Obsidian Loft",
    slug: "obsidian-loft",
    description: "Layered 3D parallax depth with floating particles for furniture and interior brands.",
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
    name: "Little Cosmos",
    slug: "little-cosmos",
    description: "A living WebGL galaxy with drifting, twinkling stars — bedtime-story magic for kids' brands.",
    industry: "Toys & Kids",
    previewColor: "#FBBF24",
    snapshot: {
      primaryColor: "#FBBF24",
      accentColor: "#F472B6",
      mode: "dark",
      font: "sans",
      headerStyle: "centered",
      footerStyle: "full",
      cardStyle: "rounded",
      buttonStyle: "pill",
      heroStyle: "galaxy",
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
    name: "Northern Studio",
    slug: "northern-studio",
    description: "Aurora curtains breathing across a WebGL night sky — an unforgettable first impression.",
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
      heroStyle: "aurora-flow",
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
  "noir-chrome": 4900,
  lumiere: 5900,
  "silk-ritual": 4900,
  "ember-harvest": 3900,
  "apex-orbit": 4900,
  "neon-district": 6900,
  "warp-drive": 5900,
  "prism-atelier": 4900,
  "first-edition": 6900,
  "obsidian-loft": 6900,
  "little-cosmos": 3900,
  "northern-studio": 5900,
};

/** Old platform template slugs that were replaced — unpublished on sync so they vanish from the gallery. */
const RETIRED_SLUGS = [
  "classic-copper",
  "light-minimal",
  "bakery-warm",
  "beauty-glow",
  "tech-mono",
  "home-haven",
  "fitness-fresh",
  "pet-corner",
  "luxury-noir",
  "goldsmith",
  "glow-lab",
  "farm-table",
  "iron-pulse",
  "neon-pop",
  "code-forge",
  "artist-prism",
  "editorial-magazine",
  "obsidian-depth",
  "wonder-kids",
  "aurora-drift",
];

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
  "ember-core": "general",
  "atelier-blanc": "fashion",
  "golden-crust": "food",
  "dew-glow": "beauty",
  "pixel-forge": "tech",
  "nest-loft": "home",
  "velocity-lab": "fitness",
  wildtail: "kids",
  "noir-chrome": "fashion",
  lumiere: "jewelry",
  "silk-ritual": "beauty",
  "ember-harvest": "food",
  "apex-orbit": "fitness",
  "neon-district": "streetwear",
  "warp-drive": "tech",
  "prism-atelier": "art",
  "first-edition": "editorial",
  "obsidian-loft": "home",
  "little-cosmos": "kids",
  "northern-studio": "art",
};

function enrichSnapshot(slug: string, snapshot: ThemeSnapshot): ThemeSnapshot {
  return {
    ...snapshot,
    visualProfile: snapshot.visualProfile ?? VISUAL_PROFILE_BY_SLUG[slug] ?? "general",
  };
}

export async function ensurePlatformTemplates() {
  // Retire replaced platform templates. Stores that already applied one keep their
  // current theme (it was copied into StoreTheme), and purchase records remain intact.
  await db.storefrontTemplate.updateMany({
    where: { storeId: null, slug: { in: RETIRED_SLUGS } },
    data: { isPublished: false },
  });

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
