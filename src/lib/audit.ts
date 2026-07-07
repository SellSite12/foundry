import { headers } from "next/headers";

import { db } from "@/lib/db";

/**
 * Writes a security audit trail entry. Never throws — audit failures must
 * not break the operation being audited.
 */
export async function auditLog(input: {
  action: string;
  storeId?: string | null;
  userId?: string | null;
  detail?: Record<string, unknown>;
}): Promise<void> {
  try {
    const hdrs = await headers();
    await db.auditLog.create({
      data: {
        action: input.action,
        storeId: input.storeId ?? null,
        userId: input.userId ?? null,
        detail: input.detail ? JSON.stringify(input.detail) : null,
        ipAddress: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] Failed to write audit log:", error);
  }
}
