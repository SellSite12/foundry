import { NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { ok, parseBody, withErrorHandling } from "@/lib/api";
import { requireUser, getCurrentUser } from "@/lib/auth/session";
import { systemLog } from "@/lib/observability/logger";

const TERMS_VERSION = "2026-07-01";

const consentSchema = z.object({
  type: z.enum(["cookies", "analytics", "terms", "marketing"]),
  granted: z.boolean(),
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getCurrentUser();
  const data = await parseBody(req, consentSchema);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ua = req.headers.get("user-agent") ?? null;

  await db.consentRecord.create({
    data: {
      userId: user?.id ?? null,
      type: data.type,
      granted: data.granted,
      version: data.type === "terms" ? TERMS_VERSION : null,
      ipAddress: ip,
      userAgent: ua,
    },
  });

  if (user) {
    const prefsUpdate: Record<string, unknown> = {};
    if (data.type === "cookies" && data.granted) prefsUpdate.cookieConsentAt = new Date();
    if (data.type === "analytics") prefsUpdate.analyticsConsent = data.granted;
    if (data.type === "terms" && data.granted) {
      prefsUpdate.termsAcceptedAt = new Date();
      prefsUpdate.termsVersion = TERMS_VERSION;
    }
    if (data.type === "marketing") prefsUpdate.marketingEmails = data.granted;

    if (Object.keys(prefsUpdate).length > 0) {
      await db.userPreferences.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...prefsUpdate },
        update: prefsUpdate,
      });
    }
  }

  await systemLog({
    level: "info",
    category: "system",
    message: `consent.${data.type}.${data.granted ? "granted" : "denied"}`,
    userId: user?.id,
    detail: { type: data.type, granted: data.granted },
  });

  return ok({ recorded: true });
});

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const prefs = await db.userPreferences.findUnique({ where: { userId: user.id } });
  const records = await db.consentRecord.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return ok({
    termsVersion: TERMS_VERSION,
    preferences: prefs,
    records,
  });
});
