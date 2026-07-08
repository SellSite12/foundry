import { NextRequest } from "next/server";

import { ApiError, ok, parseBody, withErrorHandling } from "@/lib/api";
import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/seller/access";
import { getOrCreateTheme } from "@/lib/shop/theme";
import { applyThemeSnapshot } from "@/lib/templates/theme";
import { z } from "zod";

const codeBodySchema = z.object({
  html: z.string().trim().min(10).max(100_000),
  css: z.string().max(100_000).optional().default(""),
  js: z.string().max(50_000).optional().default(""),
});

const DRAFT_SLUG = (storeId: string) => `draft-code-${storeId}`;

function codeSnapshot(html: string, css: string, js: string) {
  return {
    primaryColor: "#E8A33D",
    accentColor: "#B85C2E",
    mode: "dark",
    font: "sans",
    headerStyle: "minimal",
    footerStyle: "slim",
    cardStyle: "rounded",
    buttonStyle: "rounded",
    layoutMode: "code" as const,
    code: { html, css, js },
    sections: [],
  };
}

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "settings");

  const theme = await getOrCreateTheme(storeId);
  if (theme.layoutMode !== "code" || !theme.customHtml) {
    return ok({ code: null });
  }

  return ok({
    code: {
      html: theme.customHtml,
      css: theme.customCss ?? "",
      js: theme.customJs ?? "",
    },
  });
});

/** Preview draft code or return preview URL after POST body. */
export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const access = await requireStoreAccess(storeId, "settings");
  const body = await parseBody(req, codeBodySchema);
  const slug = DRAFT_SLUG(storeId);

  const template = await db.storefrontTemplate.upsert({
    where: { slug },
    create: {
      name: "Code preview draft",
      slug,
      description: "Ephemeral draft for code studio preview",
      tier: "CUSTOM",
      previewColor: "#E8A33D",
      snapshotJson: JSON.stringify(codeSnapshot(body.html, body.css ?? "", body.js ?? "")),
      storeId,
      createdById: access.user.id,
      isPublished: false,
    },
    update: {
      snapshotJson: JSON.stringify(codeSnapshot(body.html, body.css ?? "", body.js ?? "")),
      updatedAt: new Date(),
    },
  });

  return ok({
    previewUrl: `/preview/store/${storeId}/${template.id}?embed=1`,
  });
});
