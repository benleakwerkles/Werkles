import type { HumanGate, TransportGap } from "@/protocol/index";

export type GateTier = "green" | "blue" | "red";

export type RedGateCard = {
  tier: "red";
  classification: string;
  why: string;
  consequence: string;
  detail: string | null;
  transportGap: TransportGap | null;
};

export type GateResolution = {
  tier: GateTier;
  redCard: RedGateCard | null;
  gate: HumanGate;
};
