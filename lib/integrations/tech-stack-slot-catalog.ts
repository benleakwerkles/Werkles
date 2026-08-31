export const TECH_STACK_SLOT_IDS = [
  "supabase_auth",
  "supabase_member_data",
  "supabase_storage",
  "stripe_billing",
  "stripe_identity",
  "plaid",
  "twilio_verify",
  "checkr"
] as const;

export type TechStackSlotId = (typeof TECH_STACK_SLOT_IDS)[number];
export type TechStackSlotStage =
  | "test_path_present"
  | "sandbox_demo"
  | "foundation_only"
  | "not_connected"
  | "policy_blocked";

export type TechStackSlot = Readonly<{
  id: TechStackSlotId;
  system: string;
  purpose: string;
  stage: TechStackSlotStage;
  productionLive: false;
  compositionModule: string;
  routes: readonly string[];
  authority: string;
  blocker: string | null;
}>;

function slot(value: TechStackSlot): TechStackSlot {
  return Object.freeze({ ...value, routes: Object.freeze([...value.routes]) });
}

/** Static architecture inventory, not runtime configuration. Runtime checks
 * remain server-only and fail closed at each route/adapter boundary. */
export const TECH_STACK_SLOTS: Readonly<Record<TechStackSlotId, TechStackSlot>> = Object.freeze({
  supabase_auth: slot({
    id: "supabase_auth",
    system: "Supabase Auth",
    purpose: "Account authentication and verified member identity",
    stage: "test_path_present",
    productionLive: false,
    compositionModule: "lib/supabase/request.ts",
    routes: ["/login", "/signup", "/auth/callback"],
    authority: "Server validates the bearer/session user with Supabase Auth.",
    blocker: "Server-readable SSR session continuity is not complete across member Intake surfaces."
  }),
  supabase_member_data: slot({
    id: "supabase_member_data",
    system: "Supabase Postgres",
    purpose: "Owner-bound profiles, membership, Intake, claims, receipts, and grants",
    stage: "foundation_only",
    productionLive: false,
    compositionModule: "lib/supabase/server.ts",
    routes: ["/dashboard/profile"],
    authority: "Reviewed schema, RLS, and server-only service operations.",
    blocker: "Member Intake custody plus provider claim/event/grant schema and RLS require a separate gate."
  }),
  supabase_storage: slot({
    id: "supabase_storage",
    system: "Supabase Storage",
    purpose: "Future Workshop files with owner and room access controls",
    stage: "not_connected",
    productionLive: false,
    compositionModule: "lib/integrations/supabase-storage-adapter.ts",
    routes: [],
    authority: "Reviewed bucket policy, RLS, retention, and signed access paths.",
    blocker: "No bucket, adapter, route, policy, or retention contract is connected."
  }),
  stripe_billing: slot({
    id: "stripe_billing",
    system: "Stripe Billing",
    purpose: "Foundry Dues checkout, subscription status, and billing portal",
    stage: "test_path_present",
    productionLive: false,
    compositionModule: "lib/stripe.ts",
    routes: ["/api/membership/checkout", "/api/billing/portal", "/api/webhooks/stripe"],
    authority: "Signed Stripe webhook updates server-derived membership state.",
    blocker: "Secret-entry and paid-checkout go-live remain separate human gates."
  }),
  stripe_identity: slot({
    id: "stripe_identity",
    system: "Stripe Identity",
    purpose: "Government ID and optional selfie-to-ID claim observations",
    stage: "test_path_present",
    productionLive: false,
    compositionModule: "lib/verification/adapters/stripe-identity-adapter.ts",
    routes: ["/api/verification/identity", "/api/webhooks/stripe"],
    authority: "Verified provider event enters the provider adapter port and claim conformance boundary.",
    blocker: "Current route stores only a profile flag; durable operation and receipt persistence are not connected."
  }),
  plaid: slot({
    id: "plaid",
    system: "Plaid",
    purpose: "Bank ownership and dated funds-threshold observations",
    stage: "sandbox_demo",
    productionLive: false,
    compositionModule: "lib/verification/adapters/plaid-adapter.ts",
    routes: ["/api/verification/funds"],
    authority: "Verified server event plus owner-bound custody; Link completion alone is never proof.",
    blocker: "Plaid sandbox access is granted, but server credential custody is not connected. Product selection, exchange, encrypted Item custody, revoke, receipts, webhooks, schema, and RLS remain disabled; production access is under review."
  }),
  twilio_verify: slot({
    id: "twilio_verify",
    system: "Twilio Verify",
    purpose: "Time-bounded possession of a phone or other contact channel",
    stage: "foundation_only",
    productionLive: false,
    compositionModule: "lib/verification/adapters/twilio-verify-adapter.ts",
    routes: [],
    authority: "Server-side Verification Check result; send success alone is never proof.",
    blocker: "Provider setup, private credentials, consent, rate limits, spend boundary, routes, and persistence are not connected."
  }),
  checkr: slot({
    id: "checkr",
    system: "Checkr",
    purpose: "Purpose-specific background-screen completion workflow",
    stage: "policy_blocked",
    productionLive: false,
    compositionModule: "lib/verification/adapters/checkr-adapter.ts",
    routes: [],
    authority: "Signed provider events inside an approved purpose, consent, dispute, and adverse-action workflow.",
    blocker: "Counsel/provider approval, permissible purpose, consent, adverse action, disputes, retention, routes, and persistence are not connected."
  })
});

export function techStackSlot(id: TechStackSlotId): TechStackSlot {
  return TECH_STACK_SLOTS[id];
}
