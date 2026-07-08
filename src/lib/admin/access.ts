import { ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new ApiError("Admin access required", 403);
  }
  return user;
}

export function supportEmailAddress(): string {
  return process.env.SUPPORT_EMAIL ?? process.env.EMAIL_FROM ?? "support@foundry.local";
}
