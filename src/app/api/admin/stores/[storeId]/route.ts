import { NextRequest } from "next/server";

import { ok, parseBody, withErrorHandling } from "@/lib/api";
import { requireAdmin } from "@/lib/admin/access";
import { db } from "@/lib/db";
import { adminStorePatchSchema } from "@/lib/validation/templates";

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  await requireAdmin();
  const { storeId } = await params;
  const data = await parseBody(req, adminStorePatchSchema);

  const store = await db.store.update({
    where: { id: storeId },
    data,
    select: { id: true, name: true, slug: true, status: true },
  });

  return ok({ store });
});
