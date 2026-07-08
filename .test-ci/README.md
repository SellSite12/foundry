# Foundry

Commerce, cast in one platform. A premium SaaS platform for builders to launch
stores, price products, and run the whole business.

**Status: Phase 6 complete — production launch ready.** Phases 1–5 deliver the
full commerce platform; Phase 6 adds security hardening, observability,
compliance foundations, SEO, CI/CD, documentation, and launch verification.
Everything uses the real database — no mock data.

## Stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, TypeScript, Turbopack)          |
| Database   | Prisma ORM — SQLite in dev, PostgreSQL-ready for prod   |
| Auth       | Custom session auth: bcrypt + DB-backed httpOnly cookies|
| Payments   | Foundry Pay (dev) / Stripe REST API (production)        |
| Styling    | Tailwind CSS 4 + Foundry design tokens (Phase 1 palette)|
| Email      | Nodemailer (SMTP) with console fallback in development  |
| Validation | Zod on every API boundary                               |

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
#    Copy .env.example to .env (the dev defaults work out of the box)
copy .env.example .env

# 3. Create the database and run migrations
npx prisma migrate dev

# 4. Run
npm run dev        # development
npm run build && npm start   # production
```

Open http://localhost:3000. Create an account at `/signup` — with no SMTP
configured, verification and password-reset emails are printed to the server
console so you can click the links locally.

### Useful scripts

| Command                       | What it does                                  |
| ----------------------------- | --------------------------------------------- |
| `npm run dev`                 | Dev server with hot reload                    |
| `npm run build`               | Production build (runs `prisma generate`)     |
| `npm run db:migrate`          | Create/apply a migration in development       |
| `npm run db:deploy`           | Apply migrations in production                |
| `npm run db:studio`           | Browse the database in Prisma Studio          |
| `node scripts/phase2-test.mjs`| End-to-end auth/account test suite (25 checks)|
| `node scripts/phase3-test.mjs`| End-to-end seller platform suite (59 checks)  |
| `node scripts/phase4-test.mjs`| Storefront, cart, checkout, marketplace (34 checks) |
| `node scripts/phase5-test.mjs`| AI, API v1, webhooks, integrations, reports (33 checks) |
| `node scripts/phase6-test.mjs`| Production readiness: health, SEO, security, compliance (20+ checks) |
| `npm run test:launch`         | Phase 6 tests + launch readiness report              |
| `npm run backup`              | Backup database, uploads, and reports              |

All test suites run against a live server (`npm run dev` or `npm start`) and
create their own throwaway accounts, so they are safe to run repeatedly.

## Environment variables

See `.env.example` for the full list. Never commit `.env`.

| Variable        | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| `DATABASE_URL`  | Database connection string                           |
| `APP_URL`       | Absolute base URL, used in email links               |
| `SMTP_*`        | SMTP credentials (blank in dev = console emails)     |
| `EMAIL_FROM`    | From address for transactional email                 |
| `STRIPE_SECRET_KEY` | Enables Stripe adapter (optional; Foundry Pay default) |
| `CRON_SECRET`   | Protects `/api/internal/cron/*` scheduled jobs       |
| `INTERNAL_SECRET` | Protects internal domain resolver API              |
| `OPENAI_API_KEY` | Optional — enables LLM-enhanced AI assistant copy |
| `INTEGRATION_ENCRYPTION_KEY` | Encrypts integration credentials at rest |

### Switching to PostgreSQL for production

1. Change `provider = "sqlite"` to `provider = "postgresql"` in
   `prisma/schema.prisma`.
2. Point `DATABASE_URL` at your Postgres instance.
3. Run `npx prisma migrate dev` once locally to regenerate migrations for
   Postgres, then `npm run db:deploy` in production.

The schema uses no engine-specific features (string status fields instead of
enums, JSON stored as strings), so it ports cleanly.

## Architecture

```
prisma/schema.prisma      Database schema (all models + relations)
var/uploads/              Uploaded media (runtime data, gitignored)
src/
  proxy.ts                Edge routing guard (cookie presence check)
  app/
    page.tsx              Landing page (Phase 1 design)
    (auth)/               signup, login, forgot/reset password, verify email
    dashboard/            Protected app: overview, notifications, settings,
                          stores list (entry point to the seller area)
    onboarding/[storeId]/ Multi-step seller onboarding wizard
    store/[storeId]/      Seller dashboard (+ storefront editor at /storefront)
    shop/[slug]/          Customer storefront: home, products, cart, checkout,
                          about, FAQ, contact, privacy, terms, order tracking
    marketplace/          Cross-store browse: trending, categories, search,
                          seller profiles
    account/              Buyer account: orders, addresses, wallet, wishlist,
                          reviews
    uploads/[...path]/    Serves uploaded media from var/uploads at runtime
    api/
      shop/[slug]/        cart, quote, checkout, reviews, questions, contact, track
      marketplace/        search + autocomplete
      account/            orders, addresses, payment-methods, wishlist, reviews
      internal/           domain resolver, cron (abandoned carts)
  lib/
    db.ts                 Prisma client singleton
    constants.ts          Allowed values for status/type columns
    theme.ts              Design tokens
    api.ts                API helpers: responses, body parsing, error handling
    rate-limit.ts         Fixed-window in-memory rate limiter
    analytics.ts          Platform event tracking
    notifications.ts      Notification creation
    money.ts              Cents-based money formatting/parsing
    plans.ts              Subscription plan definitions and limits
    auth/                 password hashing, sessions, single-use tokens
    email/                Transactional email (SMTP or console)
    seller/               store access + roles, metrics, pagination, CSV, slugs
    shop/                 storefront, cart, checkout engine, theme, marketplace,
                          domain resolution, automations
    payments/             Foundry Pay + Stripe adapters, fraud risk scoring
    audit.ts              Security audit trail for checkout and payments
    validation/           Zod schemas for every mutating endpoint
  components/
    ui/                   Button, Input, Alert, Card, Avatar (theme-aware)
    auth/                 AuthShell layout
    dashboard/            Sidebar, Topbar, UserMenu, NotificationList, …
    settings/             Profile, Password, Preferences, Sessions, DangerZone
    seller/               Seller dashboard UI (+ ThemeCustomizer, CustomDomainForm)
    storefront/           CartView, CheckoutFlow, ProductGallery, ReviewsSection
    landing/              FoundryLanding (Phase 1, wired to real auth)
```

### Seller platform (Phase 3)

- **Onboarding** — any user can create a store; a four-step wizard collects
  business identity, contact/address, tax + locale, and branding, saving
  progress to the database at each step.
- **Access control** — `requireStoreAccess(storeId, scope)` resolves the
  caller's role (Owner / Admin / Manager / Support / Warehouse, plus optional
  per-member permission overrides) and returns 404 for stores the user cannot
  see at all, 403 for scopes their role does not permit.
- **Products** — variants, images/videos, SKU/barcode, weight/dimensions,
  SEO, scheduled publishing, bulk actions; deletes archive instead when order
  history exists so records stay intact.
- **Orders** — manual order creation with price snapshots, store tax, and
  inventory decrement; full status lifecycle, tracking, notes, timeline,
  partial/full refunds with optional restock, printable invoice/packing slip.
- **Inventory** — stock, reserved, incoming, thresholds with low/out-of-stock
  notifications, and a complete adjustment history with reasons and actors.
- **Media** — uploads stored under `var/uploads` and served through a
  validated route handler; folders, search, replace, delete, plan storage
  limits. Swap the disk write for S3/R2 in production — the data model stores
  URLs, so no schema change is needed.
- **Analytics** — revenue, orders, AOV, units, returning customers, and
  day-by-day series computed from live orders; conversion, traffic sources,
  devices, geography, and funnel charts aggregate real `storefront.visit`
  events emitted on every shop page.
- **Billing** — per-store subscription with Starter/Growth/Scale plans;
  limits on stores, products, team seats, and storage are enforced in the
  APIs; upgrade/downgrade/cancel/resume recorded with history.
- **Theming** — dark/light mode via CSS variables and a `data-theme`
  attribute applied server-side from user preferences (no flash).

### Storefront & checkout (Phase 4)

- **Storefront** — every onboarded store is live at `/shop/[slug]` with themed
  homepage sections, product catalog, collections, and content pages (about,
  FAQ, contact, privacy, terms). Sellers customize colors, fonts, layouts,
  announcement bar, and banner via the theme customizer with live preview.
- **Custom domains** — `Store.customDomain` is persisted and resolved by the
  edge proxy, rewriting requests to the correct storefront slug.
- **Cart** — persistent DB cart keyed by cookie token; merges on login;
  supports saved-for-later, promo codes, and gift cards.
- **Checkout** — server-side repricing via `computeQuote()` (automatic
  discounts, code discounts, region tax rules, shipping rates, gift cards);
  multi-step UI; guest and account checkout; saved addresses and payment
  methods; price-drift detection before charging.
- **Payments** — provider-agnostic `PaymentProvider` interface; Foundry Pay
  handles full E2E in development (test cards, tokenization, decline codes);
  Stripe REST adapter activates when `STRIPE_SECRET_KEY` is set. Card numbers
  are never stored — only provider tokens, brand, and last4.
- **Marketplace** — `/marketplace` aggregates products across all live stores
  with search, filters, sorting, categories, trending, and seller profiles.
- **Buyer account** — `/account` for order history, addresses, saved cards,
  wishlist, and review management across storefronts.
- **Reviews & Q&A** — customers submit reviews (moderated before publication);
  verified-purchase badge; seller replies and abuse reporting.
- **Automations** — `CART_ABANDONED` rules fire via cron
  (`POST /api/internal/cron/abandoned-carts`) or manual seller trigger.

### Security model

- **Passwords** — bcrypt with 12 rounds; strength rules enforced by Zod.
- **Sessions** — 32-byte random token in an `httpOnly`, `SameSite=Lax`,
  `Secure` (prod) cookie. Only the SHA-256 hash is stored in the database, so
  a leaked DB row cannot be replayed. 30-day expiry, revocable per device.
- **Email tokens** — single-use, hashed at rest, short expiry (24 h
  verification / 60 min reset). Issuing a new token invalidates old ones;
  consuming is atomic to prevent races.
- **Route protection** — edge proxy redirects by cookie presence for UX; every
  server component and API route re-validates the session against the
  database (`getCurrentUser` / `requireUser`).
- **Data isolation** — every query is scoped by the authenticated user's id;
  verified by the e2e suite with two concurrent accounts.
- **CSRF** — SameSite cookies plus an Origin/Host check on every mutating
  request.
- **Rate limiting** — per-IP fixed windows on signup, login, checkout, cart,
  reviews, and track-order endpoints (swap for Redis when running multiple
  instances).
- **Audit logging** — checkout.placed, payment.failed, and payment-method
  events written to `AuditLog` with IP address.
- **Fraud foundation** — `assessRisk()` flags elevated/high-risk orders based
  on amount, guest status, and item count; stored on `Payment.riskLevel`.
- **Anti-enumeration** — forgot-password returns an identical response whether
  or not the email exists; login errors never say which field was wrong.
- **Password change / reset** — revokes all other sessions.
- **Account deletion** — requires password re-confirmation; cascading deletes
  remove all owned rows.
- **Headers** — `X-Frame-Options: DENY`, `nosniff`, strict referrer policy.

## Phase 6 — Production launch

Phase 6 delivers production readiness:

- **Security:** CSP, HSTS (prod), COOP/CORP, production secret enforcement
- **Observability:** `/api/health`, `/api/ready`, `/api/metrics`, structured `SystemLog`
- **Compliance:** User data export, cookie consent, terms tracking, consent audit trail
- **SEO:** `sitemap.xml`, `robots.txt`, Open Graph metadata, JSON-LD helpers
- **Accessibility:** Skip link, reduced motion, ARIA dialog for cookie consent
- **i18n foundation:** Translation catalogs for en/es/fr/de/ja
- **Email templates:** Branded transactional emails for orders, shipping, refunds
- **CI/CD:** GitHub Actions pipeline (lint, typecheck, build, test)
- **Documentation:** `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/RUNBOOK.md`
- **Backups:** `scripts/backup.mjs` with manifest
- **Launch report:** `scripts/launch-report.mjs` → `var/reports/launch-readiness-report.json`

Generate the launch report:

```bash
npm run test:launch
```
