import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Bell } from "lucide-react";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getStoreAccess } from "@/lib/seller/access";
import { SellerSidebar } from "@/components/seller/SellerSidebar";
import { GlobalSearch } from "@/components/seller/GlobalSearch";
import { ThemeToggle } from "@/components/seller/ThemeToggle";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { StatusBadge } from "@/components/seller/ui";

export default async function SellerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const access = await getStoreAccess(storeId);
  if (!access) notFound();
  const { store, role } = access;

  if (!store.onboardingDone && role === "OWNER") {
    redirect(`/onboarding/${store.id}`);
  }

  const [unreadCount, prefs] = await Promise.all([
    db.notification.count({ where: { userId: user.id, readAt: null } }),
    db.userPreferences.findUnique({
      where: { userId: user.id },
      select: { theme: true },
    }),
  ]);

  return (
    <div className="flex min-h-screen bg-base">
      <SellerSidebar
        storeId={store.id}
        storeName={store.name}
        brandColor={store.brandColor}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-base/85 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <GlobalSearch storeId={store.id} />
            {store.status !== "ACTIVE" && <StatusBadge status={store.status} />}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="fdy-mono mr-1 hidden rounded-full bg-copper-soft px-2.5 py-1 text-[10px] font-semibold text-copper md:inline">
              {role}
            </span>
            <ThemeToggle initial={prefs?.theme ?? "dark"} />
            <Link
              href="/dashboard/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-dim transition-colors hover:bg-hover hover:text-ink"
              aria-label={`Notifications (${unreadCount} unread)`}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="fdy-mono absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-copper px-1 text-[9px] font-bold text-base">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <UserMenu name={user.name} email={user.email} image={user.image} />
          </div>
        </header>
        <main className="fdy-page-enter flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
