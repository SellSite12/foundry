"use client";

import type { HeroStyle } from "@/lib/constants";

type Props = {
  heroStyle: string;
  motionPreset: string;
  primaryColor: string;
  accentColor: string;
};

/** Fixed ambient orbs behind storefront content for motion presets. */
export function StorefrontAmbient({ heroStyle, motionPreset, primaryColor, accentColor }: Props) {
  if (motionPreset === "none" && heroStyle === "classic") return null;

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
