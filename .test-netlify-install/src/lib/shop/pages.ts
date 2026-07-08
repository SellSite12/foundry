import type { Store } from "@prisma/client";

import { db } from "@/lib/db";
import type { StorePageSlug } from "@/lib/constants";

/**
 * Default content for storefront pages the seller hasn't customized —
 * generated from real store data, so every storefront ships complete.
 */
export function defaultPageContent(store: Store, slug: StorePageSlug): { title: string; content: string } {
  switch (slug) {
    case "about":
      return {
        title: `About ${store.name}`,
        content:
          (store.description ? `${store.description}\n\n` : "") +
          `${store.name} is an independent ${store.industry ? store.industry.toLowerCase() + " " : ""}store` +
          (store.city && store.country ? ` based in ${store.city}, ${store.country}.` : ".") +
          `\n\nEvery order is fulfilled directly by our team. Questions? Reach us through the contact page — we read everything.`,
      };
    case "contact":
      return {
        title: `Contact ${store.name}`,
        content: `Send us a message with the form below and we'll get back to you as soon as we can.`,
      };
    case "privacy":
      return {
        title: "Privacy Policy",
        content:
          `${store.name} collects only the information needed to fulfil your order: your name, email address, and shipping address.\n\n` +
          `We never sell your personal data. Payment details are processed by our payment provider and are never stored on our servers.\n\n` +
          `Order history is retained for accounting purposes. To request deletion of your data, contact us${store.businessEmail ? ` at ${store.businessEmail}` : " via the contact page"}.`,
      };
    case "terms":
      return {
        title: "Terms of Service",
        content:
          `By placing an order with ${store.name}, you agree to the following terms.\n\n` +
          `Orders: All orders are subject to availability and confirmation of payment.\n\n` +
          `Pricing: Prices are shown in ${store.currency} and may change without notice. The price at the time of checkout applies to your order.\n\n` +
          `Returns & refunds: Contact us within 14 days of delivery to arrange a return or refund.\n\n` +
          `Questions about these terms? Reach us via the contact page.`,
      };
  }
}

export async function getStorePage(store: Store, slug: StorePageSlug) {
  const page = await db.storePage.findUnique({
    where: { storeId_slug: { storeId: store.id, slug } },
  });
  if (page?.content) return { title: page.title, content: page.content };
  return defaultPageContent(store, slug);
}
