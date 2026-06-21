import fs from "node:fs";
import path from "node:path";

import { dispatchBuild } from "@/lib/soledash/command-surface/dispatch";
import type { CousinId } from "@/lib/soledash/command-surface/types";
import { loadAeyeResources } from "@/lib/soledash/dispatch-matrix/aeye-availability";
import type { AeyeId, AeyeResourceView } from "@/lib/soledash/dispatch-matrix/types";
import type {
  IntentAvailabilitySnapshot,
  IntentMachineCandidate,
  IntentRouteAction,
  IntentRouteCategory,
  IntentRouteState,
  IntentRouterProposal,
  IntentRouterReceipt,
  IntentRouterView
} from "./types";

const ROOT = process.cwd();
const ROUTER_DIR = path.join(ROOT, "foreman", "soledash", "intent-router");
const PROPOSALS_DIR = path.join(ROUTER_DIR, "proposals");
const RECEIPTS_DIR = path.join(ROUTER_DIR, "receipts");
const FLEET_STATE_PATH = path.join(ROOT, "foreman", "soledash", "FLEET_STATE.json");
const LOCALHOST_STATUS_PATH = path.join(ROOT, "foreman", "soledash", "LAST_LOCALHOST_STATUS.json");

type FleetState = {
  machines?: Array<{
    id?: string;
    display_name?: string;
    hostname?: string;
    status?: string;
    evidence_status?: string;
    active_cousins?: string;
    current_task?: string | null;
    blocker?: string | null;
  }>;
};

type LocalhostStatus = {
  lastSuccess?: {
    ok?: boolean;
    port?: string;
    url?: string;
    checkedAt?: string;
  };
};

const AEYE_LABELS: Record<AeyeId, string> = {
  DINK: "Dink",
  MAKER: "Maker",
  ENDER: "Ender",
  BEAN: "Bean",
  SKYBRO: "Skybro",
  THUFIR: "Thufir",
  PETRA: "Petra"
};

const AEYE_TO_COUSIN: Record<AeyeId, CousinId> = {
  DINK: "DINK",
  MAKER: "MAKER",
  ENDER: "ENDER",
  BEAN: "BEAN",
  SKYBRO: "SKYBRO",
  THUFIR: "COMPUTER",
  PETRA: "PETRA"
};

function ensureDirs(): void {
  fs.mkdirSync(PROPOSALS_DIR, { recursive: true });
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

function rel(filePath: string): string {
  return path.relative(ROOT, filePath).split(path.sep).join("/");
}

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function safeIdPart(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
}

function readFleet(): FleetState {
  return readJson<FleetState>(FLEET_STATE_PATH) ?? { machines: [] };
}

function machineFromFleet(machine: NonNullable<FleetState["machines"]>[number]): IntentMachineCandidate {
  const status = machine.status ?? "UNKNOWN";
  const blocker = machine.blocker ?? null;
  const evidenceStatus = machine.evidence_status ?? "UNKNOWN";
  const liveStatus = status.toUpperCase().includes("LIVE");
  return {
    id: machine.id ?? safeIdPart(machine.display_name ?? "unknown"),
    label: machine.display_name ?? machine.id ?? "Unknown machine",
    hostname: machine.hostname ?? null,
    status,
    evidenceStatus,
    activeCousins: machine.active_cousins ?? "UNKNOWN",
    currentTask: machine.current_task ?? null,
    blocker,
    routeLive: liveStatus && evidenceStatus !== "UNKNOWN" && !blocker
  };
}

function defaultBetsy(): IntentMachineCandidate {
  return {
    id: "betsy",
    label: "Betsy",
    hostname: "DESKTOP-KTBH0LA",
    status: "LIVE",
    evidenceStatus: "OBSERVED",
    activeCousins: "Maker / Dink local hands",
    currentTask: null,
    blocker: null,
    routeLive: true
  };
}

function fleetCandidates(): IntentMachineCandidate[] {
  const fleet = readFleet();
  const candidates = (fleet.machines ?? []).map(machineFromFleet);
  if (!candidates.some((m) => m.id === "betsy")) candidates.unshift(defaultBetsy());
  return candidates;
}

function localhostSnapshot(): IntentAvailabilitySnapshot["localhost"] {
  const status = readJson<LocalhostStatus>(LOCALHOST_STATUS_PATH);
  return {
    ok: Boolean(status?.lastSuccess?.ok),
    port: status?.lastSuccess?.port ?? null,
    url: status?.lastSuccess?.url ?? null,
    checkedAt: status?.lastSuccess?.checkedAt ?? null
  };
}

function classifyIntent(text: string): IntentRouteCategory {
  const lower = text.toLowerCase();

  if (/\b(push|merge|deploy|production|sql|secret|env|billing|money|approve|approval)\b/.test(lower)) {
    return "human gate";
  }
  if (/\b(workstation|uniformity|uniformization|cenpoint|build 2\.0|install on|all machines)\b/.test(lower)) {
    return "workstation uniformity";
  }
  if (/\b(mobile|phone|field|pwa|away from desk|mobile sd|sd mobile)\b/.test(lower)) {
    return "mobile field command";
  }
  if (/\b(kill test|red team|hostile|audit|bean|break|attack)\b/.test(lower)) {
    return "audit / kill test";
  }
  if (/\b(research|cite|source|vendor|external|compare|current|thufir|perplexity)\b/.test(lower)) {
    return "research";
  }
  if (/\b(site cleanup|cleanup|homepage|business|pricing|kind sir|kindsir|copy cleanup)\b/.test(lower)) {
    return "business/site cleanup";
  }
  if (/\b(ui|ux|surface|card|layout|responsive|visual|css|page|screen|component)\b/.test(lower)) {
    return "UI / UX surface";
  }
  return "infrastructure / automation";
}

function routeShape(category: IntentRouteCategory): {
  primary: AeyeId;
  support: AeyeId[];
  capability: string;
  expectedReceipt: string;
  baseConfidence: IntentRouterProposal["confidence"];
} {
  switch (category) {
    case "mobile field command":
      return {
        primary: "DINK",
        support: ["MAKER"],
        capability: "mobile access infrastructure plus the responsive SoleDash surface",
        expectedReceipt: "mobile URL, mobile screenshot, access method, blockers",
        baseConfidence: "high"
      };
    case "UI / UX surface":
      return {
        primary: "MAKER",
        support: ["ENDER"],
        capability: "UI cards, responsive layout, and visual implementation",
        expectedReceipt: "changed surfaces, screenshots, files touched, blockers",
        baseConfidence: "medium"
      };
    case "research":
      return {
        primary: "THUFIR",
        support: ["SKYBRO"],
        capability: "external research with sourced synthesis",
        expectedReceipt: "sources consulted, synthesis, unknowns, next decision",
        baseConfidence: "medium"
      };
    case "audit / kill test":
      return {
        primary: "BEAN",
        support: ["PETRA"],
        capability: "hostile audit and trust/compliance red-team review",
        expectedReceipt: "VERDICT, findings by severity, kill conditions, blockers",
        baseConfidence: "medium"
      };
    case "business/site cleanup":
      return {
        primary: "ENDER",
        support: ["MAKER"],
        capability: "liveability/usability audit with UI implementation support",
        expectedReceipt: "cleanup findings, proposed patches, screenshots, no-go lines",
        baseConfidence: "medium"
      };
    case "human gate":
      return {
        primary: "PETRA",
        support: ["DINK"],
        capability: "comptroller priority and GO/NO-GO gate framing",
        expectedReceipt: "gate type, decision needed, risks, GO/NO-GO recommendation",
        baseConfidence: "high"
      };
    case "workstation uniformity":
      return {
        primary: "DINK",
        support: ["PETRA"],
        capability: "fleet/workstation setup, approval memory, and uniformity receipts",
        expectedReceipt: "machine readback, installed tools, blockers, restart requirement",
        baseConfidence: "high"
      };
    case "infrastructure / automation":
    default:
      return {
        primary: "DINK",
        support: ["PETRA"],
        capability: "infrastructure, relay, automation, fleet, and approval memory",
        expectedReceipt: "packet path, route status, receipt path, blockers",
        baseConfidence: "medium"
      };
  }
}

function pickMachine(category: IntentRouteCategory, primary: AeyeId): IntentMachineCandidate {
  const candidates = fleetCandidates();
  const betsy = candidates.find((m) => m.id === "betsy") ?? defaultBetsy();

  if (primary === "MAKER" || primary === "DINK") return betsy;
  if (category === "workstation uniformity") return betsy;

  return {
    ...betsy,
    label: `${betsy.label} relay`,
    routeLive: false
  };
}

function availabilitySnapshot(
  category: IntentRouteCategory,
  primary: AeyeId,
  selectedMachine: IntentMachineCandidate
): IntentAvailabilitySnapshot {
  const { resources } = loadAeyeResources();
  const resource = resources.find((r) => r.id === primary);
  const machines = fleetCandidates();
  const localhost = localhostSnapshot();

  const activeAssignments = [
    ...resources
      .filter((r) => r.busy_on)
      .map((r) => `${r.label}: ${r.busy_on}`),
    ...machines
      .filter((m) => m.currentTask && m.currentTask !== "UNKNOWN")
      .map((m) => `${m.label}: ${m.currentTask}`)
  ];

  const knownBlockers = machines.filter((m) => m.blocker).map((m) => `${m.label}: ${m.blocker}`);

  let routeMode: IntentAvailabilitySnapshot["routeMode"] = "simulated";
  if (selectedMachine.blocker) {
    routeMode = "blocked";
  } else if ((primary === "DINK" || primary === "MAKER") && selectedMachine.routeLive) {
    routeMode = "live";
  } else if (category !== "human gate") {
    routeMode = "outbox_only";
  }

  return {
    aeyes: resources,
    primaryAeyeAvailability: resource?.availability ?? "unknown",
    activeAssignments,
    knownBlockers,
    selectedMachine,
    alternatives: machines.filter((m) => m.id !== selectedMachine.id),
    localhost,
    routeMode
  };
}

function selectedLabel(primary: AeyeId, support: AeyeId[]): string {
  const supportText = support.length ? ` primary, ${support.map((id) => AEYE_LABELS[id]).join(" + ")} support` : " primary";
  return `${AEYE_LABELS[primary]}${supportText}`;
}

function whySelected(category: IntentRouteCategory, primary: AeyeId, support: AeyeId[]): string[] {
  if (category === "mobile field command") {
    return [
      "Mobile access is infrastructure first: Dink owns relay, automation, mobile access, fleet, and approval memory.",
      "The mobile SoleDash surface is UI: Maker supports responsive layout and visual implementation.",
      "Betsy is the observed primary forge with localhost evidence, while Doss still has an identity blocker."
    ];
  }

  const supportLine = support.length
    ? `${support.map((id) => AEYE_LABELS[id]).join(" + ")} provide support if the route expands.`
    : "No support Aeye required for the first pass.";

  return [
    `${AEYE_LABELS[primary]} owns ${category}.`,
    supportLine,
    "Route starts as a review card so Ben does not name machine, Aeye, or branch."
  ];
}

function alternativesRejected(category: IntentRouteCategory, primary: AeyeId): string[] {
  if (category === "mobile field command") {
    return [
      "Maker primary rejected: mobile surface needs Maker support, but mobile access/routing is infrastructure first.",
      "Doss rejected: machine identity is blocked until LOCAL_DOSS_WINDOWS readback.",
      "Petra rejected: no GO/NO-GO gate is needed before a reversible local packet."
    ];
  }

  const alternatives: string[] = [];
  if (primary !== "DINK") alternatives.push("Dink rejected as primary: no infrastructure/relay blocker dominates this intent.");
  if (primary !== "MAKER") alternatives.push("Maker rejected as primary: visible UI implementation is not the first capability needed.");
  if (primary !== "PETRA") alternatives.push("Petra rejected as primary: this is not primarily a GO/NO-GO comptroller decision.");
  return alternatives.slice(0, 3);
}

function interpretIntent(rawIntent: string, category: IntentRouteCategory): string {
  const trimmed = rawIntent.trim();
  if (/^build mobile sd$/i.test(trimmed)) return "Build mobile SoleDash access and surface proof";
  if (trimmed.length <= 84) return trimmed;
  return `${trimmed.slice(0, 81)}...`;
}

function proposalPath(id: string): string {
  return path.join(PROPOSALS_DIR, `${id}.json`);
}

function writeProposal(proposal: IntentRouterProposal): IntentRouterProposal {
  ensureDirs();
  fs.writeFileSync(proposalPath(proposal.id), `${JSON.stringify(proposal, null, 2)}\n`, "utf8");
  return proposal;
}

function writeReceipt(proposalId: string, receipt: IntentRouterReceipt): string {
  ensureDirs();
  const file = path.join(RECEIPTS_DIR, `${proposalId}_${Date.now()}.json`);
  fs.writeFileSync(file, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return rel(file);
}

export function readIntentProposal(id: string): IntentRouterProposal | null {
  return readJson<IntentRouterProposal>(proposalPath(id));
}

export function listIntentProposals(): IntentRouterProposal[] {
  ensureDirs();
  return fs
    .readdirSync(PROPOSALS_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => readJson<IntentRouterProposal>(path.join(PROPOSALS_DIR, name)))
    .filter((p): p is IntentRouterProposal => Boolean(p))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getIntentRouterView(): IntentRouterView {
  const recent = listIntentProposals();
  return {
    ok: true,
    latestProposal: recent[0] ?? null,
    recent: recent.slice(0, 5),
    proposalDir: rel(PROPOSALS_DIR),
    receiptDir: rel(RECEIPTS_DIR)
  };
}

export function createIntentProposal(rawIntent: string): IntentRouterProposal {
  const trimmed = rawIntent.trim();
  if (!trimmed) throw new Error("Intent required");

  const category = classifyIntent(trimmed);
  const shape = routeShape(category);
  const selectedMachine = pickMachine(category, shape.primary);
  const availability = availabilitySnapshot(category, shape.primary, selectedMachine);
  const now = new Date().toISOString();
  const id = `intent_${Date.now()}_${safeIdPart(trimmed) || "operator"}`;

  const proposal: IntentRouterProposal = {
    id,
    createdAt: now,
    updatedAt: now,
    rawIntent: trimmed,
    interpretedIntent: interpretIntent(trimmed, category),
    category,
    requiredCapability: shape.capability,
    selectedAeyes: {
      primary: shape.primary,
      support: shape.support,
      label: selectedLabel(shape.primary, shape.support)
    },
    selectedMachine: selectedMachine.label,
    selectedMachineId: selectedMachine.id,
    whySelected: whySelected(category, shape.primary, shape.support),
    alternativesRejected: alternativesRejected(category, shape.primary),
    expectedReceipt: shape.expectedReceipt,
    confidence: shape.baseConfidence,
    availability,
    state: "PROPOSED",
    packetPath: null,
    receipt: null,
    nextDecision: null
  };

  return writeProposal(proposal);
}

function missionTextFor(proposal: IntentRouterProposal, action: IntentRouteAction): string {
  const actionLine =
    action === "kill_test"
      ? "Kill test this route before implementation."
      : action === "needs_research"
        ? "Research this route before implementation."
        : "Execute the approved route.";

  return `Automatica Intent Router MVP

Raw operator intent:
${proposal.rawIntent}

Interpreted intent:
${proposal.interpretedIntent}

Route:
- Category: ${proposal.category}
- Owner: ${proposal.selectedAeyes.label}
- Machine: ${proposal.selectedMachine}
- Required capability: ${proposal.requiredCapability}
- Expected receipt: ${proposal.expectedReceipt}
- Route mode: ${proposal.availability.routeMode}

Why selected:
${proposal.whySelected.map((w) => `- ${w}`).join("\n")}

Alternatives rejected:
${proposal.alternativesRejected.map((w) => `- ${w}`).join("\n")}

Action:
${actionLine}

Return receipt to this SoleDash card with:
- result summary
- receipt path
- blockers
- next decision if action is needed
`;
}

function receiptFor(input: {
  proposal: IntentRouterProposal;
  action: IntentRouteAction;
  state: IntentRouteState;
  summary: string;
  packetPath: string | null;
  outboxPath: string | null;
  blocker: string | null;
  nextAction: string;
}): IntentRouterReceipt {
  return {
    action: input.action,
    status: input.state,
    summary: input.summary,
    packetPath: input.packetPath,
    outboxPath: input.outboxPath,
    receiptPath: null,
    blocker: input.blocker,
    nextAction: input.nextAction,
    createdAt: new Date().toISOString()
  };
}

function updateWithReceipt(
  proposal: IntentRouterProposal,
  receipt: IntentRouterReceipt,
  state: IntentRouteState,
  nextDecision: string | null
): IntentRouterProposal {
  const receiptPath = writeReceipt(proposal.id, receipt);
  const withPath = { ...receipt, receiptPath };
  return writeProposal({
    ...proposal,
    updatedAt: new Date().toISOString(),
    state,
    packetPath: withPath.outboxPath ?? withPath.packetPath,
    receipt: withPath,
    nextDecision
  });
}

export async function actOnIntentProposal(input: {
  proposalId: string;
  action: IntentRouteAction;
  editedIntent?: string;
}): Promise<{ ok: boolean; proposal: IntentRouterProposal | null; message: string }> {
  const proposal = readIntentProposal(input.proposalId);
  if (!proposal) return { ok: false, proposal: null, message: "Proposal not found" };

  if (input.action === "edit_route") {
    const nextText = input.editedIntent?.trim();
    if (!nextText) return { ok: false, proposal, message: "Edited intent required" };
    const edited = createIntentProposal(nextText);
    const receipt = receiptFor({
      proposal,
      action: "edit_route",
      state: "REJECTED",
      summary: `Route edited into ${edited.id}`,
      packetPath: null,
      outboxPath: null,
      blocker: null,
      nextAction: "Review edited route card"
    });
    updateWithReceipt(proposal, receipt, "REJECTED", `Review edited card ${edited.id}`);
    return { ok: true, proposal: edited, message: "Route edited" };
  }

  if (input.action === "reject") {
    const receipt = receiptFor({
      proposal,
      action: "reject",
      state: "REJECTED",
      summary: "Route rejected. No packet written.",
      packetPath: null,
      outboxPath: null,
      blocker: null,
      nextAction: "Await next operator intent"
    });
    const updated = updateWithReceipt(proposal, receipt, "REJECTED", null);
    return { ok: true, proposal: updated, message: "Route rejected" };
  }

  const actionCousin: CousinId =
    input.action === "kill_test"
      ? "BEAN"
      : input.action === "needs_research"
        ? "COMPUTER"
        : AEYE_TO_COUSIN[proposal.selectedAeyes.primary];

  const dispatch = await dispatchBuild({
    missionText: missionTextFor(proposal, input.action),
    title: proposal.interpretedIntent,
    cousin: actionCousin,
    decisionNote: `Intent Router ${input.action} for ${proposal.id}`
  });

  const state: IntentRouteState = dispatch.ok ? "AWAITING_RECEIPT" : "BLOCKED";
  const receipt = receiptFor({
    proposal,
    action: input.action,
    state,
    summary: dispatch.message,
    packetPath: dispatch.build?.outboxPath ?? null,
    outboxPath: dispatch.build?.outboxPath ?? null,
    blocker: dispatch.blocker,
    nextAction: dispatch.ok
      ? `Await ${proposal.expectedReceipt}`
      : dispatch.blocker ?? "Inspect blocked dispatch"
  });
  const nextDecision = dispatch.ok
    ? `Await receipt: ${proposal.expectedReceipt}`
    : "Route blocked. Edit route, needs research, or kill test.";
  const updated = updateWithReceipt(proposal, receipt, state, nextDecision);
  return { ok: dispatch.ok, proposal: updated, message: dispatch.message };
}
