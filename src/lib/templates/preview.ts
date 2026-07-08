import type { StoreTheme } from "@prisma/client";

import type { ThemeSnapshot } from "@/lib/templates/theme";

/** Builds an in-memory theme row from a template snapshot (no DB write). */
export function snapshotToPreviewTheme(snapshot: ThemeSnapshot, storeId: string): StoreTheme {
  const isCode = snapshot.layoutMode === "code" && snapshot.code?.html;

  return {
    id: "preview",
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
    sectionsJson: JSON.stringify(snapshot.sections ?? []),
    testimonialsJson: JSON.stringify(snapshot.testimonials ?? []),
    faqJson: JSON.stringify(snapshot.faq ?? []),
    updatedAt: new Date(),
  };
}
