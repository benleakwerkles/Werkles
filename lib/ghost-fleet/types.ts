export type GhostLane =
  | "Worker"
  | "Operator"
  | "Builder"
  | "Connector"
  | "Backer"
  | "Unsure";

export type GhostHandeyeSeat =
  | "LadyJessica"
  | "Ender"
  | "Bean"
  | "Heimerdinker"
  | "Petra"
  | "Skybro"
  | "Computer"
  | "ImageSniper";

/** Binary, purpose-limited eligibility for a capital conversation. It is not
 * a rank, wealth band, score, badge, or statement of judgment. */
export type GhostCapitalPosture = "can_back" | "not_qualified";

export type GhostMember = {
  id: string;
  /** Always true — synthetic test member, never a real human claim. */
  synthetic: true;
  displayName: string;
  city: string;
  region: string;
  lane: GhostLane;
  roleLabel: string;
  skills: string[];
  /** What this member can carry for someone else. Drives complementarity. */
  offers: string[];
  /** What this member still needs. Drives reciprocity. */
  seeks: string[];
  capitalPosture: GhostCapitalPosture;
  openToPartner: boolean;
  statedNeed: string;
  alreadyTried: string;
  timeCost: string;
  stuckDecision: string;
  successTwelveMonths: string;
  proofGaps: string[];
  workshopHeadline: string;
  workshopRows: string[];
  introEligibility: "open" | "review_required" | "blocked";
  handeyeSeat: GhostHandeyeSeat;
  /** Placeholder until face batch phrase unlocks Aeye portraits. */
  faceAsset: string;
  faceStatus: "placeholder" | "aeye_pending" | "ready";
};

export type GhostFleetFile = {
  version: "v2";
  synthetic: true;
  label: string;
  disclosure: string;
  generatedAt: string;
  targetCount: number;
  members: GhostMember[];
};

export type GhostMatchReason = {
  label: string;
  detail: string;
  points: number;
};

export type GhostMatchCandidate = {
  ghostId: string;
  displayName: string;
  lane: GhostLane;
  city: string;
  region: string;
  score: number;
  /** Ranked position among eligible candidates, 1-based. */
  rank: number;
  /** Plain-language explanation of score order versus useful-variety selection. */
  orderReason: string;
  reasons: GhostMatchReason[];
  blockers: string[];
  eligibility: "open" | "review_required";
  faceAsset: string;
  faceStatus: GhostMember["faceStatus"];
  synthetic: true;
  proximity: Readonly<{
    band: import("@/lib/ghost-fleet/proximity").GhostProximityBand;
    label: string;
  }>;
};

export type GhostMatchResult = {
  intakeId: string | null;
  statedNeed: string | null;
  scored: number;
  excludedBlocked: number;
  candidates: GhostMatchCandidate[];
};

export type GhostWorkshopSnapshot = {
  ghostId: string;
  displayName: string;
  headline: string;
  rows: string[];
  lane: GhostLane;
  synthetic: true;
};
