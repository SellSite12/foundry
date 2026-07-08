import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Real session validation (the edge middleware only checks cookie presence).
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const unreadCount = await db.notification.count({
    where: { userId: user.id, readAt: null },
  });

  return (
    <div className="flex min-h-screen bg-[#0C0A09]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} unreadCount={unreadCount} />
        <main className="flex-1 px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
