export type ProfileCardState = "undeclared" | "lane-chosen" | "in-formation" | "formed";

export type LaneId = "spark" | "operator" | "backer" | "connector" | "builder" | "worker";

export type LaneDefinition = {
  id: LaneId;
  title: string;
  definition: string;
  attributes: [string, string, string];
  /** Iron Palette CSS variable for lane accent — token values unchanged */
  accentVar: string;
};

export type ProfileCardModel = {
  state: ProfileCardState;
  name: string;
  location?: string;
  currentTitle?: string;
  lane?: LaneId;
  roleLabel?: string;
  formationStatus: string;
  skills?: string[];
  availability?: string;
  projectState?: string;
  werkileLabel?: string;
  formedOn?: string;
};

export type FormationPhase = "solo" | "partial" | "formed";
