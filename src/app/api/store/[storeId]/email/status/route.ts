import { ok, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { getEmailSetupStatus } from "@/lib/email/status";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");
  return ok({ email: getEmailSetupStatus() });
});
