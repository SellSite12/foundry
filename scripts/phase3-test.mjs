 
// Phase 3 end-to-end verification against a running server (npm start).
// Covers: onboarding, products (variants/bulk/duplicate), manual orders,
// payments, refunds, inventory, customers (import/export), media upload,
// discounts, gift cards, campaigns, automations, team roles, API keys,
// search, analytics, billing, and cross-seller data isolation.
// Usage: node scripts/phase3-test.mjs

const BASE = process.env.APP_URL ?? "http://localhost:3000";

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
  for (const c of setCookie) {
    if (c.startsWith("foundry_session=")) {
      const value = c.split(";")[0];
      return value === "foundry_session=" ? null : value;
    }
  }
  return undefined;
}

async function req(path, { method = "GET", body, cookie, form, redirect = "manual" } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    redirect,
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      origin: BASE,
    },
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  let json = null;
  try {
    json = await res.clone().json();
  } catch {}
  return { res, json, cookie: cookieFrom(res) };
}

const stamp = Date.now();
const sellerA = { name: "Sana Seller", email: `sana.${stamp}@example.com`, password: "Sup3rSecret!A" };
const sellerB = { name: "Bruno Buyer", email: `bruno.${stamp}@example.com`, password: "Sup3rSecret!B" };

console.log(`\nPhase 3 verification against ${BASE}\n`);

// --- accounts -------------------------------------------------------------
let cookieA, cookieB;
{
  const a = await req("/api/auth/signup", { method: "POST", body: sellerA });
  cookieA = a.cookie;
  check("seller A signs up", a.res.status === 201 && Boolean(cookieA));

  const b = await req("/api/auth/signup", { method: "POST", body: sellerB });
  cookieB = b.cookie;
  check("seller B signs up", b.res.status === 201 && Boolean(cookieB));
}

// --- onboarding -------------------------------------------------------------
let storeA;
{
  const { res, json } = await req("/api/stores", {
    method: "POST",
    cookie: cookieA,
    body: { name: "Ember Goods", description: "Handmade candles", industry: "Home & Garden" },
  });
  storeA = json?.data?.store;
  check("store created (onboarding step 1)", res.status === 201 && Boolean(storeA?.id));

  const step2 = await req(`/api/store/${storeA.id}/settings`, {
    method: "PATCH",
    cookie: cookieA,
    body: {
      businessEmail: `orders.${stamp}@embergoods.com`,
      phone: "+1 555 010 2030",
      website: "https://embergoods.example.com",
      addressLine1: "12 Forge Lane",
      city: "Portland",
      state: "OR",
      postalCode: "97201",
      country: "USA",
      onboardingStep: 3,
    },
  });
  check("onboarding saves contact & address", step2.res.status === 200);

  const step3 = await req(`/api/store/${storeA.id}/settings`, {
    method: "PATCH",
    cookie: cookieA,
    body: { taxId: "US-123456789", taxRate: 10, currency: "USD", timezone: "America/Los_Angeles", onboardingStep: 4 },
  });
  check("onboarding saves tax & locale", step3.res.status === 200);

  const finish = await req(`/api/store/${storeA.id}/settings`, {
    method: "PATCH",
    cookie: cookieA,
    body: { brandColor: "#B85C2E", onboardingDone: true },
  });
  check(
    "onboarding completes",
    finish.res.status === 200 && finish.json?.data?.store?.onboardingDone === true
  );

  const page = await req(`/store/${storeA.id}`, { cookie: cookieA });
  check("seller dashboard renders after onboarding", page.res.status === 200);
}

// --- products ---------------------------------------------------------------
let productMain, productSecond, collection;
{
  const col = await req(`/api/store/${storeA.id}/collections`, {
    method: "POST",
    cookie: cookieA,
    body: { name: "Winter Collection" },
  });
  collection = col.json?.data?.collection;
  check("collection created", col.res.status === 201);

  const p1 = await req(`/api/store/${storeA.id}/products`, {
    method: "POST",
    cookie: cookieA,
    body: {
      name: "Cedar Candle",
      description: "Hand-poured cedarwood candle",
      type: "PHYSICAL",
      status: "PUBLISHED",
      priceCents: 2400,
      compareAtCents: 3000,
      costCents: 800,
      sku: "CNDL-CEDAR",
      barcode: "0123456789012",
      weightGrams: 450,
      requiresShipping: true,
      trackInventory: true,
      stock: 20,
      lowStockThreshold: 18,
      category: "Candles",
      tags: "cedar,winter,bestseller",
      collectionId: collection?.id ?? null,
      seoTitle: "Cedar Candle — Ember Goods",
      seoDescription: "A hand-poured cedarwood candle.",
      images: [{ url: "https://images.example.com/cedar.jpg", alt: "Cedar candle" }],
      variants: [
        { name: "Small", options: { Size: "Small" }, sku: "CNDL-CEDAR-S", priceCents: 1800, stock: 10 },
        { name: "Large", options: { Size: "Large" }, sku: "CNDL-CEDAR-L", priceCents: 3200, stock: 5 },
      ],
    },
  });
  productMain = p1.json?.data?.product;
  check(
    "product created with variants + images",
    p1.res.status === 201 && productMain?.variants?.length === 2 && productMain?.images?.length === 1
  );

  const p2 = await req(`/api/store/${storeA.id}/products`, {
    method: "POST",
    cookie: cookieA,
    body: { name: "Pine Diffuser", priceCents: 1500, status: "PUBLISHED", trackInventory: true, stock: 3, lowStockThreshold: 5 },
  });
  productSecond = p2.json?.data?.product;
  check("second product created", p2.res.status === 201);

  const upd = await req(`/api/store/${storeA.id}/products/${productMain.id}`, {
    method: "PATCH",
    cookie: cookieA,
    body: { priceCents: 2600, seoTitle: "Cedar Candle | Ember Goods" },
  });
  check("product updated", upd.res.status === 200 && upd.json?.data?.product?.priceCents === 2600);

  const dup = await req(`/api/store/${storeA.id}/products/${productMain.id}/duplicate`, {
    method: "POST",
    cookie: cookieA,
  });
  const dupId = dup.json?.data?.product?.id;
  check(
    "product duplicated as draft",
    dup.res.status === 201 && dup.json?.data?.product?.status === "DRAFT"
  );

  const bulk = await req(`/api/store/${storeA.id}/products/bulk`, {
    method: "POST",
    cookie: cookieA,
    body: { ids: [dupId], action: "ARCHIVE" },
  });
  check("bulk archive works", bulk.res.status === 200 && bulk.json?.data?.affected === 1);

  const del = await req(`/api/store/${storeA.id}/products/${dupId}`, {
    method: "DELETE",
    cookie: cookieA,
  });
  check("product without orders is deleted", del.res.status === 200 && del.json?.data?.deleted === true);

  const list = await req(`/api/store/${storeA.id}/products?q=cedar`, { cookie: cookieA });
  check(
    "product search finds by name",
    list.res.status === 200 && list.json?.data?.products?.some((p) => p.id === productMain.id)
  );
}

// --- orders, payments, inventory ---------------------------------------------
let order;
{
  const create = await req(`/api/store/${storeA.id}/orders`, {
    method: "POST",
    cookie: cookieA,
    body: {
      customerName: "Cora Customer",
      customerEmail: `cora.${stamp}@example.com`,
      items: [
        { productId: productMain.id, quantity: 2 }, // base product, stock 20 → 18 (hits threshold)
        { productId: productSecond.id, quantity: 1 },
      ],
      shippingCents: 500,
      markPaid: true,
    },
  });
  order = create.json?.data?.order;
  check("manual order created and paid", create.res.status === 201 && order?.status === "PAID");
  check("order number is sequential", order?.orderNumber === 1001);
  // subtotal 2*2600 + 1500 = 6700; tax 10% = 670; shipping 500 → 7870
  check("totals computed with store tax", order?.totalCents === 7870, `got ${order?.totalCents}`);

  const detail = await req(`/api/store/${storeA.id}/orders/${order.id}`, { cookie: cookieA });
  const d = detail.json?.data?.order;
  check(
    "order timeline + payment recorded",
    d?.timeline?.length >= 2 && d?.payments?.[0]?.status === "SUCCEEDED"
  );

  const prod = await req(`/api/store/${storeA.id}/products/${productMain.id}`, { cookie: cookieA });
  check(
    "inventory decremented by paid order",
    prod.json?.data?.product?.stock === 18,
    `got ${prod.json?.data?.product?.stock}`
  );

  const hist = await req(`/api/store/${storeA.id}/inventory/history`, { cookie: cookieA });
  check(
    "inventory history records the sale",
    hist.json?.data?.adjustments?.some((a) => a.reason === "SALE")
  );

  const ship = await req(`/api/store/${storeA.id}/orders/${order.id}`, {
    method: "PATCH",
    cookie: cookieA,
    body: { status: "SHIPPED", trackingNumber: "1Z999AA10123456784", shippingCarrier: "UPS" },
  });
  check(
    "order shipped with tracking",
    ship.res.status === 200 && ship.json?.data?.order?.trackingNumber === "1Z999AA10123456784"
  );

  const refund = await req(`/api/store/${storeA.id}/orders/${order.id}/refund`, {
    method: "POST",
    cookie: cookieA,
    body: { amountCents: 1500, reason: "One item damaged", restock: false },
  });
  check(
    "partial refund recorded",
    refund.res.status === 200 && refund.json?.data?.order?.refundedCents === 1500
  );

  const over = await req(`/api/store/${storeA.id}/orders/${order.id}/refund`, {
    method: "POST",
    cookie: cookieA,
    body: { amountCents: 99999999, reason: "too much" },
  });
  check("over-refund rejected", over.res.status === 400);

  const invoice = await req(`/store/${storeA.id}/orders/${order.id}/invoice`, { cookie: cookieA });
  const slip = await req(`/store/${storeA.id}/orders/${order.id}/packing-slip`, { cookie: cookieA });
  check("invoice + packing slip render", invoice.res.status === 200 && slip.res.status === 200);

  const adj = await req(`/api/store/${storeA.id}/inventory`, {
    method: "POST",
    cookie: cookieA,
    body: { productId: productSecond.id, delta: 50, reason: "RESTOCK", note: "PO-100" },
  });
  check("manual inventory adjustment", adj.res.status === 201 && adj.json?.data?.stockAfter === 52);
}

// --- customers ---------------------------------------------------------------
{
  const list = await req(`/api/store/${storeA.id}/customers`, { cookie: cookieA });
  const cora = list.json?.data?.customers?.find((c) => c.email.startsWith("cora."));
  check("customer auto-created from order", Boolean(cora));
  check(
    "lifetime value reflects refunds",
    cora?.lifetimeValueCents === 7870 - 1500,
    `got ${cora?.lifetimeValueCents}`
  );

  const add = await req(`/api/store/${storeA.id}/customers`, {
    method: "POST",
    cookie: cookieA,
    body: { name: "Manual Max", email: `max.${stamp}@example.com`, tags: "vip" },
  });
  check("customer added manually", add.res.status === 201);

  const exp = await req(`/api/store/${storeA.id}/customers/export`, { cookie: cookieA });
  const csv = await exp.res.text();
  check(
    "customer CSV export works",
    exp.res.status === 200 && csv.includes("name,email") && csv.includes("Manual Max")
  );

  const imp = await req(`/api/store/${storeA.id}/customers/import`, {
    method: "POST",
    cookie: cookieA,
    body: { csv: `name,email,phone,tags\nImported Iris,iris.${stamp}@example.com,+1555,wholesale\nBad Row,not-an-email,,` },
  });
  check(
    "customer CSV import creates + skips invalid",
    imp.res.status === 200 && imp.json?.data?.created === 1 && imp.json?.data?.skipped === 1
  );
}

// --- media upload --------------------------------------------------------------
let mediaFile;
{
  // 1x1 transparent PNG
  const pngBytes = Uint8Array.from(
    atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="),
    (c) => c.charCodeAt(0)
  );
  const form = new FormData();
  form.append("file", new File([pngBytes], "pixel.png", { type: "image/png" }));
  form.append("folder", "/products");
  const up = await req(`/api/store/${storeA.id}/media`, { method: "POST", cookie: cookieA, form });
  mediaFile = up.json?.data?.file;
  check("media upload works", up.res.status === 201 && Boolean(mediaFile?.url));

  const served = await req(mediaFile.url, { cookie: cookieA });
  check("uploaded file is served", served.res.status === 200);

  const bad = new FormData();
  bad.append("file", new File(["#!/bin/sh"], "evil.sh", { type: "application/x-sh" }));
  const rejected = await req(`/api/store/${storeA.id}/media`, { method: "POST", cookie: cookieA, form: bad });
  check("disallowed file type rejected", rejected.res.status === 400);

  const listing = await req(`/api/store/${storeA.id}/media?q=pixel`, { cookie: cookieA });
  check("media search works", listing.json?.data?.files?.some((f) => f.id === mediaFile.id));
}

// --- marketing ------------------------------------------------------------------
{
  const disc = await req(`/api/store/${storeA.id}/discounts`, {
    method: "POST",
    cookie: cookieA,
    body: { kind: "CODE", code: "WINTER20", title: "Winter sale", type: "PERCENT", value: 20 },
  });
  check("discount code created", disc.res.status === 201);

  const dupCode = await req(`/api/store/${storeA.id}/discounts`, {
    method: "POST",
    cookie: cookieA,
    body: { kind: "CODE", code: "WINTER20", title: "Dup", type: "PERCENT", value: 5 },
  });
  check("duplicate discount code rejected", dupCode.res.status === 409);

  const gift = await req(`/api/store/${storeA.id}/giftcards`, {
    method: "POST",
    cookie: cookieA,
    body: { initialCents: 5000 },
  });
  check(
    "gift card issued with unique code",
    gift.res.status === 201 && /^[A-Z2-9]{4}-/.test(gift.json?.data?.giftCard?.code ?? "")
  );

  const camp = await req(`/api/store/${storeA.id}/campaigns`, {
    method: "POST",
    cookie: cookieA,
    body: { name: "Launch email", subject: "We're live!" },
  });
  check("email campaign drafted", camp.res.status === 201);

  const auto = await req(`/api/store/${storeA.id}/automations`, {
    method: "POST",
    cookie: cookieA,
    body: { name: "Cart recovery", trigger: "CART_ABANDONED", action: "SEND_EMAIL" },
  });
  check("automation rule created", auto.res.status === 201);
}

// --- team & permissions ------------------------------------------------------------
{
  const invite = await req(`/api/store/${storeA.id}/team`, {
    method: "POST",
    cookie: cookieA,
    body: { email: sellerB.email, role: "SUPPORT" },
  });
  check(
    "existing user invited and instantly active",
    invite.res.status === 201 && invite.json?.data?.member?.status === "ACTIVE"
  );

  const bOrders = await req(`/api/store/${storeA.id}/orders`, { cookie: cookieB });
  check("SUPPORT member can read orders", bOrders.res.status === 200);

  const bProducts = await req(`/api/store/${storeA.id}/products`, {
    method: "POST",
    cookie: cookieB,
    body: { name: "Should fail", priceCents: 100 },
  });
  check("SUPPORT member cannot create products", bProducts.res.status === 403);

  const bBilling = await req(`/api/store/${storeA.id}/billing`, { cookie: cookieB });
  check("SUPPORT member cannot read billing", bBilling.res.status === 403);

  const bInvite = await req(`/api/store/${storeA.id}/team`, {
    method: "POST",
    cookie: cookieB,
    body: { email: "someone@example.com", role: "ADMIN" },
  });
  check("SUPPORT member cannot invite staff", bInvite.res.status === 403);
}

// --- API keys, search, analytics, billing --------------------------------------------
{
  const key = await req(`/api/store/${storeA.id}/apikeys`, {
    method: "POST",
    cookie: cookieA,
    body: { name: "Test key" },
  });
  const rawKey = key.json?.data?.rawKey;
  check("API key created (raw shown once)", key.res.status === 201 && rawKey?.startsWith("fdy_"));

  const revoke = await req(`/api/store/${storeA.id}/apikeys?id=${key.json?.data?.key?.id}`, {
    method: "DELETE",
    cookie: cookieA,
  });
  check("API key revoked", revoke.res.status === 200);

  const search = await req(`/api/store/${storeA.id}/search?q=cedar`, { cookie: cookieA });
  const groups = new Set((search.json?.data?.results ?? []).map((r) => r.group));
  check("global search returns product results", groups.has("Products"));

  const search2 = await req(`/api/store/${storeA.id}/search?q=cora`, { cookie: cookieA });
  const groups2 = new Set((search2.json?.data?.results ?? []).map((r) => r.group));
  check("global search finds orders + customers", groups2.has("Orders") && groups2.has("Customers"));

  const analytics = await req(`/api/store/${storeA.id}/analytics?range=30d`, { cookie: cookieA });
  const totals = analytics.json?.data?.analytics?.totals;
  check(
    "analytics computes revenue from live orders",
    analytics.res.status === 200 && totals?.revenueCents === 7870 - 1500,
    `got ${totals?.revenueCents}`
  );
  check("conversion rate honest with zero visitors", totals?.conversionRate === null);

  const upgrade = await req(`/api/store/${storeA.id}/billing`, {
    method: "POST",
    cookie: cookieA,
    body: { action: "change_plan", plan: "GROWTH" },
  });
  check(
    "plan upgrade recorded",
    upgrade.res.status === 200 && upgrade.json?.data?.subscription?.plan === "GROWTH"
  );
}

// --- data isolation --------------------------------------------------------------------
{
  const bStore = await req("/api/stores", {
    method: "POST",
    cookie: cookieB,
    body: { name: "Bruno's Bikes" },
  });
  const storeB = bStore.json?.data?.store;
  check("seller B creates own store", bStore.res.status === 201);

  const aReadsB = await req(`/api/store/${storeB.id}/products`, { cookie: cookieA });
  check("seller A cannot access seller B's store (404)", aReadsB.res.status === 404);

  const anonReads = await req(`/api/store/${storeA.id}/orders`);
  check("anonymous request rejected (401)", anonReads.res.status === 401);

  const bStores = await req("/api/stores", { cookie: cookieB });
  const ids = (bStores.json?.data?.stores ?? []).map((s) => s.id);
  check(
    "store list shows own + member stores only",
    ids.includes(storeB.id) && ids.includes(storeA.id) && ids.length === 2
  );

  const pageB = await req(`/store/${storeB.id}`, { cookie: cookieA });
  check("seller dashboard page hidden across sellers", pageB.res.status === 404);
}

// --- notifications ----------------------------------------------------------------------
{
  const notif = await req("/api/notifications", { cookie: cookieA });
  const titles = (notif.json?.data?.notifications ?? []).map((n) => n.title);
  check(
    "low-stock notification generated by real order",
    titles.some((t) => t.includes("Low stock")),
    titles.join(" | ")
  );
  check(
    "refund + plan-change notifications generated",
    titles.some((t) => t.startsWith("Refund issued")) &&
      titles.some((t) => t.startsWith("Plan changed"))
  );
}

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
