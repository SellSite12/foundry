import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PageHeader, Panel, Table, Th, Td } from "@/components/seller/ui";
import { ApiKeysManager } from "@/components/seller/ApiKeysManager";
import { WebhooksManager } from "@/components/seller/WebhooksManager";

export const metadata = { title: "Developer / API" };

const V1_ENDPOINTS = [
  ["GET", "/api/v1/{storeId}/products", "List products (paginated, searchable)"],
  ["GET", "/api/v1/{storeId}/orders", "List orders with filters"],
  ["GET", "/api/v1/{storeId}/customers", "List customers"],
  ["GET", "/api/v1/{storeId}/inventory", "Stock levels"],
  ["GET", "/api/v1/{storeId}/discounts", "Active discounts"],
  ["GET", "/api/v1/{storeId}/reviews", "Published reviews"],
  ["GET", "/api/v1/{storeId}/analytics?range=30d", "Advanced analytics metrics"],
  ["GET", "/api/v1/{storeId}/users", "Team members"],
];

function last24h() {
  return new Date(Date.now() - 86_400_000);
}

export default async function DeveloperPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "developer");
  if (!access) notFound();

  const [keys, webhooks, apiLogs] = await Promise.all([
    db.apiKey.findMany({
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
    }),
    db.webhook.findMany({ where: { storeId }, orderBy: { createdAt: "desc" } }),
    db.apiRequestLog.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const logs24h = await db.apiRequestLog.count({
    where: { storeId, createdAt: { gte: last24h() } },
  });

  return (
    <div>
      <PageHeader
        title="Developer portal"
        description="API keys, webhooks, request logs, and versioned REST documentation."
      />

      <ApiKeysManager
        storeId={storeId}
        canManage={access.role === "OWNER" || access.role === "ADMIN"}
        keys={keys.map((k) => ({
          id: k.id,
          name: k.name,
          prefix: k.prefix,
          scopes: k.scopes,
          lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
          createdAt: k.createdAt.toISOString(),
        }))}
      />

      <div className="mt-5 grid gap-5">
        <Panel title="Rate limit usage" description="120 requests per minute per API key.">
          <p className="text-sm">
            Last 24h: <strong>{logs24h}</strong> requests
            {logs24h > 0 && (
              <> · ~{Math.round((logs24h / 1440) * 100)}% of per-minute budget if sustained</>
            )}
          </p>
        </Panel>

        <WebhooksManager
          storeId={storeId}
          canManage={access.role === "OWNER" || access.role === "ADMIN"}
          webhooks={webhooks.map((w) => ({
            id: w.id,
            url: w.url,
            events: w.events,
            active: w.active,
            failureCount: w.failureCount,
          }))}
        />

        <Panel title="Recent API requests">
          <Table>
            <thead>
              <tr>
                <Th>Time</Th>
                <Th>Method</Th>
                <Th>Path</Th>
                <Th>Status</Th>
                <Th>ms</Th>
              </tr>
            </thead>
            <tbody>
              {apiLogs.map((l) => (
                <tr key={l.id}>
                  <Td>{new Date(l.createdAt).toLocaleString()}</Td>
                  <Td>{l.method}</Td>
                  <Td><code className="text-xs">{l.path}</code></Td>
                  <Td>{l.statusCode}</Td>
                  <Td>{l.durationMs}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>

        <Panel
          title="Public API v1"
          description="Authenticate with Authorization: Bearer fdy_… Rate limited, scoped, and audit-logged."
        >
          <p className="text-sm mb-3 text-[var(--text-muted)]">
            Sample: <code>curl -H &quot;Authorization: Bearer fdy_…&quot; {process.env.APP_URL ?? "http://localhost:3000"}/api/v1/{storeId}/products</code>
          </p>
          <Table>
            <thead>
              <tr>
                <Th>Method</Th>
                <Th>Endpoint</Th>
                <Th>Description</Th>
              </tr>
            </thead>
            <tbody>
              {V1_ENDPOINTS.map(([method, path, desc]) => (
                <tr key={path + method}>
                  <Td>
                    <span className="fdy-mono rounded px-1.5 py-0.5 text-[10px] font-bold bg-success-soft text-success">
                      {method}
                    </span>
                  </Td>
                  <Td><code className="fdy-mono text-[11.5px]">{path}</code></Td>
                  <Td>{desc}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      </div>
    </div>
  );
}
