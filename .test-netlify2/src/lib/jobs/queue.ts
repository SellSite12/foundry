import { db } from "@/lib/db";
import type { JOB_TYPES } from "@/lib/constants";

export type JobType = (typeof JOB_TYPES)[number];

export async function enqueueJob(input: {
  type: JobType;
  payload: Record<string, unknown>;
  storeId?: string;
  scheduledAt?: Date;
  maxAttempts?: number;
}) {
  return db.backgroundJob.create({
    data: {
      type: input.type,
      payload: JSON.stringify(input.payload),
      storeId: input.storeId ?? null,
      scheduledAt: input.scheduledAt ?? new Date(),
      maxAttempts: input.maxAttempts ?? 3,
    },
  });
}

export async function claimPendingJobs(limit = 10) {
  const now = new Date();
  const pending = await db.backgroundJob.findMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: "asc" },
    take: limit * 2,
  });

  const eligible = pending.filter((j) => j.attempts < j.maxAttempts).slice(0, limit);
  const claimed: typeof pending = [];
  for (const job of eligible) {
    const updated = await db.backgroundJob.updateMany({
      where: { id: job.id, status: "PENDING" },
      data: { status: "RUNNING", startedAt: now, attempts: { increment: 1 } },
    });
    if (updated.count === 1) claimed.push(job);
  }
  return claimed;
}

export async function completeJob(id: string) {
  await db.backgroundJob.update({
    where: { id },
    data: { status: "COMPLETED", completedAt: new Date(), error: null },
  });
}

export async function failJob(id: string, error: string, maxAttempts: number, attempts: number) {
  const retry = attempts < maxAttempts;
  await db.backgroundJob.update({
    where: { id },
    data: {
      status: retry ? "PENDING" : "FAILED",
      error,
      startedAt: null,
      scheduledAt: retry ? new Date(Date.now() + attempts * 60_000) : undefined,
      completedAt: retry ? null : new Date(),
    },
  });
}

export async function getQueueStats() {
  const [pending, running, failed, completed] = await Promise.all([
    db.backgroundJob.count({ where: { status: "PENDING" } }),
    db.backgroundJob.count({ where: { status: "RUNNING" } }),
    db.backgroundJob.count({ where: { status: "FAILED" } }),
    db.backgroundJob.count({
      where: { status: "COMPLETED", completedAt: { gte: new Date(Date.now() - 86_400_000) } },
    }),
  ]);
  return { pending, running, failed, completedLast24h: completed };
}
