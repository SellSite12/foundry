import Link from "next/link";

type Props = {
  slug: string;
  storeName: string;
  heroStyle: string;
  motionPreset: string;
  bannerUrl: string | null;
  bannerHeading: string | null;
  bannerSubheading: string | null;
};

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
  const hasBanner = Boolean(bannerHeading || bannerUrl || heroStyle !== "classic");
  const floatClass = motionPreset === "subtle" || motionPreset === "premium" ? "sf-hero-float" : "";

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
    "sf-section relative mt-6 overflow-hidden",
    heroStyle === "cinematic" ? "sf-hero-cinematic-grain" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      aria-label="Store banner"
      className={heroClass}
      style={{
        borderRadius: "var(--sf-radius)",
        minHeight: heroStyle === "cinematic" ? "420px" : "320px",
        perspective: heroStyle === "depth" || heroStyle === "aurora" ? "1000px" : undefined,
      }}
    >
      <HeroBackground heroStyle={heroStyle} bannerUrl={bannerUrl} />

      <div
        className={`relative z-10 flex min-h-[280px] flex-col items-start justify-center gap-4 p-8 sm:min-h-[360px] sm:p-14 ${floatClass}`}
        style={{
          transform:
            heroStyle === "depth" || heroStyle === "aurora"
              ? "translateZ(40px)"
              : undefined,
          transformStyle: "preserve-3d",
        }}
      >
        <h1
          className={`max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl ${
            heroStyle === "spotlight" || heroStyle === "neon-grid" ? "sf-hero-shimmer-text" : "text-white"
          }`}
        >
          {heading}
        </h1>
        {bannerSubheading ? (
          <p className="max-w-lg text-[15px] leading-relaxed text-white/85 sm:text-base">{bannerSubheading}</p>
        ) : null}
        <HeroCta slug={slug} motionPreset={motionPreset} />
      </div>
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
          style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 70%)" }}
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
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 30% 20%, color-mix(in srgb, var(--sf-primary) 40%, transparent), transparent 55%),
                radial-gradient(ellipse at 80% 80%, color-mix(in srgb, var(--sf-accent) 35%, transparent), transparent 50%)`,
            }}
          />
        </div>
      );
    case "depth":
      return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: "var(--sf-bg)" }}>
          <div
            className="sf-hero-depth-layer sf-hero-depth-back"
            style={{
              background: `linear-gradient(135deg, var(--sf-accent), var(--sf-primary))`,
            }}
          />
          <div
            className="sf-hero-depth-layer sf-hero-depth-mid"
            style={{
              background: `linear-gradient(160deg, color-mix(in srgb, var(--sf-primary) 70%, #000), transparent)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(120deg, color-mix(in srgb, var(--sf-primary) 85%, #000), color-mix(in srgb, var(--sf-accent) 60%, #000))`,
            }}
          />
        </div>
      );
    case "spotlight":
      return (
        <div className="absolute inset-0" style={{ background: "#0a0a0a" }}>
          <div className="sf-hero-spotlight-beam" />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 30%, color-mix(in srgb, var(--sf-primary) 25%, transparent), transparent 60%)`,
            }}
          />
        </div>
      );
    case "neon-grid":
      return (
        <div className="absolute inset-0" style={{ background: "#050508" }}>
          <div className="sf-hero-neon-grid">
            <div className="sf-hero-neon-grid-plane" />
          </div>
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--sf-accent) 30%, transparent), transparent 55%)`,
            }}
          />
        </div>
      );
    case "cinematic":
      return (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, color-mix(in srgb, var(--sf-primary) 20%, #000), #000 70%),
              linear-gradient(120deg, var(--sf-primary), var(--sf-accent))`,
            backgroundBlendMode: "overlay",
          }}
        />
      );
    default:
      return (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(120deg, var(--sf-primary), var(--sf-accent))`,
          }}
        />
      );
  }
}

function HeroCta({ slug, motionPreset }: { slug: string; motionPreset: string }) {
  const premium = motionPreset === "premium";
  return (
    <Link
      href={`/shop/${slug}/products`}
      className={`mt-2 inline-flex items-center px-6 py-3 text-[14px] font-semibold text-white transition-transform hover:scale-[1.03] ${
        premium ? "sf-hero-cta" : ""
      }`}
      style={{ background: "var(--sf-primary)", borderRadius: "var(--sf-btn-radius)" }}
    >
      Shop all products
    </Link>
  );
}
