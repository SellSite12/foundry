import type { StoreTheme } from "@prisma/client";

import { db } from "@/lib/db";
import type { FaqEntry, Testimonial, ThemeSection } from "@/lib/shop/theme";
import { DEFAULT_SECTIONS } from "@/lib/shop/theme";

import type { CodeTemplateSnapshot } from "@/lib/templates/code";

export type ThemeSnapshot = {
  primaryColor: string;
  accentColor: string;
  mode: string;
  font: string;
  headerStyle: string;
  footerStyle: string;
  cardStyle: string;
  buttonStyle: string;
  announcementText?: string | null;
  announcementEnabled?: boolean;
  bannerUrl?: string | null;
  bannerHeading?: string | null;
  bannerSubheading?: string | null;
  heroStyle?: string;
  motionPreset?: string;
  visualProfile?: string | null;
  layoutMode?: "builtin" | "code";
  code?: CodeTemplateSnapshot;
  sections?: ThemeSection[];
  testimonials?: Testimonial[];
  faq?: FaqEntry[];
};

export function themeToSnapshot(theme: StoreTheme, sections: ThemeSection[], testimonials: Testimonial[], faq: FaqEntry[]): ThemeSnapshot {
  return {
    primaryColor: theme.primaryColor,
    accentColor: theme.accentColor,
    mode: theme.mode,
    font: theme.font,
    headerStyle: theme.headerStyle,
    footerStyle: theme.footerStyle,
    cardStyle: theme.cardStyle,
    buttonStyle: theme.buttonStyle,
    announcementText: theme.announcementText,
    announcementEnabled: theme.announcementEnabled,
    bannerUrl: theme.bannerUrl,
    bannerHeading: theme.bannerHeading,
    bannerSubheading: theme.bannerSubheading,
    heroStyle: theme.heroStyle,
    motionPreset: theme.motionPreset,
    visualProfile: theme.visualProfile,
    layoutMode: theme.layoutMode === "code" ? "code" : "builtin",
    code:
      theme.layoutMode === "code" && theme.customHtml
        ? { html: theme.customHtml, css: theme.customCss ?? "", js: theme.customJs ?? "" }
        : undefined,
    sections,
    testimonials,
    faq,
  };
}

export async function applyThemeSnapshot(storeId: string, snapshot: ThemeSnapshot) {
  const isCode = snapshot.layoutMode === "code" && snapshot.code?.html;

  await db.storeTheme.upsert({
    where: { storeId },
    create: {
      storeId,
      primaryColor: snapshot.primaryColor,
      accentColor: snapshot.accentColor,
      mode: snapshot.mode,
      font: snapshot.font,
      headerStyle: snapshot.headerStyle,
      footerStyle: snapshot.footerStyle,
      cardStyle: snapshot.cardStyle,
      buttonStyle: snapshot.buttonStyle,
      announcementText: snapshot.announcementText ?? null,
      announcementEnabled: snapshot.announcementEnabled ?? false,
      bannerUrl: snapshot.bannerUrl ?? null,
      bannerHeading: snapshot.bannerHeading ?? null,
      bannerSubheading: snapshot.bannerSubheading ?? null,
      heroStyle: snapshot.heroStyle ?? "classic",
      motionPreset: snapshot.motionPreset ?? "none",
      visualProfile: snapshot.visualProfile ?? null,
      layoutMode: isCode ? "code" : "builtin",
      customHtml: isCode ? snapshot.code!.html : null,
      customCss: isCode ? snapshot.code!.css : null,
      customJs: isCode ? snapshot.code!.js : null,
      sectionsJson: JSON.stringify(snapshot.sections ?? DEFAULT_SECTIONS),
      testimonialsJson: JSON.stringify(snapshot.testimonials ?? []),
      faqJson: JSON.stringify(snapshot.faq ?? []),
    },
    update: {
      primaryColor: snapshot.primaryColor,
      accentColor: snapshot.accentColor,
      mode: snapshot.mode,
      font: snapshot.font,
      headerStyle: snapshot.headerStyle,
      footerStyle: snapshot.footerStyle,
      cardStyle: snapshot.cardStyle,
      buttonStyle: snapshot.buttonStyle,
      announcementText: snapshot.announcementText ?? null,
      announcementEnabled: snapshot.announcementEnabled ?? false,
      bannerUrl: snapshot.bannerUrl ?? null,
      bannerHeading: snapshot.bannerHeading ?? null,
      bannerSubheading: snapshot.bannerSubheading ?? null,
      heroStyle: snapshot.heroStyle ?? "classic",
      motionPreset: snapshot.motionPreset ?? "none",
      visualProfile: snapshot.visualProfile ?? null,
      layoutMode: isCode ? "code" : "builtin",
      customHtml: isCode ? snapshot.code!.html : null,
      customCss: isCode ? snapshot.code!.css : null,
      customJs: isCode ? snapshot.code!.js : null,
      sectionsJson: JSON.stringify(snapshot.sections ?? DEFAULT_SECTIONS),
      testimonialsJson: JSON.stringify(snapshot.testimonials ?? []),
      faqJson: JSON.stringify(snapshot.faq ?? []),
    },
  });

  await db.store.update({
    where: { id: storeId },
    data: { brandColor: snapshot.primaryColor },
  });
}

export function parseSnapshot(json: string): ThemeSnapshot {
  return JSON.parse(json) as ThemeSnapshot;
}
