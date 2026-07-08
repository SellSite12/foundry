import { NextRequest } from "next/server";
import { randomBytes } from "crypto";

import { db } from "@/lib/db";
import { ok, fail, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { getPagination, pageMeta } from "@/lib/seller/pagination";
import { PLAN_DEFS } from "@/lib/plans";
import { deleteUpload, putUpload, urlToSegments } from "@/lib/storage";

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

// Files live outside public/ on disk, or in Netlify Blobs in production.
// /uploads/* is served by src/app/uploads/[...path]/route.ts.

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "media");

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const folder = sp.get("folder");
  const { page, take, skip } = getPagination(req);

  const where = {
    storeId,
    ...(folder && { folder }),
    ...(q && { name: { contains: q } }),
  };

  const [total, files, folders, usage] = await Promise.all([
    db.mediaFile.count({ where }),
    db.mediaFile.findMany({ where, orderBy: { createdAt: "desc" }, take, skip }),
    db.mediaFile.findMany({
      where: { storeId },
      select: { folder: true },
      distinct: ["folder"],
    }),
    db.mediaFile.aggregate({ where: { storeId }, _sum: { sizeBytes: true } }),
  ]);

  return ok({
    files,
    folders: folders.map((f) => f.folder).sort(),
    usedBytes: usage._sum.sizeBytes ?? 0,
    ...pageMeta(total, page),
  });
});

/** Uploads a file (multipart/form-data: file, folder?, replaceId?). */
export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { storeId } = await params;
  await requireStoreAccess(storeId, "media");

  const form = await req.formData().catch(() => null);
  if (!form) return fail("Expected multipart/form-data", 400);

  const file = form.get("file");
  if (!(file instanceof File)) return fail("Missing file", 400);
  if (file.size === 0) return fail("File is empty", 400);
  if (file.size > MAX_FILE_BYTES) return fail("File exceeds the 20 MB limit", 400);

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return fail(`File type ${file.type || "unknown"} is not allowed`, 400);

  const folderRaw = (form.get("folder") as string | null)?.trim() || "/";
  const folder = folderRaw.startsWith("/") ? folderRaw : `/${folderRaw}`;
  if (!/^\/[a-zA-Z0-9 _\-/]*$/.test(folder) || folder.includes("..")) {
    return fail("Invalid folder name", 400);
  }
  const replaceId = (form.get("replaceId") as string | null) || null;

  // Enforce plan storage limits.
  const sub = await db.subscription.findFirst({
    where: { storeId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  const plan = PLAN_DEFS[(sub?.plan ?? "STARTER") as keyof typeof PLAN_DEFS];
  const usage = await db.mediaFile.aggregate({
    where: { storeId },
    _sum: { sizeBytes: true },
  });
  const used = usage._sum.sizeBytes ?? 0;
  if (used + file.size > plan.limits.storageMb * 1024 * 1024) {
    return fail(
      `This upload would exceed your ${plan.name} plan's ${plan.limits.storageMb} MB storage limit.`,
      403
    );
  }

  const diskName = `${randomBytes(12).toString("hex")}${ext}`;
  await putUpload([storeId, diskName], Buffer.from(await file.arrayBuffer()));
  const url = `/uploads/${storeId}/${diskName}`;

  let record;
  if (replaceId) {
    const old = await db.mediaFile.findFirst({ where: { id: replaceId, storeId } });
    if (!old) return fail("File to replace not found", 404);
    if (old.url.startsWith("/uploads/")) {
      const segs = urlToSegments(old.url);
      if (segs) await deleteUpload(segs);
    }
    record = await db.mediaFile.update({
      where: { id: old.id },
      data: {
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        url,
      },
    });
  } else {
    record = await db.mediaFile.create({
      data: {
        storeId,
        folder,
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        url,
      },
    });
  }

  return ok({ file: record }, { status: 201 });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { storeId } = await params;
  await requireStoreAccess(storeId, "media");

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing file id", 400);

  const file = await db.mediaFile.findFirst({ where: { id, storeId } });
  if (!file) return fail("File not found", 404);

  if (file.url.startsWith("/uploads/")) {
    const segs = urlToSegments(file.url);
    if (segs) await deleteUpload(segs);
  }
  await db.mediaFile.delete({ where: { id: file.id } });

  return ok({ deleted: true });
});
