"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellOff, CheckCheck, Info, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";

import { api } from "@/lib/client/api";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

const typeIcon: Record<string, typeof Info> = {
  INFO: Info,
  SUCCESS: CheckCircle2,
  WARNING: AlertTriangle,
  SECURITY: ShieldAlert,
};

export function NotificationList({ initial }: { initial: NotificationItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [marking, setMarking] = useState(false);

  const unread = items.filter((n) => !n.readAt).length;

  async function markAllRead() {
    setMarking(true);
    const result = await api("/api/notifications", {
      method: "PATCH",
      body: {},
    });
    if (result.ok) {
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
      router.refresh(); // refresh topbar badge
    }
    setMarking(false);
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-[rgba(232,163,61,0.25)] bg-[#111011] px-6 py-14 text-center">
        <BellOff size={22} className="text-[#7A7266]" />
        <p className="mt-4 text-[13.5px] text-[#B8AFA0]">
          You&apos;re all caught up. Notifications about your account and
          stores will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[13px] text-[#7A7266]">
          {unread > 0 ? `${unread} unread` : "All read"}
        </span>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            disabled={marking}
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(232,163,61,0.22)] px-3.5 py-1.5 text-[12.5px] font-medium text-[#E8A33D] transition-colors hover:bg-[rgba(232,163,61,0.08)] disabled:opacity-50"
          >
            <CheckCheck size={14} />
            {marking ? "Marking…" : "Mark all as read"}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[rgba(232,163,61,0.1)] bg-[#111011]">
        {items.map((n, i) => {
          const Icon = typeIcon[n.type] ?? Info;
          return (
            <div
              key={n.id}
              className={`flex items-start gap-3.5 px-5 py-4 ${
                i > 0 ? "border-t border-[rgba(232,163,61,0.07)]" : ""
              } ${n.readAt ? "opacity-60" : ""}`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  n.type === "SECURITY"
                    ? "bg-[rgba(248,113,113,0.1)] text-[#F87171]"
                    : "bg-[rgba(232,163,61,0.1)] text-[#E8A33D]"
                }`}
              >
                <Icon size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-medium text-[#EFE9DF]">
                    {n.title}
                  </span>
                  {!n.readAt && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8A33D]" />
                  )}
                </div>
                {n.body && (
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#7A7266]">
                    {n.body}
                  </p>
                )}
              </div>
              <span className="fdy-mono shrink-0 text-[10.5px] text-[#7A7266]">
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(n.createdAt))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
