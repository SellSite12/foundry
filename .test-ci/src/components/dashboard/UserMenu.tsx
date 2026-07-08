"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/client/api";

type Props = {
  name: string;
  email: string;
  image: string | null;
};

export function UserMenu({ name, email, image }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    setLoggingOut(true);
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-[rgba(255,255,255,0.04)]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={name} image={image} size={32} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-xl border border-[rgba(232,163,61,0.15)] bg-[#18140F] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          <div className="border-b border-[rgba(232,163,61,0.1)] px-4 py-3">
            <div className="truncate text-[13.5px] font-medium text-[#EFE9DF]">
              {name}
            </div>
            <div className="truncate text-[12px] text-[#7A7266]">{email}</div>
          </div>
          <div className="p-1.5">
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[#B8AFA0] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#EFE9DF]"
              role="menuitem"
            >
              <User size={15} /> Profile
            </Link>
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[#B8AFA0] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#EFE9DF]"
              role="menuitem"
            >
              <Settings size={15} /> Settings
            </Link>
            <button
              onClick={logout}
              disabled={loggingOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-[#F87171] hover:bg-[rgba(248,113,113,0.08)] disabled:opacity-50"
              role="menuitem"
            >
              <LogOut size={15} />
              {loggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
