import assert from "node:assert/strict";

const base = (process.env.HARVEY_TEST_BASE_URL ?? "").replace(/\/$/, "");
const password = process.env.HARVEY_TEST_PASSWORD ?? "";
if (!base || !password) throw new Error("HARVEY_PRIVATE_TEST_INPUTS_REQUIRED");
const origin = new URL(base).origin;

async function request(path, init = {}) {
  return fetch(`${base}${path}`, { redirect: "manual", cache: "no-store", ...init });
}

function setCookie(response) {
  return typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie().join("; ")
    : response.headers.get("set-cookie") ?? "";
}

function sessionCookie(response) {
  const raw = setCookie(response);
  const pair = raw.split(";", 1)[0];
  assert.match(pair, /^(?:harvey_private_dev|__Host-harvey_private)=/);
  return pair;
}

async function login(candidate, remember = false) {
  return request("/api/harvey-private-access/login", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({ password: candidate, remember })
  });
}

const lockedPage = await request("/harvey");
assert.ok([303, 307, 308].includes(lockedPage.status));
assert.equal(new URL(lockedPage.headers.get("location"), origin).pathname, "/harvey-access");
assert.match(lockedPage.headers.get("cache-control") ?? "", /private|no-store/i);

const gate = await request("/harvey-access");
assert.equal(gate.status, 200);
assert.match(await gate.text(), /Private Harvey password/);

const lockedApi = await request("/api/harvey/snapshot");
assert.equal(lockedApi.status, 401);
assert.equal((await lockedApi.json()).error, "HARVEY_PRIVATE_SESSION_REQUIRED");

const crossOrigin = await fetch(`${base}/api/harvey-private-access/login`, {
  method: "POST",
  headers: { origin: "https://attacker.invalid", "content-type": "application/json" },
  body: JSON.stringify({ password })
});
assert.equal(crossOrigin.status, 403);

const oversized = await request("/api/harvey-private-access/login", {
  method: "POST",
  headers: { origin, "content-type": "application/json" },
  body: JSON.stringify({ password: "x".repeat(4096) })
});
assert.equal(oversized.status, 413);

const wrong = await login(`${password}-wrong`);
assert.equal(wrong.status, 401);
assert.equal(setCookie(wrong), "");

const authenticated = await login(password);
assert.equal(authenticated.status, 200);
const cookie = sessionCookie(authenticated);
const cookieHeader = setCookie(authenticated);
assert.match(cookieHeader, /HttpOnly/i);
assert.match(cookieHeader, /SameSite=Strict/i);
assert.match(cookieHeader, /Path=\//i);
assert.doesNotMatch(cookieHeader, /Max-Age=/i);

const privatePage = await request("/harvey", { headers: { cookie } });
assert.equal(privatePage.status, 200);
assert.match(await privatePage.text(), /HARVEY|Harvey/);

const privateApi = await request("/api/harvey/snapshot", { headers: { cookie } });
assert.equal(privateApi.status, 200);
assert.equal((await privateApi.json()).schema, "werkles.harvey-snapshot/v1");

const privateCommandRoute = await request("/api/harvey/work-orders", { headers: { cookie } });
assert.equal(privateCommandRoute.status, 200);
assert.equal((await privateCommandRoute.json()).operator.mode, "HARVEY_CLOUD");

const crossOriginCommand = await request("/api/harvey/work-orders", {
  method: "POST",
  headers: { origin: "https://attacker.invalid", cookie, "content-type": "application/json" },
  body: JSON.stringify({ submission_id: "a".repeat(32), verb: "GO", target: "All Aeyes", instruction: "Cross-origin relay test." })
});
assert.equal(crossOriginCommand.status, 403);
assert.equal((await crossOriginCommand.json()).error, "REQUEST_ORIGIN_REJECTED");

const [cookieName, cookieValue] = cookie.split("=");
const tampered = `${cookieName}=${cookieValue.slice(0, -1)}${cookieValue.endsWith("a") ? "b" : "a"}`;
assert.equal((await request("/api/harvey/snapshot", { headers: { cookie: tampered } })).status, 401);

const remembered = await login(password, true);
assert.equal(remembered.status, 200);
assert.match(setCookie(remembered), /Max-Age=604800/i);

const logout = await request("/api/harvey-private-access/logout", {
  method: "POST",
  headers: { origin, cookie }
});
assert.equal(logout.status, 303);
assert.equal(new URL(logout.headers.get("location"), origin).pathname, "/harvey-access");
assert.match(setCookie(logout), /Expires=Thu, 01 Jan 1970/i);

for (let index = 0; index < 5; index += 1) {
  const failure = await login(`wrong-${index}`);
  assert.equal(failure.status, 401);
}
const rateLimited = await login("still-wrong");
assert.equal(rateLimited.status, 429);
assert.ok(Number(rateLimited.headers.get("retry-after")) > 0);

console.log("HARVEY_PRIVATE_ACCESS_E2E_PASS");
