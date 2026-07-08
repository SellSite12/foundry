import Link from "next/link";

export function StorefrontFooter({
  slug,
  storeName,
  description,
  footerStyle,
  businessEmail,
  phone,
}: {
  slug: string;
  storeName: string;
  description: string | null;
  footerStyle: string;
  businessEmail: string | null;
  phone: string | null;
}) {
  const year = new Date().getFullYear();

  if (footerStyle === "slim") {
    return (
      <footer className="mt-16 border-t" style={{ borderColor: "var(--sf-line)" }}>
        <div
          className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-[13px] sm:flex-row sm:px-6"
          style={{ color: "var(--sf-text-dim)" }}
        >
          <span>© {year} {storeName}</span>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-4">
            <Link href={`/shop/${slug}/about`} className="hover:opacity-75">About</Link>
            <Link href={`/shop/${slug}/contact`} className="hover:opacity-75">Contact</Link>
            <Link href={`/shop/${slug}/privacy`} className="hover:opacity-75">Privacy</Link>
            <Link href={`/shop/${slug}/terms`} className="hover:opacity-75">Terms</Link>
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-16 border-t" style={{ borderColor: "var(--sf-line)", background: "var(--sf-surface)" }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <h3 className="text-[15px] font-semibold" style={{ color: "var(--sf-text)" }}>{storeName}</h3>
          {description ? (
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed" style={{ color: "var(--sf-text-dim)" }}>
              {description}
            </p>
          ) : null}
        </div>
        <nav aria-label="Shop links" className="text-[13.5px]">
          <h4 className="mb-3 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--sf-text-dim)" }}>Shop</h4>
          <ul className="space-y-2" style={{ color: "var(--sf-text-dim)" }}>
            <li><Link href={`/shop/${slug}/products`} className="hover:opacity-75">All products</Link></li>
            <li><Link href={`/shop/${slug}/faq`} className="hover:opacity-75">FAQ</Link></li>
            <li><Link href={`/shop/${slug}/track`} className="hover:opacity-75">Track your order</Link></li>
          </ul>
        </nav>
        <nav aria-label="Company links" className="text-[13.5px]">
          <h4 className="mb-3 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--sf-text-dim)" }}>Company</h4>
          <ul className="space-y-2" style={{ color: "var(--sf-text-dim)" }}>
            <li><Link href={`/shop/${slug}/about`} className="hover:opacity-75">About</Link></li>
            <li><Link href={`/shop/${slug}/contact`} className="hover:opacity-75">Contact</Link></li>
            <li><Link href={`/shop/${slug}/privacy`} className="hover:opacity-75">Privacy Policy</Link></li>
            <li><Link href={`/shop/${slug}/terms`} className="hover:opacity-75">Terms of Service</Link></li>
          </ul>
        </nav>
        <div className="text-[13.5px]">
          <h4 className="mb-3 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--sf-text-dim)" }}>Get in touch</h4>
          <ul className="space-y-2" style={{ color: "var(--sf-text-dim)" }}>
            {businessEmail ? <li><a href={`mailto:${businessEmail}`} className="hover:opacity-75">{businessEmail}</a></li> : null}
            {phone ? <li><a href={`tel:${phone}`} className="hover:opacity-75">{phone}</a></li> : null}
            <li>
              <Link href="/marketplace" className="hover:opacity-75">Part of the Foundry marketplace</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-[12px]" style={{ borderColor: "var(--sf-line)", color: "var(--sf-text-dim)" }}>
        © {year} {storeName}. Powered by Foundry.
      </div>
    </footer>
  );
}
