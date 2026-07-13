 
// Phase 2 end-to-end verification against a running server (npm start).
// Usage: node scripts/phase2-test.mjs

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
      // an empty value means the cookie was cleared
      return value === "foundry_session=" ? null : value;
    }
  }
  return undefined; // no session cookie header at all
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
const userA = {
  name: "Alice Tester",
  email: `alice.${stamp}@example.com`,
  password: "Sup3rSecret!A",
};
const userB = {
  name: "Bob Tester",
  email: `bob.${stamp}@example.com`,
  password: "Sup3rSecret!B",
};

console.log(`\nPhase 2 verification against ${BASE}\n`);

// --- public pages -------------------------------------------------------
{
  const { res } = await req("/");
  check("landing page renders", res.status === 200);
}
{
  const { res } = await req("/dashboard");
  check(
    "protected page redirects anonymous users to /login",
    res.status === 307 && res.headers.get("location")?.includes("/login")
  );
}
{
  const { res } = await req("/api/notifications");
  check("protected API rejects anonymous users (401)", res.status === 401);
}

// --- signup ------------------------------------------------------------
let cookieA;
{
  const { res, json, cookie } = await req("/api/auth/signup", {
    method: "POST",
    body: userA,
  });
  cookieA = cookie;
  check("signup creates account (201 + session cookie)", res.status === 201 && Boolean(cookie), JSON.stringify(json));
}
{
  const { res, json } = await req("/api/auth/signup", {
    method: "POST",
    body: userA,
  });
  check("duplicate email rejected (409)", res.status === 409 && json?.fieldErrors?.email);
}
{
  const { res, json } = await req("/api/auth/signup", {
    method: "POST",
    body: { name: "X", email: "not-an-email", password: "weak" },
  });
  check(
    "validation errors returned per-field (400)",
    res.status === 400 && json?.fieldErrors?.email && json?.fieldErrors?.password && json?.fieldErrors?.name
  );
}

// --- authenticated session ----------------------------------------------
{
  const { json } = await req("/api/auth/me", { cookie: cookieA });
  check("session resolves to the right user", json?.data?.user?.email === userA.email);
}
{
  const { res } = await req("/dashboard", { cookie: cookieA });
  check("dashboard renders for authenticated user", res.status === 200);
}
{
  const { res } = await req("/login", { cookie: cookieA });
  check("logged-in user is redirected away from /login", res.status === 307);
}

// --- profile & preferences ----------------------------------------------
{
  const { res, json } = await req("/api/user/profile", {
    method: "PATCH",
    cookie: cookieA,
    body: { name: "Alice Updated" },
  });
  check("profile update persists", res.status === 200 && json?.data?.user?.name === "Alice Updated");
}
{
  const { res, json } = await req("/api/user/preferences", {
    method: "PATCH",
    cookie: cookieA,
    body: { theme: "system", marketingEmails: true },
  });
  check(
    "preferences update persists",
    res.status === 200 && json?.data?.preferences?.theme === "system" && json?.data?.preferences?.marketingEmails === true
  );
}

// --- notifications & data isolation --------------------------------------
let cookieB;
{
  const { cookie } = await req("/api/auth/signup", { method: "POST", body: userB });
  cookieB = cookie;
  check("second user signs up", Boolean(cookie));
}
{
  const a = await req("/api/notifications", { cookie: cookieA });
  const b = await req("/api/notifications", { cookie: cookieB });
  const aHasWelcome = a.json?.data?.notifications?.some((n) => n.title === "Welcome to Foundry");
  const bCount = b.json?.data?.notifications?.length;
  check("user A sees own welcome notification", aHasWelcome);
  check("user B has isolated data (exactly 1 own notification)", bCount === 1);
}

// --- password change ------------------------------------------------------
const newPasswordA = "Ev3nMoreSecret!A";
{
  const { res } = await req("/api/user/password", {
    method: "POST",
    cookie: cookieA,
    body: { currentPassword: "wrong-password", newPassword: newPasswordA },
  });
  check("password change rejects wrong current password", res.status === 400);
}
{
  const { res, cookie } = await req("/api/user/password", {
    method: "POST",
    cookie: cookieA,
    body: { currentPassword: userA.password, newPassword: newPasswordA },
  });
  check("password change succeeds", res.status === 200);
  if (cookie) cookieA = cookie; // fresh session issued
}

// --- logout / login -------------------------------------------------------
{
  const { res, cookie } = await req("/api/auth/logout", { method: "POST", cookie: cookieA });
  check("logout clears session", res.status === 200 && cookie === null);
}
{
  const { json } = await req("/api/auth/me", { cookie: cookieA });
  check("old session token no longer valid after logout", json?.data?.user === null);
}
{
  const { res } = await req("/api/auth/login", {
    method: "POST",
    body: { email: userA.email, password: userA.password },
  });
  check("login rejects old password", res.status === 401);
}
{
  const { res, cookie } = await req("/api/auth/login", {
    method: "POST",
    body: { email: userA.email, password: newPasswordA },
  });
  cookieA = cookie;
  check("login succeeds with new password", res.status === 200 && Boolean(cookie));
}

// --- forgot password (anti-enumeration) -----------------------------------
{
  const real = await req("/api/auth/forgot-password", {
    method: "POST",
    body: { email: userA.email },
  });
  const fake = await req("/api/auth/forgot-password", {
    method: "POST",
    body: { email: `nobody.${stamp}@example.com` },
  });
  check(
    "forgot-password responds identically for real and unknown emails",
    real.res.status === 200 && fake.res.status === 200 &&
      JSON.stringify(real.json) === JSON.stringify(fake.json)
  );
}

// --- CSRF origin check -----------------------------------------------------
{
  const res = await fetch(`${BASE}/api/user/profile`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      cookie: cookieA,
      origin: "https://evil.example.com",
    },
    body: JSON.stringify({ name: "Hacked" }),
  });
  check("cross-origin write request rejected (403)", res.status === 403);
}

// --- sessions listing -------------------------------------------------------
{
  const { res, json } = await req("/api/user/sessions", { cookie: cookieA });
  check(
    "active sessions listed with current device flagged",
    res.status === 200 && json?.data?.sessions?.some((s) => s.current)
  );
}

// --- account deletion -------------------------------------------------------
{
  const { res } = await req("/api/user/account", {
    method: "DELETE",
    cookie: cookieB,
    body: { password: userB.password },
  });
  check("account deletion succeeds with password confirmation", res.status === 200);
}
{
  const { res } = await req("/api/auth/login", {
    method: "POST",
    body: { email: userB.email, password: userB.password },
  });
  check("deleted account can no longer log in", res.status === 401);
}

console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
