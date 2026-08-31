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
  if (source.mode === "latest_intake" && rankedCount === 0) {
    return {
      state: "intake",
      eyebrow: "Your answers are connected",
      body:
        "Werkles has your answers, but it needs a little more detail before shortening the list. You can still browse every option.",
      actionLabel: "Update My Answers"
    };
  }

  if (rankedCount > 0) {
    return source.mode === "latest_intake"
      ? {
          state: "ready",
          eyebrow: "Ideas Based on Your Answers",
          body: "",
          actionLabel: "Update My Answers"
        }
      : {
          state: "ready",
          eyebrow: hasPublishedSourceDocument ? "Published catalog readout" : "Catalog readout",
          body: hasPublishedSourceDocument
            ? "These ratings use the published source document on this page, not a personal intake. Choosing an option changes only the readout below."
            : "These options are a general catalog, not personal recommendations. Choosing one changes only the readout below.",
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
