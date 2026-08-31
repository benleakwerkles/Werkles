import type { WerkleTopicId } from "@/lib/werkle/formation";

export type WerkleTopicExperiment = Readonly<{
  kind: "field_test" | "adviser_handoff";
  title: string;
  prompt: string;
  observe: string;
  bellowsHref: string;
  crucibleHref?: string;
}>;

const TOPIC_EXPERIMENTS: Readonly<Record<WerkleTopicId, WerkleTopicExperiment>> = Object.freeze({
  purpose: {
    kind: "field_test",
    title: "Try the one-sentence test",
    prompt: "Each person explains the company in one sentence to three likely customers. Do not coach the listener.",
    observe: "Write down what each listener thinks the company does, who it serves, and why they would care.",
    bellowsHref: "/bellows/personal/partnership-alignment"
  },
  first_customer: {
    kind: "field_test",
    title: "Talk to three reachable customers",
    prompt: "Ask when this problem last happened, what they did instead, and what the workaround cost them.",
    observe: "Keep the exact examples. A polite compliment is not the same as a customer problem.",
    bellowsHref: "/bellows/library/assumption-test-design"
  },
  thirty_day_test: {
    kind: "field_test",
    title: "Run one small delivery",
    prompt: "Choose one result you can deliver for one real person inside thirty days, with a clear start and stop.",
    observe: "Record time, cash spent, what failed, and whether the person wanted the result enough to continue.",
    bellowsHref: "/bellows/library/assumption-test-design"
  },
  roles: {
    kind: "field_test",
    title: "Test one handoff",
    prompt: "Complete one repeated piece of work together. Name who starts it, what they hand over, and who finishes it.",
    observe: "Note every missing input, delay, duplicate effort, and point where ownership became unclear.",
    bellowsHref: "/bellows/personal/partnership-alignment"
  },
  decision_rights: {
    kind: "field_test",
    title: "Test one reversible decision",
    prompt: "Pick a small upcoming decision. Agree who decides, who must be consulted, and when the decision is closed.",
    observe: "Afterward, ask whether the process was fast, informed, and acceptable to both people.",
    bellowsHref: "/bellows/personal/partnership-alignment"
  },
  contributions: {
    kind: "adviser_handoff",
    title: "Inventory contributions before valuing them",
    prompt: "List cash, equipment, existing work, relationships, guarantees, and unpaid time separately. Do not transfer or price anything yet.",
    observe: "Take the inventory and the disputed items to the appropriate lawyer, accountant, or tax adviser.",
    bellowsHref: "/bellows/personal/partnership-alignment"
  },
  money_questions: {
    kind: "adviser_handoff",
    title: "Turn money tension into adviser questions",
    prompt: "List startup costs, who pays them, expected compensation, reimbursements, and the financial unknowns you disagree about.",
    observe: "Ask a qualified accountant or lawyer to explain the consequences before either person relies on the draft.",
    bellowsHref: "/bellows/personal/partnership-alignment"
  },
  proof_needs: {
    kind: "field_test",
    title: "Name the claim before buying proof",
    prompt: "Write the exact claim, who needs to rely on it, and what evidence would change the decision. Ask the other person directly first.",
    observe: "Use an outside check only when a specific unanswered fact still changes the decision.",
    bellowsHref: "/bellows/library/proof-before-reliance",
    crucibleHref: "/dashboard/crucible#match-check-context"
  },
  exit: {
    kind: "adviser_handoff",
    title: "List the ways someone may need to leave",
    prompt: "Describe likely departure scenarios, unfinished duties, access that must end, and questions about money or ownership. Do not draft a legal clause.",
    observe: "Take the scenario list to independent legal and tax advisers before making an agreement.",
    bellowsHref: "/bellows/personal/partnership-alignment"
  },
  ip: {
    kind: "adviser_handoff",
    title: "Inventory the work before deciding ownership",
    prompt: "Separate work created before the Werkle, work created together, licensed material, and material owned by someone else.",
    observe: "Have the right adviser review the inventory before either person transfers, licenses, or promises ownership.",
    bellowsHref: "/bellows/personal/partnership-alignment"
  },
  confidentiality: {
    kind: "field_test",
    title: "Sort information before sharing it",
    prompt: "Using harmless examples, label what may be shared, what requires permission, and what should stay out of Werkles entirely.",
    observe: "If the two people classify the same example differently, keep the real information private until that difference is resolved.",
    bellowsHref: "/privacy"
  },
  unknowns: {
    kind: "field_test",
    title: "Close one important unknown",
    prompt: "Choose one unanswered question that could change the next move. Use a primary source, direct observation, or a qualified adviser.",
    observe: "Record the answer, its source, the date, and whether it changed the plan.",
    bellowsHref: "/bellows/library/assumption-test-design"
  }
});

export function topicExperimentFor(topicId: WerkleTopicId): WerkleTopicExperiment {
  return TOPIC_EXPERIMENTS[topicId];
}
