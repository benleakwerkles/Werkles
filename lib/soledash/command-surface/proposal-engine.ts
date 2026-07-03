import type { SoleDashData } from "@/lib/soledash/cockpit-data";

import {
  findBuild,
  readCommandState,
  upsertBuild,
  writeCommandState
} from "./command-state";
import { findProposalById, loadProposalCatalogV1 } from "./proposal-seeds-v1";
import type { CommandState, ProposedBuild, ProposalCard } from "./v1-types";
import {
  executionHintFor,
  getLatestReceiptForBuild,
  resolveButtonState,
  synthesizeReceiptFromBuild
} from "./action-receipts";

export function resolveProposal(buildId: string, _data?: SoleDashData): ProposedBuild | null {
  const state = readCommandState();
  const fromState = state.builds.find((b) => b.id === buildId);
  if (fromState) return { ...fromState };

  const fromCatalog = findProposalById(buildId);
  return fromCatalog ? { ...fromCatalog } : null;
}

export function ensureProposalInState(buildId: string, data?: SoleDashData): ProposedBuild | null {
  const proposal = resolveProposal(buildId, data);
  if (!proposal) return null;

  let state = readCommandState();
  const existing = findBuild(state, buildId);
  if (existing) return existing;

  state = upsertBuild(state, proposal);
  writeCommandState(state);
  return proposal;
}

export function generateProposals(_data: SoleDashData): ProposedBuild[] {
  return loadProposalCatalogV1();
}

export function mergeProposalsWithState(proposals: ProposedBuild[], state: CommandState): ProposalCard[] {
  return proposals.map((p) => {
    const existing = state.builds.find((b) => b.id === p.id);
    const build = existing
      ? { ...existing, timeToComplete: existing.timeToComplete ?? p.timeToComplete ?? "TBD" }
      : { ...p };
    const lastReceipt = getLatestReceiptForBuild(p.id) ?? synthesizeReceiptFromBuild(build);
    const buttonState = resolveButtonState(build, lastReceipt);
    return {
      build,
      buttonState,
      lastReceipt,
      executionHint: executionHintFor(build.missionText)
    };
  });
}

export function listDeferredProposals(state: CommandState): ProposedBuild[] {
  return state.builds.filter((b) => b.status === "deferred");
}

export const DECISION_LOG_PATH = "foreman/soledash/DECISION_LOG.jsonl";
