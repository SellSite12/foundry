import { headers } from "next/headers";

import { db } from "@/lib/db";

export type LogLevel = "info" | "warn" | "error";
export type LogCategory =
  | "auth"
  | "order"
  | "payment"
  | "api"
  | "webhook"
  | "automation"
  | "inventory"
  | "billing"
  | "system"
  | "security";

type LogInput = {
  level: LogLevel;
  category: LogCategory;
  message: string;
  detail?: Record<string, unknown>;
  userId?: string | null;
  storeId?: string | null;
  requestId?: string | null;
};

const RETENTION_DAYS = 90;

/**
 * Writes a structured log entry to stdout and the database.
 * Never throws — logging failures must not break operations.
 */
export async function systemLog(input: LogInput): Promise<void> {
  const entry = {
    ts: new Date().toISOString(),
    level: input.level,
    category: input.category,
    message: input.message,
    ...(input.detail ? { detail: input.detail } : {}),
    ...(input.requestId ? { requestId: input.requestId } : {}),
  };

  const line = JSON.stringify(entry);
  if (input.level === "error") console.error(line);
  else if (input.level === "warn") console.warn(line);
  else console.log(line);

  try {
    let ipAddress: string | null = null;
    try {
      const hdrs = await headers();
      ipAddress = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    } catch {
      // no request context (background job)
    }

    await db.systemLog.create({
      data: {
        level: input.level,
        category: input.category,
        message: input.message,
        detail: input.detail ? JSON.stringify(input.detail) : null,
        userId: input.userId ?? null,
        storeId: input.storeId ?? null,
        requestId: input.requestId ?? null,
        ipAddress,
      },
    });
  } catch (error) {
    console.error("[logger] Failed to persist log:", error);
  }
}

/** Purge logs older than retention policy (call from cron). */
export async function purgeOldLogs(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000);
  const result = await db.systemLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return result.count;
}

export async function getRecentLogs(input: {
  category?: string;
  level?: string;
  limit?: number;
}) {
  return db.systemLog.findMany({
    where: {
      ...(input.category ? { category: input.category } : {}),
      ...(input.level ? { level: input.level } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 100,
  });
}
