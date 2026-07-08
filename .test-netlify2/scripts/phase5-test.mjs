/* eslint-disable no-console */
// Phase 5 verification: AI assistant, insights, public API v1, webhooks,
// integrations, reports, audit logs, advanced analytics, background jobs.
// Usage: node scripts/phase5-test.mjs  (requires npm start)

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

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function cookieFrom(res) {
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookies = [];
  for (const c of setCookie) {
    const part = c.split(";")[0];
    if (part.includes("=")) cookies.push(part);
  }
  return cookies.length ? cookies.join("; ") : undefined;
}

async function req(path, { method = "GET", body, cookie, headers = {}, redirect = "manual" } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    redirect,
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      origin: BASE,
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.clone().json();
  } catch {}
  return { res, json, cookie: cookieFrom(res) };
}

const stamp = Date.now();
const seller = { name: "P5 Seller", email: `p5seller.${stamp}@example.com`, password: "Sup3rSecret!P5" };

console.log(`\nPhase 5 verification against ${BASE}\n`);

let sellerCookie, store, apiKey;

// --- setup -------------------------------------------------------------------
{
  const s = await req("/api/auth/signup", { method: "POST", body: seller });
  sellerCookie = s.cookie;
  check("seller signs up", s.res.status === 201 && Boolean(sellerCookie));

  const created = await req("/api/stores", {
    method: "POST",
    cookie: sellerCookie,
    body: { name: "Phase5 Shop", description: "AI platform test store" },
  });
  store = created.json?.data?.store;
  check("store created", created.res.status === 201 && Boolean(store?.id));

  await req(`/api/store/${store.id}/settings`, {
    method: "PATCH",
    cookie: sellerCookie,
    body: { onboardingDone: true },
  });

  const p = await req(`/api/store/${store.id}/products`, {
    method: "POST",
    cookie: sellerCookie,
    body: {
      name: "Smart Lamp",
      description: "WiFi enabled desk lamp",
      type: "PHYSICAL",
      status: "PUBLISHED",
      priceCents: 4500,
      trackInventory: true,
      stock: 3,
    },
  });
  check("product created", p.res.status === 201);

  const keyRes = await req(`/api/store/${store.id}/apikeys`, {
    method: "POST",
    cookie: sellerCookie,
    body: { name: "Phase5 test key", scopes: "read" },
  });
  apiKey = keyRes.json?.data?.rawKey;
  check("API key created", keyRes.res.status === 201 && apiKey?.startsWith("fdy_"));
}

// --- seller pages ------------------------------------------------------------
const pages = [
  `/store/${store.id}/assistant`,
  `/store/${store.id}/insights`,
  `/store/${store.id}/reports`,
  `/store/${store.id}/audit`,
  `/store/${store.id}/integrations`,
  `/store/${store.id}/developer`,
  `/store/${store.id}/workspace`,
  `/store/${store.id}/analytics`,
];

for (const path of pages) {
  const p = await req(path, { cookie: sellerCookie, redirect: "follow" });
  check(`page ${path.split("/").pop()} loads`, p.res.status === 200);
}

// --- AI assistant ------------------------------------------------------------
{
  const chat = await req(`/api/store/${store.id}/ai/assistant`, {
    method: "POST",
    cookie: sellerCookie,
    body: { message: "How is revenue trending?" },
  });
  check(
    "AI assistant responds",
    chat.res.status === 200 && Boolean(chat.json?.data?.message?.content)
  );
}

// --- AI insights -------------------------------------------------------------
{
  const ins = await req(`/api/store/${store.id}/ai/insights`, {
    method: "POST",
    cookie: sellerCookie,
  });
  check("AI insights refresh", ins.res.status === 200);

  const list = await req(`/api/store/${store.id}/ai/insights`, { cookie: sellerCookie });
  const items = list.json?.data?.insights ?? [];
  check("AI insights returned", list.res.status === 200 && items.length > 0);
  if (items[0]) {
    check("insight has explanation", Boolean(items[0].explanation));
  }
}

// --- AI drafts (review before publish) ---------------------------------------
{
  const draft = await req(`/api/store/${store.id}/ai/drafts`, {
    method: "POST",
    cookie: sellerCookie,
    body: { kind: "social", prompt: "Weekend sale" },
  });
  check("AI draft created", draft.res.status === 201 && draft.json?.data?.draft?.status === "PENDING");

  const pending = await req(`/api/store/${store.id}/ai/drafts?status=PENDING`, { cookie: sellerCookie });
  check("pending drafts listed", pending.res.status === 200 && (pending.json?.data?.drafts?.length ?? 0) > 0);
}

// --- public API v1 -----------------------------------------------------------
{
  const products = await req(`/api/v1/${store.id}/products`, {
    headers: { authorization: `Bearer ${apiKey}` },
  });
  check("v1 products with bearer auth", products.res.status === 200 && products.json?.data?.items);

  const noAuth = await req(`/api/v1/${store.id}/products`);
  check("v1 rejects missing auth", noAuth.res.status === 401);

  const analytics = await req(`/api/v1/${store.id}/analytics?range=30d`, {
    headers: { authorization: `Bearer ${apiKey}` },
  });
  check("v1 analytics", analytics.res.status === 200 && analytics.json?.data?.metrics);
}

// --- webhooks ----------------------------------------------------------------
{
  const hook = await req(`/api/store/${store.id}/webhooks`, {
    method: "POST",
    cookie: sellerCookie,
    body: { url: "https://example.com/hook", events: ["order.created"] },
  });
  check("webhook created", hook.res.status === 201 && Boolean(hook.json?.data?.secret));

  const list = await req(`/api/store/${store.id}/webhooks`, { cookie: sellerCookie });
  check("webhooks listed", list.res.status === 200 && (list.json?.data?.webhooks?.length ?? 0) > 0);
}

// --- integrations ------------------------------------------------------------
{
  const intg = await req(`/api/store/${store.id}/integrations`, {
    method: "POST",
    cookie: sellerCookie,
    body: { provider: "stripe", credentials: { apiKey: "sk_test_phase5" } },
  });
  check("integration connected", intg.res.status === 200);

  const list = await req(`/api/store/${store.id}/integrations`, { cookie: sellerCookie });
  const stripe = list.json?.data?.integrations?.find((i) => i.id === "stripe");
  check("integration status connected", list.res.status === 200 && stripe?.connected === true);
}

// --- reports -----------------------------------------------------------------
{
  const rep = await req(`/api/store/${store.id}/reports`, {
    method: "POST",
    cookie: sellerCookie,
    body: { name: "Sales export", type: "sales", format: "CSV" },
  });
  check("report created", rep.res.status === 201);
  const reportId = rep.json?.data?.report?.id;

  if (reportId) {
    const run = await req(`/api/store/${store.id}/reports?id=${reportId}`, {
      method: "PATCH",
      cookie: sellerCookie,
    });
    check("report run queued", run.res.status === 200);
  }
}

// --- audit logs --------------------------------------------------------------
{
  const logs = await req(`/api/store/${store.id}/audit-logs`, { cookie: sellerCookie });
  check("audit logs API", logs.res.status === 200 && Array.isArray(logs.json?.data?.logs));
}

// --- advanced analytics ------------------------------------------------------
{
  const adv = await req(`/api/store/${store.id}/analytics/advanced?range=30d`, { cookie: sellerCookie });
  const m = adv.json?.data?.metrics;
  check("advanced analytics", adv.res.status === 200 && m && "avgLtvCents" in m);
}

// --- API request logs --------------------------------------------------------
{
  const logs = await req(`/api/store/${store.id}/api-logs`, { cookie: sellerCookie });
  check("API request logs", logs.res.status === 200 && logs.json?.data?.total24h >= 1);
}

// --- background jobs cron ----------------------------------------------------
{
  const cronSecret = process.env.CRON_SECRET;
  const cron = await req("/api/internal/cron/jobs", {
    method: "POST",
    headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
  });
  check("job cron endpoint", cron.res.status === 200 && cron.json?.data?.jobs);
}

// --- import validation -------------------------------------------------------
{
  const bad = await req(`/api/store/${store.id}/import`, {
    method: "POST",
    cookie: sellerCookie,
    body: { kind: "products", rows: [{ priceCents: 100 }] },
  });
  check("import validates rows", bad.res.status === 200 && bad.json?.data?.valid === false);

  const good = await req(`/api/store/${store.id}/import`, {
    method: "POST",
    cookie: sellerCookie,
    body: { kind: "products", rows: [{ name: "Import Widget", priceCents: 999 }] },
  });
  check("import accepts valid rows", good.res.status === 202 && good.json?.data?.valid === true);
}

// --- summary -----------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
