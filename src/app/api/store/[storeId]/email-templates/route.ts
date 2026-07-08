import { NextRequest } from "next/server";

import { ok, parseBody, withErrorHandling } from "@/lib/api";
import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/seller/access";
import { ensurePlatformTemplates } from "@/lib/templates/seed";
import { createEmailTemplateSchema } from "@/lib/validation/templates";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");
  await ensurePlatformTemplates();

  const [platform, custom] = await Promise.all([
    db.emailTemplate.findMany({
      where: { storeId: null },
      orderBy: [{ tier: "asc" }, { name: "asc" }],
    }),
    db.emailTemplate.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return ok({
    templates: [...platform, ...custom].map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      tier: t.tier,
      kind: t.kind,
      subject: t.subject,
      preheader: t.preheader,
      priceCents: t.priceCents,
      isCustom: Boolean(t.storeId),
      isDefault: t.isDefault,
    })),
  });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");
  const data = await parseBody(req, createEmailTemplateSchema);

  let bodyHtml = data.bodyHtml;
  let bodyText = data.bodyText;
  let subject = data.subject;

  if (data.fromTemplateId) {
    const source = await db.emailTemplate.findFirst({
      where: {
        id: data.fromTemplateId,
        OR: [{ storeId: null }, { storeId }],
      },
    });
    if (source) {
      bodyHtml = data.bodyHtml || source.bodyHtml;
      bodyText = data.bodyText ?? source.bodyText ?? undefined;
      subject = data.subject || source.subject;
    }
  }

  const slug = `custom-${Date.now().toString(36)}`;
  const template = await db.emailTemplate.create({
    data: {
      storeId,
      tier: "CUSTOM",
      kind: data.kind,
      slug,
      name: data.name,
      subject,
      preheader: data.preheader,
      bodyHtml,
      bodyText,
    },
  });

  return ok({ template: { id: template.id, name: template.name, slug: template.slug } });
});
