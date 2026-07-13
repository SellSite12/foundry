 
// Phase 4 end-to-end verification: storefront, cart, checkout, payments,
// marketplace, reviews, customer account, automatic discounts, data isolation.
// Usage: node scripts/phase4-test.mjs  (requires npm start)

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
  const cookies = [];
  for (const c of setCookie) {
    const part = c.split(";")[0];
    if (part.includes("=")) cookies.push(part);
  }
  return cookies.length ? cookies.join("; ") : undefined;
}

async function req(path, { method = "GET", body, cookie, redirect = "manual" } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    redirect,
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
  return { res, json, cookie: cookieFrom(res) };
}

const stamp = Date.now();
const seller = { name: "Maya Merchant", email: `maya.${stamp}@example.com`, password: "Sup3rSecret!M" };
const buyer = { name: "Chris Customer", email: `chris.${stamp}@example.com`, password: "Sup3rSecret!C" };

console.log(`\nPhase 4 verification against ${BASE}\n`);

// --- seller setup ------------------------------------------------------------
let sellerCookie, store, product;
{
  const s = await req("/api/auth/signup", { method: "POST", body: seller });
  sellerCookie = s.cookie;
  check("seller signs up", s.res.status === 201 && Boolean(sellerCookie));

  const created = await req("/api/stores", {
    method: "POST",
    cookie: sellerCookie,
    body: { name: "Northwind Goods", description: "Artisan home goods" },
  });
  store = created.json?.data?.store;
  check("store created", created.res.status === 201 && Boolean(store?.slug));

  await req(`/api/store/${store.id}/settings`, {
    method: "PATCH",
    cookie: sellerCookie,
    body: { onboardingDone: true, taxRate: 8, country: "USA" },
  });

  const ship = await req(`/api/store/${store.id}/shipping`, {
    method: "POST",
    cookie: sellerCookie,
    body: { name: "Standard", region: "USA", priceCents: 599, countries: "USA", minDays: 3, maxDays: 7 },
  });
  check("shipping rate configured", ship.res.status === 201);

  const p = await req(`/api/store/${store.id}/products`, {
    method: "POST",
    cookie: sellerCookie,
    body: {
      name: "Wool Throw",
      description: "Soft merino wool throw blanket",
      type: "PHYSICAL",
      status: "PUBLISHED",
      priceCents: 8900,
      requiresShipping: true,
      trackInventory: true,
      stock: 10,
      category: "Home",
    },
  });
  product = p.json?.data?.product;
  check("published product created", p.res.status === 201 && product?.slug);

  const autoDisc = await req(`/api/store/${store.id}/discounts`, {
    method: "POST",
    cookie: sellerCookie,
    body: { kind: "AUTOMATIC", title: "Welcome 10%", type: "PERCENT", value: 10 },
  });
  check("automatic discount created", autoDisc.res.status === 201);
}

const shopSlug = store.slug;

// --- storefront pages --------------------------------------------------------
{
  const pages = [
    `/shop/${shopSlug}`,
    `/shop/${shopSlug}/products`,
    `/shop/${shopSlug}/products/${product.slug}`,
    `/shop/${shopSlug}/cart`,
    `/shop/${shopSlug}/about`,
    `/shop/${shopSlug}/faq`,
    `/shop/${shopSlug}/contact`,
    `/marketplace`,
    `/marketplace/search?q=wool`,
  ];
  for (const p of pages) {
    const { res } = await req(p);
    check(`page renders ${p}`, res.status === 200);
  }
}

// --- cart + quote + checkout (guest) -----------------------------------------
{
  const add = await req(`/api/shop/${shopSlug}/cart`, {
    method: "POST",
    body: { productId: product.id, quantity: 1 },
  });
  const cartCookie = add.cookie;
  check("add to cart", add.res.status === 201 && add.json?.data?.cart?.itemCount === 1);

  const checkoutPage = await req(`/shop/${shopSlug}/checkout`, { cookie: cartCookie });
  check("checkout page renders with items in cart", checkoutPage.res.status === 200);

  const quote = await req(`/api/shop/${shopSlug}/quote`, {
    method: "POST",
    cookie: cartCookie,
    body: { country: "USA", state: "CA" },
  });
  const q = quote.json?.data?.quote;
  // 8900 - 10% = 8010; tax 8% = 641; shipping 599 → 9249
  check(
    "quote applies automatic discount + tax + shipping",
    quote.res.status === 200 &&
      q?.discountCents === 890 &&
      q?.shippingCents === 599 &&
      q?.totalCents === q.subtotalCents - q.discountCents + q.shippingCents + q.taxCents - q.giftCardCents,
    `discount=${q?.discountCents} total=${q?.totalCents} tax=${q?.taxCents}`
  );

  const checkout = await req(`/api/shop/${shopSlug}/checkout`, {
    method: "POST",
    cookie: cartCookie,
    body: {
      email: `guest.${stamp}@example.com`,
      address: {
        name: "Guest Shopper",
        line1: "100 Market St",
        city: "San Francisco",
        state: "CA",
        postalCode: "94105",
        country: "USA",
      },
      payment: {
        kind: "card",
        card: {
          number: "4242 4242 4242 4242",
          expMonth: 12,
          expYear: 2030,
          cvc: "123",
          name: "Guest Shopper",
        },
      },
      expectedTotalCents: q.totalCents,
    },
  });
  check(
    "guest checkout succeeds with Foundry Pay",
    checkout.res.status === 201 && checkout.json?.data?.order?.status === "PAID",
    checkout.json?.error
  );

  const prod = await req(`/api/store/${store.id}/products/${product.id}`, { cookie: sellerCookie });
  check(
    "inventory decremented after storefront sale",
    prod.json?.data?.product?.stock === 9,
    `stock=${prod.json?.data?.product?.stock}`
  );
}

// --- promo code checkout (logged-in buyer) -----------------------------------
let buyerCookie;
let buyerOrderId;
{
  const bSignup = await req("/api/auth/signup", { method: "POST", body: buyer });
  buyerCookie = bSignup.cookie;
  check("buyer signs up", bSignup.res.status === 201);

  const codeDisc = await req(`/api/store/${store.id}/discounts`, {
    method: "POST",
    cookie: sellerCookie,
    body: { kind: "CODE", code: "SAVE5", title: "Save $5", type: "FIXED_AMOUNT", value: 500 },
  });
  check("discount code created", codeDisc.res.status === 201);

  const add = await req(`/api/shop/${shopSlug}/cart`, {
    method: "POST",
    cookie: buyerCookie,
    body: { productId: product.id, quantity: 1 },
  });
  let cartCookie = [buyerCookie, add.cookie].filter(Boolean).join("; ");

  await req(`/api/shop/${shopSlug}/cart`, {
    method: "PUT",
    cookie: cartCookie,
    body: { discountCode: "SAVE5" },
  });

  const quote = await req(`/api/shop/${shopSlug}/quote`, {
    method: "POST",
    cookie: cartCookie,
    body: { country: "USA", discountCode: "SAVE5" },
  });
  const q = quote.json?.data?.quote;
  check("promo code overrides automatic discount", q?.discountCents === 500, `got ${q?.discountCents}`);

  const checkout = await req(`/api/shop/${shopSlug}/checkout`, {
    method: "POST",
    cookie: cartCookie,
    body: {
      email: buyer.email,
      address: {
        name: buyer.name,
        line1: "200 Oak Ave",
        city: "Portland",
        state: "OR",
        postalCode: "97201",
        country: "USA",
      },
      discountCode: "SAVE5",
      payment: {
        kind: "card",
        card: {
          number: "4242424242424242",
          expMonth: 6,
          expYear: 2031,
          cvc: "456",
          name: buyer.name,
        },
        save: true,
      },
      expectedTotalCents: q.totalCents,
    },
  });
  check("logged-in checkout with promo code", checkout.res.status === 201);

  buyerOrderId = checkout.json?.data?.order?.id;

  const wallet = await req("/api/account/payment-methods", { cookie: buyerCookie });
  check(
    "saved payment method after checkout",
    wallet.json?.data?.methods?.length >= 1
  );

  const orders = await req("/api/account/orders", { cookie: buyerCookie });
  check(
    "buyer sees order history",
    orders.json?.data?.orders?.some((o) => o.id === buyerOrderId)
  );
}

// --- reviews -----------------------------------------------------------------
{
  const review = await req(`/api/shop/${shopSlug}/reviews`, {
    method: "POST",
    body: {
      productId: product.id,
      rating: 5,
      title: "Cozy and warm",
      body: "Exactly what I wanted for the couch.",
      authorName: "Anonymous Guest",
      email: `guest.${stamp}@example.com`,
    },
  });
  check("guest review submitted", review.res.status === 201);

  const list = await req(`/api/shop/${shopSlug}/reviews?productId=${product.id}`);
  check(
    "published reviews empty until moderated",
    list.res.status === 200 && (list.json?.data?.reviews ?? []).length === 0
  );
}

// --- marketplace search ------------------------------------------------------
{
  const search = await req("/api/marketplace/search?q=wool");
  const products = search.json?.data?.products ?? [];
  check(
    "marketplace search finds product",
    products.some((p) => p.name?.includes("Wool"))
  );
}

// --- track order -------------------------------------------------------------
{
  const track = await req(`/api/shop/${shopSlug}/track`, {
    method: "POST",
    body: { orderNumber: 1001, email: `guest.${stamp}@example.com` },
  });
  check(
    "order tracking by email + number",
    track.res.status === 200 && track.json?.data?.order?.orderNumber === 1001
  );
}

// --- reviews (moderation queue) ----------------------------------------------
{
  const sellerReviews = await req(`/api/store/${store.id}/reviews`, { cookie: sellerCookie });
  check(
    "seller sees pending review in moderation queue",
    (sellerReviews.json?.data?.reviews ?? []).some((r) => r.status === "PENDING")
  );
}

// --- data isolation ----------------------------------------------------------
{
  const other = await req("/api/auth/signup", {
    method: "POST",
    body: { name: "Other Seller", email: `other.${stamp}@example.com`, password: "Sup3rSecret!O" },
  });
  const otherStore = await req("/api/stores", {
    method: "POST",
    cookie: other.cookie,
    body: { name: "Other Shop" },
  });
  const otherId = otherStore.json?.data?.store?.id;

  const peek = await req(`/api/store/${otherId}/orders`, { cookie: sellerCookie });
  check("seller cannot read another store's orders", peek.res.status === 404);

  const buyerOrders = await req("/api/account/orders", { cookie: buyerCookie });
  const buyerIds = (buyerOrders.json?.data?.orders ?? []).map((o) => o.id);
  check("buyer sees only their orders", buyerIds.includes(buyerOrderId));

  const strangerOrders = await req("/api/account/orders", { cookie: other.cookie });
  check(
    "other user has empty order history",
    (strangerOrders.json?.data?.orders ?? []).length === 0
  );
}

// --- declined card -----------------------------------------------------------
{
  const add = await req(`/api/shop/${shopSlug}/cart`, {
    method: "POST",
    body: { productId: product.id, quantity: 1 },
  });
  const quote = await req(`/api/shop/${shopSlug}/quote`, {
    method: "POST",
    cookie: add.cookie,
    body: { country: "USA" },
  });
  const q = quote.json?.data?.quote;
  const bad = await req(`/api/shop/${shopSlug}/checkout`, {
    method: "POST",
    cookie: add.cookie,
    body: {
      email: `decline.${stamp}@example.com`,
      address: {
        name: "Decline Test",
        line1: "1 Fail St",
        city: "SF",
        postalCode: "94105",
        country: "USA",
      },
      payment: {
        kind: "card",
        card: {
          number: "4000 0000 0000 0002",
          expMonth: 12,
          expYear: 2030,
          cvc: "123",
          name: "Decline Test",
        },
      },
      expectedTotalCents: q.totalCents,
    },
  });
  check("declined card rejected (402)", bad.res.status === 402);
}

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
