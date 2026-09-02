import type { SquibbRecommendationSessionSource } from "@/lib/squibb/recommendations";

export type RecommendationPageState = "empty" | "intake" | "ready";

export type RecommendationPageStateCopy = {
  state: RecommendationPageState;
  eyebrow: string;
  body: string;
  actionLabel: "Tell Werkles About My Goal" | "Update My Answers";
};

type RecommendationPageStateInput = {
  source: Pick<SquibbRecommendationSessionSource, "mode">;
  rankedCount: number;
  hasPublishedSourceDocument: boolean;
};

/** Describes inputs/readout availability, never a saved decision. */
export function getRecommendationPageState({
  source,
  rankedCount,
  hasPublishedSourceDocument
}: RecommendationPageStateInput): RecommendationPageStateCopy {
  const hasPersonalIntake = source.mode === "latest_intake" || source.mode === "browser_intake";

  if (hasPersonalIntake && rankedCount === 0) {
    return {
      state: "intake",
      eyebrow: "Your answers are connected",
      body:
        "Werkles has your answers, but it needs a little more detail before shortening the list. You can still browse every option.",
      actionLabel: "Update My Answers"
    };
  }

  if (rankedCount > 0) {
    return hasPersonalIntake
      ? {
          state: "ready",
          eyebrow: "Ideas Based on Your Answers",
          body: "",
          actionLabel: "Update My Answers"
        }
      : {
          state: "ready",
          eyebrow: hasPublishedSourceDocument ? "Worked example" : "General options",
          body: hasPublishedSourceDocument
            ? "This example shows how Werkles compares possible paths. It is not based on your Intake."
            : "These are general options, not a personal ranking. Complete Intake to put them in a useful order.",
          actionLabel: "Tell Werkles About My Goal"
        };
  }

  return {
    state: "empty",
    eyebrow: "Tell Werkles about your goal first",
    body:
      "Personalized options stay empty until you answer the Werkles questions. All options is the general catalog, not a personal list.",
    actionLabel: "Tell Werkles About My Goal"
  };
}
