# Launch Checklist — Foundry on Netlify + Neon

## Pre-deploy (one time)

- [ ] Neon database connected (`npm run test:neon`)
- [ ] Netlify site linked to this repo
- [ ] Environment variables copied to **Netlify → Site settings → Environment variables**
- [ ] `APP_URL` set to your Netlify URL (e.g. `https://foundry.netlify.app`)
- [ ] Email provider: `RESEND_API_KEY` (recommended) or SMTP credentials
- [ ] Run `node scripts/setup-netlify.mjs` — all checks green

## Required Netlify environment variables

| Variable | Example / notes |
|----------|-----------------|
| `DATABASE_URL` | Neon **pooled** connection string (`-pooler` hostname) — Netlify Neon extension sets this |
| `DIRECT_URL` | Neon **direct** string (optional — auto-derived from `DATABASE_URL` at build) |
| `APP_URL` | `https://your-site.netlify.app` |
| `INTERNAL_SECRET` | Random 64-char hex (`npm run setup:env`) |
| `CRON_SECRET` | Random 64-char hex |
| `INTEGRATION_ENCRYPTION_KEY` | Random 64-char hex |
| `METRICS_SECRET` | Random 64-char hex |
| `RESEND_API_KEY` | From [resend.com](https://resend.com) (100 emails/day free) |
| `EMAIL_FROM` | `Foundry <hello@yourdomain.com>` (verify domain in Resend) |

## What deploy includes automatically

- **Next.js** via `@netlify/plugin-nextjs`
- **DB migrations** during build (`prisma migrate deploy`)
- **Cron jobs** via Netlify scheduled functions
- **File uploads** via Netlify Blobs (`foundry-uploads` store)
- **Security headers** (CSP, HSTS in production)

## Post-deploy verification

```bash
curl https://YOUR-SITE.netlify.app/api/health
curl https://YOUR-SITE.netlify.app/api/ready
```

Sign up at `/signup` and confirm verification email arrives (requires Resend/SMTP).

## Optional (scale later)

| Item | When |
|------|------|
| `REDIS_URL` (Upstash) | Multiple instances / stricter rate limits |
| Custom domain | Brand launch |
| Stripe `STRIPE_SECRET_KEY` | Live payments |
| `OPENAI_API_KEY` | LLM-enhanced AI assistant |

## Rollback

1. Netlify → Deploys → **Publish previous deploy**
2. If schema broke: restore Neon branch from console
3. See `docs/DEPLOYMENT.md` for full runbook
