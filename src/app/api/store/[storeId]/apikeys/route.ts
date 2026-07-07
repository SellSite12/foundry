import { NextRequest } from "next/server";
import { randomBytes } from "crypto";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { apiKeySchema } from "@/lib/validation/seller";
import { sha256 } from "@/lib/auth/tokens";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "developer");

  const keys = await db.apiKey.findMany({
    where: { storeId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });
  return ok({ keys });
});

/** Creates an API key. The raw key is returned exactly once. */
export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { role } = await requireStoreAccess(storeId, "developer");
  if (role !== "OWNER" && role !== "ADMIN") {
    return fail("Only owners and admins can create API keys", 403);
  }

  const data = await parseBody(req, apiKeySchema);
  const raw = `fdy_${randomBytes(24).toString("hex")}`;

  const key = await db.apiKey.create({
    data: {
      storeId,
      name: data.name,
      prefix: raw.slice(0, 8),
      keyHash: sha256(raw),
      scopes: data.scopes ?? "read",
    },
    select: { id: true, name: true, prefix: true, scopes: true, createdAt: true },
  });

  return ok({ key, rawKey: raw }, { status: 201 });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { storeId } = await params;
  const { role } = await requireStoreAccess(storeId, "developer");
  if (role !== "OWNER" && role !== "ADMIN") {
    return fail("Only owners and admins can revoke API keys", 403);
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing key id", 400);

  const result = await db.apiKey.updateMany({
    where: { id, storeId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count === 0) return fail("API key not found", 404);
  return ok({ revoked: true });
});
