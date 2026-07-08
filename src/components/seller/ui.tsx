"use client";

import Link from "next/link";
import { type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Shared seller-dashboard primitives, themed via semantic tokens      */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="fdy-display text-[22px] font-semibold text-ink">{title}</h1>
        {description && <p className="mt-0.5 text-[13px] text-ink-faint">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-ink-faint">{label}</span>
        {icon}
      </div>
      <div className="fdy-mono mt-2 text-[22px] font-semibold text-ink">{value}</div>
      {sub && <div className="mt-1 text-[11.5px] text-ink-faint">{sub}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className = "",
  id,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`rounded-2xl border border-line bg-surface p-5 sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="fdy-display text-[15.5px] font-semibold text-ink">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-[12.5px] text-ink-faint">{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-base2 px-6 py-12 text-center">
      {icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-copper-soft text-copper">
          {icon}
        </div>
      )}
      <h3 className="fdy-display text-[16px] font-semibold text-ink">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-dim">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  // orders
  PENDING: "bg-copper-soft text-copper",
  PAID: "bg-success-soft text-success",
  PROCESSING: "bg-copper-soft text-copper",
  PACKED: "bg-copper-soft text-copper",
  SHIPPED: "bg-success-soft text-success",
  DELIVERED: "bg-success-soft text-success",
  CANCELLED: "bg-danger-soft text-danger",
  REFUNDED: "bg-danger-soft text-danger",
  // products
  DRAFT: "bg-hover text-ink-faint",
  PUBLISHED: "bg-success-soft text-success",
  ARCHIVED: "bg-hover text-ink-faint",
  // generic
  ACTIVE: "bg-success-soft text-success",
  DISABLED: "bg-hover text-ink-faint",
  CANCELED: "bg-danger-soft text-danger",
  INVITED: "bg-copper-soft text-copper",
  OPEN: "bg-copper-soft text-copper",
  CLOSED: "bg-hover text-ink-faint",
  SENT: "bg-success-soft text-success",
  SCHEDULED: "bg-copper-soft text-copper",
  HIDDEN: "bg-hover text-ink-faint",
  IN_PROGRESS: "bg-copper-soft text-copper",
  WAITING: "bg-hover text-ink-dim",
  RESOLVED: "bg-green-500/10 text-green-400",
  SUSPENDED: "bg-danger/10 text-danger",
  URGENT: "bg-danger/10 text-danger",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`fdy-mono inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        STATUS_COLORS[status] ?? "bg-hover text-ink-faint"
      }`}
    >
      {status}
    </span>
  );
}

export function Pagination({
  page,
  pageCount,
  makeHref,
}: {
  page: number;
  pageCount: number;
  makeHref: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-[12.5px] text-ink-faint">
      <span>
        Page {page} of {pageCount}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={makeHref(page - 1)}
            className="rounded-full border border-line-strong px-3.5 py-1.5 text-ink-dim hover:text-ink"
          >
            Previous
          </Link>
        )}
        {page < pageCount && (
          <Link
            href={makeHref(page + 1)}
            className="rounded-full border border-line-strong px-3.5 py-1.5 text-ink-dim hover:text-ink"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
  xl = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
  xl?: boolean;
}) {
  if (!open) return null;
  const maxW = xl ? "max-w-5xl" : wide ? "max-w-2xl" : "max-w-md";
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 pt-[8vh]">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div
        className={`fdy-pop relative w-full ${maxW} rounded-2xl border border-line-strong bg-surface p-6 shadow-[0_40px_100px_rgba(0,0,0,0.4)]`}
        role="dialog"
        aria-label={title}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="fdy-display text-[16px] font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-ink-faint hover:bg-hover hover:text-ink"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* Table primitives — consistent look across all list pages. */

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[640px] text-left text-[13px]">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={`border-b border-line px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-faint ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`border-b border-line px-4 py-3 text-ink-dim ${className}`}>{children}</td>;
}
