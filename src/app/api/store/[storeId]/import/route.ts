import { NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { ok, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { enqueueJob } from "@/lib/jobs/queue";

const importSchema = z.object({
  kind: z.enum(["products", "customers", "orders"]),
  rows: z.array(z.record(z.string(), z.unknown())).min(1).max(500),
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "products");
  const data = await parseBody(req, importSchema);

  const errors: { row: number; message: string }[] = [];
  data.rows.forEach((row, i) => {
    if (data.kind === "products" && !row.name) errors.push({ row: i, message: "name required" });
    if (data.kind === "customers" && !row.email) errors.push({ row: i, message: "email required" });
  });

  if (errors.length) return ok({ valid: false, errors });

  const job = await enqueueJob({
    type: "import.process",
    storeId,
    payload: { storeId, kind: data.kind, rows: data.rows },
  });

  return ok({ valid: true, jobId: job.id, rowCount: data.rows.length }, { status: 202 });
});
