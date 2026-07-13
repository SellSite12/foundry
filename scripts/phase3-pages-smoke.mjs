 
// Smoke test: every seller page must render (HTTP 200) for an authenticated
// seller with a completed store. Usage: node scripts/phase3-pages-smoke.mjs

const BASE = process.env.APP_URL ?? "http://localhost:3000";

async function req(path, { method = "GET", body, cookie } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    redirect: "manual",
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      origin: BASE,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.clone().json();
  } catch {}
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookieOut = setCookie
    .find((c) => c.startsWith("foundry_session="))
    ?.split(";")[0];
  return { res, json, cookie: cookieOut };
}

const stamp = Date.now();
const signup = await req("/api/auth/signup", {
  method: "POST",
  body: { name: "Page Smoke", email: `smoke.${stamp}@example.com`, password: "Sup3rSecret!S" },
});
const cookie = signup.cookie;
const storeRes = await req("/api/stores", {
  method: "POST",
  cookie,
  body: { name: "Smoke Test Store" },
});
const storeId = storeRes.json?.data?.store?.id;
await req(`/api/store/${storeId}/settings`, {
  method: "PATCH",
  cookie,
  body: { onboardingDone: true },
});

const pages = [
  "",
  "/products",
  "/products/new",
  "/orders",
  "/customers",
  "/inventory",
  "/analytics",
  "/marketing",
  "/discounts",
  "/payments",
  "/shipping",
  "/reviews",
  "/inbox",
  "/files",
  "/team",
  "/automation",
  "/settings",
  "/billing",
  "/developer",
  "/support",
];

let failed = 0;
for (const p of pages) {
  const { res } = await req(`/store/${storeId}${p}`, { cookie });
  const okStatus = res.status === 200;
  if (!okStatus) failed++;
  console.log(`  ${okStatus ? "PASS" : "FAIL"}  /store/[storeId]${p || "/"} -> ${res.status}`);
}

const onboarding = await req(`/dashboard/stores`, { cookie });
console.log(`  ${onboarding.res.status === 200 ? "PASS" : "FAIL"}  /dashboard/stores -> ${onboarding.res.status}`);
if (onboarding.res.status !== 200) failed++;

console.log(`\n${failed === 0 ? "All seller pages render." : `${failed} pages failed.`}\n`);
process.exit(failed > 0 ? 1 : 0);
