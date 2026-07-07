"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  full?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[13.5px] px-5 py-2.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8A33D]";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-[#E8A33D] to-[#B85C2E] text-[#0C0A09] hover:brightness-110 shadow-[0_8px_30px_rgba(232,163,61,0.2)]",
  secondary:
    "bg-transparent text-ink border border-line-strong hover:border-copper hover:bg-copper-soft/40",
  ghost: "bg-transparent text-ink-dim hover:text-ink hover:bg-hover",
  danger:
    "bg-transparent text-danger border border-danger/30 hover:bg-danger-soft",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", loading = false, full = false, className = "", children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
});
