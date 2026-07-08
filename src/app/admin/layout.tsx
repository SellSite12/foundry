import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  Store,
  Users,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/stores", label: "Stores", icon: Store },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
  { href: "/admin/email", label: "Email", icon: Mail },
  { href: "/admin/monitoring", label: "Monitoring", icon: Activity },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen bg-base">
      <aside className="w-56 shrink-0 border-r border-line bg-base2 p-4">
        <Link href="/dashboard" className="mb-6 block text-[11px] text-ink-faint hover:text-ink">
          ← Back to dashboard
        </Link>
        <div className="fdy-display mb-6 text-[15px] font-semibold text-ink">Foundry Admin</div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-ink-dim transition-colors hover:bg-hover hover:text-ink"
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  );
}
