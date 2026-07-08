import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

import { withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";

const REPORT_DIR = path.join(process.cwd(), "var", "reports");

export const GET = withErrorHandling(async (_req: NextRequest, { params }) => {
  await requireUser();
  const { filename } = await params;
  if (!filename || filename.includes("..")) {
    return NextResponse.json({ ok: false, error: "Invalid file" }, { status: 400 });
  }

  const filePath = path.join(REPORT_DIR, filename);
  const content = await readFile(filePath, "utf8");
  const isJson = filename.endsWith(".json");

  return new NextResponse(content, {
    headers: {
      "content-type": isJson ? "application/json" : "text/csv",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
});
