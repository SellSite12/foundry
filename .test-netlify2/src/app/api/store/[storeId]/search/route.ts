import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, withErrorHandling } from "@/lib/api";
import { requireStoreAccess, roleAllows } from "@/lib/seller/access";

/**
 * Global dashboard search across products, orders, customers, files, and
 * settings pages. All queries hit indexed columns and are capped at 5
 * results per group.
 */
export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { role } = await requireStoreAccess(storeId);

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return ok({ results: [] });

  const orderNumber = parseInt(q.replace(/^#/, ""), 10);

  const [products, orders, customers, files] = await Promise.all([
    roleAllows(role, "products")
      ? db.product.findMany({
          where: {
            storeId,
            OR: [{ name: { contains: q } }, { sku: { contains: q } }],
          },
          take: 5,
          select: { id: true, name: true, status: true, sku: true },
        })
      : [],
    roleAllows(role, "orders")
      ? db.order.findMany({
          where: {
            storeId,
            OR: [
              { customerEmail: { contains: q } },
              ...(Number.isFinite(orderNumber) ? [{ orderNumber }] : []),
            ],
          },
          take: 5,
          select: { id: true, orderNumber: true, customerEmail: true, status: true },
        })
      : [],
    roleAllows(role, "customers")
      ? db.customer.findMany({
          where: {
            storeId,
            OR: [{ name: { contains: q } }, { email: { contains: q } }],
          },
          take: 5,
          select: { id: true, name: true, email: true },
        })
      : [],
    roleAllows(role, "media")
      ? db.mediaFile.findMany({
          where: { storeId, name: { contains: q } },
          take: 5,
          select: { id: true, name: true, folder: true, mimeType: true },
        })
      : [],
  ]);

  const SETTINGS_PAGES = [
    { label: "Store settings", href: `/store/${storeId}/settings` },
    { label: "Shipping settings", href: `/store/${storeId}/shipping` },
    { label: "Tax settings", href: `/store/${storeId}/settings#tax` },
    { label: "Branding", href: `/store/${storeId}/settings#branding` },
    { label: "Team members", href: `/store/${storeId}/team` },
    { label: "Billing & plan", href: `/store/${storeId}/billing` },
    { label: "API keys", href: `/store/${storeId}/developer` },
    { label: "Notifications", href: `/dashboard/notifications` },
  ];
  const settings = SETTINGS_PAGES.filter((s) =>
    s.label.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 5);

  const results = [
    ...products.map((p) => ({
      group: "Products",
      label: p.name,
      detail: p.sku ?? p.status,
      href: `/store/${storeId}/products/${p.id}`,
    })),
    ...orders.map((o) => ({
      group: "Orders",
      label: `Order #${o.orderNumber}`,
      detail: `${o.customerEmail} · ${o.status}`,
      href: `/store/${storeId}/orders/${o.id}`,
    })),
    ...customers.map((c) => ({
      group: "Customers",
      label: c.name,
      detail: c.email,
      href: `/store/${storeId}/customers/${c.id}`,
    })),
    ...files.map((f) => ({
      group: "Files",
      label: f.name,
      detail: f.folder,
      href: `/store/${storeId}/files`,
    })),
    ...settings.map((s) => ({
      group: "Settings",
      label: s.label,
      detail: "",
      href: s.href,
    })),
  ];

  return ok({ results });
});
