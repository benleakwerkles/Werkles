/** SoleDash Leverage Mission Card v0 — display-only strategic frame. Not the matching engine. */

export type StrategicFrameBullet = {
  id: string;
  text: string;
};

export type LeverageMissionCard = {
  version: "v0";
  title: "Current Strategic Frame";
  subtitle: "Leverage Matching direction";
  bullets: StrategicFrameBullet[];
};

export const LEVERAGE_MISSION_CARD: LeverageMissionCard = {
  version: "v0",
  title: "Current Strategic Frame",
  subtitle: "Leverage Matching direction",
  bullets: [
    { id: "diagnosis-first", text: "Werkles = leverage diagnosis before matching" },
    { id: "speaker-bottleneck", text: "Speaker diagnoses the bottleneck" },
    {
      id: "squibb-recommend",
      text: "Squibb recommends with evidence, confidence, and gates"
    },
    {
      id: "retrieve-after-class",
      text: "Matching retrieves options only after need class is established"
    },
    {
      id: "human-gates",
      text: "Human Gates protect irreversible decisions"
    }
  ]
};
