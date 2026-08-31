import type { StarterProfileDraft, StructuredSignals } from "@/lib/matching/types";

function stringList(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? [...value] : null;
}

/** Keep pre-starter-profile shadow runs readable without inventing member facts. */
export function starterProfileForSignals(signals: StructuredSignals): StarterProfileDraft {
  const value = signals.starterProfile as StarterProfileDraft | undefined;
  if (value && value.version === "v1" && value.source === "self_reported_intake") {
    const resources = stringList(value.resources);
    const offers = stringList(value.offers);
    const seeks = stringList(value.seeks);
    const constraints = stringList(value.constraints);
    const missing = stringList(value.missing);
    if (
      typeof value.project === "string" &&
      typeof value.stage === "string" &&
      typeof value.goal === "string" &&
      resources && offers && seeks && constraints && missing
    ) {
      return { ...value, resources, offers, seeks, constraints, missing };
    }
  }

  return {
    version: "v1",
    source: "self_reported_intake",
    project: typeof signals.statedNeed === "string" ? signals.statedNeed : "",
    stage: "",
    goal: "",
    resources: [],
    offers: [],
    seeks: [],
    constraints: [],
    missing: ["business stage", "goal", "resources", "what you can offer another member", "constraints"]
  };
}
