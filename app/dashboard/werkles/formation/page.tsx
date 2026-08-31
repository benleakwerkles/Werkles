import { createHash } from "node:crypto";

import Image from "next/image";
import Link from "next/link";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { DashboardAuthGuard } from "@/components/foundry/dashboard-auth-guard";
import { MemberWorkLocationReadout } from "@/components/foundry/member-work-location-readout";
import { WerkleFormationWorkbench } from "@/components/werkle/formation-workbench";
import { isGhostFleetEnabled, listGhostMembers, matchGhostsForOwner } from "@/lib/ghost-fleet";
import { loadOwnerSurfaceState } from "@/lib/owner-surfaces/owner-state";
import { readBellowsOwnerIdFromCookies } from "@/lib/squibb/bellows-owner-session";
import type { WerkleFormationSeed, WerkleResolutionChoice, WerkleTopicDefinition } from "@/lib/werkle/formation";

import "./werkle-formation.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Form a Werkle | Werkles",
  description: "Compare two Workshops and deliberately build a shared company room."
};

function source(id: string, author: "owner" | "partner", text: string, origin: string) {
  return { id, author, text: text.trim() || "Not answered in this Workshop yet.", origin } as const;
}

function compact(value: string | null | undefined, fallback: string) {
  return value?.replace(/\s+/g, " ").trim() || fallback;
}

function ownerOrigin(label: string) {
  return `Your latest Intake · ${label} · self-reported, not verified`;
}

function partnerOrigin(partnerName: string, label: string) {
  return `${partnerName}'s synthetic Workshop · ${label} · practice profile, not verified`;
}

function partnerPosition(
  choice: WerkleResolutionChoice,
  reason: string,
  question: string,
  note = reason
) {
  return { choice, reason, question, note } as const;
}

function pick<T>(values: readonly T[], seed: number, offset: number): T {
  return values[(seed + offset) % values.length];
}

export default async function WerkleFormationPage({
  searchParams
}: {
  searchParams: Promise<{ candidate?: string }>;
}) {
  const fleetOn = isGhostFleetEnabled();
  const ownerId = await readBellowsOwnerIdFromCookies();
  const requestedCandidateId = (await searchParams).candidate?.trim() ?? "";
  const [ownerState, fleet, matches] = await Promise.all([
    loadOwnerSurfaceState(ownerId),
    listGhostMembers(),
    fleetOn && ownerId ? matchGhostsForOwner(ownerId, 9) : Promise.resolve(null)
  ]);
  const topMatch = matches?.candidates[0] ?? null;
  const allowedCandidateIds = new Set(matches?.candidates.map((candidate) => candidate.ghostId) ?? []);
  const selectedMatch = matches?.candidates.find((candidate) => candidate.ghostId === requestedCandidateId) ?? topMatch;
  const partner = fleet.find((member) => member.id === selectedMatch?.ghostId && allowedCandidateIds.has(member.id)) ?? fleet.find((member) => member.id === topMatch?.ghostId) ?? fleet.find((member) => member.openToPartner) ?? fleet[0];
  const carrying = new Map(ownerState.carrying.map((row) => [row.id, row.value]));
  const ownerPurpose = compact(carrying.get("heaviest_lift"), "Build a useful business around a real problem.");
  const ownerSuccess = compact(carrying.get("success_twelve_months"), "A year from now, the work has repeat customers and a reliable way to deliver.");
  const ownerDecision = compact(carrying.get("stuck_decision"), "Choose the first offer and the smallest honest test.");
  const ownerResources = compact(carrying.get("resources_on_hand"), "Time, lived experience, and a starting network.");
  const ownerOffer = compact(carrying.get("what_you_offer"), "Product direction and the willingness to do the early work.");
  const ownerConstraints = compact(carrying.get("constraints"), "Do not make a commitment neither person can keep.");
  const partnerName = partner?.displayName ?? "Imani Pham";
  const partnerOffer = compact(partner?.offers[0], "day-to-day operating discipline");
  const partnerNeed = compact(partner?.seeks[0], "a clear role and a fair way to test the fit");
  const partnerPurpose = compact(partner?.statedNeed, "Turn a useful skill into a stable local business without taking on the whole job alone.");
  const partnerDecision = compact(partner?.stuckDecision, "Decide which part of the operation to test first.");
  const partnerRows = partner?.workshopRows ?? [];
  const personalitySeed = Number.parseInt(
    createHash("sha256").update(partner?.id ?? "ghost_095").digest("hex").slice(0, 8),
    16
  );
  const partnerProfile = {
    summary: `${partnerName} is a fictional ${partner?.roleLabel ?? "operator"} practice profile built from this Ghost's Workshop data—not a real person's private record.`,
    workPace: pick(["Steady weekly progress", "Short focused sprints", "A written plan before fast execution"], personalitySeed, 1),
    followThrough: pick(["Uses visible owners and dates", "Prefers a weekly check-in and written recap", "Wants the next handoff named before a meeting ends"], personalitySeed, 2),
    decisionStyle: pick(["Tests a small version before committing", "Wants the numbers and the operating owner clear", "Makes routine calls quickly but slows down shared commitments"], personalitySeed, 3),
    disagreementStyle: pick(["Names the concern directly and proposes a smaller test", "Asks what evidence would change either person's mind", "Parks the decision instead of forcing agreement"], personalitySeed, 4),
    availability: compact(partner?.timeCost, "A bounded weekly block, with more time only after the first test works."),
    contributionPosture: `${partnerOffer}. They are looking for ${partnerNeed}.`,
    financialScenario: partner?.capitalPosture === "can_back"
      ? "Fictional practice scenario: open to discussing a bounded test budget after costs and a stop rule are written down. Exact amount stays private. Synthetic and unverified—not a Plaid result."
      : "Fictional practice scenario: not bringing cash to the first test; contribution is time and skill. Synthetic and unverified—not a bank record or Plaid result."
  } as const;
  const formationId = createHash("sha256")
    .update(`${ownerState.intakeId ?? "example"}:${partner?.id ?? "partner"}:werkle-formation-v1`)
    .digest("hex")
    .slice(0, 24);

  const definitions: WerkleTopicDefinition[] = [
    {
      id: "purpose", group: "foundation", label: "Purpose", floor: true, adviserGate: false,
      question: "What are we actually trying to build together?",
      why: "If the two Workshops describe different companies, every later agreement is sitting on a crack.",
      ownerSource: source("owner-purpose", "owner", ownerPurpose, ownerOrigin("what you are trying to make real")),
      partnerSource: source("partner-purpose", "partner", partnerPurpose, partnerOrigin(partnerName, "stated need")),
      partnerPosition: partnerPosition("combine", "I see overlap, but I do not want either Workshop copied wholesale into the company.", "What single customer problem would make both of us say this is worth thirty days?"),
      suggestedJoint: `Together, we will choose one customer problem worth solving and test whether your direction and ${partnerName}'s ${partnerOffer.replace(/[.!?]+$/, "").toLowerCase()} make the work stronger.`,
      lesson: { label: "Use the Partnership Alignment questions", href: "/bellows/personal/partnership-alignment" }
    },
    {
      id: "first_customer", group: "foundation", label: "First customer or use case", floor: true, adviserGate: false,
      question: "Who gets helped first, and what would they choose or pay for?",
      why: "A company cannot test everything for everyone. Naming the first real use keeps the Werkle from becoming a mood board.",
      ownerSource: source("owner-customer", "owner", ownerSuccess, ownerOrigin("what a good year looks like")),
      partnerSource: source("partner-customer", "partner", compact(partnerRows[0], partnerNeed), partnerOrigin(partnerName, "first pressure")),
      partnerPosition: partnerPosition("combine", "I want one reachable first customer, not a broad audience we cannot learn from.", "Who can we speak with this month, and what real choice would count as demand?"),
      suggestedJoint: "We will choose one reachable customer group, name the problem they already feel, and ask for a real decision before expanding the offer.",
      lesson: { label: "Build a customer assumption test", href: "/bellows/library/assumption-test-design" }
    },
    {
      id: "thirty_day_test", group: "foundation", label: "First 30-day test", floor: true, adviserGate: false,
      question: "What will we actually do together before either person makes a bigger promise?",
      why: "A small working test reveals delivery, communication, cost, and follow-through better than another chemistry conversation.",
      ownerSource: source("owner-test", "owner", ownerDecision, ownerOrigin("next decision")),
      partnerSource: source("partner-test", "partner", partnerDecision, partnerOrigin(partnerName, "stuck decision")),
      partnerPosition: partnerPosition("combine", "A short test gives me more confidence than a bigger promise.", "What will we ship, measure, and stop doing if it does not work?"),
      suggestedJoint: "For 30 days we will test one offer with one reachable audience, record the work, responses, costs, and failures, then make an explicit continue, revise, or stop decision.",
      lesson: { label: "Set the pass, pause, and stop rules", href: "/bellows/library/assumption-test-design" }
    },
    {
      id: "roles", group: "working_agreement", label: "Responsibilities", floor: true, adviserGate: false,
      question: "What result does each person own during the test?",
      why: "Tasks can be shared. Responsibility cannot be vague when a customer is waiting.",
      ownerSource: source("owner-role", "owner", ownerOffer, ownerOrigin("what you can offer")),
      partnerSource: source("partner-role", "partner", partnerOffer, partnerOrigin(partnerName, "stated offer")),
      partnerPosition: partnerPosition("combine", "I am comfortable owning a result when the handoffs and decision boundary are visible.", "Which result is mine, and what do I need from you before I can deliver it?"),
      suggestedJoint: `You will lead ${ownerOffer.replace(/[.!?]+$/, "").toLowerCase()}. ${partnerName} will lead ${partnerOffer.replace(/[.!?]+$/, "").toLowerCase()}. Every handoff gets an owner, a date, and a visible result.`,
      lesson: { label: "Compare roles before ownership", href: "/bellows/personal/partnership-alignment" }
    },
    {
      id: "decision_rights", group: "working_agreement", label: "Decision rights", floor: true, adviserGate: false,
      question: "Who can decide alone, and which decisions need both people?",
      why: "This is deliberately uncomfortable. One person wants operating room; the other may fear being bound without a say.",
      ownerSource: source("owner-authority", "owner", "", ownerOrigin("decision rights not answered yet")),
      partnerSource: source("partner-authority", "partner", "The person running the day-to-day work needs room to make routine calls without turning every choice into a meeting.", partnerOrigin(partnerName, "operating preference")),
      partnerPosition: partnerPosition("partner", "Routine operating calls need a named owner; shared money and binding promises still need both people.", "Which decisions can I make without waiting, and which ones always come back to both of us?"),
      suggestedJoint: "Each person may make routine decisions inside their named responsibility. Decisions that spend shared money, bind the company, change ownership, or make a new outside promise require both people and appropriate professional review.",
      lesson: { label: "Work through authority and deadlock", href: "/bellows/personal/partnership-alignment" }
    },
    {
      id: "contributions", group: "working_agreement", label: "What each of you is putting in", floor: false, adviserGate: true,
      question: "What is each person putting in—and is it owned, loaned, licensed, or temporary?",
      why: "Time, equipment, customers, guarantees, cash, and existing work are not interchangeable. Werkles keeps the questions visible; independent legal and tax advisers help you settle the real terms.",
      ownerSource: source("owner-contribution", "owner", ownerResources, ownerOrigin("resources already on hand")),
      partnerSource: source("partner-contribution", "partner", `${partnerOffer}. Looking for ${partnerNeed}.`, partnerOrigin(partnerName, "offer and need")),
      partnerPosition: partnerPosition("combine", "Time, skill, equipment, introductions, and cash create different expectations, so I want each contribution listed separately.", "What are we each putting in for the test, and what happens to it if we stop?"),
      suggestedJoint: "We will list each contribution separately, name when it arrives, and mark ownership or reimbursement questions for independent legal and tax review before relying on them.",
      lesson: { label: "Open the contributions worksheet", href: "/bellows/personal/partnership-alignment" }
    },
    {
      id: "money_questions", group: "hard_edges", label: "Money questions for an adviser", floor: false, adviserGate: true,
      question: "What must be understood before either person spends, borrows, invests, invoices, or expects payment?",
      why: "Werkles can expose the questions. It cannot choose percentages, entity treatment, financing structure, wages, or tax answers.",
      ownerSource: source("owner-money", "owner", "", ownerOrigin("money boundary not answered yet")),
      partnerSource: source("partner-money", "partner", "I need to know whether my early work is a paid role, a contribution, or simply a short trial before I agree to more.", partnerOrigin(partnerName, "money boundary")),
      partnerPosition: partnerPosition("park", "I will not invent compensation or ownership terms before we know the costs and get appropriate advice.", "What can we safely test without either person assuming pay, equity, or reimbursement?", "Money stays unresolved until the test budget, contribution list, and adviser questions are written down."),
      suggestedJoint: "Before either person spends or promises money, we will list expected costs, who is paying, what still needs reimbursement or compensation discussion, and which questions belong with independent advisers.",
      lesson: { label: "Prepare the money questions for advisers", href: "/bellows/personal/partnership-alignment" }
    },
    {
      id: "proof_needs", group: "hard_edges", label: "Claims that need checking", floor: false, adviserGate: true,
      question: "Which facts would either person rely on before making a larger commitment?",
      why: "Identity, funds, licenses, ownership, demand, and work history answer different questions. One badge cannot stand in for all of them.",
      ownerSource: source("owner-proof", "owner", ownerConstraints, "Your latest Intake · what cannot change"),
      partnerSource: source("partner-proof", "partner", compact(partner?.proofGaps.join("; "), "Identity, role, and relevant work claims are still self-reported."), partnerOrigin(partnerName, "current proof gaps")),
      partnerPosition: partnerPosition("combine", "I want important claims checked by the source that can actually answer them, without turning one badge into a judgment about the person.", "Which claim would hurt us most if it were wrong, and what is the least invasive way to check it?"),
      suggestedJoint: "Before relying on an important claim, we will name the claim, the source that could check it, the date it was checked, and what the result still does not prove.",
      lesson: { label: "Build an Evidence Brief", href: "/bellows/library/proof-before-reliance" }
    },
    {
      id: "exit", group: "hard_edges", label: "A fair way to stop", floor: true, adviserGate: true,
      question: "What happens if the test fails or one person needs to leave?",
      why: "A room without an exit posture is a trap. Parking this is allowed, but hiding it is not.",
      ownerSource: source("owner-exit", "owner", "", ownerOrigin("exit boundary not answered yet")),
      partnerSource: source("partner-exit", "partner", "I am not ready to promise an exit rule until we agree what each person is putting in and who owns the work created together.", partnerOrigin(partnerName, "explicit hesitation")),
      partnerPosition: partnerPosition("park", "I want a fair stopping process, but the answer depends on contributions, access, and ownership questions we have not settled.", "What can either of us stop immediately, and what unfinished obligations would still need a handoff?", "I want an exit path before a larger commitment, but I am parking the exact rule until contributions and work ownership are clearer."),
      suggestedJoint: "Either person may pause the test. Before valuable work, money, or customer obligations enter, we will ask independent advisers how access, expenses, work product, and unfinished obligations should be handled.",
      lesson: { label: "Work through exit events", href: "/bellows/personal/partnership-alignment" }
    },
    {
      id: "ip", group: "hard_edges", label: "Who owns the work", floor: false, adviserGate: true,
      question: "What belongs to each Workshop, and what might belong to the future company?",
      why: "Werkles preserves the question and the source. It does not draft ownership clauses or decide the answer.",
      ownerSource: source("owner-ip", "owner", "", ownerOrigin("work-product ownership not answered yet")),
      partnerSource: source("partner-ip", "partner", "Not answered yet. I want professional advice before moving existing methods, customer material, or new work into a company.", partnerOrigin(partnerName, "unresolved")),
      partnerPosition: partnerPosition("private", "Existing work stays with its current owner until both people deliberately identify what may be used and professional advice supports the arrangement.", "What can we use in the test without transferring ownership?"),
      suggestedJoint: "We will inventory pre-existing material and new work separately, restrict access to the test, and take ownership and license questions to independent counsel before relying on an answer.",
      lesson: { label: "Prepare the professional handoff", href: "/bellows/personal/partnership-alignment" }
    },
    {
      id: "confidentiality", group: "hard_edges", label: "What may leave the room", floor: false, adviserGate: true,
      question: "What can be shared, with whom, and for what purpose?",
      why: "A shared Werkle should widen useful access deliberately—not turn both private Workshops into public material.",
      ownerSource: source("owner-confidentiality", "owner", "", ownerOrigin("sharing boundary not answered yet")),
      partnerSource: source("partner-confidentiality", "partner", "Customer names, private records, and third-party material stay out until both people know they may be shared.", partnerOrigin(partnerName, "privacy boundary")),
      partnerPosition: partnerPosition("private", "Private and third-party material should not enter the shared room merely because it helped shape an idea.", "What is safe to share for this test, and what must remain referenced but unseen?"),
      suggestedJoint: "Only accepted Werkle statements may be shared inside this room. Customer names, private records, and third-party material stay out until both people confirm they may be used for a named purpose.",
      lesson: { label: "Review Werkles privacy boundaries", href: "/privacy" }
    },
    {
      id: "unknowns", group: "hard_edges", label: "What neither person knows yet", floor: false, adviserGate: true,
      question: "Which unanswered questions could still change the company?",
      why: "Unknown is a useful state. Werkles should never turn missing facts into confident copy.",
      ownerSource: source("owner-unknowns", "owner", `Still unresolved: ${ownerDecision}`, ownerOrigin("unresolved decision")),
      partnerSource: source("partner-unknowns", "partner", `Still unresolved: ${partnerDecision}`, partnerOrigin(partnerName, "unresolved decision")),
      partnerPosition: partnerPosition("combine", "An explicit unknown is safer than confident filler, especially when it could change the plan.", "Which unknown can we test next, and what result would force us to change course?"),
      suggestedJoint: "We will keep an explicit unknowns list, assign the next fact-finding step, and record which result would change the current plan.",
      lesson: { label: "Turn one unknown into a test", href: "/bellows/library/assumption-test-design" }
    }
  ];

  const seed: WerkleFormationSeed = {
    formationId,
    partnerId: partner?.id ?? "ghost_095",
    storageKey: `werkles:formation:${formationId}:v1`,
    ownerLabel: "You",
    partnerLabel: partnerName,
    partnerSynthetic: true,
    partnerProfile,
    reasonForTable: selectedMatch?.reasons[0]?.detail ?? `${partnerName} may carry a different part of the work and is open to a small partnership test.`,
    definitions
  };

  return (
    <CockpitShell>
      <main className="dashboard-main werkle-formation-page">
        <DashboardAuthGuard next="/dashboard/werkles/formation" allowGhostWalkthrough={fleetOn}>
          <MemberWorkLocationReadout surface="formation" formationId={formationId} />
          <section className="werkle-formation-hero">
            <div>
              <p className="workshop-eyebrow">Two Workshops · one proposed Werkle</p>
              <h1>Build the company without erasing either person.</h1>
              <p>
                Compare what each person arrived with. Decide what enters the shared room, what needs new wording,
                what stays private, and what is still too important to fake agreement about.
              </p>
              <div className="member-selected-surface__actions">
                <a className="button button-dark" href="#formation-table">Start comparing Workshops</a>
                <Link className="button button-outline" href="/dashboard/intros">Back to Match Deck</Link>
              </div>
            </div>
            <figure>
              <Image src="/assets/draft/people-v1/people-shared-possibility-v1.png" alt="Two people comparing plans in a shared work space" width={1536} height={1024} priority />
              <figcaption>A match opens a conversation. Agreement still has to be built.</figcaption>
            </figure>
          </section>

          <nav className="werkle-formation-route" aria-label="Formation page stages">
            <a href="#formation-table"><span>1</span><strong>Meet at the table</strong><small>See both Workshops and the practice partner.</small></a>
            <a href="#formation-studio"><span>2</span><strong>Work through decisions</strong><small>Compare answers without inventing agreement.</small></a>
            <a href="#formation-floor"><span>3</span><strong>See what is shared</strong><small>Only mutual wording reaches the company floor.</small></a>
            <a href="#formation-operating-brief"><span>4</span><strong>Build the brief</strong><small>Turn accepted decisions into a usable readout.</small></a>
          </nav>

          <WerkleFormationWorkbench seed={seed} />
        </DashboardAuthGuard>
      </main>
    </CockpitShell>
  );
}
