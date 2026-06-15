import fs from "node:fs";
import path from "node:path";

import { classifyApprovalAction } from "./approval-classifier";
import {
  appendDecision,
  readCommandState,
  slugify,
  timestampSlug,
  upsertBuild,
  writeCommandState
} from "./command-state";
import { buildMachineCapsule } from "./machine-capsule";
import { buildMissionPacket, classifyMission } from "./mission-router";
import { ensureProposalInState } from "./proposal-engine";
import type { CousinId, MissionClassification } from "./types";
import type {
  DispatchResult,
  FreeformPending,
  FreeformProposeResult,
  ProposedBuild
} from "./v1-types";
import { COUSIN_OUTBOX_PREFIX as PREFIX, COUSIN_PLATFORM } from "./v1-types";

const ROOT = process.cwd();
const OUTBOX_DIR = path.join(ROOT, "foreman", "handoffs", "outbox");

function cousinLabel(cousin: CousinId): string {
  const labels: Record<CousinId, string> = {
    MAKER: "Cursor / Maker",
    DINK: "Dink (local hands)",
    PETRA: "Petra (Comptroller)",
    ENDER: "Ender (Claude)",
    SKYBRO: "Skybro (Gemini)",
    BEAN: "Bean (DeepSeek)",
    COMPUTER: "Computer (Perplexity)"
  };
  return labels[cousin];
}

function buildOutboxDocument(input: {
  cousin: CousinId;
  title: string;
  missionText: string;
  missionClass: string | null;
  machine: string;
  capsuleBlock: string;
  decisionNote?: string;
}): string {
  const now = new Date().toISOString();
  return `# To ${cousinLabel(input.cousin)}: ${input.title}

## SoleDash dispatch · v1

| Field | Value |
|-------|-------|
| Dispatched | ${now} |
| Cousin | ${input.cousin} @ ${input.machine} |
| Mission class | ${input.missionClass ?? "UNCLASSIFIED"} |
| Transport | SoleDash wrote this file — no Operator copy/paste |

${input.decisionNote ? `**Operator note:** ${input.decisionNote}\n` : ""}

## Mission

${input.missionText.trim()}

## Machine state (auto-attached)

${input.capsuleBlock.trim()}

## Hard stops

- No git push / merge without Operator approval
- No production deploy, SQL apply, or live billing
- No secrets in chat or commits
- Authority: \`foreman/HUMAN_GATES.md\` → \`foreman/LANES.md\` → \`foreman/BUDGET.md\` → \`foreman/NEXT_ACTION.md\`

## Cousin response

Reply to \`foreman/handoffs/inbox/\` with RECEIVED line when complete.
`;
}

function writeOutboxFile(cousin: CousinId, title: string, body: string): { path: string; filename: string } {
  const prefix = PREFIX[cousin];
  const slug = slugify(title);
  const filename = `${prefix}_SOLEDASH_${slug}_${timestampSlug()}.md`;
  fs.mkdirSync(OUTBOX_DIR, { recursive: true });
  const abs = path.join(OUTBOX_DIR, filename);
  fs.writeFileSync(abs, body, "utf8");
  return { path: `foreman/handoffs/outbox/${filename}`, filename };
}

function pickPrimaryCousin(classification: MissionClassification): CousinId {
  return classification.suggestedCousins[0]?.id ?? "MAKER";
}

function degradedSendFor(cousin: CousinId, outboxPath: string) {
  const platform = COUSIN_PLATFORM[cousin];
  const isLocal = cousin === "MAKER" || cousin === "DINK";
  return {
    required: true as const,
    label: isLocal ? "Open outbox packet (local pickup)" : "Open cousin surface (manual send — degraded)",
    detail: isLocal
      ? "Packet is on disk. Maker/Dink picks up from outbox — no paste required."
      : "Auto-send to external chat is not available yet. SoleDash wrote the packet; one manual open remains.",
    outboxPath,
    cousinPlatform: platform
  };
}

export async function dispatchBuild(input: {
  buildId?: string;
  missionText?: string;
  title?: string;
  cousin?: CousinId;
  decisionNote?: string;
  fromFreeform?: boolean;
}): Promise<DispatchResult> {
  let state = readCommandState();
  let build: ProposedBuild | null = null;
  let missionText = input.missionText?.trim() ?? "";
  let title = input.title?.trim() ?? "";
  let cousin = input.cousin;

  if (input.fromFreeform && state.freeformPending) {
    missionText = state.freeformPending.text;
    title = missionText.split("\n")[0]?.slice(0, 80) ?? "Freeform mission";
    cousin = state.freeformPending.cousin;
  } else if (input.buildId) {
    build = ensureProposalInState(input.buildId) ?? state.builds.find((b) => b.id === input.buildId) ?? null;
    if (!build) {
      return { ok: false, build: null, message: "Proposal not found.", blocker: null, degradedSend: null };
    }
    state = readCommandState();
    missionText = input.missionText?.trim() || build.missionText;
    title = build.title;
    cousin = cousin ?? build.cousin;
  }

  if (!missionText) {
    return { ok: false, build: null, message: "No mission text.", blocker: null, degradedSend: null };
  }

  const gate = classifyApprovalAction(missionText);
  if (gate.verdict === "BLOCKED") {
    return {
      ok: false,
      build,
      message: gate.operatorLine,
      blocker: gate.reasons.join(" "),
      degradedSend: null
    };
  }

  if (gate.verdict === "TRUE_HUMAN_GATE" && !input.fromFreeform && build?.sourceType !== "human_gate") {
    return {
      ok: false,
      build,
      message: "STOP: HUMAN GATE — escalate or defer instead of dispatch.",
      blocker: gate.operatorLine,
      degradedSend: null
    };
  }

  const classification = classifyMission(missionText);
  cousin = cousin ?? pickPrimaryCousin(classification);
  const primary = classification.suggestedCousins.find((c) => c.id === cousin) ?? classification.suggestedCousins[0];
  const machine = primary?.machine ?? "Betsy (primary forge)";

  const capsule = await buildMachineCapsule();
  const packet = buildMissionPacket({
    rawMission: missionText,
    classification,
    capsuleSnippet: capsule.handoffBlock
  });

  const doc = buildOutboxDocument({
    cousin,
    title: title || packet.missionLabel || "Operator mission",
    missionText,
    missionClass: classification.missionClass,
    machine,
    capsuleBlock: capsule.handoffBlock,
    decisionNote: input.decisionNote
  });

  const { path: outboxPath, filename } = writeOutboxFile(
    cousin,
    title || packet.missionLabel || "MISSION",
    doc
  );

  const now = new Date().toISOString();
  const dispatched: ProposedBuild = {
    id: build?.id ?? `build_${Date.now()}`,
    title: title || packet.missionLabel || missionText.slice(0, 72),
    question: "Do you want to build this?",
    summary: classification.label ?? missionText.slice(0, 140),
    whyNow: build?.whyNow ?? classification.label ?? "Operator approved dispatch.",
    expectedImpact: build?.expectedImpact ?? "Approved work moves forward within gates.",
    timeToComplete: build?.timeToComplete ?? "TBD",
    owner: build?.owner ?? cousinLabel(cousin).replace("Cursor / Maker", "Maker (Cursor)"),
    risk: build?.risk ?? "low",
    sourceType: build?.sourceType ?? "open_mission",
    moreInfo: build?.moreInfo ?? missionText,
    missionText,
    cousin,
    machine,
    missionClass: classification.missionClass,
    missionLabel: classification.label,
    source: input.fromFreeform ? "freeform" : (build?.source ?? "operator"),
    status: cousin === "MAKER" || cousin === "DINK" ? "ready" : "dispatched",
    outboxPath,
    outboxFilename: filename,
    blocker: null,
    updatedAt: now
  };

  state = upsertBuild(state, dispatched);
  if (input.fromFreeform) state = { ...state, freeformPending: null };
  writeCommandState(state);

  appendDecision({
    buildId: dispatched.id,
    decision: "yea",
    note: input.decisionNote ?? null,
    outboxPath
  });

  const degradedSend = degradedSendFor(cousin, outboxPath);
  const message =
    cousin === "MAKER" || cousin === "DINK"
      ? `Ready — ${cousin} @ ${machine}. Packet: ${filename}`
      : `Dispatched — packet written for ${cousin}. Manual open required (degraded mode).`;

  return { ok: true, build: dispatched, message, blocker: null, degradedSend };
}

export async function proposeFreeform(text: string): Promise<FreeformProposeResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, pending: null, approvalGate: null, blocker: "Empty command.", message: "Tell the MaSheen what you want." };
  }

  const gate = classifyApprovalAction(trimmed);
  if (gate.verdict === "BLOCKED") {
    return {
      ok: false,
      pending: null,
      approvalGate: gate.verdict,
      blocker: gate.operatorLine,
      message: gate.reasons[0] ?? "Blocked."
    };
  }

  const classification = classifyMission(trimmed);
  const cousin = pickPrimaryCousin(classification);
  const primary = classification.suggestedCousins.find((c) => c.id === cousin) ?? classification.suggestedCousins[0];

  const pending: FreeformPending = {
    text: trimmed,
    classification,
    cousin,
    machine: primary?.machine ?? "Betsy",
    summary: `${classification.label ?? "Unclassified"} → ${cousin} @ ${primary?.machine ?? "Betsy"}`,
    proposedAt: new Date().toISOString()
  };

  const state = readCommandState();
  writeCommandState({ ...state, freeformPending: pending });

  return {
    ok: true,
    pending,
    approvalGate: gate.verdict,
    blocker: gate.verdict === "TRUE_HUMAN_GATE" ? gate.operatorLine : null,
    message:
      gate.verdict === "TRUE_HUMAN_GATE"
        ? "Human gate detected — review before dispatch."
        : `Route: ${cousin} @ ${pending.machine}. One click to dispatch.`
  };
}

export function createProposedBuild(input: {
  id: string;
  title: string;
  summary: string;
  missionText: string;
  cousin: CousinId;
  machine: string;
  missionClass?: string | null;
  missionLabel?: string | null;
  source: ProposedBuild["source"];
  whyNow?: string;
  expectedImpact?: string;
  timeToComplete?: string;
  owner?: string;
  risk?: ProposedBuild["risk"];
  sourceType?: ProposedBuild["sourceType"];
  moreInfo?: string;
}): ProposedBuild {
  return {
    id: input.id,
    title: input.title,
    question: "Do you want to build this?",
    summary: input.summary,
    whyNow: input.whyNow ?? input.summary,
    expectedImpact: input.expectedImpact ?? "Moves approved lane forward.",
    timeToComplete: input.timeToComplete ?? "TBD",
    owner: input.owner ?? "Maker (Cursor)",
    risk: input.risk ?? "low",
    sourceType: input.sourceType ?? "open_mission",
    moreInfo: input.moreInfo ?? input.missionText,
    missionText: input.missionText,
    cousin: input.cousin,
    machine: input.machine,
    missionClass: input.missionClass ?? null,
    missionLabel: input.missionLabel ?? null,
    source: input.source,
    status: "proposed",
    outboxPath: null,
    outboxFilename: null,
    blocker: null,
    updatedAt: new Date().toISOString()
  };
}
