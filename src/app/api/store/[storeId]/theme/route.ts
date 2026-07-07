import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { getOrCreateTheme } from "@/lib/shop/theme";
import { updateThemeSchema } from "@/lib/validation/shop";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "settings");
  const theme = await getOrCreateTheme(storeId);
  return ok({ theme });
});

/** Saves theme customizer changes — changes are live on the storefront instantly. */
export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "settings");
  await getOrCreateTheme(storeId);

  const data = await parseBody(req, updateThemeSchema);
  const { sections, testimonials, faq, ...fields } = data;

  const theme = await db.storeTheme.update({
    where: { storeId },
    data: {
      ...fields,
      ...(sections !== undefined && { sectionsJson: JSON.stringify(sections) }),
      ...(testimonials !== undefined && { testimonialsJson: JSON.stringify(testimonials) }),
      ...(faq !== undefined && { faqJson: JSON.stringify(faq) }),
    },
  });
  return ok({ theme });
});
