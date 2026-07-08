import type { StoreTheme } from "@prisma/client";

import type { ThemeSnapshot } from "@/lib/templates/theme";

/** Builds an in-memory theme row from a template snapshot (no DB write). */
export function snapshotToPreviewTheme(snapshot: ThemeSnapshot, storeId: string): StoreTheme {
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
    sectionsJson: JSON.stringify(snapshot.sections ?? []),
    testimonialsJson: JSON.stringify(snapshot.testimonials ?? []),
    faqJson: JSON.stringify(snapshot.faq ?? []),
    updatedAt: new Date(),
  };
}
