import type { MetadataRoute } from "next";

import { db } from "@/lib/db";
import { config } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = config.appUrl;

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/marketplace`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/signup`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const stores = await db.store.findMany({
      where: { onboardingDone: true },
      select: { slug: true, updatedAt: true },
      take: 500,
    });

    const storePages: MetadataRoute.Sitemap = stores.flatMap((s) => [
      {
        url: `${base}/shop/${s.slug}`,
        lastModified: s.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
      },
      {
        url: `${base}/shop/${s.slug}/products`,
        lastModified: s.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.7,
      },
      {
        url: `${base}/marketplace/sellers/${s.slug}`,
        lastModified: s.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
    ]);

    const products = await db.product.findMany({
      where: { status: "PUBLISHED", visibility: "VISIBLE" },
      select: { slug: true, updatedAt: true, store: { select: { slug: true } } },
      take: 2000,
    });

    const productPages: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${base}/shop/${p.store.slug}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticPages, ...storePages, ...productPages];
  } catch {
    return staticPages;
  }
}
