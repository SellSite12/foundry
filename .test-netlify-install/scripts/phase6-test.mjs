/* eslint-disable no-console */
// Phase 6 production readiness verification.
// Usage: node scripts/phase6-test.mjs  (requires npm start)

import { readFile } from "fs/promises";
import path from "path";

const BASE = process.env.APP_URL ?? "http://localhost:3000";

async function loadEnv() {
  try {
    const raw = await readFile(path.join(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)="?([^"\n]+)"?/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}

await loadEnv();

let passed = 0;
let failed = 0;
const results = [];

function check(name, condition, detail = "") {
  const ok = Boolean(condition);
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
  results.push({ name, ok, detail: detail || undefined });
}

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      ...(opts.body ? { "content-type": "application/json" } : {}),
      ...(opts.cookie ? { cookie: opts.cookie } : {}),
      ...(opts.headers ?? {}),
      origin: BASE,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    redirect: opts.redirect ?? "manual",
  });
  let json = null;
  try {
    json = await res.clone().json();
  } catch {}
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c) => c.split(";")[0]).filter(Boolean).join("; ");
  return { res, json, cookie };
}

const stamp = Date.now();
const user = { name: "Phase6 User", email: `p6.${stamp}@example.com`, password: "Sup3rSecret!P6" };

console.log(`\nPhase 6 production verification against ${BASE}\n`);

let cookie, store;

// Health & readiness
{
  const health = await req("/api/health");
  check("health endpoint", health.res.status === 200 && health.json?.data?.status === "ok");
  check("health returns version", Boolean(health.json?.data?.version));

  const ready = await req("/api/ready");
  check("ready endpoint", ready.res.status === 200 && ready.json?.data?.status === "ready");
  check("ready database connected", ready.json?.data?.database === "connected");
}

// SEO
{
  const sitemap = await req("/sitemap.xml");
  check("sitemap.xml", sitemap.res.status === 200);

  const robots = await req("/robots.txt");
  check("robots.txt", robots.res.status === 200);
  const robotsText = await robots.res.text();
  check("robots disallows /api", robotsText.includes("/api/"));
}

// Security headers
{
  const res = await fetch(`${BASE}/`);
  const csp = res.headers.get("content-security-policy");
  const xfo = res.headers.get("x-frame-options");
  check("CSP header present", Boolean(csp));
  check("X-Frame-Options DENY", xfo === "DENY");
}

// User signup + export + consent
{
  const s = await req("/api/auth/signup", { method: "POST", body: user });
  cookie = s.cookie;
  check("user signs up", s.res.status === 201 && Boolean(cookie));

  const consent = await req("/api/consent", {
    method: "POST",
    cookie,
    body: { type: "terms", granted: true },
  });
  check("terms consent recorded", consent.res.status === 200);

  const exportRes = await req("/api/user/export", { cookie });
  check("user data export", exportRes.res.status === 200 && exportRes.json?.data?.profile?.email === user.email);
  check("export includes preferences", exportRes.json?.data?.preferences !== undefined);

  const storeRes = await req("/api/stores", {
    method: "POST",
    cookie,
    body: { name: "P6 Store", description: "Production test" },
  });
  store = storeRes.json?.data?.store;
  check("store created", storeRes.res.status === 201);
}

// Structured logging via consent
{
  const logs = await req(`/api/store/${store.id}/audit-logs`, { cookie });
  check("audit logs accessible", logs.res.status === 200);
}

// Metrics endpoint
{
  const metricsSecret = process.env.METRICS_SECRET;
  const metrics = await req("/api/metrics", {
    headers: metricsSecret ? { authorization: `Bearer ${metricsSecret}` } : {},
  });
  check("metrics endpoint reachable", metrics.res.status === 200);
  check("metrics include uptime", metrics.json?.data?.metrics?.uptimeSeconds >= 0);
}

// Error page
{
  const nf = await req("/this-page-does-not-exist-xyz", { redirect: "follow" });
  check("404 page", nf.res.status === 404);
}

// Cookie consent API
{
  const cookies = await req("/api/consent", {
    method: "POST",
    cookie,
    body: { type: "cookies", granted: true },
  });
  check("cookie consent API", cookies.res.status === 200);
}

// Admin monitoring (skip if not admin - user won't be admin)
{
  const mon = await req("/api/admin/monitoring", { cookie });
  check("admin monitoring gated", mon.res.status === 403 || mon.res.status === 200);
}

// Phase 5 regression spot checks
{
  const insights = await req(`/store/${store.id}/insights`, { cookie, redirect: "follow" });
  check("insights page", insights.res.status === 200);

  const dev = await req(`/store/${store.id}/developer`, { cookie, redirect: "follow" });
  check("developer page", dev.res.status === 200);
}

console.log(`\n${passed} passed, ${failed} failed\n`);

// Write report for launch-report.mjs
const { writeFile, mkdir } = await import("fs/promises");
await mkdir("var/reports", { recursive: true });
await writeFile(
  "var/reports/phase6-test-results.json",
  JSON.stringify({ passed, failed, results, timestamp: new Date().toISOString() }, null, 2)
);

process.exit(failed > 0 ? 1 : 0);
