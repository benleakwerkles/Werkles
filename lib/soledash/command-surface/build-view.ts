import type { SoleDashData } from "@/lib/soledash/cockpit-data";



import { readActionReceipts } from "./action-receipts";

import { readCommandState } from "./command-state";

import {

  generateProposals,

  listDeferredProposals,

  mergeProposalsWithState

} from "./proposal-engine";

import type { CommandSurfaceView, HumanGateItem, NeedsYouItem } from "./v1-types";



function buildHumanGates(data: SoleDashData): HumanGateItem[] {

  const gates: HumanGateItem[] = [];

  const seen = new Set<string>();



  for (const g of data.workItems.filter((w) => w.lane === "act" && w.ownership === "waiting_on_ben")) {

    const key = g.title.slice(0, 60);

    if (seen.has(key)) continue;

    seen.add(key);

    gates.push({

      id: g.id,

      title: g.title,

      detail: g.detail,

      severity: /push|merge|deploy|Petra|OAuth|billing|secret|SQL|live/i.test(g.title) ? "blocker" : "warning"

    });

  }



  return gates.slice(0, 8);

}



function buildNeedsYou(data: SoleDashData, actionableCount: number): NeedsYouItem[] {

  const items: NeedsYouItem[] = [];



  if (actionableCount > 0) {

    items.push({

      kind: "decision",

      title: `${actionableCount} proposal${actionableCount === 1 ? "" : "s"} awaiting decision`,

      detail: "YEA / NAY / DEFER — transport details only on MORE INFO.",

      buildId: null

    });

  }



  if (data.posture.color === "red") {

    items.push({

      kind: "blocker",

      title: data.posture.label,

      detail: data.posture.explanation,

      buildId: null

    });

  }



  return items.slice(0, 3);

}



export function buildCommandSurfaceView(data: SoleDashData): CommandSurfaceView {

  const state = readCommandState();

  const generated = generateProposals(data);

  const proposalCards = mergeProposalsWithState(generated, state);

  const actionableCount = proposalCards.filter((c) => c.build.status === "proposed").length;

  const deferredBuilds = listDeferredProposals(state);

  const finishedReady = state.builds.filter((b) => b.status === "ready" || b.status === "dispatched");

  const blocked = state.builds.filter((b) => b.status === "blocked" || b.status === "escalated");

  const recentReceipts = readActionReceipts(20);



  return {

    version: "v1",

    machineLabel: data.machineCard.werklesName,

    needsYouNow: buildNeedsYou(data, actionableCount),

    proposalCards,

    proposedBuilds: proposalCards.map((c) => c.build),

    deferredBuilds,

    recentReceipts,

    humanGates: buildHumanGates(data),

    freeformPending: state.freeformPending,

    finishedReady,

    blocked,

    technical: {

      branch: data.machineCard.branch,

      commit: data.machineCard.commit.slice(0, 12),

      workingTree: data.machineCard.workingTree,

      localhostOk: data.machineCard.localhostOk

    }

  };

}

