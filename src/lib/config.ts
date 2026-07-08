/**
 * Validates required environment variables at startup.
 * In production, missing critical secrets cause startup warnings logged to stderr.
 */

const IS_PROD = process.env.NODE_ENV === "production";

export const APP_VERSION = process.env.APP_VERSION ?? "0.2.0";

export function getRequiredSecret(name: string, devFallback?: string): string {
  const value = process.env[name];
  if (value) return value;
  if (!IS_PROD && devFallback) return devFallback;
  return devFallback ?? "";
}

export function validateProductionConfig(): { ok: boolean; warnings: string[] } {
  const warnings: string[] = [];
  if (!IS_PROD) return { ok: true, warnings };

  if (!process.env.DATABASE_URL?.startsWith("postgresql")) {
    warnings.push("DATABASE_URL should use PostgreSQL in production");
  }
  if (!process.env.INTERNAL_SECRET) warnings.push("INTERNAL_SECRET is required");
  if (!process.env.CRON_SECRET) warnings.push("CRON_SECRET is required");
  if (!process.env.INTEGRATION_ENCRYPTION_KEY) {
    warnings.push("INTEGRATION_ENCRYPTION_KEY should be set");
  }
  if (!process.env.REDIS_URL) {
    warnings.push("REDIS_URL not set — rate limiting uses in-memory store (single instance only)");
  }
  if (!process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
    warnings.push("RESEND_API_KEY or SMTP_* required for transactional email");
  } else if (!process.env.RESEND_API_KEY && !process.env.SMTP_USER) {
    warnings.push("SMTP_USER not set — SMTP email incomplete");
  }

  return { ok: warnings.length === 0, warnings };
}

export const config = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  isProd: IS_PROD,
  version: APP_VERSION,
  internalSecret: getRequiredSecret("INTERNAL_SECRET", "foundry-dev-internal"),
  cronSecret: getRequiredSecret("CRON_SECRET", ""),
  redisUrl: process.env.REDIS_URL ?? null,
  metricsSecret: process.env.METRICS_SECRET ?? "",
} as const;
