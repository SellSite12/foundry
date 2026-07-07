import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, parseBody, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { updatePreferencesSchema } from "@/lib/validation/auth";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const preferences = await db.userPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });
  return ok({ preferences });
});

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const data = await parseBody(req, updatePreferencesSchema);

  const preferences = await db.userPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  return ok({ preferences });
});
