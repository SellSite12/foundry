import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PrintButton } from "@/components/seller/PrintButton";

export const metadata = { title: "Packing slip" };

export default async function PackingSlipPage({
  params,
}: {
  params: Promise<{ storeId: string; orderId: string }>;
}) {
  const { storeId, orderId } = await params;
  const access = await getStoreAccess(storeId, "orders");
  if (!access) notFound();
  const { store } = access;

  const order = await db.order.findFirst({
    where: { id: orderId, storeId },
    include: {
      items: { include: { product: { select: { sku: true, warehouseLocation: true } } } },
      customerRef: true,
    },
  });
  if (!order) notFound();

  const ship = order.customerRef;

  return (
    <div className="mx-auto max-w-2xl bg-white p-10 text-black print:p-0" data-theme="light">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Packing slip</h1>
          <p className="text-sm text-gray-600">
            Order #{order.orderNumber} · {order.createdAt.toLocaleDateString("en-US")}
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-8 text-sm">
        <div>
          <h3 className="mb-1 font-semibold uppercase text-gray-500">From</h3>
          <p>{store.name}</p>
          {store.addressLine1 && <p className="text-gray-600">{store.addressLine1}</p>}
          {store.city && (
            <p className="text-gray-600">
              {store.city}
              {store.postalCode ? ` ${store.postalCode}` : ""}
            </p>
          )}
        </div>
        <div>
          <h3 className="mb-1 font-semibold uppercase text-gray-500">Ship to</h3>
          <p>{ship?.name ?? order.customerEmail}</p>
          {ship?.addressLine1 && <p className="text-gray-600">{ship.addressLine1}</p>}
          {ship?.city && (
            <p className="text-gray-600">
              {ship.city}
              {ship.postalCode ? ` ${ship.postalCode}` : ""}
              {ship.country ? `, ${ship.country}` : ""}
            </p>
          )}
        </div>
      </div>

      {order.trackingNumber && (
        <p className="mb-6 rounded border border-gray-300 p-3 text-sm">
          <strong>Tracking:</strong> {order.trackingNumber}
          {order.shippingCarrier && ` (${order.shippingCarrier})`}
        </p>
      )}

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black text-left">
            <th className="py-2">Item</th>
            <th className="py-2">SKU</th>
            <th className="py-2">Location</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Packed</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-3">
                {item.productName}
                {item.variantName && (
                  <span className="text-gray-500"> — {item.variantName}</span>
                )}
              </td>
              <td className="py-3 text-gray-600">{item.product.sku ?? "—"}</td>
              <td className="py-3 text-gray-600">{item.product.warehouseLocation ?? "—"}</td>
              <td className="py-3 text-right font-semibold">{item.quantity}</td>
              <td className="py-3 text-right">☐</td>
            </tr>
          ))}
        </tbody>
      </table>

      {order.customerNote && (
        <div className="mt-6 rounded border border-gray-300 p-3 text-sm">
          <strong>Customer note:</strong> {order.customerNote}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-gray-400">
        {store.name} · Prices intentionally omitted from packing slips
      </p>
    </div>
  );
}
