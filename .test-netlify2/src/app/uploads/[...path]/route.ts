import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getUpload, urlToSegments } from "@/lib/storage";

/**
 * Serves uploaded media from local disk (dev) or Netlify Blobs (production).
 * Content type comes from the database record — never from the file itself.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  if (
    !segments ||
    segments.length < 2 ||
    segments.some((s) => !/^[a-zA-Z0-9._-]+$/.test(s) || s.includes(".."))
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = `/uploads/${segments.join("/")}`;
  const record = await db.mediaFile.findFirst({ where: { url } });
  if (!record) return new NextResponse("Not found", { status: 404 });

  const data = await getUpload(segments);
  if (!data) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": record.mimeType,
      "Content-Length": String(data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
