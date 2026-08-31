import {
  TECH_STACK_SLOT_IDS,
  techStackSlot,
  type TechStackSlotId,
  type TechStackSlotStage
} from "@/lib/integrations/tech-stack-slot-catalog";
import { dataBoundaryFor, type PlannedDataBoundary } from "@/lib/integrations/data-minimization-boundaries";
export { TECH_STACK_ACTIVATION_WAVES } from "@/lib/integrations/tech-stack-activation-plan";

export type MemberTechStackState = TechStackSlotStage;

export type MemberTechStackService = Readonly<{
  id: TechStackSlotId;
  name: string;
  state: MemberTechStackState;
  stateLabel: string;
  does: string;
  doesNot: string;
  memberAction: string;
  nextBuild: string;
  humanGate: string;
  page: string;
  dataBoundary: PlannedDataBoundary;
  productionLive: false;
}>;

export type MemberTechStackStage = Readonly<{
  id: "account" | "record" | "checks" | "background";
  number: 1 | 2 | 3 | 4;
  title: string;
  summary: string;
  services: readonly MemberTechStackService[];
}>;

const MEMBER_COPY: Readonly<
  Record<TechStackSlotId, Pick<MemberTechStackService, "does" | "doesNot" | "memberAction" | "nextBuild" | "humanGate" | "page">>
> = Object.freeze({
  supabase_auth: {
    does: "Signs a member into an account and lets the server identify that account session.",
    doesNot: "It does not prove that the person is honest, qualified, or safe.",
    memberAction: "Open Sign Up. This build will offer account access when it is connected or name the unavailable boundary plainly.",
    nextBuild: "Prove one server-readable account session across Intake, Recommendations, Match Deck, Formation, and Personal Bellows.",
    humanGate: "Private auth configuration and any production activation stay with the Operator.",
    page: "/signup"
  },
  supabase_member_data: {
    does: "Will hold account-owned profiles, answers, claims, receipts, and sharing choices.",
    doesNot: "The current browser-only Werkles answers are not stored here yet.",
    memberAction: "Not yet. The profile page must not claim account-backed saving until the owner-bound write and read path is proven.",
    nextBuild: "Finish the owner-bound Intake/profile read-write contract and its cross-account isolation tests.",
    humanGate: "Schema, row-level security, and production data changes require separate approval.",
    page: "/dashboard/profile"
  },
  supabase_storage: {
    does: "Will hold Workshop files with owner and room access rules.",
    doesNot: "No member file bucket or upload path is connected today.",
    memberAction: "Not yet. Workshop files remain a prepared boundary rather than a working upload surface.",
    nextBuild: "Define file ownership, room sharing, deletion, size limits, and signed download behavior before accepting bytes.",
    humanGate: "Bucket creation, storage policy, and production retention approval remain gated.",
    page: "/dashboard/blueprints"
  },
  stripe_billing: {
    does: "Will record membership and billing state from signed Stripe events.",
    doesNot: "Paying dues is not evidence about identity, skill, funds, or trustworthiness.",
    memberAction: "Open Membership. Checkout starts only when the connected Stripe test path is available.",
    nextBuild: "Re-run the test checkout, signed webhook, membership update, portal, and cancellation loop as one proof.",
    humanGate: "Secret entry and paid checkout go-live require explicit approval.",
    page: "/membership"
  },
  stripe_identity: {
    does: "Can record a specific document or selfie-to-ID check at a particular time.",
    doesNot: "It does not prove character, skill, work authorization, or overall safety.",
    memberAction: "Only with a connected test member account. The practice exercise below never pretends to be Stripe.",
    nextBuild: "Persist a narrow, expiring identity-check receipt instead of a profile flag and prove webhook replay safety.",
    humanGate: "Provider activation, secrets, retention approval, and live identity checks remain gated.",
    page: "/dashboard/crucible#check-identity"
  },
  plaid: {
    does: "Has sandbox access for testing bank-ownership and dated minimum-funds evidence.",
    doesNot: "Sandbox access is not a connected Werkles runtime, and opening Plaid Link alone is not funds proof.",
    memberAction: "Not yet from Werkles. The current member surface shows the sandbox boundary; it does not connect a bank.",
    nextBuild: "Complete a sandbox-only Link, exchange, narrow evidence, expiry, revoke, and deletion proof without retaining raw financial data.",
    humanGate: "Production credentials, product approval, schema/RLS, and production Link activation remain gated.",
    page: "/dashboard/crucible#check-funds"
  },
  twilio_verify: {
    does: "Can show control of a phone or contact channel at the time of a completed check.",
    doesNot: "It does not prove legal identity or permanent ownership of the phone number.",
    memberAction: "Not yet. The on-screen practice code below does not contact Twilio or collect a phone number.",
    nextBuild: "Build the consent, rate-limit, abuse, send, check, expiry, and deletion contract before contacting Twilio.",
    humanGate: "Account setup, credentials, spend, and live message delivery remain gated.",
    page: "/dashboard/crucible#check-phone"
  },
  checkr: {
    does: "Can support a purpose-specific background-screen workflow when legally appropriate.",
    doesNot: "It is not a universal safe-person badge or a substitute for consent and dispute rights.",
    memberAction: "No. This remains blocked until the legal purpose, consent, review, dispute, and retention path is approved.",
    nextBuild: "Keep the adapter dormant while the permissible-purpose, consent, notice, dispute, adverse-action, and deletion workflow is reviewed.",
    humanGate: "Counsel, provider approval, account setup, and any real screening are separate gates.",
    page: "/dashboard/crucible#check-background_basic"
  }
});

const STATE_LABELS: Readonly<Record<TechStackSlotStage, string>> = Object.freeze({
  test_path_present: "Code path present; availability checked when opened",
  sandbox_demo: "Sandbox demonstration only",
  foundation_only: "Foundation only; no member action yet",
  not_connected: "Not connected",
  policy_blocked: "Blocked pending legal and provider approval"
});

function service(id: TechStackSlotId): MemberTechStackService {
  const slot = techStackSlot(id);
  const copy = MEMBER_COPY[id];
  return Object.freeze({
    id,
    name: slot.system,
    state: slot.stage,
    stateLabel: STATE_LABELS[slot.stage],
    does: copy.does,
    doesNot: copy.doesNot,
    memberAction: copy.memberAction,
    nextBuild: copy.nextBuild,
    humanGate: copy.humanGate,
    page: copy.page,
    dataBoundary: dataBoundaryFor(id),
    productionLive: false
  });
}

function stage(value: MemberTechStackStage): MemberTechStackStage {
  return Object.freeze({ ...value, services: Object.freeze([...value.services]) });
}

export const MEMBER_TECH_STACK_JOURNEY: readonly MemberTechStackStage[] = Object.freeze([
  stage({
    id: "account",
    number: 1,
    title: "Create and keep an account",
    summary: "Account access and membership come first. Neither is a trust badge.",
    services: [service("supabase_auth"), service("stripe_billing")]
  }),
  stage({
    id: "record",
    number: 2,
    title: "Save your working record",
    summary: "Your profile, answers, receipts, and Workshop files need owner-bound storage before they travel with you.",
    services: [service("supabase_member_data"), service("supabase_storage")]
  }),
  stage({
    id: "checks",
    number: 3,
    title: "Add only the check the work needs",
    summary: "Identity, phone, and bank evidence answer different narrow questions and expire separately.",
    services: [service("stripe_identity"), service("twilio_verify"), service("plaid")]
  }),
  stage({
    id: "background",
    number: 4,
    title: "Keep background screening in its own lane",
    summary: "A role-specific background process needs purpose, consent, review, disputes, and retention rules.",
    services: [service("checkr")]
  })
]);

const journeyIds = MEMBER_TECH_STACK_JOURNEY.flatMap((item) => item.services.map((item) => item.id));
if (
  journeyIds.length !== TECH_STACK_SLOT_IDS.length ||
  new Set(journeyIds).size !== TECH_STACK_SLOT_IDS.length ||
  TECH_STACK_SLOT_IDS.some((id) => !journeyIds.includes(id))
) {
  throw new Error("Member tech-stack journey must cover every service exactly once.");
}
