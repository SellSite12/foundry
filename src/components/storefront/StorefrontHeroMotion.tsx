"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  motionPreset: string;
  heroStyle: string;
};

/** Mouse-reactive parallax + floating particles inside storefront heroes. */
export function StorefrontHeroMotion({ children, motionPreset, heroStyle }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const active = motionPreset === "premium" || motionPreset === "cinematic" || motionPreset === "subtle";

  useEffect(() => {
    if (!active || !ref.current) return;

    const el = ref.current;
    const section = el.closest("section");
    if (!section) return;

    function onMove(e: MouseEvent) {
      const rect = section!.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const strength = motionPreset === "premium" ? 28 : motionPreset === "cinematic" ? 18 : 10;
      el.style.setProperty("--sf-mx", `${x * strength}px`);
      el.style.setProperty("--sf-my", `${y * strength}px`);
      section!.style.setProperty("--sf-hero-tilt-x", `${-y * 6}deg`);
      section!.style.setProperty("--sf-hero-tilt-y", `${x * 6}deg`);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [active, motionPreset]);

  const particleCount =
    motionPreset === "premium" ? 14 : motionPreset === "cinematic" ? 8 : motionPreset === "subtle" ? 4 : 0;

  return (
    <div
      ref={ref}
      className={`sf-hero-motion ${active ? "sf-hero-motion-active" : ""}`}
      data-sf-hero-style={heroStyle}
    >
      {particleCount > 0 ? (
        <div className="sf-hero-particles" aria-hidden>
          {Array.from({ length: particleCount }, (_, i) => (
            <span key={i} className={`sf-hero-particle sf-hero-particle-${(i % 5) + 1}`} />
          ))}
        </div>
      ) : null}
      {children}
    </div>
  );
}
