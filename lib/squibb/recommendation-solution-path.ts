import type { RecommendationKind } from "./recommendations";

export type RecommendationArtifactField = Readonly<{
  id: string;
  label: string;
  placeholder: string;
}>;

export type RecommendationSolutionPath = Readonly<{
  outcome: string;
  playbook: readonly [string, string, string];
  artifact: Readonly<{
    title: string;
    description: string;
    fields: readonly [RecommendationArtifactField, RecommendationArtifactField, RecommendationArtifactField];
  }>;
  bellows: Readonly<{
    href: `/bellows/library/${string}`;
    title: string;
    description: string;
  }>;
  comparison: Readonly<{
    title: string;
    criteria: readonly string[];
    disclosure: string;
  }>;
}>;

function field(id: string, label: string, placeholder: string): RecommendationArtifactField {
  return Object.freeze({ id, label, placeholder });
}

const GENERAL_DISCLOSURE =
  "No provider is ranked here yet. Future results must show sources, location fit, last-checked date, price limits, and whether Werkles is paid.";

const PATHS: Record<RecommendationKind, RecommendationSolutionPath> = {
  translate_need: {
    outcome: "Leave with one decision you can test this week—not a foggy goal.",
    playbook: [
      "Turn the goal into one decision with two or three real choices.",
      "Name the missing fact that would change the choice.",
      "Choose the smallest test that can produce that fact this week."
    ],
    artifact: {
      title: "One-decision brief",
      description: "A short brief you can use to stop circling and run one useful test.",
      fields: [
        field("decision", "The decision", "Should we rent, buy used, or delay the equipment?"),
        field("missing-fact", "The fact you still need", "Expected weekly jobs that require this machine"),
        field("small-test", "The smallest useful test", "Rent for one job and record time, cost, and margin")
      ]
    },
    bellows: {
      href: "/bellows/library/assumption-test-design",
      title: "Assumption Test Design",
      description: "Turn the missing fact into a small test with a threshold, deadline, and cost cap."
    },
    comparison: {
      title: "What Werkles would compare next",
      criteria: ["real choices", "cost of testing", "time to evidence", "reversibility"],
      disclosure: GENERAL_DISCLOSURE
    }
  },
  verify_proof: {
    outcome: "Leave with an evidence brief that separates the claim, support, and biggest gap.",
    playbook: [
      "Write the business hypothesis another person would need to understand.",
      "Attach one current fact that supports it and name where that fact came from.",
      "Name the biggest unanswered question and one small test that could answer it."
    ],
    artifact: {
      title: "Evidence brief",
      description: "A practical handoff for a lender, partner, customer, seller, or professional adviser.",
      fields: [
        field("hypothesis", "Business hypothesis", "Buying this tool could let us complete two more jobs each week"),
        field(
          "support",
          "Current support — source, date, and status",
          "Member-reported: three customers asked; observed Aug. 17. External source: two quotes dated this month"
        ),
        field("gap-test", "Biggest gap and test", "Unknown demand after month one; pre-sell two jobs before buying")
      ]
    },
    bellows: {
      href: "/bellows/library/proof-before-reliance",
      title: "Proof before reliance",
      description: "Use claim, source, scope, date, and remaining-gap discipline."
    },
    comparison: {
      title: "What a useful outside review would compare",
      criteria: ["claim scope", "source quality", "freshness", "remaining uncertainty"],
      disclosure: GENERAL_DISCLOSURE
    }
  },
  stage_intro_candidate: {
    outcome: "Leave with a two-week help brief before looking at names.",
    playbook: [
      "Define the work the person would own in the first two weeks.",
      "Write what you can offer and why a conversation matters now.",
      "List what each side should verify before an introduction."
    ],
    artifact: {
      title: "Introduction brief",
      description: "A specific request that helps both people decide whether a conversation is worthwhile.",
      fields: [
        field("two-week-job", "First two weeks of work", "Price three equipment paths and call two service shops"),
        field("give-back", "What you offer", "Paid project, customer access, operating knowledge, or another fair exchange"),
        field("checks", "Questions before an intro", "Availability, authority, conflicts, credentials, and expectations")
      ]
    },
    bellows: {
      href: "/bellows/library/partnership-alignment",
      title: "Partnership alignment",
      description: "Separate the work, authority, money, and exit questions before an introduction."
    },
    comparison: {
      title: "What Werkles would compare before showing people",
      criteria: ["specific work", "mutual value", "timing", "what is still unknown"],
      disclosure: GENERAL_DISCLOSURE
    }
  },
  find_partner: {
    outcome: "Leave with a paid or time-boxed working test before discussing ownership.",
    playbook: [
      "Define the week-one work and decisions the other person would own.",
      "Choose a small project that reveals how you communicate and perform together.",
      "Record the money, control, disagreement, and exit questions for professional review."
    ],
    artifact: {
      title: "Partner test brief",
      description: "A reversible test of the working relationship—not an equity offer or agreement.",
      fields: [
        field("role", "Week-one role", "Own vendor quotes and delivery plan for the equipment purchase"),
        field("trial", "Small working test", "Two-week paid project with one deliverable and review date"),
        field("hard-questions", "Questions to resolve", "Authority, pay, ownership, deadlock, absence, and exit")
      ]
    },
    bellows: {
      href: "/bellows/library/partnership-alignment",
      title: "Partnership alignment",
      description: "Build the nonbinding alignment memo before drafting an agreement."
    },
    comparison: {
      title: "What Werkles would compare in a partner path",
      criteria: ["role fit", "mutual value", "trial evidence", "unresolved deal terms"],
      disclosure: GENERAL_DISCLOSURE
    }
  },
  find_equipment: {
    outcome: "Leave with a quote-ready equipment requirement and a fair buy/rent/lease comparison.",
    playbook: [
      "Write the job, must-have specifications, budget ceiling, and date needed.",
      "Collect comparable buy, used, lease, and rental paths where they apply.",
      "Compare total delivered cost, condition, support, warranty, and seller evidence."
    ],
    artifact: {
      title: "Equipment comparison brief",
      description: "The same requirement sheet can be sent to sellers, dealers, rental yards, or lenders.",
      fields: [
        field("spec", "Job and must-have specification", "Move 3,000 lb pallets through a 7-foot opening"),
        field("budget-date", "Budget and need date", "$25,000 ceiling; needed before October 1"),
        field("compare", "Quotes to compare", "New, used, lease, and rental with delivery and service included")
      ]
    },
    bellows: {
      href: "/bellows/library/supplier-comparison",
      title: "Make Suppliers Answer the Same Question",
      description: "Compare the same requirement, first-year cost, service, downtime, and current seller evidence."
    },
    comparison: {
      title: "What Werkles will require from equipment options",
      criteria: ["spec fit", "total landed cost", "condition and warranty", "seller and service evidence"],
      disclosure: GENERAL_DISCLOSURE
    }
  },
  find_banker: {
    outcome: "Leave with one clear banking question and a document-ready call brief.",
    playbook: [
      "State the amount or banking problem, its use, and when it matters.",
      "List the records already available and the records still missing.",
      "Ask each institution the same questions about fees, timing, authority, and next requirements."
    ],
    artifact: {
      title: "Banker conversation brief",
      description: "A consistent request that makes bank conversations easier to compare.",
      fields: [
        field("money-question", "The money question", "We need to understand financing paths for a $40,000 equipment purchase"),
        field("documents", "Records ready", "Recent statements, tax returns, quote, revenue history, and owner information"),
        field("ask", "Questions for every bank", "Eligibility, documents, fees, timing, guarantees, and decision maker")
      ]
    },
    bellows: {
      href: "/bellows/library/company-starter-floor",
      title: "Build the launch floor",
      description: "Put records, money discipline, permissions, and professional questions in order."
    },
    comparison: {
      title: "What Werkles must compare before naming a bank",
      criteria: ["business eligibility", "service geography", "fee evidence", "product and decision fit"],
      disclosure: GENERAL_DISCLOSURE
    }
  },
  find_credit_union: {
    outcome: "Leave with an eligibility-first shortlist request—not three random nearby names.",
    playbook: [
      "Write the amount, use, down payment, collateral, and location.",
      "Check membership eligibility and whether the institution handles this business need.",
      "Compare current documents, fees, rate structure, guarantees, and decision timing."
    ],
    artifact: {
      title: "Credit-union comparison brief",
      description: "A common question sheet for institutions that actually fit the member and request.",
      fields: [
        field("request", "Amount and use", "$40,000 for named equipment, with $8,000 available down"),
        field("eligibility", "Membership and geography", "Business and owners are located in the service area"),
        field("same-questions", "Questions for every option", "Membership, product, documents, total cost, guarantee, and decision time")
      ]
    },
    bellows: {
      href: "/bellows/library/company-starter-floor",
      title: "Build the launch floor",
      description: "Prepare the records and unknowns before comparing financing paths."
    },
    comparison: {
      title: "What Werkles must verify before ranking credit unions",
      criteria: ["membership eligibility", "insured status", "service geography", "product terms and recency"],
      disclosure: GENERAL_DISCLOSURE
    }
  },
  find_better_job: {
    outcome: "Leave with a job scorecard tied to the business you are trying to build.",
    playbook: [
      "Set minimum pay, schedule, location, benefits, and skill-growth needs.",
      "Name what the job must protect or enable outside work.",
      "Score real openings against the same requirements before applying."
    ],
    artifact: {
      title: "Better-job scorecard",
      description: "A repeatable screen for jobs that support the larger plan.",
      fields: [
        field("minimums", "Non-negotiable minimums", "Pay, schedule, commute, benefits, and stability"),
        field("enable", "What the job should enable", "Training, savings, contacts, or predictable time"),
        field("dealbreaker", "Dealbreakers", "Travel, nights, instability, or conflicts with the business test")
      ]
    },
    bellows: {
      href: "/bellows/library/pitch-is-not-the-plan",
      title: "The pitch is not the plan",
      description: "Name the real constraint before changing paths."
    },
    comparison: {
      title: "What Werkles would compare across jobs",
      criteria: ["minimum requirements", "business-plan fit", "skill growth", "verified job facts"],
      disclosure: GENERAL_DISCLOSURE
    }
  },
  stay_current_job: {
    outcome: "Leave with a protected-income experiment and a written decision date.",
    playbook: [
      "Choose one business test that does not require risking current income.",
      "Set its time, cash budget, and end date before starting.",
      "Write the result that would justify keeping, changing, or stopping the plan."
    ],
    artifact: {
      title: "Protected-income experiment",
      description: "A boundary around the side test so 'keep the job' does not mean 'wait forever.'",
      fields: [
        field("test", "The business test", "Pre-sell five jobs that would use the new equipment"),
        field("limits", "Time and money limits", "Six Saturdays and no more than $1,500"),
        field("decision-rule", "Decision rule", "Revisit after five paid commitments or on October 1")
      ]
    },
    bellows: {
      href: "/bellows/library/assumption-test-design",
      title: "Assumption Test Design",
      description: "Set the pass, pause, or stop rule before risking current income."
    },
    comparison: {
      title: "What Werkles would compare across experiments",
      criteria: ["income protection", "cost cap", "learning value", "decision deadline"],
      disclosure: GENERAL_DISCLOSURE
    }
  },
  relocate: {
    outcome: "Leave with a location scorecard and a low-cost way to test the leader.",
    playbook: [
      "Name the exact business problem a move is supposed to solve.",
      "Compare three places on customers, costs, rules, travel, and non-negotiables.",
      "Test the strongest place with calls, visits, or a short pilot before committing."
    ],
    artifact: {
      title: "Location comparison brief",
      description: "A common scorecard that keeps one attractive fact from deciding the whole move.",
      fields: [
        field("problem", "Problem the move should solve", "Access to year-round customers and a licensed workforce"),
        field("criteria", "Comparison criteria", "Customers, rent, pay, rules, travel, family, and suppliers"),
        field("pilot", "Test before moving", "Interview ten customers and two advisers in the leading location")
      ]
    },
    bellows: {
      href: "/bellows/library/company-starter-floor",
      title: "Build the launch floor",
      description: "Check location-specific rules, permissions, money, and professional questions."
    },
    comparison: {
      title: "What Werkles would compare across locations",
      criteria: ["named business problem", "current local facts", "non-negotiables", "pilot evidence"],
      disclosure: GENERAL_DISCLOSURE
    }
  },
  get_training: {
    outcome: "Leave with a skill requirement and a small real-world proof task.",
    playbook: [
      "Name the exact task or credential that is blocked today.",
      "Compare the shortest credible ways to learn or prove it.",
      "Use the skill on a small real project before buying a larger program."
    ],
    artifact: {
      title: "Training requirement brief",
      description: "A buyer's brief that starts with the work—not the course marketing.",
      fields: [
        field("task", "Task or credential needed", "Build and read a weekly cash-flow forecast"),
        field("proof", "What would prove enough skill", "Produce one accurate forecast and review it with an accountant"),
        field("limits", "Time and budget", "Four weeks, evenings, under $500")
      ]
    },
    bellows: {
      href: "/bellows/library/proof-before-reliance",
      title: "Proof before reliance",
      description: "Separate a course claim, credential, current evidence, and remaining gap."
    },
    comparison: {
      title: "What Werkles must compare before ranking training",
      criteria: ["task fit", "credential recognition", "total time and cost", "independent outcome evidence"],
      disclosure: GENERAL_DISCLOSURE
    }
  },
  raise_capital: {
    outcome: "Leave with a milestone-sized funding brief before choosing debt or equity.",
    playbook: [
      "Write the amount, exact use, date, and milestone the money should reach.",
      "List the current facts and records that make the milestone plausible.",
      "Compare financing structures by total cost, control, downside, and professional requirements."
    ],
    artifact: {
      title: "Funding-use brief",
      description: "A planning handoff for qualified financial, legal, tax, or lending professionals—not an application.",
      fields: [
        field("amount-use", "Amount and exact use", "$40,000 for named equipment, delivery, and installation"),
        field("milestone", "Milestone and date", "Complete 20 additional paid jobs by March 31"),
        field("support", "Facts and unknowns", "Quotes, demand evidence, cash available, repayment unknowns, and downside")
      ]
    },
    bellows: {
      href: "/bellows/library/proof-before-reliance",
      title: "Proof before reliance",
      description: "Separate self-reported plans from dated evidence and unresolved risk."
    },
    comparison: {
      title: "What Werkles must compare across funding paths",
      criteria: ["eligibility", "total cost", "control and guarantees", "current source and professional review"],
      disclosure: GENERAL_DISCLOSURE
    }
  }
};

for (const path of Object.values(PATHS)) {
  Object.freeze(path.playbook);
  Object.freeze(path.artifact.fields);
  Object.freeze(path.artifact);
  Object.freeze(path.bellows);
  Object.freeze(path.comparison.criteria);
  Object.freeze(path.comparison);
  Object.freeze(path);
}

Object.freeze(PATHS);

export function recommendationSolutionPath(kind: RecommendationKind): RecommendationSolutionPath {
  return PATHS[kind];
}
