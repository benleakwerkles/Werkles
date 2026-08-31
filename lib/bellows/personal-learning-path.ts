import { buildMemberRecommendationPlan } from "@/lib/squibb/member-recommendation-plan";
import { recommendationSolutionPath } from "@/lib/squibb/recommendation-solution-path";
import type { SquibbRecommendationSession } from "@/lib/squibb/recommendations";

export type PersonalBellowsLearningStep = Readonly<{
  rank: number;
  recommendationTitle: string;
  lesson: Readonly<{
    href: `/bellows/library/${string}`;
    title: string;
    description: string;
  }>;
  workingRead: string;
  exercises: readonly Readonly<{
    title: string;
    action: string;
    output: string;
  }>[];
  finishLine: string;
}>;

export function buildPersonalBellowsLearningPath(
  session: SquibbRecommendationSession
): readonly PersonalBellowsLearningStep[] {
  if (session.source?.mode !== "latest_intake") return Object.freeze([]);
  if (session.source.fedDocument?.kind !== "member_intake") return Object.freeze([]);

  const facts = session.source.fedDocument.excerpts.map((excerpt) => ({
    id: excerpt.id,
    label: excerpt.label,
    text: excerpt.text
  }));
  const seenLessons = new Set<string>();
  const steps: PersonalBellowsLearningStep[] = [];

  for (const recommendation of session.ranked) {
    const lesson = recommendationSolutionPath(recommendation.kind).bellows;
    if (seenLessons.has(lesson.href)) continue;

    const plan = buildMemberRecommendationPlan(recommendation.kind, facts);
    if (!plan.tailored || plan.sprint.length === 0) continue;

    seenLessons.add(lesson.href);
    steps.push(
      Object.freeze({
        rank: steps.length + 1,
        recommendationTitle: recommendation.title,
        lesson: Object.freeze({ ...lesson, title: plan.title }),
        workingRead: plan.verdict,
        exercises: Object.freeze(plan.sprint.slice(0, 3).map((exercise) => Object.freeze({ ...exercise }))),
        finishLine: plan.finishLine
      })
    );

    if (steps.length === 3) break;
  }

  return Object.freeze(steps);
}
