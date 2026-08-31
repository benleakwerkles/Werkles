export type BellowsLesson = {
  slug: string;
  eyebrow: string;
  title: string;
  promise: string;
  pattern: string;
  truth: string;
  breaks: string[];
  questions: string[];
  action: string;
  boundary: string;
};

export const bellowsLessons: BellowsLesson[] = [
  {
    slug: "pitch-is-not-the-plan",
    eyebrow: "Guru busting",
    title: "The pitch is not the plan.",
    promise: "A partner, a loan, or an LLC may be useful. None of them tells you what the business actually needs.",
    pattern:
      "The seductive version begins with a solution: find a partner, raise money, file the company, quit the job. The missing step is naming the constraint first.",
    truth:
      "Start with the work that cannot happen, the evidence you have, the consequence of waiting, and the smallest reversible test. Then ask which resource—person, money, space, equipment, advice, or time—fits that problem.",
    breaks: [
      "The proposed solution is carrying three different problems at once.",
      "Nobody can say what success would look like in the next thirty days.",
      "The plan only works if sales, timing, or goodwill land perfectly.",
      "The downside belongs to one person while the upside is described as shared."
    ],
    questions: [
      "What can the business not do today?",
      "What evidence would change your diagnosis?",
      "What is the cheapest useful test before you bind yourself to someone?"
    ],
    action: "Write one sentence beginning: “The work stops when…” Then list three possible causes before naming a solution.",
    boundary: "A clearer problem does not guarantee a good outcome. It makes the next decision easier to inspect."
  },
  {
    slug: "company-starter-floor",
    eyebrow: "Company starter kit",
    title: "Build the launch floor, not a paper costume.",
    promise: "Formation paperwork is one station on the floor. A functioning company also needs decisions, records, money discipline, permissions, and owners who understand the arrangement.",
    pattern:
      "A filing service can help create an entity. It cannot decide whether the structure fits your taxes, liability, ownership, licensing, financing, or local rules.",
    truth:
      "Use a starter kit to organize questions and evidence for the right professionals. Keep the work in stages: clarify the business, choose advisers, select structure and location, register, obtain tax IDs and permissions, separate money, insure the risks, and establish recordkeeping.",
    breaks: [
      "The entity is chosen before the owners explain how money and authority work.",
      "Personal and business spending are mixed.",
      "A license, permit, insurance policy, tax registration, or local rule is assumed instead of checked.",
      "The founders possess documents but cannot explain the obligations inside them."
    ],
    questions: [
      "What activity will the company perform, and where?",
      "Which attorney, accountant, insurer, lender, or local office must review the plan?",
      "Which records must exist before the first customer, employee, payment, or lease?"
    ],
    action: "Create three columns: decided, needs professional review, and unknown. Put every launch task in one column.",
    boundary: "This is a planning sequence, not entity, tax, licensing, insurance, or legal advice. Requirements vary by business and jurisdiction."
  },
  {
    slug: "proof-before-reliance",
    eyebrow: "Proof before reliance",
    title: "Proof reduces uncertainty. It does not remove judgment.",
    promise: "A confident claim is not the same thing as current, relevant evidence—and evidence is never a guarantee of future behavior.",
    pattern:
      "People often ask whether someone is verified as though verification were one permanent badge. Useful proof is narrower: what was checked, against which source, when, for what purpose, and what remains unknown.",
    truth:
      "Move through a simple proof chain: claim → document or source → issuer or checker → scope → date → unresolved gap. Label self-reported information honestly and let stale checks expire.",
    breaks: [
      "A document is real but does not prove the claim being made.",
      "A license existed once but its current status is unknown.",
      "Funds are shown without explaining timing, access, restrictions, or purpose.",
      "A successful identity check is treated as proof of skill, honesty, or future performance."
    ],
    questions: [
      "What exact claim are you relying on?",
      "Who issued or checked the evidence?",
      "When does this proof become stale?",
      "What important question does this evidence not answer?"
    ],
    action: "Take one important claim and write its source, scope, date, and biggest remaining gap.",
    boundary: "Werkles proof language must describe the check performed. It must never promise character, performance, safety, creditworthiness, or a successful deal."
  },
  {
    slug: "partnership-alignment",
    eyebrow: "Partnership alignment",
    title: "Agree on the hard questions before you draft the agreement.",
    promise: "Goodwill is valuable. It is not a decision system for money, authority, absence, deadlock, or exit.",
    pattern:
      "Many partnerships begin with a shared dream and an equity percentage. The misunderstandings live underneath: different definitions of work, risk, fairness, control, pay, and what happens when life changes.",
    truth:
      "Write a nonbinding alignment memo first. Use it to expose disagreement, record open questions, and give independent attorneys and tax advisers a clearer handoff. The memo is preparation for professional drafting—not a substitute for it.",
    breaks: [
      "Ownership percentage is expected to answer every question about pay and authority.",
      "One person contributes cash while another contributes indefinite future effort.",
      "Routine decisions, major decisions, and emergency decisions have no different rules.",
      "Nobody has discussed absence, underperformance, new capital, deadlock, sale, disability, death, or departure."
    ],
    questions: [
      "What is each person contributing, by when, and how will completion be recognized?",
      "Which decisions can one person make, which require consultation, and which require unanimous approval?",
      "How are wages, fees, distributions, reimbursements, and ownership treated differently?",
      "What happens when someone cannot or will not perform the expected role?",
      "How can the arrangement change, pause, buy someone out, or end?",
      "Which unresolved questions must go to separate legal and tax advisers?"
    ],
    action: "Answer the six questions separately, compare answers, and mark every difference. Do not negotiate the percentage until the differences are visible.",
    boundary: "Do not sign or rely on a Werkles alignment memo as an operating agreement, partnership agreement, tax election, securities document, employment agreement, or legal opinion."
  },
  {
    slug: "assumption-test-design",
    eyebrow: "Learn before you bind",
    title: "Turn the riskiest assumption into a small test.",
    promise: "A useful test says what you expect, who or what can disprove it, how much you will risk, and what result changes the decision.",
    pattern:
      "The vague version says to research the market, ask people what they think, or try the idea. Those activities can produce notes and encouragement without answering the decision that matters.",
    truth:
      "Choose one assumption that could sink the next move. Test it with the people, prices, conditions, and behavior that matter. Set the pass, pause, or stop rule before seeing the result so enthusiasm cannot quietly move the goalposts.",
    breaks: [
      "The test asks friends whether they like an idea instead of asking likely customers to make a realistic choice.",
      "The test changes the product, audience, price, and sales message at the same time.",
      "There is no threshold, deadline, cost cap, or record of what actually happened.",
      "A positive conversation is counted as a sale, repeat demand, workable margin, or reliable delivery.",
      "A weak result is explained away instead of changing the decision or the next test."
    ],
    questions: [
      "Which single assumption could make the next move a bad decision?",
      "Whose real behavior—or which current record—could challenge it?",
      "What result means proceed, revise, pause, or stop?",
      "What is the smallest honest test that fits your time and cash limit?",
      "What will still be unknown even if the test passes?"
    ],
    action:
      "Write one assumption, one target group or source, one action they must take, one pass/fail threshold, one deadline, and one cost cap. Run no test until those six lines are visible.",
    boundary:
      "A small test can reduce uncertainty. It does not guarantee demand, price, margin, delivery, safety, legality, financing, or future success."
  },
  {
    slug: "supplier-comparison",
    eyebrow: "Buy the fit, not the pitch",
    title: "Make suppliers answer the same question.",
    promise: "The cheapest sticker price can become the most expensive working option after delivery, setup, service, delay, and mismatch enter the room.",
    pattern:
      "The weak comparison collects three quotes that describe three different packages. One includes delivery, one assumes installation, one hides service, and the most persuasive salesperson wins because the numbers never became comparable.",
    truth:
      "Write one vendor-neutral requirement first. Ask every option for the same delivered scope, date, exclusions, warranty, service response, cancellation terms, and evidence. Compare first-year cost and the cost of being unable to use the thing—not only the purchase price.",
    breaks: [
      "The requirement changes to match whichever seller is speaking.",
      "A low price excludes freight, installation, utilities, training, consumables, maintenance, or downtime.",
      "A testimonial, badge, or marketplace rating substitutes for current seller, condition, warranty, or service evidence.",
      "Werkles compensation or sponsorship is hidden, or a paid option is allowed to outrank a better fit.",
      "The buyer is rushed into a signature before comparing the contract, renewal, cancellation, and personal-guarantee terms."
    ],
    questions: [
      "What exact job, capacity, location, and deadline must every option satisfy?",
      "What is included, excluded, assumed, and still unknown in each quoted price?",
      "Who services it, how quickly, under which warranty, and what does downtime cost?",
      "Which seller, condition, availability, and price claims were checked, by whom, and on what date?",
      "Is Werkles paid by any option, and would the order stay the same if it were not?"
    ],
    action:
      "Write one requirement and send the same question sheet to every option. Add purchase, delivery, setup, twelve months of recurring cost, and one downtime estimate before comparing.",
    boundary:
      "A comparison organizes current user-entered facts. It does not inspect a seller, equipment condition, contract, warranty, financing, tax treatment, safety, or legal requirements."
  }
];

export function bellowsLessonBySlug(slug: string): BellowsLesson | undefined {
  return bellowsLessons.find((lesson) => lesson.slug === slug);
}

export const partnershipAlignmentTopics = [
  ["Purpose", "What are we building, and what are we explicitly not building?"],
  ["Contributions", "What cash, equipment, intellectual property, customers, labor, or guarantees are owned, loaned, or licensed?"],
  ["Ownership and pay", "How are ownership, wages or fees, reimbursements, and distributions kept separate?"],
  ["Roles and time", "Who owns which outcomes, and what happens when availability changes?"],
  ["Authority", "Who may sign, spend, hire, borrow, open accounts, or bind the company—and at what threshold?"],
  ["Records", "Who can see the books, bank statements, contracts, and proof—and how often?"],
  ["Change", "What happens when scope, hours, roles, or capital needs change?"],
  ["Deadlock", "Which decisions need unanimity, and how will a stuck decision escalate?"],
  ["Exit events", "What questions must be answered for departure, removal, incapacity, death, buyout, sale, or shutdown?"],
  ["Professional handoff", "Which facts are known, which assumptions are disputed, and which questions belong with independent counsel or a tax adviser?"]
] as const;

export const bellowsPrimarySources = [
  {
    label: "U.S. Small Business Administration — Business Guide",
    href: "https://www.sba.gov/business-guide",
    note: "Planning, launch, registration, licenses, banking, insurance, finance, and compliance starting points."
  },
  {
    label: "U.S. Small Business Administration — Choose a business structure",
    href: "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure",
    note: "How structure affects operations, taxes, fundraising, paperwork, and liability; recommends professional guidance."
  },
  {
    label: "U.S. Small Business Administration — Market research and competitive analysis",
    href: "https://www.sba.gov/business-guide/plan-your-business/market-research-competitive-analysis",
    note: "Current starting questions for demand, market size, location, saturation, and pricing; distinguishes existing sources from direct customer research."
  },
  {
    label: "U.S. Small Business Administration — Plan your business",
    href: "https://www.sba.gov/counseling/plan-your-business/",
    note: "Current guidance on separating one-time and monthly costs and checking comparable expenses with vendors and service providers."
  },
  {
    label: "Federal Trade Commission — Scams and Your Small Business",
    href: "https://www.ftc.gov/business-guidance/resources/scams-your-small-business-guide-business",
    note: "Equipment-leasing and small-business scam warnings, including pressure, fine print, half-truths, and unsupported savings claims."
  },
  {
    label: "Internal Revenue Service — Partnerships",
    href: "https://www.irs.gov/businesses/partnerships",
    note: "Federal tax overview for partnerships, partners, Form 1065, and Schedule K-1."
  },
  {
    label: "Internal Revenue Service — Publication 541",
    href: "https://www.irs.gov/publications/p541",
    note: "Detailed federal partnership tax information. State law and individual facts still require professional review."
  }
] as const;

export const bellowsSourceReviewDate = "August 20, 2026";
