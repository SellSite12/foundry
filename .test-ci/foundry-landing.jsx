import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowRight,
  Store,
  CreditCard,
  Package,
  Users,
  BarChart3,
  Zap,
  Check,
  Menu,
  X,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  Tooltip,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  TOKENS                                                             */
/* ------------------------------------------------------------------ */
const C = {
  base: "#0C0A09",       // warm black
  base2: "#111011",      // panel base
  surface: "#18140F",    // card surface
  surface2: "#1F1A13",   // raised surface
  line: "rgba(232,163,61,0.10)",
  lineStrong: "rgba(232,163,61,0.22)",
  copper: "#E8A33D",     // primary accent (molten gold)
  copperDeep: "#B85C2E", // deep copper
  copperSoft: "rgba(232,163,61,0.14)",
  text: "#EFE9DF",       // warm white
  textDim: "#B8AFA0",    // warm gray
  textFaint: "#7A7266",  // muted
};

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
`;

/* ------------------------------------------------------------------ */
/*  GLOBAL STYLE / KEYFRAMES                                          */
/* ------------------------------------------------------------------ */
const GlobalStyle = () => (
  <style>{`
    ${FONT_IMPORT}

    .fdy-root {
      font-family: 'Inter', sans-serif;
      background: ${C.base};
      color: ${C.text};
      position: relative;
      overflow-x: hidden;
    }
    .fdy-display { font-family: 'Space Grotesk', sans-serif; }
    .fdy-mono { font-family: 'JetBrains Mono', monospace; }

    @keyframes fdy-drift-1 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(4%, 6%) scale(1.08); }
    }
    @keyframes fdy-drift-2 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-5%, -4%) scale(1.1); }
    }
    @keyframes fdy-float {
      0%, 100% { transform: translateY(0px) rotate(var(--rot, 0deg)); }
      50% { transform: translateY(-14px) rotate(var(--rot, 0deg)); }
    }
    @keyframes fdy-pulse-glow {
      0%, 100% { opacity: 0.55; }
      50% { opacity: 1; }
    }
    @keyframes fdy-rise {
      from { opacity: 0; transform: translateY(28px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fdy-spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes fdy-marquee {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }
    @keyframes fdy-grain {
      0%, 100% { transform: translate(0,0); }
      10% { transform: translate(-1%,-2%); }
      30% { transform: translate(2%,1%); }
      50% { transform: translate(-2%,2%); }
      70% { transform: translate(1%,-1%); }
      90% { transform: translate(-1%,1%); }
    }

    .fdy-reveal {
      opacity: 0;
      transform: translateY(28px);
      transition: opacity 0.7s cubic-bezier(.2,.7,.3,1), transform 0.7s cubic-bezier(.2,.7,.3,1);
    }
    .fdy-reveal.fdy-in {
      opacity: 1;
      transform: translateY(0);
    }

    .fdy-magnetic {
      transition: transform 0.25s cubic-bezier(.2,.8,.2,1), box-shadow 0.25s ease;
    }

    .fdy-card-hover {
      transition: transform 0.35s cubic-bezier(.2,.8,.2,1), border-color 0.35s ease, background 0.35s ease;
    }
    .fdy-card-hover:hover {
      transform: translateY(-6px);
    }

    .fdy-scrollbar::-webkit-scrollbar { display: none; }

    @media (prefers-reduced-motion: reduce) {
      .fdy-root * {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
      }
    }
  `}</style>
);

/* ------------------------------------------------------------------ */
/*  SCROLL REVEAL WRAPPER                                             */
/* ------------------------------------------------------------------ */
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`fdy-reveal ${inView ? "fdy-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAGNETIC BUTTON                                                    */
/* ------------------------------------------------------------------ */
function Magnetic({ children, strength = 18, style = {}, ...props }) {
  const ref = useRef(null);

  const onMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${(x / rect.width) * strength}px, ${
        (y / rect.height) * strength
      }px)`;
    },
    [strength]
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (el) el.style.transform = "translate(0px, 0px)";
  }, []);

  return (
    <button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="fdy-magnetic"
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  NAV                                                                */
/* ------------------------------------------------------------------ */
function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["Product", "Pricing", "Customers", "Docs"];

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pt-4"
      style={{ pointerEvents: "none" }}
    >
      <nav
        className="w-full max-w-6xl flex items-center justify-between rounded-2xl px-4 sm:px-5 py-3"
        style={{
          pointerEvents: "auto",
          background: scrolled ? "rgba(17,16,17,0.72)" : "rgba(17,16,17,0.35)",
          backdropFilter: "blur(18px)",
          border: `1px solid ${scrolled ? C.lineStrong : C.line}`,
          transition: "background 0.4s ease, border-color 0.4s ease",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center fdy-display font-bold"
            style={{
              background: `linear-gradient(135deg, ${C.copper}, ${C.copperDeep})`,
              color: C.base,
            }}
          >
            F
          </div>
          <span className="fdy-display font-semibold text-[15px] tracking-tight" style={{ color: C.text }}>
            Foundry
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l}
              href="#"
              className="text-[13.5px] transition-colors"
              style={{ color: C.textDim }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.textDim)}
            >
              {l}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <a href="#" className="text-[13.5px]" style={{ color: C.textDim }}>
            Sign in
          </a>
          <Magnetic
            style={{
              background: C.text,
              color: C.base,
              fontSize: "13.5px",
              fontWeight: 600,
              padding: "9px 16px",
              borderRadius: "9999px",
            }}
          >
            Start building
          </Magnetic>
        </div>

        <button
          className="md:hidden p-1.5"
          style={{ color: C.text }}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div
          className="md:hidden absolute top-[72px] left-4 right-4 rounded-2xl p-5 flex flex-col gap-4"
          style={{
            pointerEvents: "auto",
            background: "rgba(17,16,17,0.96)",
            border: `1px solid ${C.line}`,
          }}
        >
          {links.map((l) => (
            <a key={l} href="#" className="text-sm" style={{ color: C.textDim }}>
              {l}
            </a>
          ))}
          <div className="h-px w-full" style={{ background: C.line }} />
          <a href="#" className="text-sm" style={{ color: C.textDim }}>
            Sign in
          </a>
          <button
            className="text-sm font-semibold rounded-full py-2.5"
            style={{ background: C.text, color: C.base }}
          >
            Start building
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AURORA / GRAIN BACKGROUND                                         */
/* ------------------------------------------------------------------ */
function AuroraBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div
        className="absolute rounded-full"
        style={{
          width: 700,
          height: 700,
          top: -220,
          left: -160,
          background: `radial-gradient(circle, ${C.copperSoft} 0%, transparent 70%)`,
          filter: "blur(40px)",
          animation: "fdy-drift-1 22s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 560,
          height: 560,
          top: -80,
          right: -180,
          background: `radial-gradient(circle, rgba(184,92,46,0.16) 0%, transparent 70%)`,
          filter: "blur(50px)",
          animation: "fdy-drift-2 26s ease-in-out infinite",
        }}
      />
      <svg width="0" height="0">
        <filter id="fdy-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div
        className="absolute inset-0"
        style={{
          filter: "url(#fdy-noise)",
          opacity: 0.035,
          animation: "fdy-grain 1.2s steps(2) infinite",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HERO                                                               */
/* ------------------------------------------------------------------ */
function Hero() {
  const heroRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMove = (e) => {
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x, y });
  };

  const stats = [
    { label: "avg. checkout time", value: "38s" },
    { label: "processed last month", value: "$41.2M" },
    { label: "stores forged", value: "12,900+" },
  ];

  return (
    <section
      ref={heroRef}
      onMouseMove={onMove}
      className="relative pt-40 pb-28 px-4 sm:px-6"
      style={{ zIndex: 1 }}
    >
      <AuroraBackdrop />

      <div className="relative max-w-6xl mx-auto flex flex-col items-center text-center" style={{ zIndex: 2 }}>
        <div
          className="fdy-mono inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11.5px] mb-8"
          style={{
            border: `1px solid ${C.lineStrong}`,
            color: C.copper,
            background: "rgba(232,163,61,0.06)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: C.copper, animation: "fdy-pulse-glow 2s ease-in-out infinite" }}
          />
          NOW FORGING V2.0
        </div>

        <h1
          className="fdy-display font-semibold tracking-tight leading-[1.02]"
          style={{
            fontSize: "clamp(2.6rem, 6.4vw, 5.4rem)",
            color: C.text,
          }}
        >
          Commerce,
          <br />
          <span
            style={{
              background: `linear-gradient(100deg, ${C.copper} 0%, #F4C577 35%, ${C.copperDeep} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            cast in one platform.
          </span>
        </h1>

        <p
          className="mt-7 max-w-xl text-[16.5px] leading-relaxed"
          style={{ color: C.textDim }}
        >
          Foundry gives builders one place to launch stores, price products, and
          run the whole business — digital goods, physical goods, subscriptions,
          licenses, and services, all from a single dashboard.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center gap-4">
          <Magnetic
            style={{
              background: `linear-gradient(135deg, ${C.copper}, ${C.copperDeep})`,
              color: C.base,
              fontWeight: 600,
              fontSize: "14.5px",
              padding: "13px 26px",
              borderRadius: "9999px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 8px 30px rgba(232,163,61,0.25)",
            }}
          >
            Start building free <ArrowRight size={16} />
          </Magnetic>
          <Magnetic
            strength={10}
            style={{
              background: "transparent",
              color: C.text,
              fontWeight: 500,
              fontSize: "14.5px",
              padding: "13px 24px",
              borderRadius: "9999px",
              border: `1px solid ${C.lineStrong}`,
            }}
          >
            Watch the forge — 2 min
          </Magnetic>
        </div>

        {/* stats row */}
        <div className="mt-14 flex flex-wrap justify-center gap-x-12 gap-y-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="fdy-mono font-semibold text-[22px]" style={{ color: C.text }}>
                {s.value}
              </div>
              <div className="text-[12px] mt-1" style={{ color: C.textFaint }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* floating dashboard preview */}
        <div
          className="relative mt-20 w-full max-w-4xl"
          style={{ perspective: "1400px" }}
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: `1px solid ${C.lineStrong}`,
              background: `linear-gradient(180deg, ${C.surface2}, ${C.base2})`,
              boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
              transform: `rotateX(${tilt.y * -6}deg) rotateY(${tilt.x * 8}deg)`,
              transition: "transform 0.15s ease-out",
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#5A4A38" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#5A4A38" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#5A4A38" }} />
              <span className="fdy-mono text-[11px] ml-3" style={{ color: C.textFaint }}>
                app.foundry.co/dashboard
              </span>
            </div>
            <div className="p-6 sm:p-8 text-left">
              <MiniDashboard />
            </div>
          </div>

          {/* floating chip cards */}
          <div
            className="hidden md:block absolute -left-10 top-14 rounded-xl px-4 py-3"
            style={{
              background: C.surface2,
              border: `1px solid ${C.lineStrong}`,
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              animation: "fdy-float 6s ease-in-out infinite",
              "--rot": "-4deg",
            }}
          >
            <div className="text-[11px]" style={{ color: C.textFaint }}>New order</div>
            <div className="fdy-mono text-[13px] font-semibold" style={{ color: C.copper }}>
              +$249.00
            </div>
          </div>
          <div
            className="hidden md:block absolute -right-8 bottom-8 rounded-xl px-4 py-3"
            style={{
              background: C.surface2,
              border: `1px solid ${C.lineStrong}`,
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              animation: "fdy-float 7s ease-in-out infinite 1s",
              "--rot": "3deg",
            }}
          >
            <div className="text-[11px]" style={{ color: C.textFaint }}>License activated</div>
            <div className="fdy-mono text-[13px] font-semibold" style={{ color: C.text }}>
              PRO-88213
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  MINI DASHBOARD (used inside hero preview)                          */
/* ------------------------------------------------------------------ */
const demoRevenue = [
  { d: "Mon", v: 3200 },
  { d: "Tue", v: 4100 },
  { d: "Wed", v: 3800 },
  { d: "Thu", v: 5200 },
  { d: "Fri", v: 6100 },
  { d: "Sat", v: 5600 },
  { d: "Sun", v: 7200 },
];

function MiniDashboard() {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[11px]" style={{ color: C.textFaint }}>This week's revenue</div>
          <div className="fdy-display font-semibold text-[26px]" style={{ color: C.text }}>
            $34,912
          </div>
        </div>
        <span
          className="fdy-mono text-[11px] px-2.5 py-1 rounded-full"
          style={{ color: C.copper, background: "rgba(232,163,61,0.1)" }}
        >
          PREVIEW DATA
        </span>
      </div>
      <div style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={demoRevenue}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.copper} stopOpacity={0.45} />
                <stop offset="100%" stopColor={C.copper} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="d" hide />
            <Tooltip
              contentStyle={{
                background: C.base2,
                border: `1px solid ${C.line}`,
                borderRadius: 8,
                fontSize: 12,
                color: C.text,
              }}
              labelStyle={{ color: C.textFaint }}
            />
            <Area type="monotone" dataKey="v" stroke={C.copper} strokeWidth={2} fill="url(#rev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-5">
        {[
          { l: "Orders", v: "428" },
          { l: "Customers", v: "1,204" },
          { l: "Products", v: "36" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg px-3 py-2.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.line}` }}>
            <div className="text-[10.5px]" style={{ color: C.textFaint }}>{s.l}</div>
            <div className="fdy-mono text-[15px] font-semibold" style={{ color: C.text }}>{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FEATURES                                                           */
/* ------------------------------------------------------------------ */
const features = [
  {
    icon: Store,
    title: "Store builder",
    desc: "Compose pages from premium blocks. No template lock-in — every section is yours to reshape.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Revenue, cohorts, and churn in one view. See what's working before you need to ask.",
  },
  {
    icon: CreditCard,
    title: "Payments",
    desc: "Cards, wallets, and local methods handled under one ledger — one payout, one reconciliation.",
  },
  {
    icon: Package,
    title: "Digital delivery",
    desc: "Licenses, files, and access keys delivered the instant payment clears. Nothing to babysit.",
  },
  {
    icon: Users,
    title: "Customer management",
    desc: "Every buyer, subscription, and support thread in one record — no more stitching tools together.",
  },
  {
    icon: Zap,
    title: "Automation",
    desc: "Trigger emails, refunds, and fulfillment from rules you set once. Foundry runs the rest.",
  },
];

function Features() {
  return (
    <section className="relative py-28 px-4 sm:px-6" style={{ zIndex: 1 }}>
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="max-w-xl mb-16">
            <span className="fdy-mono text-[11.5px]" style={{ color: C.copper }}>
              CAPABILITIES
            </span>
            <h2 className="fdy-display font-semibold mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)] leading-tight" style={{ color: C.text }}>
              Everything a store needs, forged into one system.
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 70}>
              <div
                className="fdy-card-hover h-full rounded-2xl p-6"
                style={{
                  background: C.surface,
                  border: `1px solid ${C.line}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.lineStrong)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line)}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
                  style={{ background: "rgba(232,163,61,0.1)" }}
                >
                  <f.icon size={18} color={C.copper} />
                </div>
                <h3 className="fdy-display font-semibold text-[16.5px] mb-2" style={{ color: C.text }}>
                  {f.title}
                </h3>
                <p className="text-[13.5px] leading-relaxed" style={{ color: C.textDim }}>
                  {f.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  PRICING                                                            */
/* ------------------------------------------------------------------ */
const tiers = [
  {
    name: "Starter",
    blurb: "For a first product launch.",
    monthly: 0,
    yearly: 0,
    features: ["1 store", "Up to 50 orders/mo", "Digital delivery", "Community support"],
  },
  {
    name: "Growth",
    blurb: "For stores scaling past the first year.",
    monthly: 39,
    yearly: 31,
    features: [
      "5 stores",
      "Unlimited orders",
      "Subscriptions & licenses",
      "Automation rules",
      "Priority support",
    ],
    highlight: true,
  },
  {
    name: "Scale",
    blurb: "For teams running commerce at volume.",
    monthly: 129,
    yearly: 103,
    features: [
      "Unlimited stores",
      "Custom checkout",
      "Dedicated account lead",
      "SLA & audit logs",
      "SSO",
    ],
  },
];

function Pricing() {
  const [yearly, setYearly] = useState(true);

  return (
    <section className="relative py-28 px-4 sm:px-6" style={{ zIndex: 1 }}>
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="flex flex-col items-center text-center mb-12">
            <span className="fdy-mono text-[11.5px]" style={{ color: C.copper }}>
              PRICING
            </span>
            <h2 className="fdy-display font-semibold mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]" style={{ color: C.text }}>
              Simple pricing, no seat games.
            </h2>

            <div
              className="mt-8 inline-flex items-center rounded-full p-1"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              {["Monthly", "Yearly"].map((label, idx) => {
                const active = (idx === 1) === yearly;
                return (
                  <button
                    key={label}
                    onClick={() => setYearly(idx === 1)}
                    className="fdy-mono text-[12.5px] px-4 py-2 rounded-full transition-colors"
                    style={{
                      background: active ? C.copper : "transparent",
                      color: active ? C.base : C.textDim,
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    {label}
                    {label === "Yearly" && (
                      <span className="ml-1.5" style={{ opacity: 0.75 }}>
                        −20%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {tiers.map((t, i) => (
            <Reveal key={t.name} delay={i * 80}>
              <div
                className="fdy-card-hover rounded-2xl p-7 h-full flex flex-col"
                style={{
                  background: t.highlight
                    ? `linear-gradient(180deg, ${C.surface2}, ${C.surface})`
                    : C.surface,
                  border: `1px solid ${t.highlight ? C.copper : C.line}`,
                  boxShadow: t.highlight ? "0 20px 60px rgba(232,163,61,0.12)" : "none",
                }}
              >
                {t.highlight && (
                  <span
                    className="fdy-mono text-[10.5px] self-start px-2.5 py-1 rounded-full mb-4"
                    style={{ background: "rgba(232,163,61,0.15)", color: C.copper }}
                  >
                    MOST POPULAR
                  </span>
                )}
                <h3 className="fdy-display font-semibold text-[19px]" style={{ color: C.text }}>
                  {t.name}
                </h3>
                <p className="text-[13px] mt-1.5 mb-6" style={{ color: C.textFaint }}>
                  {t.blurb}
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="fdy-display font-semibold text-[36px]" style={{ color: C.text }}>
                    ${yearly ? t.yearly : t.monthly}
                  </span>
                  <span className="text-[13px]" style={{ color: C.textFaint }}>
                    /mo
                  </span>
                </div>
                <div className="flex flex-col gap-3 mb-8 flex-1">
                  {t.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-[13.5px]" style={{ color: C.textDim }}>
                      <Check size={15} color={C.copper} />
                      {f}
                    </div>
                  ))}
                </div>
                <button
                  className="w-full py-3 rounded-full text-[13.5px] font-semibold transition-transform"
                  style={{
                    background: t.highlight ? C.copper : "transparent",
                    color: t.highlight ? C.base : C.text,
                    border: t.highlight ? "none" : `1px solid ${C.lineStrong}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {t.monthly === 0 ? "Start free" : "Choose plan"}
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  TESTIMONIALS                                                       */
/* ------------------------------------------------------------------ */
const testimonials = [
  {
    quote:
      "We moved three separate tools into Foundry in a weekend. Payouts finally match what the dashboard says.",
    name: "Priya N.",
    role: "Founder, studio selling design kits",
  },
  {
    quote:
      "The automation rules replaced a spreadsheet three of us maintained by hand every Friday.",
    name: "Marcus T.",
    role: "Ops lead, subscription software company",
  },
  {
    quote:
      "License delivery used to be our top support ticket. It's now the thing customers never write in about.",
    name: "Elena V.",
    role: "Co-founder, indie tools maker",
  },
];

function Testimonials() {
  const logos = ["ORBITAL", "NUEVA", "PINEBOX", "HALFTONE", "REDWICK", "AMPFIELD"];
  return (
    <section className="relative py-28 px-4 sm:px-6" style={{ zIndex: 1 }}>
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="max-w-xl mb-14">
            <span className="fdy-mono text-[11.5px]" style={{ color: C.copper }}>
              CUSTOMERS
            </span>
            <h2 className="fdy-display font-semibold mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]" style={{ color: C.text }}>
              Builders trust Foundry with the whole storefront.
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 80}>
              <div
                className="fdy-card-hover h-full rounded-2xl p-6"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <p className="text-[14px] leading-relaxed mb-6" style={{ color: C.text }}>
                  “{t.quote}”
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center fdy-mono text-[12px] font-semibold"
                    style={{ background: C.copperSoft, color: C.copper }}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: C.text }}>{t.name}</div>
                    <div className="text-[11.5px]" style={{ color: C.textFaint }}>{t.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div
            className="relative overflow-hidden py-6 rounded-xl"
            style={{ border: `1px solid ${C.line}`, background: C.surface }}
          >
            <div
              className="flex gap-16 whitespace-nowrap fdy-mono text-[13px]"
              style={{ animation: "fdy-marquee 22s linear infinite", color: C.textFaint }}
            >
              {[...logos, ...logos].map((l, i) => (
                <span key={i} className="tracking-widest">
                  {l}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FOOTER                                                             */
/* ------------------------------------------------------------------ */
function Footer() {
  const cols = [
    {
      title: "Product",
      links: ["Store builder", "Payments", "Analytics", "Automation", "Changelog"],
    },
    {
      title: "Company",
      links: ["About", "Careers", "Blog", "Press"],
    },
    {
      title: "Resources",
      links: ["Documentation", "API reference", "Guides", "Status"],
    },
    {
      title: "Legal",
      links: ["Privacy", "Terms", "Security"],
    },
  ];

  return (
    <footer className="relative pt-20 pb-10 px-4 sm:px-6" style={{ borderTop: `1px solid ${C.line}`, zIndex: 1 }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center fdy-display font-bold"
                style={{ background: `linear-gradient(135deg, ${C.copper}, ${C.copperDeep})`, color: C.base }}
              >
                F
              </div>
              <span className="fdy-display font-semibold text-[15px]" style={{ color: C.text }}>
                Foundry
              </span>
            </div>
            <p className="text-[13px] leading-relaxed max-w-xs" style={{ color: C.textFaint }}>
              One platform to cast a store, price a product, and run the business behind it.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <Twitter size={16} color={C.textFaint} />
              <Github size={16} color={C.textFaint} />
              <Linkedin size={16} color={C.textFaint} />
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <div className="fdy-mono text-[11px] mb-4" style={{ color: C.textFaint }}>
                {c.title.toUpperCase()}
              </div>
              <div className="flex flex-col gap-3">
                {c.links.map((l) => (
                  <a key={l} href="#" className="text-[13px]" style={{ color: C.textDim }}>
                    {l}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: `1px solid ${C.line}` }}
        >
          <span className="text-[12px]" style={{ color: C.textFaint }}>
            © 2026 Foundry, Inc. All rights reserved.
          </span>
          <span className="fdy-mono text-[11px]" style={{ color: C.textFaint }}>
            Built for builders.
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  ROOT                                                                */
/* ------------------------------------------------------------------ */
export default function FoundryLanding() {
  return (
    <div className="fdy-root min-h-screen w-full">
      <GlobalStyle />
      <Nav />
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <Footer />
    </div>
  );
}
