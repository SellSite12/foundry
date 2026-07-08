import type { MetadataRoute } from "next";

import { config } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const base = config.appUrl;
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/marketplace", "/shop/", "/marketplace/sellers/"],
        disallow: [
          "/api/",
          "/dashboard/",
          "/store/",
          "/account/",
          "/admin/",
          "/onboarding/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
