"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Boxes,
  BarChart3,
  Megaphone,
  TicketPercent,
  CreditCard,
  Truck,
  Star,
  MessageSquare,
  FolderOpen,
  UserPlus,
  Zap,
  Settings,
  Store,
  Receipt,
  Code2,
  LifeBuoy,
  ChevronDown,
  Menu,
  X,
  ArrowLeft,
  Sparkles,
  Lightbulb,
  FileText,
  Shield,
  Plug,
  Building2,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: typeof Package };
type NavGroup = { label: string; items: NavItem[] };

function buildNav(base: string): NavGroup[] {
  return [
    {
      label: "Overview",
      items: [
        { href: `${base}`, label: "Dashboard", icon: LayoutDashboard },
        { href: `${base}/analytics`, label: "Analytics", icon: BarChart3 },
        { href: `${base}/insights`, label: "AI Insights", icon: Lightbulb },
        { href: `${base}/assistant`, label: "AI Assistant", icon: Sparkles },
      ],
    },
    {
      label: "Sell",
      items: [
        { href: `${base}/orders`, label: "Orders", icon: ShoppingCart },
        { href: `${base}/products`, label: "Products", icon: Package },
        { href: `${base}/customers`, label: "Customers", icon: Users },
        { href: `${base}/inventory`, label: "Inventory", icon: Boxes },
        { href: `${base}/reviews`, label: "Reviews", icon: Star },
        { href: `${base}/inbox`, label: "Inbox", icon: MessageSquare },
      ],
    },
    {
      label: "Grow",
      items: [
        { href: `${base}/storefront`, label: "Storefront", icon: Store },
        { href: `${base}/marketing`, label: "Marketing", icon: Megaphone },
        { href: `${base}/discounts`, label: "Discounts", icon: TicketPercent },
        { href: `${base}/automation`, label: "Automation", icon: Zap },
      ],
    },
    {
      label: "Operate",
      items: [
        { href: `${base}/payments`, label: "Payments", icon: CreditCard },
        { href: `${base}/shipping`, label: "Shipping", icon: Truck },
        { href: `${base}/files`, label: "Files", icon: FolderOpen },
        { href: `${base}/team`, label: "Team members", icon: UserPlus },
      ],
    },
    {
      label: "Manage",
      items: [
        { href: `${base}/reports`, label: "Reports", icon: FileText },
        { href: `${base}/integrations`, label: "Integrations", icon: Plug },
        { href: `${base}/audit`, label: "Audit logs", icon: Shield },
        { href: `${base}/workspace`, label: "Workspace", icon: Building2 },
        { href: `${base}/settings`, label: "Settings", icon: Settings },
        { href: `${base}/billing`, label: "Billing", icon: Receipt },
        { href: `${base}/developer`, label: "Developer / API", icon: Code2 },
        { href: `${base}/support`, label: "Support", icon: LifeBuoy },
      ],
    },
  ];
}

function NavContent({
  storeId,
  storeName,
  brandColor,
  onNavigate,
}: {
  storeId: string;
  storeName: string;
  brandColor: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const base = `/store/${storeId}`;
  const groups = buildNav(base);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 px-2">
        <Link
          href="/dashboard/stores"
          className="mb-3 flex items-center gap-1.5 text-[11.5px] text-ink-faint hover:text-ink"
          onClick={onNavigate}
        >
          <ArrowLeft size={12} /> All stores
        </Link>
        <Link href={base} onClick={onNavigate} className="flex items-center gap-2.5">
          <div
            className="fdy-display flex h-8 w-8 items-center justify-center rounded-lg text-[14px] font-bold text-white"
            style={{ background: brandColor }}
          >
            {storeName[0]?.toUpperCase() ?? "S"}
          </div>
          <span className="fdy-display truncate text-[14.5px] font-semibold text-ink">
            {storeName}
          </span>
        </Link>
      </div>

      <nav className="fdy-scrollbar flex-1 overflow-y-auto pb-6">
        {groups.map((group) => {
          const isCollapsed = collapsed[group.label];
          return (
            <div key={group.label} className="mb-1">
              <button
                onClick={() =>
                  setCollapsed((c) => ({ ...c, [group.label]: !c[group.label] }))
                }
                className="flex w-full items-center justify-between px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint hover:text-ink-dim"
              >
                {group.label}
                <ChevronDown
                  size={12}
                  className={`transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                />
              </button>
              {!isCollapsed && (
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const active =
                      item.href === base
                        ? pathname === base
                        : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={`mx-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                          active
                            ? "bg-copper-soft font-medium text-copper"
                            : "text-ink-dim hover:bg-hover hover:text-ink"
                        }`}
                      >
                        <item.icon size={15.5} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

export function SellerSidebar({
  storeId,
  storeName,
  brandColor,
}: {
  storeId: string;
  storeName: string;
  brandColor: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-line bg-base2 px-2 py-5 lg:block">
        <NavContent storeId={storeId} storeName={storeName} brandColor={brandColor} />
      </aside>

      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-5 left-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-copper text-base shadow-lg lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-line-strong bg-base2 px-2 py-5">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 text-ink-dim"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
            <NavContent
              storeId={storeId}
              storeName={storeName}
              brandColor={brandColor}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
