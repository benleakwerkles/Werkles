export type TechStackLayer = "product_runtime" | "member_provider" | "operator_custody";

export type ProductRuntimeReadiness = "in_use" | "configured_not_enabled" | "not_adopted";
export type MemberProviderReadiness = "available" | "not_live_yet" | "planned" | "policy_blocked";
export type OperatorCustodyReadiness = "in_use" | "not_adopted";

type SharedLedgerEntry = Readonly<{
  id: string;
  system: string;
  purpose: string;
  productionLive: false;
  actionEnabled: boolean;
  authorityBoundary: string;
  dataBoundary: string;
  blocker: string | null;
  lastReviewedAt: "2026-08-22";
}>;

export type ProductRuntimeLedgerEntry = SharedLedgerEntry & Readonly<{
  layer: "product_runtime";
  readiness: ProductRuntimeReadiness;
  memberPath?: never;
}>;

export type MemberProviderLedgerEntry = SharedLedgerEntry & Readonly<{
  layer: "member_provider";
  readiness: MemberProviderReadiness;
  memberPath: `/${string}`;
}>;

export type OperatorCustodyLedgerEntry = SharedLedgerEntry & Readonly<{
  layer: "operator_custody";
  readiness: OperatorCustodyReadiness;
  memberPath?: never;
}>;

export type TechStackReadinessEntry =
  | ProductRuntimeLedgerEntry
  | MemberProviderLedgerEntry
  | OperatorCustodyLedgerEntry;

function entry<const T extends TechStackReadinessEntry>(value: T): Readonly<T> {
  return Object.freeze(value);
}

/**
 * Architecture/readiness truth, not a runtime health check. Provider presence
 * here never means a production integration is active or a member is verified.
 */
export const TECH_STACK_READINESS_LEDGER = Object.freeze([
  entry({
    id: "nextjs_react",
    system: "Next.js / React",
    layer: "product_runtime",
    readiness: "in_use",
    purpose: "Application framework and interface runtime.",
    productionLive: false,
    actionEnabled: false,
    authorityBoundary: "Application code renders Werkles; it cannot establish a member claim.",
    dataBoundary: "Framework code receives only the request and application data needed to render the requested surface.",
    blocker: null,
    lastReviewedAt: "2026-08-22"
  }),
  entry({
    id: "vercel",
    system: "Vercel",
    layer: "product_runtime",
    readiness: "in_use",
    purpose: "Application hosting and server runtime.",
    productionLive: false,
    actionEnabled: false,
    authorityBoundary: "Hosting availability is not membership, identity, funds, or trust evidence.",
    dataBoundary: "Keep application and request logs to the minimum required for security and operations under the adopted retention schedule.",
    blocker: null,
    lastReviewedAt: "2026-08-22"
  }),
  entry({
    id: "supabase_postgres",
    system: "Supabase Postgres",
    layer: "product_runtime",
    readiness: "configured_not_enabled",
    purpose: "Owner-bound application records.",
    productionLive: false,
    actionEnabled: false,
    authorityBoundary: "Reviewed schema, row-level security, and server-side ownership checks decide access.",
    dataBoundary: "Store only records Werkles needs to deliver an explicitly requested member function.",
    blocker: "Member Intake custody plus provider claim, receipt, consent, and grant schema/RLS remain gated.",
    lastReviewedAt: "2026-08-22"
  }),
  entry({
    id: "supabase_storage",
    system: "Supabase Storage",
    layer: "product_runtime",
    readiness: "not_adopted",
    purpose: "Future private Workshop file storage.",
    productionLive: false,
    actionEnabled: false,
    authorityBoundary: "Private bucket policy, owner/room authorization, retention, and signed access paths.",
    dataBoundary: "No member file bytes are accepted until file ownership, access, deletion, and retention are implemented together.",
    blocker: "No bucket, member upload route, policy, or retention workflow is connected.",
    lastReviewedAt: "2026-08-22"
  }),
  entry({
    id: "posthog",
    system: "PostHog",
    layer: "product_runtime",
    readiness: "not_adopted",
    purpose: "Future privacy-bounded product analytics.",
    productionLive: false,
    actionEnabled: false,
    authorityBoundary: "Analytics may explain product performance; it may not rank members, infer wealth or sensitive traits, or write into a Werkle.",
    dataBoundary: "No session replay, cross-context advertising, or identifiable Werkle-linked behavior without explicit notice, purpose, consent where required, and deletion controls.",
    blocker: "Collection scope, consent, retention, processor disclosure, and structural isolation from matching are not implemented.",
    lastReviewedAt: "2026-08-22"
  }),
  entry({
    id: "expo_push",
    system: "Expo Push",
    layer: "product_runtime",
    readiness: "not_adopted",
    purpose: "Future delivery of member-requested notifications.",
    productionLive: false,
    actionEnabled: false,
    authorityBoundary: "Delivery acknowledgement is not proof that a person read, accepted, or acted on a notification.",
    dataBoundary: "Keep only the minimum revocable delivery token and preference needed for an opted-in notification purpose; never place sensitive Werkle details in lock-screen copy.",
    blocker: "Member opt-in, per-purpose controls, token lifecycle, quiet hours, revocation, and safe-copy rules are not implemented.",
    lastReviewedAt: "2026-08-22"
  }),
  entry({
    id: "supabase_auth",
    system: "Supabase Auth",
    layer: "member_provider",
    readiness: "not_live_yet",
    purpose: "Member account authentication and session identity.",
    productionLive: false,
    actionEnabled: false,
    memberPath: "/login",
    authorityBoundary: "A server-validated Supabase user identifies the account session; it does not prove character, skill, or safety.",
    dataBoundary: "Supabase handles password, recovery, session, and optional MFA data; Werkles keeps the minimum account reference and supplied contact fields.",
    blocker: "Server-readable session continuity is incomplete across all member Intake surfaces.",
    lastReviewedAt: "2026-08-22"
  }),
  entry({
    id: "stripe_billing",
    system: "Stripe Billing",
    layer: "member_provider",
    readiness: "not_live_yet",
    purpose: "Membership checkout, subscription state, and billing portal.",
    productionLive: false,
    actionEnabled: false,
    memberPath: "/membership",
    authorityBoundary: "Only a verified signed Stripe event can change server-derived membership state.",
    dataBoundary: "Stripe handles card and payment-method details; Werkles keeps only the references and states needed for billing access.",
    blocker: "Test webhook proof, secret entry, and paid checkout remain separate gates.",
    lastReviewedAt: "2026-08-22"
  }),
  entry({
    id: "stripe_identity",
    system: "Stripe Identity",
    layer: "member_provider",
    readiness: "not_live_yet",
    purpose: "Narrow document and optional selfie-to-ID observations.",
    productionLive: false,
    actionEnabled: false,
    memberPath: "/dashboard/crucible#check-identity",
    authorityBoundary: "A verified provider event may establish only the scoped observation it actually performed.",
    dataBoundary: "Werkles keeps result, purpose, provider reference, and timestamps—not document or selfie files.",
    blocker: "Durable operation and receipt persistence are not connected.",
    lastReviewedAt: "2026-08-22"
  }),
  entry({
    id: "plaid",
    system: "Plaid",
    layer: "member_provider",
    readiness: "not_live_yet",
    purpose: "Dated bank-ownership and minimum-funds evidence when a member chooses to disclose it.",
    productionLive: false,
    actionEnabled: false,
    memberPath: "/dashboard/crucible#check-funds",
    authorityBoundary: "Link completion alone is never proof; any result must bind subject, purpose, scope, date, expiry, and consent.",
    dataBoundary: "Werkles keeps no public amount, balance, band, transaction, account number, or raw report; any private minimum disclosure must be expiring and mutually approved.",
    blocker: "Plaid sandbox access was granted. Server credential custody, the narrow product decision, exchange, removal confirmation, receipts, webhooks, schema, and RLS remain disabled; production access is under Plaid review.",
    lastReviewedAt: "2026-08-22"
  }),
  entry({
    id: "twilio_verify",
    system: "Twilio Verify",
    layer: "member_provider",
    readiness: "planned",
    purpose: "Time-bounded possession of a phone or contact channel.",
    productionLive: false,
    actionEnabled: false,
    memberPath: "/dashboard/crucible#check-phone",
    authorityBoundary: "A successful Verification Check establishes possession at that time; sending a message alone proves nothing.",
    dataBoundary: "Werkles keeps the phone number and scoped result only while an account or safety purpose requires them; never the verification code.",
    blocker: "Provider setup, consent, abuse controls, rate limits, spend boundary, routes, and persistence are not connected.",
    lastReviewedAt: "2026-08-22"
  }),
  entry({
    id: "checkr",
    system: "Checkr",
    layer: "member_provider",
    readiness: "policy_blocked",
    purpose: "Purpose-specific background-screen workflows.",
    productionLive: false,
    actionEnabled: false,
    memberPath: "/dashboard/crucible#check-background_basic",
    authorityBoundary: "No report flow exists without approved purpose, consent, notices, disputes, adverse action, and retention.",
    dataBoundary: "Werkles keeps nothing today; a future approved flow would keep only consent, purpose, status, references, notices, and audit timestamps.",
    blocker: "Counsel and provider approval are required before collection or integration.",
    lastReviewedAt: "2026-08-22"
  }),
  entry({
    id: "onepassword",
    system: "1Password",
    layer: "operator_custody",
    readiness: "in_use",
    purpose: "Operator and automation secret custody.",
    productionLive: false,
    actionEnabled: false,
    authorityBoundary: "Secret custody does not approve secret entry, provider activation, spending, push, or deployment.",
    dataBoundary: "Member product data does not belong in the operator secret vault; credentials never enter client code or chat receipts.",
    blocker: null,
    lastReviewedAt: "2026-08-22"
  })
] as const satisfies readonly TechStackReadinessEntry[]);

export const TECH_STACK_LAYER_ORDER = Object.freeze([
  "product_runtime",
  "member_provider",
  "operator_custody"
] as const satisfies readonly TechStackLayer[]);

export function techStackEntriesForLayer(layer: TechStackLayer): readonly TechStackReadinessEntry[] {
  return TECH_STACK_READINESS_LEDGER.filter((item) => item.layer === layer);
}
