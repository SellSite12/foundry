import Link from "next/link";
import { redirect } from "next/navigation";
import { Store as StoreIcon, ArrowRight, Plus } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { getUserStores } from "@/lib/seller/access";
import { db } from "@/lib/db";
import { CreateStoreButton } from "@/components/seller/CreateStoreButton";

export const metadata = { title: "Your stores" };

export default async function StoresPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stores = await getUserStores(user.id);

  const counts = await Promise.all(
    stores.map(async (s) => ({
      id: s.id,
      products: await db.product.count({ where: { storeId: s.id } }),
      orders: await db.order.count({ where: { storeId: s.id } }),
    }))
  );
  const countMap = new Map(counts.map((c) => [c.id, c]));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="fdy-display text-[24px] font-semibold text-ink">Your stores</h1>
          <p className="mt-1 text-[13px] text-ink-faint">
            Every store gets its own seller dashboard, catalog, and team.
          </p>
        </div>
        <CreateStoreButton />
      </div>

      {stores.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-base2 px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-copper-soft">
            <StoreIcon size={22} className="text-copper" />
          </div>
          <h2 className="fdy-display mt-5 text-[18px] font-semibold text-ink">
            Become a seller
          </h2>
          <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-dim">
            Create your first store to unlock the full seller dashboard: products,
            orders, customers, analytics, marketing, and more.
          </p>
          <div className="mt-6">
            <CreateStoreButton primary />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {stores.map((store) => {
            const c = countMap.get(store.id);
            const href = store.onboardingDone
              ? `/store/${store.id}`
              : `/onboarding/${store.id}`;
            return (
              <Link
                key={store.id}
                href={href}
                className="fdy-card-hover group rounded-2xl border border-line bg-surface p-5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="fdy-display flex h-11 w-11 items-center justify-center rounded-xl text-[16px] font-bold text-white"
                    style={{ background: store.brandColor }}
                  >
                    {store.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold text-ink">
                      {store.name}
                    </div>
                    <div className="text-[12px] text-ink-faint">
                      {store.industry ?? "No industry set"} · {store.currency}
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-copper"
                  />
                </div>
                <div className="mt-4 flex items-center gap-5 text-[12px] text-ink-faint">
                  {store.onboardingDone ? (
                    <>
                      <span>
                        <span className="fdy-mono font-semibold text-ink">{c?.products ?? 0}</span>{" "}
                        products
                      </span>
                      <span>
                        <span className="fdy-mono font-semibold text-ink">{c?.orders ?? 0}</span>{" "}
                        orders
                      </span>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-copper-soft px-2.5 py-1 text-[11px] font-medium text-copper">
                      <Plus size={11} /> Resume setup — step {store.onboardingStep} of 5
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
