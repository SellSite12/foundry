import type { StoreTheme } from "@prisma/client";

import { db } from "@/lib/db";

export type ThemeSection =
  | { type: "featured_products"; title?: string; productIds?: string[]; limit?: number }
  | { type: "featured_collections"; title?: string; limit?: number }
  | { type: "testimonials"; title?: string }
  | { type: "faq"; title?: string }
  | { type: "rich_text"; title?: string; body?: string };

export type Testimonial = { author: string; quote: string; rating?: number };
export type FaqEntry = { question: string; answer: string };

export const DEFAULT_SECTIONS: ThemeSection[] = [
  { type: "featured_products", title: "Featured products", limit: 8 },
  { type: "featured_collections", title: "Shop by collection", limit: 4 },
  { type: "testimonials", title: "What customers say" },
  { type: "faq", title: "Frequently asked questions" },
];

/** Returns the store's theme, creating the default row on first access. */
export async function getOrCreateTheme(storeId: string): Promise<StoreTheme> {
  const existing = await db.storeTheme.findUnique({ where: { storeId } });
  if (existing) return existing;
  return db.storeTheme.upsert({
    where: { storeId },
    create: { storeId },
    update: {},
  });
}

export function parseSections(theme: StoreTheme): ThemeSection[] {
  if (!theme.sectionsJson) return DEFAULT_SECTIONS;
  try {
    const parsed = JSON.parse(theme.sectionsJson) as ThemeSection[];
    return Array.isArray(parsed) ? parsed : DEFAULT_SECTIONS;
  } catch {
    return DEFAULT_SECTIONS;
  }
}

export function parseTestimonials(theme: StoreTheme): Testimonial[] {
  if (!theme.testimonialsJson) return [];
  try {
    const parsed = JSON.parse(theme.testimonialsJson) as Testimonial[];
    return Array.isArray(parsed) ? parsed.filter((t) => t.author && t.quote) : [];
  } catch {
    return [];
  }
}

export function parseFaq(theme: StoreTheme): FaqEntry[] {
  if (!theme.faqJson) return [];
  try {
    const parsed = JSON.parse(theme.faqJson) as FaqEntry[];
    return Array.isArray(parsed) ? parsed.filter((f) => f.question && f.answer) : [];
  } catch {
    return [];
  }
}

const FONT_STACKS: Record<string, string> = {
  sans: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "var(--font-geist-mono), ui-monospace, monospace",
};

/**
 * Converts a theme row into CSS custom properties applied on the storefront
 * root element. Storefront components consume only these variables, so the
 * customizer's live preview is a matter of swapping values.
 */
export function themeCssVars(theme: StoreTheme): Record<string, string> {
  const dark = theme.mode !== "light";
  return {
    "--sf-primary": theme.primaryColor,
    "--sf-accent": theme.accentColor,
    "--sf-bg": dark ? "#0F0D0B" : "#FAF8F5",
    "--sf-surface": dark ? "#191512" : "#FFFFFF",
    "--sf-text": dark ? "#F2EDE4" : "#211D18",
    "--sf-text-dim": dark ? "#B8AFA0" : "#6B6357",
    "--sf-line": dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)",
    "--sf-font": FONT_STACKS[theme.font] ?? FONT_STACKS.sans,
    "--sf-radius":
      theme.cardStyle === "square" ? "2px" : theme.cardStyle === "borderless" ? "10px" : "14px",
    "--sf-btn-radius":
      theme.buttonStyle === "pill" ? "999px" : theme.buttonStyle === "square" ? "2px" : "10px",
    "--sf-card-border": theme.cardStyle === "borderless" ? "transparent" : "var(--sf-line)",
  };
}
