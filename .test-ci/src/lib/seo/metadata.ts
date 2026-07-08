import type { Metadata } from "next";

import { config } from "@/lib/config";

type OgInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
};

export function buildMetadata(input: OgInput): Metadata {
  const url = `${config.appUrl}${input.path ?? ""}`;
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: "Foundry",
      type: input.type ?? "website",
      ...(input.image ? { images: [{ url: input.image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      ...(input.image ? { images: [input.image] } : {}),
    },
  };
}

export function productJsonLd(input: {
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  url: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.image,
    offers: {
      "@type": "Offer",
      price: (input.priceCents / 100).toFixed(2),
      priceCurrency: input.currency,
      availability: "https://schema.org/InStock",
      url: input.url,
    },
  };
}
