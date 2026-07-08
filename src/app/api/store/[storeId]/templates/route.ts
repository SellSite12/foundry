import { NextRequest } from "next/server";

import { ApiError, ok, parseBody, withErrorHandling } from "@/lib/api";
import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/seller/access";
import { ensurePlatformTemplates } from "@/lib/templates/seed";
import { applyThemeSnapshot, parseSnapshot, themeToSnapshot } from "@/lib/templates/theme";
import { getOrCreateTheme, parseFaq, parseSections, parseTestimonials } from "@/lib/shop/theme";
import { templateActionSchema } from "@/lib/validation/templates";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "settings");
  await ensurePlatformTemplates();

  const [platform, custom, purchases] = await Promise.all([
    db.storefrontTemplate.findMany({
      where: { storeId: null, isPublished: true },
      orderBy: [{ tier: "asc" }, { name: "asc" }],
    }),
    db.storefrontTemplate.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
    }),
    db.storefrontTemplatePurchase.findMany({
      where: { storeId },
      select: { templateId: true },
    }),
  ]);

  const purchasedIds = new Set(purchases.map((p) => p.templateId));

  return ok({
    templates: [...platform, ...custom].map((t) => {
      let heroStyle = "classic";
      let motionPreset = "none";
      try {
        const snap = JSON.parse(t.snapshotJson) as { heroStyle?: string; motionPreset?: string };
        heroStyle = snap.heroStyle ?? "classic";
        motionPreset = snap.motionPreset ?? "none";
      } catch {
        // ignore
      }
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        description: t.description,
        tier: t.tier,
        priceCents: t.priceCents,
        industry: t.industry,
        previewColor: t.previewColor,
        isCustom: Boolean(t.storeId),
        purchased: t.tier !== "PAID" || purchasedIds.has(t.id) || Boolean(t.storeId),
        heroStyle,
        motionPreset,
      };
    }),
  });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const access = await requireStoreAccess(storeId, "settings");
  const body = await parseBody(req, templateActionSchema);

  if (body.action === "save") {
    const theme = await getOrCreateTheme(storeId);
    const snapshot = themeToSnapshot(
      theme,
      parseSections(theme),
      parseTestimonials(theme),
      parseFaq(theme)
    );
    const base = slugify(body.name);
    const slug = `custom-${storeId.slice(-6)}-${base}-${Date.now().toString(36)}`;

    const template = await db.storefrontTemplate.create({
      data: {
        name: body.name,
        slug,
        description: body.description,
        tier: "CUSTOM",
        previewColor: theme.primaryColor,
        snapshotJson: JSON.stringify(snapshot),
        storeId,
        createdById: access.user.id,
        isPublished: true,
      },
    });

    return ok({ template: { id: template.id, name: template.name } });
  }

  const template = await db.storefrontTemplate.findUnique({ where: { id: body.templateId } });
  if (!template) throw new ApiError("Template not found", 404);
  if (template.storeId && template.storeId !== storeId) {
    throw new ApiError("Template not available for this store", 403);
  }

  if (body.action === "purchase") {
    if (template.tier !== "PAID") throw new ApiError("This template is not paid", 400);
    await db.storefrontTemplatePurchase.upsert({
      where: { storeId_templateId: { storeId, templateId: template.id } },
      create: { storeId, templateId: template.id },
      update: {},
    });
    return ok({ purchased: true });
  }

  if (template.tier === "PAID") {
    const purchased = await db.storefrontTemplatePurchase.findUnique({
      where: { storeId_templateId: { storeId, templateId: template.id } },
    });
    if (!purchased) throw new ApiError("Purchase this template first", 402);
  }

  const snapshot = parseSnapshot(template.snapshotJson);
  await applyThemeSnapshot(storeId, snapshot);

  return ok({ applied: true, templateId: template.id });
});
