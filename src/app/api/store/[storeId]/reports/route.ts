import { NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { enqueueJob } from "@/lib/jobs/queue";

const reportSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["sales", "inventory", "customers", "marketing", "financial"]),
  format: z.enum(["CSV", "JSON"]).optional(),
  schedule: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).optional(),
  recipients: z.string().optional(),
});

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "reports");

  const reports = await db.report.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    include: { runs: { orderBy: { createdAt: "desc" }, take: 3 } },
  });
  return ok({ reports });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "reports");
  const data = await parseBody(req, reportSchema);

  const report = await db.report.create({
    data: {
      storeId,
      name: data.name,
      type: data.type,
      format: data.format ?? "CSV",
      schedule: data.schedule ?? null,
      recipients: data.recipients ?? null,
    },
  });
  return ok({ report }, { status: 201 });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "reports");
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing report id", 400);

  const run = await db.reportRun.create({ data: { reportId: id, status: "PENDING" } });
  await enqueueJob({
    type: "report.generate",
    storeId,
    payload: { reportId: id, runId: run.id },
  });
  return ok({ runId: run.id });
});
