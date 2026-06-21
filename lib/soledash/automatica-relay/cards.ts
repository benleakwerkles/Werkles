import type { RelayCardDef } from "./types";

export const RELAY_CARDS: RelayCardDef[] = [
  {
    id: "spanzee_remote_check",
    name: "SPANZEE REMOTE CHECK",
    targetAgent: "Spanzee node agent",
    targetComputer: "Spanzee",
    taskType: "remote_health_check",
    expectedReceipt: "Spanzee reachability + fleet slot sync receipt",
    routeKind: "spanzee_remote",
    cousin: null,
    missionText:
      "Automatica relay — probe Spanzee node reachability and return fleet health receipt. No simulation.",
    nextActionReady: "FIRE remote check when Spanzee route is wired"
  },
  {
    id: "ui_cleanup_across_screens",
    name: "UI CLEANUP ACROSS SCREENS",
    targetAgent: "Maker",
    targetComputer: "Betsy",
    taskType: "ui_cleanup",
    expectedReceipt: "Maker outbox packet + SoleDash receipt link",
    routeKind: "cousin_outbox",
    cousin: "MAKER",
    missionText:
      "Automatica relay — UI cleanup pass across SoleDash / Starship Explode screens. List diffs only; no deploy.",
    nextActionReady: "FIRE to write Maker outbox packet"
  },
  {
    id: "kindsir_com_cleanup",
    name: "KINDSIR.COM CLEANUP",
    targetAgent: "Ender",
    targetComputer: "Betsy (Edge)",
    taskType: "site_cleanup_audit",
    expectedReceipt: "Ender outbox packet + audit receipt path",
    routeKind: "cousin_outbox",
    cousin: "ENDER",
    missionText:
      "Automatica relay — KindSir.com cleanup audit. PASS / PATCH / NO-GO with cited trust patterns. Display-only.",
    nextActionReady: "FIRE to write Ender outbox packet"
  },
  {
    id: "kind_sir_sue_research",
    name: "KIND SIR SUE RESEARCH",
    targetAgent: "Petra",
    targetComputer: "Betsy",
    taskType: "research_verdict",
    expectedReceipt: "Petra outbox packet + comptroller receipt",
    routeKind: "cousin_outbox",
    cousin: "PETRA",
    missionText:
      "Automatica relay — Kind Sir SUE research verdict. Top risks, stop lines, GO / CONDITIONAL / NO-GO. No field commit.",
    nextActionReady: "FIRE to write Petra outbox packet"
  },
  {
    id: "kind_sir_grading_research",
    name: "KIND SIR GRADING RESEARCH",
    targetAgent: "Petra",
    targetComputer: "Betsy",
    taskType: "grading_research",
    expectedReceipt: "Petra grading scope receipt + routing note",
    routeKind: "cousin_outbox",
    cousin: "PETRA",
    missionText:
      "Automatica relay — Kind Sir grading research scope. Separate grading lane from SUE; explicit UNKNOWN handling.",
    nextActionReady: "FIRE to write Petra outbox packet"
  }
];

export function cardById(id: string): RelayCardDef | undefined {
  return RELAY_CARDS.find((c) => c.id === id);
}
