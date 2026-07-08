import { ok, withErrorHandling } from "@/lib/api";
import { requireAdmin } from "@/lib/admin/access";
import { getEmailSetupStatus } from "@/lib/email/status";

export const GET = withErrorHandling(async () => {
  await requireAdmin();
  return ok({ email: getEmailSetupStatus() });
});
