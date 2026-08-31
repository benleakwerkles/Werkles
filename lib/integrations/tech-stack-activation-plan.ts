import { TECH_STACK_SLOT_IDS, type TechStackSlotId } from "@/lib/integrations/tech-stack-slot-catalog";

export type TechStackActivationWave = Readonly<{
  number: 1 | 2 | 3 | 4;
  title: string;
  slotIds: readonly TechStackSlotId[];
  usefulResult: string;
  nextProof: string;
  stopsBefore: string;
}>;

function wave(value: TechStackActivationWave): TechStackActivationWave {
  return Object.freeze({ ...value, slotIds: Object.freeze([...value.slotIds]) });
}

/**
 * Canonical build order for product providers. This is architecture and gate
 * sequencing, not runtime availability or permission to activate a provider.
 */
export const TECH_STACK_ACTIVATION_WAVES: readonly TechStackActivationWave[] = Object.freeze([
  wave({
    number: 1,
    title: "Keep one member connected to their work",
    slotIds: ["supabase_auth", "supabase_member_data", "supabase_storage"],
    usefulResult: "A signed-in member can return to their own Intake, recommendations, Match Deck, Formation work, and Personal Bellows.",
    nextProof: "Prove one owner-bound read and write path across those routes, including a second account that cannot see it.",
    stopsBefore: "Production schema, row-level security, or account activation without Operator approval."
  }),
  wave({
    number: 2,
    title: "Connect membership without turning payment into trust",
    slotIds: ["stripe_billing"],
    usefulResult: "Stripe can record whether a membership is active while Werkles keeps that fact separate from identity, skill, or character.",
    nextProof: "Re-run checkout, signed webhook, membership update, portal, cancellation, and replay handling in test mode.",
    stopsBefore: "Live charges, production secrets, or a claim that paying makes someone safer or better qualified."
  }),
  wave({
    number: 3,
    title: "Add only the check a conversation needs",
    slotIds: ["stripe_identity", "plaid", "twilio_verify"],
    usefulResult: "Plaid, Twilio, and Stripe Identity can eventually answer narrow, dated questions without becoming a public ranking system.",
    nextProof: "Prove each sandbox or test flow separately, keep only the smallest useful receipt, and prove expiry, revocation, and deletion.",
    stopsBefore: "Live messages, live identity checks, production Plaid Link, provider spend, or raw financial and identity retention."
  }),
  wave({
    number: 4,
    title: "Keep background screening blocked until the rules are ready",
    slotIds: ["checkr"],
    usefulResult: "Checkr stays visibly separate instead of quietly becoming a universal badge of safety.",
    nextProof: "Finish the purpose, consent, notice, review, dispute, adverse-action, and deletion workflow before wiring the provider.",
    stopsBefore: "Any real screening or member-facing availability claim."
  })
]);

const assignedSlots = TECH_STACK_ACTIVATION_WAVES.flatMap((item) => item.slotIds);
if (
  assignedSlots.length !== TECH_STACK_SLOT_IDS.length ||
  new Set(assignedSlots).size !== TECH_STACK_SLOT_IDS.length ||
  TECH_STACK_SLOT_IDS.some((slotId) => !assignedSlots.includes(slotId))
) {
  throw new Error("Every tech-stack slot must appear in exactly one activation wave.");
}

export function activationWaveFor(slotId: TechStackSlotId): TechStackActivationWave {
  const match = TECH_STACK_ACTIVATION_WAVES.find((item) => item.slotIds.includes(slotId));
  if (!match) throw new Error(`No activation wave exists for ${slotId}.`);
  return match;
}
