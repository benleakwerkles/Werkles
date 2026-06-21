import type { SoleDashData } from "@/lib/soledash/cockpit-data";

import { buildCommandSurfaceView } from "./build-view";
import { frontierPriority } from "./frontier-priority";
import type {
  ActionReceipt,
  CommandSurfaceView,
  HumanGateItem,
  ProposalCard,
  ProposedBuild
} from "./v1-types";
import { COUSIN_PLATFORM } from "./v1-types";

export type TransportGap = {
  headline: string;
  reason: string;
  manualStep: string | null;
  outboxPath: string | null;
  cousinPlatform: string | null;
  canAutoExecute: boolean;
};

export type FrontierDecision = {
  kind: "proposal" | "human_gate" | "blocker" | "idle";
  card: ProposalCard | null;
  gate: HumanGateItem | null;
  headline: string;
  subline: string;
  queueBehind: number;
  transportGap: TransportGap | null;
};

export type OsInstrumentation = {
  recentDecisions: ActionReceipt[];
  snoozed: ProposedBuild[];
  inProgress: ProposedBuild[];
  blocked: ProposedBuild[];
  queueTitles: string[];
};

export type OsSurfaceView = {
  version: "os-v1";
  machineLabel: string;
  frontier: FrontierDecision;
  base: CommandSurfaceView;
  instrumentation: OsInstrumentation;
  freeformPending: CommandSurfaceView["freeformPending"];
  technical: CommandSurfaceView["technical"];
};

function transportGapForCard(card: ProposalCard): TransportGap | null {
  const { build, executionHint, lastReceipt } = card;
  const isLocal = build.cousin === "MAKER" || build.cousin === "DINK";

  if (lastReceipt?.needsHumanHands && lastReceipt.humanHandsReason) {
    return {
      headline: "SoleDash cannot finish this loop",
      reason: lastReceipt.humanHandsReason,
      manualStep: lastReceipt.writtenTo
        ? `Open ${build.cousin} and send the packet SoleDash wrote. Auto-send is not wired yet.`
        : "Complete the manual step described above.",
      outboxPath: lastReceipt.writtenTo,
      cousinPlatform: build.cousin ? COUSIN_PLATFORM[build.cousin] : null,
      canAutoExecute: false
    };
  }

  if (executionHint.verdict === "TRUE_HUMAN_GATE") {
    return {
      headline: "True human gate — YEA will not auto-execute",
      reason: executionHint.reason ?? "Requires Ben approval per foreman/HUMAN_GATES.md.",
      manualStep: "This is a real gate, not a UI label. Approve only if you intend to pass the gate yourself.",
      outboxPath: null,
      cousinPlatform: null,
      canAutoExecute: false
    };
  }

  if (isLocal && executionHint.autoExecutable) {
    return null;
  }

  return null;
}

function sortProposedForFrontier(cards: ProposalCard[]): ProposalCard[] {
  return [...cards].sort((a, b) => {
    const pa = frontierPriority(a.build.sourceType);
    const pb = frontierPriority(b.build.sourceType);
    if (pa !== pb) return pa - pb;
    const ra = a.build.risk === "high" ? 0 : a.build.risk === "medium" ? 1 : 2;
    const rb = b.build.risk === "high" ? 0 : b.build.risk === "medium" ? 1 : 2;
    if (ra !== rb) return ra - rb;
    return a.build.title.localeCompare(b.build.title);
  });
}

function pickFrontier(
  base: CommandSurfaceView,
  data: SoleDashData
): FrontierDecision {
  const proposed = sortProposedForFrontier(
    base.proposalCards.filter((c) => c.build.status === "proposed")
  );
  const queueBehind = Math.max(0, proposed.length - 1);

  if (proposed[0]) {
    const card = proposed[0];
    return {
      kind: "proposal",
      card,
      gate: null,
      headline: card.build.title,
      subline: card.build.summary,
      queueBehind,
      transportGap: transportGapForCard(card)
    };
  }

  if (base.humanGates[0]) {
    const gate = base.humanGates[0];
    return {
      kind: "human_gate",
      card: null,
      gate,
      headline: gate.title,
      subline: gate.detail,
      queueBehind: 0,
      transportGap: {
        headline: "Human gate — SoleDash cannot approve for you",
        reason: gate.detail,
        manualStep: "This decision requires your hands in the real world (OAuth, billing, deploy, etc.).",
        outboxPath: null,
        cousinPlatform: null,
        canAutoExecute: false
      }
    };
  }

  const blocker = base.needsYouNow.find((n) => n.kind === "blocker");
  if (blocker) {
    return {
      kind: "blocker",
      card: null,
      gate: null,
      headline: blocker.title,
      subline: blocker.detail,
      queueBehind: 0,
      transportGap: {
        headline: "Blocked — machine needs your read",
        reason: blocker.detail,
        manualStep: "Resolve blocker in cockpit files or freeform below.",
        outboxPath: null,
        cousinPlatform: null,
        canAutoExecute: false
      }
    };
  }

  const postureOk = data.posture.color === "green";
  return {
    kind: "idle",
    card: null,
    gate: null,
    headline: postureOk ? "Caught up" : data.posture.label,
    subline: postureOk
      ? "Nothing needs your decision right now. The machine is updating itself."
      : data.posture.explanation,
    queueBehind: 0,
    transportGap: null
  };
}

export function buildOsSurfaceView(data: SoleDashData): OsSurfaceView {
  const base = buildCommandSurfaceView(data);
  const proposed = sortProposedForFrontier(
    base.proposalCards.filter((c) => c.build.status === "proposed")
  );
  const queueTitles = proposed.slice(1, 4).map((c) => c.build.title);

  return {
    version: "os-v1",
    machineLabel: base.machineLabel,
    frontier: pickFrontier(base, data),
    base,
    instrumentation: {
      recentDecisions: base.recentReceipts.slice(0, 12),
      snoozed: base.deferredBuilds,
      inProgress: base.finishedReady,
      blocked: base.blocked,
      queueTitles
    },
    freeformPending: base.freeformPending,
    technical: base.technical
  };
}
