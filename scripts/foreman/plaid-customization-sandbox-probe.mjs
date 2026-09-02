const SANDBOX_LINK_TOKEN_URL = "https://sandbox.plaid.com/link/token/create";
const DUMMY_OWNER_ID = "werkles_customization_probe_20260814";
const PUBLIC_LINK_REQUEST = Object.freeze({
  client_name: "Werkles",
  user: Object.freeze({ client_user_id: DUMMY_OWNER_ID }),
  products: Object.freeze(["assets"]),
  country_codes: Object.freeze(["US"]),
  language: "en",
  link_customization_name: "default"
});
const FAILURE_CATEGORIES = new Set([
  "environment_not_sandbox",
  "credentials_missing",
  "local_contract_failure",
  "network_failure",
  "provider_rejected",
  "invalid_response"
]);

async function probe() {
  if (process.env.PLAID_ENV !== "sandbox") return "environment_not_sandbox";

  const clientId = process.env.PLAID_CLIENT_ID?.trim();
  const secret = process.env.PLAID_SECRET?.trim();
  if (!clientId || !secret) return "credentials_missing";

  let response;
  try {
    response = await fetch(SANDBOX_LINK_TOKEN_URL, {
      method: "POST",
      redirect: "error",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, secret, ...PUBLIC_LINK_REQUEST }),
      signal: AbortSignal.timeout(15_000)
    });
  } catch {
    return "network_failure";
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    return "invalid_response";
  }
  if (!response.ok) return "provider_rejected";
  if (typeof payload?.link_token !== "string" || payload.link_token.trim().length === 0) {
    return "invalid_response";
  }
  return "PASS";
}

const result = await probe().catch(() => "local_contract_failure");
if (result === "PASS") {
  console.log("PLAID_CUSTOMIZATION_PROBE: PASS");
  process.exitCode = 0;
} else {
  const category = FAILURE_CATEGORIES.has(result) ? result : "local_contract_failure";
  console.log(`PLAID_CUSTOMIZATION_PROBE: FAIL ${category}`);
  process.exitCode = 1;
}
