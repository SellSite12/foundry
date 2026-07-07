import { ok, withErrorHandling } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  return ok({ user });
});
