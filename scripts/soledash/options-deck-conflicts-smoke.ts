/**
 * Smoke test — options deck card model (intent proposals only).
 * Run: npm run test:options-deck
 */
import { buildCompanyOptions } from "../../lib/soledash/options-deck/build-options";
import { salvoAllowed, selectionConflicts } from "../../lib/soledash/options-deck/conflicts";
import type { FrontierQueueItem, Proposal } from "../../protocol/index";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`ok: ${message}`);
}

const proposal: Proposal = {
  id: "prop_workstation_uniform",
  action_code: "P0-A001",
  title: "Workstation Uniformization",
  summary: "Standardize Betsy workstation layout.",
  queue_behind: 2,
  evidence_status: "OBSERVED"
};

const queue: FrontierQueueItem[] = [
  {
    rank: 1,
    final_rank: 1,
    proposal_id: "prop_workstation_uniform",
    action_code: "P0-A001",
    title: "Workstation Uniformization",
    evidence_status: "OBSERVED",
    weight: 0.78,
    score: 0.78,
    owner: "Maker @ Betsy",
    rank_source: "OPERATOR",
    weight_label: "frontier"
  },
  {
    rank: 2,
    final_rank: 2,
    proposal_id: "prop_doss_stability",
    action_code: "P0-A002",
    title: "Doss Stability Investigation",
    evidence_status: "HYPOTHESIS",
    weight: 0.92,
    score: 0.92,
    owner: "Dink / Doss",
    rank_source: "MACHINE",
    weight_label: "alternative"
  }
];

const routeButtons = [
  { id: "needs_research", label: "NEEDS RESEARCH", enabled: true, route_owner: "Thufir", reason_disabled: null },
  { id: "kill_test", label: "KILL TEST", enabled: true, route_owner: "Bean", reason_disabled: null },
  { id: "human_reality", label: "HUMAN REALITY", enabled: true, route_owner: "Ender", reason_disabled: null }
];

const options = buildCompanyOptions({
  queue,
  proposal,
  routeButtons,
  unavailable: false,
  rationale: null,
  machineFrontierTitle: "Doss Stability Investigation"
});

assert(options.every((o) => o.cardType === "intent_proposal"), "all deck cards are intent proposals");
assert(!options.some((o) => o.id.includes("nay") || o.title.toLowerCase().includes("nay ·")), "no NAY cards in deck");
assert(!options.some((o) => o.id.startsWith("play:") || o.id.startsWith("route:")), "no fake decision or route cards");

const activeQueue = options.find((o) => o.id === "proposal:prop_workstation_uniform")!;
assert(activeQueue.verbs.includes("nay"), "reject verb on active proposal, not a card");
assert(activeQueue.verbs.includes("needs_research"), "needs research verb on active proposal");

const dossQueue = options.find((o) => o.id === "proposal:prop_doss_stability")!;
const wsVsResearch = selectionConflicts([activeQueue, dossQueue], options);
assert(wsVsResearch.length === 0 || wsVsResearch[0].kind === "frontier", "two queued proposals — frontier deferral only");

const salvoDispatch = salvoAllowed([activeQueue, dossQueue], options, "dispatch");
assert(salvoDispatch.allowed === true, "dispatch salvo on two proposals with different primary Aeyes allowed");

console.log(`\nDeck size: ${options.length} intent proposals (expected ${queue.length})`);
console.log("\nAll options-deck card model smoke checks passed.");
