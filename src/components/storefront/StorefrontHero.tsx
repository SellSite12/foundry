import Link from "next/link";

import { StorefrontHeroMotion } from "@/components/storefront/StorefrontHeroMotion";

type Props = {
  slug: string;
  storeName: string;
  heroStyle: string;
  motionPreset: string;
  bannerUrl: string | null;
  bannerHeading: string | null;
  bannerSubheading: string | null;
};

const PREMIUM_HEROES = new Set([
  "aurora",
  "depth",
  "spotlight",
  "neon-grid",
  "cinematic",
  "bokeh",
  "orbit",
  "hologram",
  "marble",
  "prism",
  "sunrise",
]);

export function StorefrontHero({
  slug,
  storeName,
  heroStyle,
  motionPreset,
  bannerUrl,
  bannerHeading,
  bannerSubheading,
}: Props) {
  const heading = bannerHeading ?? storeName;
  const isPremiumHero = PREMIUM_HEROES.has(heroStyle);
  const hasBanner = Boolean(bannerHeading || bannerUrl || isPremiumHero);
  const floatClass =
    motionPreset === "subtle" || motionPreset === "premium" || motionPreset === "cinematic"
      ? "sf-hero-float"
      : "";
  const shimmerClass =
    heroStyle === "spotlight" ||
    heroStyle === "neon-grid" ||
    heroStyle === "hologram" ||
    heroStyle === "prism"
      ? "sf-hero-shimmer-text"
      : heroStyle === "marble"
        ? "sf-hero-gold-text"
        : "text-white";

  if (!hasBanner && heroStyle === "classic") {
    return (
      <section className="sf-section mt-10 flex flex-col items-center gap-3 py-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl" style={{ color: "var(--sf-text)" }}>
          {storeName}
        </h1>
        {bannerSubheading ? (
          <p className="max-w-xl text-[15px] leading-relaxed" style={{ color: "var(--sf-text-dim)" }}>
            {bannerSubheading}
          </p>
        ) : null}
        <HeroCta slug={slug} motionPreset={motionPreset} />
      </section>
    );
  }

  const heroClass = [
    "sf-section sf-hero-stage relative mt-6 overflow-hidden",
    `sf-hero-${heroStyle}`,
    heroStyle === "cinematic" ? "sf-hero-cinematic-grain" : "",
    motionPreset === "premium" ? "sf-hero-stage-premium" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const minHeight =
    heroStyle === "cinematic" || heroStyle === "marble" ? "480px" : isPremiumHero ? "400px" : "320px";

  return (
    <section
      aria-label="Store banner"
      className={heroClass}
      style={{
        borderRadius: "var(--sf-radius)",
        minHeight,
        perspective: isPremiumHero ? "1200px" : undefined,
      }}
    >
      <HeroBackground heroStyle={heroStyle} bannerUrl={bannerUrl} />

      <StorefrontHeroMotion motionPreset={motionPreset} heroStyle={heroStyle}>
        <div
          className={`relative z-10 flex min-h-[300px] flex-col items-start justify-center gap-5 p-8 sm:min-h-[400px] sm:p-14 ${floatClass}`}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {isPremiumHero ? (
            <span className="sf-hero-eyebrow">
              {heroStyle === "sunrise" ? "Fresh today" : heroStyle === "orbit" ? "Now live" : "New collection"}
            </span>
          ) : null}
          <h1 className={`max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl ${shimmerClass}`}>
            {heading}
          </h1>
          {bannerSubheading ? (
            <p className="max-w-lg text-[15px] leading-relaxed text-white/88 sm:text-base lg:text-lg">
              {bannerSubheading}
            </p>
          ) : null}
          <HeroCta slug={slug} motionPreset={motionPreset} />
        </div>
      </StorefrontHeroMotion>
    </section>
  );
}

function HeroBackground({ heroStyle, bannerUrl }: { heroStyle: string; bannerUrl: string | null }) {
  if (bannerUrl) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 70%)" }}
        />
      </>
    );
  }

  switch (heroStyle) {
    case "aurora":
      return (
        <div className="absolute inset-0" style={{ background: "var(--sf-bg)" }}>
          <div className="sf-hero-aurora-blob sf-hero-aurora-blob-1" />
          <div className="sf-hero-aurora-blob sf-hero-aurora-blob-2" />
          <div className="sf-hero-aurora-blob sf-hero-aurora-blob-3" />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 30% 20%, color-mix(in srgb, var(--sf-primary) 45%, transparent), transparent 55%),
                radial-gradient(ellipse at 80% 80%, color-mix(in srgb, var(--sf-accent) 40%, transparent), transparent 50%)`,
            }}
          />
        </div>
      );
    case "depth":
      return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: "var(--sf-bg)" }}>
          <div className="sf-hero-depth-layer sf-hero-depth-back sf-hero-depth-animate" style={{ background: `linear-gradient(135deg, var(--sf-accent), var(--sf-primary))` }} />
          <div className="sf-hero-depth-layer sf-hero-depth-mid sf-hero-depth-animate-delay" style={{ background: `linear-gradient(160deg, color-mix(in srgb, var(--sf-primary) 70%, #000), transparent)` }} />
          <div className="sf-hero-depth-layer sf-hero-depth-front" />
          <div className="absolute inset-0 sf-hero-depth-vignette" />
        </div>
      );
    case "spotlight":
      return (
        <div className="absolute inset-0" style={{ background: "#080808" }}>
          <div className="sf-hero-spotlight-beam" />
          <div className="sf-hero-spotlight-beam sf-hero-spotlight-beam-2" />
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 25%, color-mix(in srgb, var(--sf-primary) 30%, transparent), transparent 65%)` }} />
        </div>
      );
    case "neon-grid":
      return (
        <div className="absolute inset-0" style={{ background: "#030308" }}>
          <div className="sf-hero-neon-grid">
            <div className="sf-hero-neon-grid-plane" />
            <div className="sf-hero-neon-grid-plane sf-hero-neon-grid-plane-2" />
          </div>
          <div className="sf-hero-neon-glow" />
        </div>
      );
    case "cinematic":
      return (
        <div
          className="absolute inset-0 sf-hero-cinematic-bg"
          style={{
            background: `linear-gradient(to bottom, color-mix(in srgb, var(--sf-primary) 25%, #000), #000 75%),
              linear-gradient(120deg, var(--sf-primary), var(--sf-accent))`,
            backgroundBlendMode: "overlay",
          }}
        />
      );
    case "bokeh":
      return (
        <div className="absolute inset-0 sf-hero-bokeh-wrap" style={{ background: "var(--sf-bg)" }}>
          <div className="sf-hero-bokeh sf-hero-bokeh-1" />
          <div className="sf-hero-bokeh sf-hero-bokeh-2" />
          <div className="sf-hero-bokeh sf-hero-bokeh-3" />
          <div className="sf-hero-bokeh sf-hero-bokeh-4" />
          <div className="sf-hero-bokeh sf-hero-bokeh-5" />
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 40%, color-mix(in srgb, var(--sf-primary) 20%, transparent), transparent 70%)` }} />
        </div>
      );
    case "orbit":
      return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: "#06080f" }}>
          <div className="sf-hero-orbit-ring sf-hero-orbit-ring-1" />
          <div className="sf-hero-orbit-ring sf-hero-orbit-ring-2" />
          <div className="sf-hero-orbit-ring sf-hero-orbit-ring-3" />
          <div className="sf-hero-orbit-core" />
        </div>
      );
    case "hologram":
      return (
        <div className="absolute inset-0 sf-hero-hologram" style={{ background: "#050508" }}>
          <div className="sf-hero-hologram-sheen" />
          <div className="sf-hero-hologram-grid" />
        </div>
      );
    case "marble":
      return (
        <div className="absolute inset-0 sf-hero-marble" style={{ background: "#0c0b0a" }}>
          <div className="sf-hero-marble-vein sf-hero-marble-vein-1" />
          <div className="sf-hero-marble-vein sf-hero-marble-vein-2" />
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 40% 30%, color-mix(in srgb, var(--sf-primary) 18%, transparent), transparent 60%)` }} />
        </div>
      );
    case "prism":
      return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: "#0a0a0c" }}>
          <div className="sf-hero-prism" />
          <div className="sf-hero-prism sf-hero-prism-2" />
        </div>
      );
    case "sunrise":
      return (
        <div className="absolute inset-0 sf-hero-sunrise" style={{ background: "#1a1008" }}>
          <div className="sf-hero-sunrise-glow" />
          <div className="sf-hero-steam sf-hero-steam-1" />
          <div className="sf-hero-steam sf-hero-steam-2" />
          <div className="sf-hero-steam sf-hero-steam-3" />
        </div>
      );
    default:
      return (
        <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, var(--sf-primary), var(--sf-accent))` }} />
      );
  }
}

function HeroCta({ slug, motionPreset }: { slug: string; motionPreset: string }) {
  const premium = motionPreset === "premium" || motionPreset === "cinematic";
  return (
    <Link
      href={`/shop/${slug}/products`}
      className={`mt-1 inline-flex items-center gap-2 px-7 py-3.5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.04] ${premium ? "sf-hero-cta" : ""}`}
      style={{ background: "var(--sf-primary)", borderRadius: "var(--sf-btn-radius)" }}
    >
      Shop collection
      <span aria-hidden className="text-white/70">→</span>
    </Link>
  );
}
