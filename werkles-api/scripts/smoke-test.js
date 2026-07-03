const baseUrl = process.env.WERKLES_API_URL || "http://127.0.0.1:8787";

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  return body;
}

async function health() {
  return request("/health");
}

async function login(email = "demo@werkles.local") {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

async function getSession(token) {
  return request("/auth/session", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function getMatchingSnapshot(token, query = {}) {
  const params = new URLSearchParams(query);
  const suffix = params.toString() ? `?${params}` : "";
  return request(`/matching/snapshot${suffix}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function updateProfile(token, profile) {
  return request("/matching/profile", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(profile),
  });
}

async function getProofStatus(token) {
  return request("/proof/status", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function setProofChecks(token, checks) {
  return request("/proof/status", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ checks }),
  });
}

async function getIntros(token) {
  return request("/intros", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function addIntro(token, profileId) {
  return request("/intros", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ profileId }),
  });
}

async function removeIntro(token, profileId) {
  return request(`/intros/${profileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function clearIntros(token) {
  return request("/intros", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function toggleShortlist(token, profileId) {
  return request("/matching/shortlist", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ profileId }),
  });
}

async function getBillingStatus(token) {
  return request("/billing/status", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function createCheckoutSession(token, planId = "partner") {
  return request("/billing/checkout-session", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ planId }),
  });
}

const steps = [
  ["health", () => health()],
  ["login", async () => {
    const loginResult = await login();
    globalToken = loginResult.token;
    return loginResult;
  }],
  ["session", () => getSession(globalToken)],
  ["matching", () => getMatchingSnapshot(globalToken, { filter: "all" })],
  ["proof", () => getProofStatus(globalToken)],
  ["billing", () => getBillingStatus(globalToken)],
];

let globalToken = "";

for (const [name, run] of steps) {
  const result = await run();
  console.log(`${name}: ok`);
  if (name === "matching") {
    console.log(`  matches=${result.matches.length}`);
  }
  if (name === "proof") {
    console.log(`  proof=${result.percent}%`);
  }
}

console.log("werkles-api smoke test passed");
