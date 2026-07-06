/**
 * Crucible provider API smoke — names-only output, no secrets printed.
 */
const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const plaidClientId = process.env.PLAID_CLIENT_ID || "";
const plaidSecret = process.env.PLAID_SECRET || "";
const plaidEnv = (process.env.PLAID_ENV || "sandbox").toLowerCase();

const plaidBase =
  plaidEnv === "production"
    ? "https://production.plaid.com"
    : plaidEnv === "development"
      ? "https://development.plaid.com"
      : "https://sandbox.plaid.com";

const result = {
  ok: true,
  checks: [],
  secret_values_printed: "NO"
};

async function add(name, fn) {
  try {
    const detail = await fn();
    result.checks.push({ name, status: "PASS", ...detail });
  } catch (error) {
    result.ok = false;
    result.checks.push({
      name,
      status: "FAIL",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

await add("stripe_secret_shape", async () => {
  if (!/^(sk|rk)_(test|live)_/.test(stripeSecret)) {
    throw new Error("STRIPE_SECRET_KEY missing or invalid shape");
  }
  return { mode: /^(sk|rk)_live_/.test(stripeSecret) ? "live" : "test" };
});

await add("stripe_identity_session", async () => {
  const body = new URLSearchParams({
    type: "document",
    "metadata[user_id]": "crucible_mule_smoke",
    return_url: "https://werkles.com/dashboard/crucible?check=identity&return=1"
  });
  const response = await fetch("https://api.stripe.com/v1/identity/verification_sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecret}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || `stripe identity http ${response.status}`);
  }
  return {
    session_id: payload.id,
    has_url: Boolean(payload.url),
    status: payload.status
  };
});

await add("plaid_link_token", async () => {
  if (!plaidClientId || !plaidSecret) {
    throw new Error("PLAID_CLIENT_ID or PLAID_SECRET missing");
  }
  const response = await fetch(`${plaidBase}/link/token/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: plaidClientId,
      secret: plaidSecret,
      user: { client_user_id: "crucible_mule_smoke" },
      client_name: "Werkles",
      products: ["assets"],
      country_codes: ["US"],
      language: "en"
    })
  });
  const payload = await response.json();
  if (!response.ok || !payload.link_token) {
    throw new Error(payload.error_message || payload.error?.error_message || `plaid http ${response.status}`);
  }
  return { link_token_present: true, plaid_env: plaidEnv };
});

console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
