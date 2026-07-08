import Link from "next/link";
import { Bell } from "lucide-react";

import { UserMenu } from "@/components/dashboard/UserMenu";
import type { SessionUser } from "@/lib/auth/session";

type Props = {
  user: SessionUser;
  unreadCount: number;
};

export function Topbar({ user, unreadCount }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[rgba(232,163,61,0.1)] bg-[rgba(12,10,9,0.85)] px-5 backdrop-blur-md sm:px-8">
      <div className="fdy-display text-[15px] font-semibold text-[#EFE9DF] lg:hidden">
        Foundry
      </div>
      <div className="hidden text-[13px] text-[#7A7266] lg:block" />

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#B8AFA0] transition-colors hover:bg-[rgba(255,255,255,0.04)] hover:text-[#EFE9DF]"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="fdy-mono absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E8A33D] px-1 text-[9px] font-bold text-[#0C0A09]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <UserMenu name={user.name} email={user.email} image={user.image} role={user.role} />
      </div>
    </header>
  );
}
