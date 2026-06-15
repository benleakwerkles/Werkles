import type { ProposalSource } from "./v1-types";

/** Skybro / Phase 0 frontier queue — lower = sooner on frontier */
const FRONTIER_PRIORITY: Record<ProposalSource, number> = {
  mule_elimination: 10,
  blocked_work: 20,
  human_gate: 30,
  open_mission: 40,
  roadmap: 50
};

export function frontierPriority(sourceType: ProposalSource): number {
  return FRONTIER_PRIORITY[sourceType] ?? 50;
}
