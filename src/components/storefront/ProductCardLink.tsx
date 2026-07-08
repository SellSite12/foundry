"use client";

import Link from "next/link";
import { useRef, type CSSProperties, type ReactNode } from "react";

type Props = {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/** Product card link with optional mouse-follow 3D tilt inside premium motion themes. */
export function ProductCardLink({ href, className, style, children }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    const motion = el?.closest('[data-sf-motion="premium"], [data-sf-motion="cinematic"]');
    if (!el || !motion) return;

    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${-y * 14}deg) rotateY(${x * 14}deg) translateY(-10px) scale(1.03)`;
    el.style.boxShadow = `0 28px 48px -16px color-mix(in srgb, var(--sf-primary) 45%, transparent),
      0 0 0 1px color-mix(in srgb, var(--sf-primary) 25%, transparent)`;
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
    el.style.boxShadow = "";
  }

  return (
    <Link
      ref={ref}
      href={href}
      className={className}
      style={style}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </Link>
  );
}
