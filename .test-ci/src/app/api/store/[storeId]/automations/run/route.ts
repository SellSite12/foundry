import { NextRequest } from "next/server";

import { ok, fail, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { runAbandonedCartAutomations } from "@/lib/shop/automations";

/** Manually triggers abandoned-cart automations for a store. */
export const POST = withErrorHandling(async (_req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { role } = await requireStoreAccess(storeId, "marketing");
  if (role !== "OWNER" && role !== "ADMIN") {
    return fail("Only owners and admins can run automations", 403);
  }

  const result = await runAbandonedCartAutomations(storeId);
  return ok({ result });
});
