import type { RecommendationKind } from "@/lib/squibb/recommendations";

export type RecommendationGuidance = Readonly<{
  headline: string;
  summary: string;
  nextSteps: readonly [string, string, string];
}>;

const GUIDANCE: Record<RecommendationKind, RecommendationGuidance> = {
  translate_need: {
    headline: "Turn the idea into one decision you can test this week.",
    summary: "Separate the goal from the next decision so you can test one thing instead of solving the whole business at once.",
    nextSteps: [
      "Write the next decision as a question with two or three real choices.",
      "Name the one fact that would make the choice easier.",
      "Run the smallest test that can produce that fact this week."
    ]
  },
  verify_proof: {
    headline: "Build an evidence brief someone can actually inspect.",
    summary: "Separate the business hypothesis, current support, and biggest unanswered question before asking anyone to rely on it.",
    nextSteps: [
      "Write the exact claim someone must believe, including any amount, date, or promised result.",
      "Attach one current quote, receipt, customer result, or other fact that supports it.",
      "Run a small test to close the biggest remaining hole."
    ]
  },
  stage_intro_candidate: {
    headline: "Describe the exact help you need before looking at names.",
    summary: "A useful introduction starts with a specific job, a useful give-back, and a reason to talk now.",
    nextSteps: [
      "Write what the person would do in the first two weeks.",
      "Name what you can offer them in return.",
      "List the facts both sides should check before an introduction."
    ]
  },
  find_partner: {
    headline: "Test the working relationship before discussing ownership.",
    summary: "Define the work and decision rights first; partnership terms come after you learn whether you work well together.",
    nextSteps: [
      "Write the partner's week-one work and the decisions they would own.",
      "Choose a small paid or time-boxed project to do together first.",
      "Discuss money, control, exit, and disagreement rules before offering equity."
    ]
  },
  find_equipment: {
    headline: "Price the exact tool three ways before spending.",
    summary: "Compare the equipment against the job it must do, the budget, and the date you need it.",
    nextSteps: [
      "List the must-have specifications, maximum budget, and date needed.",
      "Compare buy, used, lease, and rental quotes where they apply.",
      "Check seller, condition, warranty, delivery, and installation before paying."
    ]
  },
  find_banker: {
    headline: "Prepare one clear money question before calling a banker.",
    summary: "A focused request and a short document list make the conversation useful faster.",
    nextSteps: [
      "Write the amount or banking problem, its use, and the date it matters.",
      "Gather the recent records that support the request.",
      "Compare fees, minimums, timing, and who actually makes the decision."
    ]
  },
  find_credit_union: {
    headline: "Compare eligibility and total cost before applying.",
    summary: "Shortlist credit unions that actually serve your location and business need, then ask the same questions of each.",
    nextSteps: [
      "Write the amount, use, down payment, and collateral you could offer.",
      "Shortlist three credit unions that explicitly handle this kind of business request.",
      "Ask each about membership, documents, guarantees, fees, rate, and decision time before applying."
    ]
  },
  find_better_job: {
    headline: "Write what a better job must improve before searching.",
    summary: "Use your business goal and constraints to define a job that helps rather than merely changes employers.",
    nextSteps: [
      "Set minimum pay, schedule, location, benefits, and skill-growth needs.",
      "Choose roles that support those needs and do not block your larger goal.",
      "Compare real openings against the list before investing time in applications."
    ]
  },
  stay_current_job: {
    headline: "Protect income while you run a time-boxed business test.",
    summary: "Keeping the current job can buy time, but only if the side experiment has a clear end date and success measure.",
    nextSteps: [
      "Choose one business test you can run without risking current income.",
      "Set the hours, budget, and end date before starting.",
      "Decide now what result would justify changing the plan."
    ]
  },
  relocate: {
    headline: "Compare places against real costs and non-negotiables.",
    summary: "A move should solve a named business problem without quietly breaking something more important.",
    nextSteps: [
      "Write the exact problem a move is supposed to solve.",
      "Compare three places on customers, costs, rules, travel, and your non-negotiables.",
      "Test the strongest location with calls, visits, or a short pilot before committing."
    ]
  },
  get_training: {
    headline: "Choose the smallest lesson that unlocks a real task.",
    summary: "Start with the work you need to perform, then buy only the training that closes that gap.",
    nextSteps: [
      "Name the exact task or credential you cannot complete today.",
      "Compare the shortest credible ways to learn or prove it.",
      "Use the skill on a real small project before buying a larger program."
    ]
  },
  raise_capital: {
    headline: "Size the ask around one milestone, not vague growth.",
    summary: "Connect the money to a specific use, date, and result before choosing debt, revenue financing, or equity.",
    nextSteps: [
      "Write the amount, exact use, and milestone the money should reach.",
      "List the traction and records that show why the milestone is plausible.",
      "Compare debt, revenue-based funding, and equity by total cost, control, and risk."
    ]
  }
};

export function recommendationGuidance(kind: RecommendationKind): RecommendationGuidance {
  return GUIDANCE[kind];
}
