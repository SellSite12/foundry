import type { Config } from "@netlify/functions";

/** Abandoned-cart recovery — hourly. */
export default async function handler() {
  const base = process.env.APP_URL ?? process.env.URL ?? process.env.DEPLOY_PRIME_URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    return new Response(
      JSON.stringify({ ok: false, error: "APP_URL and CRON_SECRET required" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  const res = await fetch(`${base.replace(/\/$/, "")}/api/internal/cron/abandoned-carts`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}

export const config: Config = {
  schedule: "@hourly",
};
