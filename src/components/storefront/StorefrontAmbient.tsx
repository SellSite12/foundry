"use client";

import type { HeroStyle } from "@/lib/constants";
import { HeroShader, isShaderHero } from "@/components/storefront/HeroShader";

type Props = {
  heroStyle: string;
  motionPreset: string;
  primaryColor: string;
  accentColor: string;
};

/** Fixed ambient background behind storefront content. */
export function StorefrontAmbient({ heroStyle, motionPreset, primaryColor, accentColor }: Props) {
  if (motionPreset === "none" && heroStyle === "classic") return null;

  // Shader templates are fully immersive: the WebGL scene fills the whole page,
  // vivid at the top and fading toward the theme background so content stays readable.
  if (isShaderHero(heroStyle)) {
    return (
      <div className="sf-ambient" aria-hidden>
        <HeroShader variant={heroStyle} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, color-mix(in srgb, var(--sf-bg) 52%, transparent) 46%, color-mix(in srgb, var(--sf-bg) 84%, transparent) 100%)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="sf-ambient" aria-hidden>
      <div
        className="sf-ambient-orb"
        style={{
          width: "40vw",
          height: "40vw",
          top: "-10%",
          right: "-10%",
          background: primaryColor,
          animationDelay: "0s",
        }}
      />
      <div
        className="sf-ambient-orb"
        style={{
          width: "35vw",
          height: "35vw",
          bottom: "10%",
          left: "-15%",
          background: accentColor,
          animationDelay: "2s",
        }}
      />
      {motionPreset === "premium" ? (
        <div
          className="sf-ambient-orb"
          style={{
            width: "25vw",
            height: "25vw",
            top: "40%",
            left: "40%",
            background: primaryColor,
            animationDelay: "4s",
            opacity: 0.2,
          }}
        />
      ) : null}
    </div>
  );
}

export type { HeroStyle };
