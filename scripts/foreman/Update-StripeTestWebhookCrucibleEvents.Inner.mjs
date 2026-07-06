const webhookUrl = process.argv[2] || "https://werkles.com/api/webhooks/stripe";
const stripeSecret = process.env.STRIPE_SECRET_KEY || "";

const identityEvents = [
  "identity.verification_session.verified",
  "identity.verification_session.processing",
  "identity.verification_session.requires_input",
  "identity.verification_session.canceled"
];

const membershipEvents = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted"
];

if (!/^(sk|rk)_(test|live)_/.test(stripeSecret)) {
  console.error(JSON.stringify({ ok: false, error: "STRIPE_SECRET_KEY missing" }));
  process.exit(1);
}

const listResponse = await fetch("https://api.stripe.com/v1/webhook_endpoints?limit=100", {
  headers: { Authorization: `Bearer ${stripeSecret}` }
});
const listPayload = await listResponse.json();
if (!listResponse.ok) {
  console.error(JSON.stringify({ ok: false, error: listPayload.error?.message || "list failed" }));
  process.exit(1);
}

const endpoints = (listPayload.data || []).filter((item) => item.url === webhookUrl && !item.disabled);
if (endpoints.length === 0) {
  console.error(JSON.stringify({ ok: false, error: "no_active_webhook_for_url" }));
  process.exit(1);
}

const target = endpoints[0];
const merged = Array.from(new Set([...(target.enabled_events || []), ...membershipEvents, ...identityEvents]));

const body = new URLSearchParams();
for (const eventName of merged) {
  body.append("enabled_events[]", eventName);
}

const updateResponse = await fetch(`https://api.stripe.com/v1/webhook_endpoints/${target.id}`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${stripeSecret}`,
    "Content-Type": "application/x-www-form-urlencoded"
  },
  body
});
const updatePayload = await updateResponse.json();
if (!updateResponse.ok) {
  console.error(JSON.stringify({ ok: false, error: updatePayload.error?.message || "update failed" }));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      webhook_id: updatePayload.id,
      url: updatePayload.url,
      enabled_event_count: (updatePayload.enabled_events || []).length,
      identity_events_added: identityEvents.filter((e) => (updatePayload.enabled_events || []).includes(e))
    },
    null,
    2
  )
);
