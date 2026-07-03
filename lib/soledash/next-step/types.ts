export type NextStepOwner = "MAKER" | "DINK" | "PETRA" | "ENDER" | "BEAN" | "BEN";

export type NextStepOverride = {
  owner: NextStepOwner;
  machine: string;
  note: string | null;
  updated_at: string;
  updated_by: "operator";
};
