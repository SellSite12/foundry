import Link from "next/link";

/** Shared centered card layout for all auth screens. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute rounded-full"
          style={{
            width: 700,
            height: 700,
            top: -260,
            left: "50%",
            transform: "translateX(-50%)",
            background:
              "radial-gradient(circle, rgba(232,163,61,0.12) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      <Link href="/" className="relative mb-8 flex items-center gap-2">
        <div className="fdy-display flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[#E8A33D] to-[#B85C2E] font-bold text-[#0C0A09]">
          F
        </div>
        <span className="fdy-display text-[16px] font-semibold text-[#EFE9DF]">
          Foundry
        </span>
      </Link>

      <div className="relative w-full max-w-[420px] rounded-2xl border border-[rgba(232,163,61,0.15)] bg-[#111011] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.55)]">
        <h1 className="fdy-display text-[22px] font-semibold text-[#EFE9DF]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#B8AFA0]">
            {subtitle}
          </p>
        )}
        <div className="mt-6">{children}</div>
      </div>

      {footer && (
        <div className="relative mt-6 text-[13px] text-[#B8AFA0]">{footer}</div>
      )}
    </div>
  );
}
