import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Store,
  Package,
  ShoppingCart,
  Repeat,
  ArrowRight,
  Hammer,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { VerifyEmailBanner } from "@/components/dashboard/VerifyEmailBanner";

export const metadata = { title: "Dashboard" };

function formatMemberSince(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Every number below is scoped to this user — no shared or fake data.
  const [storeCount, productCount, orderCount, subscriptionCount, recentNotifications] =
    await Promise.all([
      db.store.count({ where: { ownerId: user.id } }),
      db.product.count({ where: { store: { ownerId: user.id } } }),
      db.order.count({ where: { store: { ownerId: user.id } } }),
      db.subscription.count({ where: { userId: user.id, status: "ACTIVE" } }),
      db.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
    ]);

  const stats = [
    { label: "Stores", value: storeCount, icon: Store },
    { label: "Products", value: productCount, icon: Package },
    { label: "Orders", value: orderCount, icon: ShoppingCart },
    { label: "Active subscriptions", value: subscriptionCount, icon: Repeat },
  ];

  const isNew = storeCount === 0;

  return (
    <div className="mx-auto max-w-5xl">
      {!user.emailVerified && <VerifyEmailBanner />}

      <div className="mb-8">
        <h1 className="fdy-display text-[26px] font-semibold text-[#EFE9DF]">
          Welcome, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-[13.5px] text-[#7A7266]">
          Member since {formatMemberSince(user.createdAt)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-[rgba(232,163,61,0.1)] bg-[#18140F] p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#7A7266]">{s.label}</span>
              <s.icon size={15} className="text-[#E8A33D]" />
            </div>
            <div className="fdy-mono mt-2 text-[26px] font-semibold text-[#EFE9DF]">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {isNew ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-[rgba(232,163,61,0.25)] bg-[#111011] px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(232,163,61,0.1)]">
            <Hammer size={22} className="text-[#E8A33D]" />
          </div>
          <h2 className="fdy-display mt-5 text-[19px] font-semibold text-[#EFE9DF]">
            Nothing forged yet
          </h2>
          <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-[#B8AFA0]">
            Your account is ready. Create your first store to unlock the full
            seller dashboard — products, orders, customers, analytics,
            marketing, and more.
          </p>
          <Link
            href="/dashboard/stores"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#E8A33D] to-[#B85C2E] px-5 py-2.5 text-[13.5px] font-semibold text-[#0C0A09] transition-all hover:brightness-110"
          >
            Become a seller <ArrowRight size={15} />
          </Link>
        </div>
      ) : null}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="fdy-display text-[16px] font-semibold text-[#EFE9DF]">
            Recent activity
          </h2>
          <Link
            href="/dashboard/notifications"
            className="text-[12.5px] text-[#E8A33D] hover:underline"
          >
            View all
          </Link>
        </div>
        {recentNotifications.length === 0 ? (
          <div className="rounded-2xl border border-[rgba(232,163,61,0.1)] bg-[#111011] px-5 py-8 text-center text-[13px] text-[#7A7266]">
            No activity yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[rgba(232,163,61,0.1)] bg-[#111011]">
            {recentNotifications.map((n, i) => (
              <div
                key={n.id}
                className={`flex items-start justify-between gap-4 px-5 py-4 ${
                  i > 0 ? "border-t border-[rgba(232,163,61,0.07)]" : ""
                }`}
              >
                <div>
                  <div className="text-[13.5px] font-medium text-[#EFE9DF]">
                    {n.title}
                  </div>
                  {n.body && (
                    <div className="mt-0.5 text-[12.5px] text-[#7A7266]">
                      {n.body}
                    </div>
                  )}
                </div>
                <span className="fdy-mono shrink-0 text-[10.5px] text-[#7A7266]">
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                  }).format(n.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}