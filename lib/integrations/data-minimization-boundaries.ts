import { TECH_STACK_SLOT_IDS, type TechStackSlotId } from "@/lib/integrations/tech-stack-slot-catalog";

export type PlannedDataBoundary = Readonly<{
  status: "planned_not_live";
  werklesKeeps: string;
  providerHandles: string;
  disposal: string;
}>;

function boundary(value: Omit<PlannedDataBoundary, "status">): PlannedDataBoundary {
  return Object.freeze({ status: "planned_not_live", ...value });
}

/** Architecture target only. The slot's readiness state still decides what exists today. */
export const DATA_MINIMIZATION_BOUNDARIES: Readonly<Record<TechStackSlotId, PlannedDataBoundary>> = Object.freeze({
  supabase_auth: boundary({
    werklesKeeps: "An account subject reference and the minimum profile contact fields the member supplies.",
    providerHandles: "Password, session, recovery, and optional multi-factor authentication data inside Supabase Auth.",
    disposal: "Account deletion must revoke sessions and remove or anonymize the app record under the adopted deletion procedure."
  }),
  supabase_member_data: boundary({
    werklesKeeps: "Owner-bound profile fields, Intake answers, work records, receipts, and sharing choices needed to deliver Werkles.",
    providerHandles: "Supabase hosts the database; Werkles still controls which application records exist and who may read them.",
    disposal: "Delete or anonymize owner data under an implemented retention schedule, except records that must be retained for a documented reason."
  }),
  supabase_storage: boundary({
    werklesKeeps: "No Workshop files today. A future file record would keep only ownership, access, purpose, and lifecycle metadata.",
    providerHandles: "File bytes in a private Supabase Storage bucket with owner and room access rules.",
    disposal: "Delete file bytes and their access metadata together when the owner removes them or the approved retention period ends."
  }),
  stripe_billing: boundary({
    werklesKeeps: "Stripe customer, subscription, price, event, and membership-state references needed for billing access.",
    providerHandles: "Card and payment-method details, payment authorization, and payment processing inside Stripe.",
    disposal: "End billing access and remove unnecessary local references; Stripe financial records follow Stripe and legally required retention."
  }),
  stripe_identity: boundary({
    werklesKeeps: "A scoped result, provider reference, purpose, status, and timestamps—not document or selfie files.",
    providerHandles: "Government-ID and selfie evidence inside Stripe Identity for the configured retention period.",
    disposal: "Request provider redaction when eligible and expire the Werkles result when its stated purpose or freshness window ends."
  }),
  plaid: boundary({
    werklesKeeps: "A fresh-date verification result, scope, expiry, consent, and provider receipt references—not public amounts, balances, bands, transactions, or account numbers. A specific minimum or amount exists only in an expiring, mutually approved private disclosure.",
    providerHandles: "Bank credentials and the raw account, balance, and Asset Report data needed for the one-shot evaluation.",
    disposal: "Remove the Plaid Item and Asset Report from Werkles access after evaluation; no result becomes shareable until removal is confirmed. Plaid's independent retention follows its own terms and legal duties."
  }),
  twilio_verify: boundary({
    werklesKeeps: "The member's phone number plus a scoped result, provider reference, purpose, and timestamps—not the verification code.",
    providerHandles: "Message delivery, verification code, delivery events, and abuse controls inside Twilio Verify.",
    disposal: "Expire the local result on its freshness schedule and remove the phone number when no account or safety purpose requires it."
  }),
  checkr: boundary({
    werklesKeeps: "Nothing today. A future workflow would keep consent, purpose, status, provider reference, notices, and audit timestamps.",
    providerHandles: "The background report and dispute workflow inside Checkr under an approved permissible purpose.",
    disposal: "No collection until counsel approves purpose, notices, disputes, adverse action, access, and retention; then enforce that schedule."
  })
});

if (Object.keys(DATA_MINIMIZATION_BOUNDARIES).length !== TECH_STACK_SLOT_IDS.length) {
  throw new Error("Every tech-stack slot must have one data-minimization boundary.");
}

export function dataBoundaryFor(id: TechStackSlotId): PlannedDataBoundary {
  return DATA_MINIMIZATION_BOUNDARIES[id];
}
