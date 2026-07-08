# Deployment Guide

## Prerequisites

- Node.js 22+
- PostgreSQL 15+ (production)
- SMTP provider (SendGrid, SES, etc.)
- Redis (recommended for multi-instance rate limiting)

## Environment variables

Copy `.env.example` to `.env` and configure all production values:

| Variable | Required (prod) | Purpose |
|----------|-----------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `APP_URL` | Yes | Public URL (https://yourdomain.com) |
| `INTERNAL_SECRET` | Yes | Custom domain resolver auth |
| `CRON_SECRET` | Yes | Cron job authentication |
| `INTEGRATION_ENCRYPTION_KEY` | Yes | AES key for integration credentials |
| `SMTP_*` | Yes | Transactional email |
| `STRIPE_SECRET_KEY` | If using Stripe | Payment processing |
| `REDIS_URL` | Recommended | Distributed rate limiting |
| `METRICS_SECRET` | Recommended | Protects `/api/metrics` |
| `OPENAI_API_KEY` | Optional | LLM-enhanced AI features |
| `APP_VERSION` | Optional | Displayed in health checks |

## Database setup (Neon)

1. Create a free project at [console.neon.tech](https://console.neon.tech)
2. Open **Connect** and copy both strings:
   - **Pooled** (`-pooler` in hostname) → `DATABASE_URL`
   - **Direct** (no `-pooler`) → `DIRECT_URL`
3. Add both to `.env` and Netlify environment variables
4. Connect and migrate:

```bash
npm run setup:neon
```

Prisma uses `directUrl` for migrations and the pooled `DATABASE_URL` at runtime via `@prisma/adapter-neon` (required for Netlify/serverless).

## Database setup (manual)

1. `provider = "postgresql"` in `prisma/schema.prisma` (already configured)
2. Set `DATABASE_URL` and `DIRECT_URL`
3. Run migrations:

```bash
npx prisma migrate deploy
```

## Email (Resend — recommended for Netlify)

1. Sign up at [resend.com](https://resend.com) (free tier: 100 emails/day)
2. Create an API key → set `RESEND_API_KEY` in Netlify env vars
3. Set `EMAIL_FROM` to a verified sender (e.g. `Foundry <hello@yourdomain.com>`)

Alternatively use SMTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`).

## Netlify deploy

See **`docs/LAUNCH.md`** for the full checklist. Quick version:

```bash
npm run setup:netlify   # validate local env
```

Push to git → Netlify builds with `npm run build:netlify`. Scheduled cron functions and Netlify Blobs uploads are configured in `netlify.toml`.

## Build & start

```bash
npm ci
npm run build
npm start
```

## Health checks

Configure your load balancer:

- **Liveness:** `GET /api/health` — returns 200 when process is running
- **Readiness:** `GET /api/ready` — returns 200 when database is reachable

## Cron jobs

Schedule `POST /api/internal/cron/jobs` every minute with:

```
Authorization: Bearer $CRON_SECRET
```

This processes: background jobs, scheduled reports, AI insight refresh, log retention purge.

Also schedule `POST /api/internal/cron/abandoned-carts` for cart recovery.

## Backups

Run daily:

```bash
node scripts/backup.mjs
```

For PostgreSQL production, use `pg_dump` with point-in-time recovery via WAL archiving.

## CDN & object storage

1. Move `var/uploads/` to S3/GCS with public-read or signed URLs
2. Update upload route to write to object storage
3. Configure CDN to cache `/uploads/*` with long TTL

## Horizontal scaling

- Run multiple Node instances behind a load balancer
- Set `REDIS_URL` for shared rate limiting
- Use PostgreSQL with connection pooling (PgBouncer)
- Keep cron on a single scheduler instance

## Rollback

1. Revert to previous container/image tag
2. If schema changed: `npx prisma migrate resolve` for failed migrations
3. Restore database from backup if needed

## Verification

```bash
node scripts/phase6-test.mjs
node scripts/launch-report.mjs
```
