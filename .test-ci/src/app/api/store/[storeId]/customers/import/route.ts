import { NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { parseCsv } from "@/lib/seller/csv";

const importSchema = z.object({ csv: z.string().min(1).max(2_000_000) });

/**
 * Imports customers from CSV text. Expected header row with at least
 * `name` and `email` columns; `phone` and `tags` are optional.
 * Existing emails are updated, new ones created.
 */
export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "customers");

  const { csv } = await parseBody(req, importSchema);
  const rows = parseCsv(csv);
  if (rows.length < 2) return fail("CSV must have a header row and at least one data row", 400);

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf("name");
  const emailIdx = header.indexOf("email");
  if (nameIdx === -1 || emailIdx === -1) {
    return fail('CSV must include "name" and "email" columns', 400);
  }
  const phoneIdx = header.indexOf("phone");
  const tagsIdx = header.indexOf("tags");

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows.slice(1)) {
    const name = row[nameIdx]?.trim();
    const email = row[emailIdx]?.trim().toLowerCase();
    if (!name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      skipped++;
      continue;
    }

    const data = {
      name,
      phone: phoneIdx >= 0 ? row[phoneIdx]?.trim() || null : null,
      tags: tagsIdx >= 0 ? row[tagsIdx]?.trim() || null : null,
    };

    const existing = await db.customer.findUnique({
      where: { storeId_email: { storeId, email } },
    });
    if (existing) {
      await db.customer.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await db.customer.create({ data: { ...data, storeId, email } });
      created++;
    }
  }

  return ok({ created, updated, skipped });
});
