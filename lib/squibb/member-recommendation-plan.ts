import type { RecommendationKind } from "./recommendations";
import { recommendationSolutionPath } from "./recommendation-solution-path";

export type MemberRecommendationFact = Readonly<{
  id: string;
  label: string;
  text: string;
}>;

export type MemberRecommendationPlan = Readonly<{
  tailored: boolean;
  title: string;
  verdict: string;
  reasons: readonly string[];
  sprint: readonly Readonly<{
    title: string;
    action: string;
    output: string;
  }>[];
  finishLine: string;
  artifactDraft: Readonly<Record<string, string>>;
}>;

function clean(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, 600);
}

function answer(facts: readonly MemberRecommendationFact[], fieldId: string): string {
  const match = facts.find((fact) => fact.id === fieldId || fact.id.endsWith(`-${fieldId}`));
  const value = clean(match?.text);
  return value === "Not answered" ? "" : value;
}

function generalPlan(
  kind: RecommendationKind,
  facts: readonly MemberRecommendationFact[]
): MemberRecommendationPlan {
  const goal = answer(facts, "heaviest_lift");
  const blocker = answer(facts, "time_cost");
  const hasEnoughSignal = Boolean(goal && blocker);

  if (!hasEnoughSignal) {
    return Object.freeze({
      tailored: false,
      title: "There is not enough here to prescribe a useful move.",
      verdict: "Werkles needs a concrete outcome and the main thing blocking it before it can build a serious plan.",
      reasons: Object.freeze(["Your goal or current obstacle is still missing."]),
      sprint: Object.freeze([]),
      finishLine: "Add the missing answer, then rerun the recommendation.",
      artifactDraft: Object.freeze({})
    });
  }

  const solution = recommendationSolutionPath(kind);
  const fieldOutputs = solution.artifact.fields.map((field) => field.label);

  return Object.freeze({
    tailored: true,
    title: `Build your ${solution.artifact.title.toLowerCase()}.`,
    verdict: solution.outcome,
    reasons: Object.freeze([
      "You named a concrete outcome and a current obstacle.",
      `This path turns the recommendation into a usable ${solution.artifact.title.toLowerCase()}, not another summary of your Intake.`,
      `Any later comparison should use the same standards: ${solution.comparison.criteria.join(", ")}.`
    ]),
    sprint: Object.freeze(solution.playbook.map((action, index) => Object.freeze({
      title: fieldOutputs[index],
      action,
      output: `A completed ${fieldOutputs[index].toLowerCase()} section in your ${solution.artifact.title.toLowerCase()}.`
    }))),
    finishLine: `Your ${solution.artifact.title.toLowerCase()} answers all three sections and is ready for the next comparison or qualified review.`,
    artifactDraft: Object.freeze({})
  });
}

function isDigitalReadinessCase(facts: readonly MemberRecommendationFact[]): boolean {
  const context = facts.map((fact) => fact.text).join(" ");
  return (
    /\b(apps?|websites?|sites?|software|platform|code|programmer|digital product)\b/i.test(context) &&
    /\b(ready|built enough|customer ready|mentor|investor|investment|funding|launch)\b/i.test(context) &&
    /\b(testing|prototype|idea|planning|starting|pre[- ]?launch)\b/i.test(context)
  );
}

function digitalReadinessPlan(
  kind: RecommendationKind,
  facts: readonly MemberRecommendationFact[]
): MemberRecommendationPlan | null {
  if (!isDigitalReadinessCase(facts)) return null;
  const constraints = answer(facts, "constraints");
  const constraintSummary = /\b(?:cannot|can't|can not)\s+(?:move|relocate)\b/i.test(constraints)
    ? "Work must fit the current location and stay focused on proving the two products."
    : "Keep the member's stated limits visible while choosing the test."

  if (kind === "verify_proof") {
    return Object.freeze({
      tailored: true,
      title: "Run a one-product readiness test—not two simultaneous polish projects.",
      verdict:
        "The hidden problem is that ‘ready’ means three different things. Customers need one useful job to work; mentors need evidence that you learn from real use; investors need a milestone that can grow. More polish across both products does not answer any one of those questions by itself.",
      reasons: Object.freeze([
        "Two products divide the evidence: activity on one cannot prove demand for the other.",
        "A mentor demo and a customer test need different asks; combining them produces vague feedback.",
        "Funding readiness is a milestone story, not a claim that every feature is finished."
      ]),
      sprint: Object.freeze([
        Object.freeze({
          title: "Choose one product and one audience",
          action:
            "Pick the product with the shortest path to an outsider completing its core job. Test it first with customers or intended users—not investors and users in the same session.",
          output: "One product, one audience, one observable job."
        }),
        Object.freeze({
          title: "Run five uncoached sessions",
          action:
            "Give five people the same starting point and goal. Do not explain the interface. Record completion, where they stall, what they expected, and whether they ask to return, pay, refer, or keep using it.",
          output: "Five behavior records, not five compliments."
        }),
        Object.freeze({
          title: "Use the rule you wrote beforehand",
          action:
            "Set go, rework, and park thresholds before the sessions. Move toward customers when the core job works; toward mentors when the same failure repeats; toward funding only when the next milestone and use of funds are specific.",
          output: "A dated go / rework / park decision."
        })
      ]),
      finishLine:
        "You can show which product was tested, what outsiders actually did, what failed repeatedly, and why the next audience is customer, mentor, or funder.",
      artifactDraft: Object.freeze({
        hypothesis: "One of the two products can produce a clearer completed-user outcome before additional cross-product polishing.",
        support: "Current support is founder-built prototypes and a completed internal walkthrough. Add dated behavior from five uncoached outsiders.",
        "gap-test": constraints
          ? `Unknown: which product produces the stronger response from real users. ${constraintSummary}`
          : "Unknown: which product produces the stronger outside behavior. Test one product with one audience first."
      })
    });
  }

  if (kind === "translate_need") {
    return Object.freeze({
      tailored: true,
      title: "Separate ‘ready for whom?’ before deciding what to finish.",
      verdict:
        "You do not have one readiness decision. You have a customer-readiness question, a mentor-readiness question, and an investor-readiness question. Treating them as one question makes every backlog item look equally urgent.",
      reasons: Object.freeze([
        "Customer-ready means a stranger can complete one valuable job and wants the result again.",
        "Mentor-ready means a specific repeated failure is worth expert diagnosis.",
        "Investor-ready means the next milestone, evidence, and use of capital can be stated without hand-waving."
      ]),
      sprint: Object.freeze([
        Object.freeze({
          title: "Make a three-column readiness map",
          action: "Create Customer, Mentor, and Investor columns. Put one required proof and one unresolved question in each.",
          output: "Three different definitions of ready."
        }),
        Object.freeze({
          title: "Choose the column with the cheapest missing proof",
          action:
            "Do the test that teaches you the most with the least code, money, and explanation. That is usually watching someone try the task before making an investor presentation.",
          output: "One proof target for the next seven days."
        }),
        Object.freeze({
          title: "Freeze the competing backlog",
          action: "For seven days, do not improve the other product unless the chosen test exposes a shared failure.",
          output: "A protected test window and a shorter backlog."
        })
      ]),
      finishLine: "Every new task can be tied to one audience and one missing proof—or removed from this sprint.",
      artifactDraft: Object.freeze({
        decision: "Which product and audience should get the next seven-day proof sprint?",
        "missing-fact": "Which product lets an outsider complete its core job with the least explanation—and gives them a reason to return?",
        "small-test": "Run five uncoached sessions on one product, then apply the written go / rework / park rule."
      })
    });
  }

  if (kind === "find_credit_union") {
    return Object.freeze({
      tailored: true,
      title: "Do not borrow to finance an unanswered product question.",
      verdict:
        "Credit can finance a priced asset with a credible repayment source. It is a poor substitute for learning which of two early products creates demand. Until the use of funds can be separated from product uncertainty, lender comparison is a later move—not the next one.",
      reasons: Object.freeze([
        "The current uncertainty is product and audience readiness, not the price of one proven asset.",
        "Borrowing would add a fixed obligation while both demand and the winning product remain unclear.",
        "A short outside-use test can shrink or eliminate the amount before any lender search."
      ]),
      sprint: Object.freeze([
        Object.freeze({
          title: "Separate learning spend from capacity spend",
          action:
            "List every proposed expense. Mark each one Learn—which product or audience works—or Deliver—serve demand already observed. Do not debt-finance the Learn column by default.",
          output: "A two-column use-of-funds list."
        }),
        Object.freeze({
          title: "Name the repayment source",
          action:
            "For every Deliver expense, write the existing revenue, contract, savings, or other source expected to repay it. Future popularity is not a repayment source.",
          output: "A repayment statement for each amount."
        }),
        Object.freeze({
          title: "Set the lender trigger",
          action:
            "Compare credit unions only when one product, one exact use, one maximum amount, and one repayment source survive the outside-use test.",
          output: "A written trigger that either opens or closes lender research."
        })
      ]),
      finishLine:
        "You can explain why debt is the right tool for a named purchase—and what pays it back—without relying on hoped-for demand.",
      artifactDraft: Object.freeze({
        request: "Not ready to size. Separate product-learning costs from capacity costs first.",
        eligibility: "Check only after the business use, location, ownership, and repayment source are concrete.",
        "same-questions": "Total cost, guarantees, collateral, fees, timing, and what happens if the milestone is missed."
      })
    });
  }

  if (kind === "find_equipment") {
    return Object.freeze({
      tailored: true,
      title: "Name the product bottleneck before adding another tool.",
      verdict:
        "A new service, contractor, or piece of infrastructure is useful only when it removes a failure you have already observed. Choose one product test first, then buy the smallest tool that changes that result.",
      reasons: Object.freeze([
        "Two products make it easy to buy broad capability without proving which workflow needs it.",
        "A repeated user failure gives vendors and contractors a specific job to solve.",
        "Comparing total cost and exit options keeps a temporary test from becoming permanent overhead."
      ]),
      sprint: Object.freeze([
        Object.freeze({
          title: "Record the repeated failure",
          action: "Run the chosen product with five outsiders and name the one failure that blocks the core job most often.",
          output: "One observed bottleneck with a count and an example."
        }),
        Object.freeze({
          title: "Write the smallest requirement",
          action: "Describe what the tool must change, what it must connect to, who will own it, the data it may touch, and the result that would justify keeping it.",
          output: "A vendor-neutral requirement and a pass line."
        }),
        Object.freeze({
          title: "Compare four ways to solve it",
          action: "Compare the current setup, a manual workaround, hired help, and a new service against setup time, first-year cost, data risk, lock-in, and reversibility.",
          output: "A comparable shortlist tied to the same observed failure."
        })
      ]),
      finishLine:
        "Choose a tool only when it fixes the named failure inside the cost and data boundary—and when you know how to leave it if the test fails.",
      artifactDraft: Object.freeze({
        spec: "The smallest capability required to remove the most repeated failure in the chosen product test.",
        "budget-date": constraints
          ? `Set the test budget and decision date while preserving: ${constraints}`
          : "Set a test budget, decision date, and exit rule before comparing providers.",
        compare: "Current setup, manual workaround, hired help, and new service—using the same result, cost, data, and exit questions."
      })
    });
  }

  if (kind === "raise_capital") {
    return Object.freeze({
      tailored: true,
      title: "Make funding buy a milestone—not two unfinished backlogs.",
      verdict:
        "A credible ask is not ‘help us finish both products.’ It is ‘this amount buys this evidence by this date, and that evidence changes this business decision.’ That framing also tells you when funding is premature.",
      reasons: Object.freeze([
        "The products are still being tested, so completion cost is not yet the same thing as investment value.",
        "Outside behavior can narrow the product, audience, and amount before dilution or debt enters the picture.",
        "One milestone makes mentor and investor conversations easier to compare."
      ]),
      sprint: Object.freeze([
        Object.freeze({
          title: "Name the milestone",
          action: "Choose one evidence milestone: completed user tasks, retained pilots, paid commitments, or a repeated workflow result.",
          output: "One dated milestone."
        }),
        Object.freeze({
          title: "Price only the gap to that milestone",
          action: "Separate work you can do now from work that truly requires money, hired skill, or paid infrastructure.",
          output: "A use-of-funds table with owner, cost, and date."
        }),
        Object.freeze({
          title: "Choose the right conversation",
          action:
            "Take a repeated product failure to a mentor, a proven small purchase with repayment capacity to a lender, and a scalable evidence milestone to an investor. Do not use one pitch for all three.",
          output: "A conversation brief matched to the evidence."
        })
      ]),
      finishLine: "The amount, use, milestone, current evidence, and reason for this funding path fit on one page.",
      artifactDraft: Object.freeze({
        "amount-use": "Amount still unknown. Price only the work required to reach the chosen evidence milestone.",
        milestone: "One product, one audience, one outside-behavior milestone, and one date.",
        support: "Founder-built prototypes and internal walkthroughs are current support; outside behavior and commercial evidence are still missing."
      })
    });
  }

  return null;
}

export function buildMemberRecommendationPlan(
  kind: RecommendationKind,
  facts: readonly MemberRecommendationFact[]
): MemberRecommendationPlan {
  const goal = answer(facts, "heaviest_lift");
  const stage = answer(facts, "business_stage");
  const blocker = answer(facts, "time_cost");
  const decision = answer(facts, "stuck_decision");
  const resources = answer(facts, "resources_on_hand");
  const constraints = answer(facts, "constraints");

  const digitalPlan = digitalReadinessPlan(kind, facts);
  if (digitalPlan) return digitalPlan;

  const demandSignal = /customer|sales|demand|orders|pre-?order/i.test(`${goal} ${blocker} ${decision}`);
  const capacitySignal = /tool|equipment|space|kitchen|oven|capacity|lease/i.test(`${goal} ${blocker} ${decision}`);
  const earlyStage = /testing|idea|planning|starting|prototype/i.test(stage);

  if (kind === "verify_proof" && demandSignal && capacitySignal && earlyStage) {
    const goalWithoutTerminalPunctuation = goal.replace(/[.!?]+$/, "");
    const hypothesis = goal
      ? `A larger space or equipment commitment for “${goalWithoutTerminalPunctuation}” is justified only if a small weekday offer reaches a written demand threshold more than once.`
      : "A larger space or equipment commitment is justified only after a small offer reaches a written demand threshold more than once.";
    const support = [
      stage ? `Self-reported stage: ${stage}.` : "",
      resources ? `Resources already named: ${resources}.` : "No current resources were listed.",
      "Add dated orders, receipts, customer commitments, and comparable capacity quotes before relying on this brief."
    ].filter(Boolean).join(" ");
    const gapTest = `${decision || "Decide whether demand should be tested before adding fixed capacity."} Run the same small paid-demand test twice and compare the result with the written threshold.`;

    return Object.freeze({
      tailored: true,
      title: "Prove weekday demand before you lease or buy.",
      verdict:
        "The first move is a two-cycle demand test—not a lender, partner, lease, or equipment search. That test tells you whether added capacity solves a real bottleneck or creates a new fixed cost.",
      reasons: Object.freeze([
        `You are at: ${stage}.`,
        `You named two linked obstacles: ${blocker}.`,
        decision ? `Your decision is: ${decision}` : "The equipment-or-demand decision still needs a written rule."
      ]),
      sprint: Object.freeze([
        Object.freeze({
          title: "Design one weekday offer",
          action: "Choose one product or service, one price, one delivery window, and one customer group. Do not test the whole operation at once.",
          output: "A one-sentence offer that can be accepted or declined."
        }),
        Object.freeze({
          title: "Set the pass line before asking",
          action: "Write the minimum paid orders or revenue needed in each of two test windows before more space or equipment deserves a quote.",
          output: "A numeric go / revise / stop rule."
        }),
        Object.freeze({
          title: "Run it twice and keep the misses",
          action: "Record offers made, paid orders, revenue, production time, and why people declined. Interest without a paid order stays interest—not demand.",
          output: "Two dated test results and the largest remaining uncertainty."
        })
      ]),
      finishLine:
        "If the written threshold is reached twice, price only the minimum capacity needed. If it misses, change the offer or customer channel before adding fixed cost.",
      artifactDraft: Object.freeze({
        hypothesis,
        support,
        "gap-test": constraints ? `${gapTest} Constraint to preserve: ${constraints}` : gapTest,
        spec: "Capacity needed to deliver the tested weekday offer without breaking the promised pickup window.",
        "budget-date": "Set after the demand threshold is met; include delivery, installation, utilities, service, and downtime.",
        compare: "Current setup, rental/shared workspace, used equipment, and new equipment—using the same capacity requirement."
      })
    });
  }

  if (kind === "find_equipment" && demandSignal && capacitySignal && earlyStage) {
    return Object.freeze({
      tailored: true,
      title: "Size the smallest capacity upgrade the demand test earns.",
      verdict:
        "Do not shop for equipment or a lease first. Convert paid demand into one capacity requirement, then compare the cheapest credible ways to meet it.",
      reasons: Object.freeze([
        `You are at: ${stage}.`,
        `You named a capacity obstacle: ${blocker}.`,
        decision ? `The equipment decision follows this choice: ${decision}` : "The required capacity is not quantified yet."
      ]),
      sprint: Object.freeze([
        Object.freeze({
          title: "Measure the work the test creates",
          action: "Record paid orders per pickup window, batch size, production minutes, labor minutes, and the point where the current setup fails.",
          output: "One peak-window capacity table based on paid demand."
        }),
        Object.freeze({
          title: "Write the minimum spec",
          action: "Turn the table into minimum units per hour, batch size, utilities, footprint, service access, and tolerable downtime.",
          output: "A vendor-neutral capacity requirement."
        }),
        Object.freeze({
          title: "Compare four ways to meet it",
          action: "Price the current setup, rental or shared workspace, used equipment, and new equipment against the same requirement and first-year all-in cost.",
          output: "A comparable shortlist with seller evidence and total cost."
        })
      ]),
      finishLine:
        "Keep only options that meet the tested capacity requirement, the written cost ceiling, and the service/condition evidence check.",
      artifactDraft: Object.freeze({
        spec: "Minimum units per hour, batch size, utilities, footprint, service access, and tolerable downtime derived from the paid-demand test.",
        "budget-date": constraints
          ? `Set a first-year all-in ceiling while preserving: ${constraints}`
          : "Set a first-year all-in ceiling before requesting quotes.",
        compare: "Current setup, rental/shared workspace, used equipment, and new equipment—each against the same capacity requirement.",
        hypothesis: "Added capacity is warranted only when the paid-demand result exceeds what the current setup can deliver.",
        support: resources ? `Start with what is already available: ${resources}.` : "Inventory the current setup before comparing additions.",
        "gap-test": "Reject any option without condition, service, delivery, installation, utilities, downtime, and total-cost evidence."
      })
    });
  }

  if (kind === "translate_need" && demandSignal && capacitySignal && earlyStage) {
    return Object.freeze({
      tailored: true,
      title: "Choose the demand test before the capacity bet.",
      verdict:
        "The decision is not simply expand or wait. It is which paid-demand result would justify taking on space, equipment, and fixed cost.",
      reasons: Object.freeze([
        `You are at: ${stage}.`,
        `You named both market and capacity pressure: ${blocker}.`,
        decision ? `The choice in your words: ${decision}` : "The demand-versus-capacity choice needs a written boundary."
      ]),
      sprint: Object.freeze([
        Object.freeze({
          title: "Write the choice in one line",
          action: "State the two live alternatives: add fixed capacity now, or run a bounded paid-demand test first.",
          output: "One decision with two comparable alternatives."
        }),
        Object.freeze({
          title: "Put a number on the risk",
          action: "Set the most money, time, and weekly obligation you can accept before dependable weekday demand is proven.",
          output: "A cost ceiling and a decision date."
        }),
        Object.freeze({
          title: "Write go, revise, and stop",
          action: "Define go, revise, and stop: the paid-order result that earns a capacity quote, triggers another offer test, or stops expansion.",
          output: "A three-row decision rule you can reuse."
        })
      ]),
      finishLine:
        "Another person can read the demand result and reach the same go, revise, or stop conclusion without guessing.",
      artifactDraft: Object.freeze({
        hypothesis: "The capacity decision should follow a written paid-demand threshold rather than interest or intuition alone.",
        support: decision || "Compare a bounded demand test with an immediate fixed-capacity commitment.",
        "gap-test": constraints ? `Preserve this constraint in every option: ${constraints}` : "Add a cost ceiling and decision date.",
        spec: "The evidence needed to choose between a demand test and a capacity commitment.",
        "budget-date": "Set the maximum acceptable pre-proof spend and the date the decision will be revisited.",
        compare: "Go / revise / stop based on paid orders, delivery capacity, and first-year fixed cost."
      })
    });
  }

  return generalPlan(kind, facts);
}
