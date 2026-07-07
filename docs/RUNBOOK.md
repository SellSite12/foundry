# Operational Runbook

## Incident response

### Application down

1. Check `GET /api/health` — if fails, restart the process
2. Check `GET /api/ready` — if 503, investigate database connectivity
3. Review recent `SystemLog` errors: query `systemLog` table where `level = 'error'`
4. Check `/admin/monitoring` (ADMIN users) for queue failures

### High error rate

1. `GET /api/metrics` (with `METRICS_SECRET`) for error count and API latency
2. Filter `apiRequestLog` by `statusCode >= 500`
3. Check `backgroundJob` where `status = 'FAILED'`

### Database issues

1. Verify `DATABASE_URL` and connection pool limits
2. Check Prisma query logs (set `log: ['query']` in dev only)
3. Restore from backup if corruption suspected

## Routine operations

| Task | Frequency | Command |
|------|-----------|---------|
| Process jobs | Every 1 min | `POST /api/internal/cron/jobs` |
| Abandoned carts | Every 15 min | `POST /api/internal/cron/abandoned-carts` |
| Database backup | Daily | `node scripts/backup.mjs` or `pg_dump` |
| Log retention | Automatic | Cron purges logs > 90 days |
| Dependency audit | Weekly | `npm audit` |

## Deployment checklist

- [ ] All env vars set (no dev fallbacks)
- [ ] `npx prisma migrate deploy` succeeded
- [ ] `npm run build` passes
- [ ] Health/ready endpoints return 200
- [ ] `node scripts/phase6-test.mjs` passes
- [ ] SMTP sends test email
- [ ] Stripe webhook configured (if applicable)
- [ ] CDN caching rules applied
- [ ] Cron jobs scheduled

## Disaster recovery

1. **RTO target:** 1 hour
2. **RPO target:** 24 hours (daily backups)
3. Restore procedure:
   - Provision new database from latest backup
   - Restore uploads from object storage backup
   - Deploy latest known-good image
   - Run `npx prisma migrate deploy`
   - Verify with health checks and phase6 tests

## Contacts & escalation

Configure alerting hooks on `/api/metrics` thresholds:
- Error rate > 5% of requests in 5 minutes
- Queue pending > 100 jobs
- API p95 latency > 2000ms
