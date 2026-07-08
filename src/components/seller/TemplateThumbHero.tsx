import type { CSSProperties } from "react";

/** Mini animated hero preview for template gallery cards. */
export function TemplateThumbHero({
  heroStyle,
  motionPreset,
  previewColor,
  tier,
}: {
  heroStyle?: string;
  motionPreset?: string;
  previewColor: string;
  tier: string;
}) {
  const style = heroStyle && heroStyle !== "classic" ? heroStyle : "aurora";
  const motion = motionPreset && motionPreset !== "none" ? motionPreset : tier === "PAID" ? "premium" : "subtle";

  return (
    <div
      className={`sf-thumb-preview sf-thumb-${style} ${tier === "PAID" ? "sf-template-thumb-paid" : ""}`}
      style={{ "--thumb-accent": previewColor } as CSSProperties}
      data-sf-motion={motion}
    >
      <div className="sf-thumb-preview-content">
        <span className="sf-thumb-preview-line sf-thumb-preview-line-lg" />
        <span className="sf-thumb-preview-line sf-thumb-preview-line-sm" />
        <span className="sf-thumb-preview-cta" />
      </div>
    </div>
  );
}
