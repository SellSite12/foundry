# Foundry Architecture Overview

## Stack

- **Frontend:** Next.js 16 App Router, React 19, Tailwind CSS 4
- **Backend:** Next.js API routes (serverless-compatible)
- **Database:** Prisma ORM — SQLite (dev), PostgreSQL (production)
- **Auth:** Custom sessions (bcrypt + httpOnly cookies, hashed tokens)
- **Email:** Nodemailer with branded HTML templates
- **Jobs:** DB-backed queue processed by cron worker

## Application layers

```
┌─────────────────────────────────────────────────┐
│  Edge proxy (src/proxy.ts)                      │
│  Cookie routing, custom domains, request IDs    │
├─────────────────────────────────────────────────┤
│  App Router pages + API routes                  │
│  Session auth, Zod validation, RBAC             │
├─────────────────────────────────────────────────┤
│  Domain libraries (src/lib/)                    │
│  shop/, seller/, ai/, jobs/, webhooks/         │
├─────────────────────────────────────────────────┤
│  Prisma + SQLite/PostgreSQL                     │
└─────────────────────────────────────────────────┘
```

## Key domains

| Domain | Path | Purpose |
|--------|------|---------|
| Identity | `src/lib/auth/` | Sessions, tokens, password hashing |
| Commerce | `src/lib/shop/` | Cart, checkout, storefront |
| Seller | `src/lib/seller/` | Access control, metrics |
| AI | `src/lib/ai/` | Insights, assistant, content generation |
| Observability | `src/lib/observability/` | Structured logs, metrics |
| Integrations | `src/lib/integrations/` | Encrypted credentials |

## Multi-tenancy

Every query is scoped by `storeId` or `userId`. Team roles enforce per-scope access via `requireStoreAccess()`.

## Stateless design

Application servers hold no session state — sessions live in the database. Rate limiters use in-memory stores in dev; configure `REDIS_URL` for production horizontal scaling.

## Regions & CDN

Deploy behind a CDN (Cloudflare, CloudFront) with:
- Static assets cached at edge
- `/api/health` and `/api/ready` bypass cache
- Upload files served via object storage + CDN in production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for infrastructure setup.
