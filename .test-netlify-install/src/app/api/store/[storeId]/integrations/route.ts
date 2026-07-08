import { NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { encryptCredentials } from "@/lib/integrations/crypto";
import { INTEGRATION_PROVIDERS } from "@/lib/constants";

const connectSchema = z.object({
  provider: z.string(),
  credentials: z.record(z.string(), z.string()).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "integrations");

  const connected = await db.integration.findMany({ where: { storeId } });
  const catalog = INTEGRATION_PROVIDERS.map((p) => {
    const row = connected.find((c) => c.provider === p.id);
    return {
      ...p,
      status: row?.status ?? "DISCONNECTED",
      lastSyncAt: row?.lastSyncAt,
      errorMessage: row?.errorMessage,
      connected: row?.status === "CONNECTED",
    };
  });
  return ok({ integrations: catalog });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { role } = await requireStoreAccess(storeId, "integrations");
  if (role !== "OWNER" && role !== "ADMIN") return fail("Forbidden", 403);

  const data = await parseBody(req, connectSchema);
  const meta = INTEGRATION_PROVIDERS.find((p) => p.id === data.provider);
  if (!meta) return fail("Unknown provider", 400);

  const encrypted = data.credentials ? encryptCredentials(data.credentials) : null;

  const integration = await db.integration.upsert({
    where: { storeId_provider: { storeId, provider: data.provider } },
    create: {
      storeId,
      provider: data.provider,
      category: meta.category,
      status: "CONNECTED",
      credentials: encrypted,
      config: data.config ? JSON.stringify(data.config) : null,
      lastSyncAt: new Date(),
    },
    update: {
      status: "CONNECTED",
      credentials: encrypted,
      config: data.config ? JSON.stringify(data.config) : undefined,
      lastSyncAt: new Date(),
      errorMessage: null,
    },
  });

  return ok({ integration: { id: integration.id, provider: integration.provider, status: integration.status } });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { role } = await requireStoreAccess(storeId, "integrations");
  if (role !== "OWNER" && role !== "ADMIN") return fail("Forbidden", 403);

  const provider = req.nextUrl.searchParams.get("provider");
  if (!provider) return fail("Missing provider", 400);

  await db.integration.updateMany({
    where: { storeId, provider },
    data: { status: "DISCONNECTED", credentials: null },
  });
  return ok({ disconnected: true });
});
