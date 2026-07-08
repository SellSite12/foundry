import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { sha256 } from "@/lib/auth/tokens";
import { API_RATE_LIMIT_PER_MINUTE } from "@/lib/constants";
import { checkMemoryRateLimit } from "@/lib/api/rate-limit";

export type ApiAuth = {
  storeId: string;
  apiKeyId: string;
  scopes: string;
};

export async function authenticateBearer(req: NextRequest, storeId: string): Promise<ApiAuth> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError("Missing or invalid Authorization header", 401);
  }

  const raw = header.slice(7).trim();
  if (!raw.startsWith("fdy_")) {
    throw new ApiError("Invalid API key format", 401);
  }

  const key = await db.apiKey.findFirst({
    where: { storeId, keyHash: sha256(raw), revokedAt: null },
  });
  if (!key) throw new ApiError("Invalid API key", 401);

  const allowed = checkMemoryRateLimit(`api:${key.id}`, API_RATE_LIMIT_PER_MINUTE);
  if (!allowed) throw new ApiError("Rate limit exceeded", 429);

  await db.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  return { storeId, apiKeyId: key.id, scopes: key.scopes };
}

export function requireWriteScope(auth: ApiAuth): void {
  if (auth.scopes !== "read_write") {
    throw new ApiError("This endpoint requires read_write scope", 403);
  }
}

export async function logApiRequest(input: {
  storeId: string;
  apiKeyId?: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
}): Promise<void> {
  try {
    await db.apiRequestLog.create({ data: input });
  } catch (error) {
    console.error("[api-log] Failed to write request log:", error);
  }
}
