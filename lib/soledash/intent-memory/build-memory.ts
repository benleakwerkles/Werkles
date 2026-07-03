import fs from "node:fs";
import path from "node:path";

import { classifyApprovalAction } from "@/lib/soledash/command-surface/approval-classifier";
import { classifyMission } from "@/lib/soledash/command-surface/mission-router";
import type { CousinId } from "@/lib/soledash/command-surface/types";
import { loadTransportReceipts } from "@/lib/soledash/decision-surface/load-live-transport";
import { RELAY_CARDS } from "@/lib/soledash/automatica-relay/cards";
import { latestRunForCard } from "@/lib/soledash/automatica-relay/storage";
import { loadWatchState, readReportJson, topRisksForPanel } from "@/lib/soledash/wisdom-watcher/storage";

import { loadParkedIntents } from "./storage";
import type { IntentMemoryPanel, PriorFinding, PriorFindingKind, RouteRecommendation } from "./types";

const ROOT = process.cwd();
const FORBIDDEN = [/doctrine violation/i, /you are wrong/i, /blocked by history/i, /do not proceed because/i];

const SOURCE_FILES: Array<{
  relPath: string;
  kind: PriorFindingKind;
  caution: string;
}> = [
  {
    relPath: "foreman/NUGGETS_OF_WISDOM_TOP_25.md",
    kind: "relevant_prior_finding",
    caution: "Check the prior finding before creating a new packet."
  },
  {
    relPath: "foreman/NUGGETS_OF_WISDOM_TOP_25.json",
    kind: "relevant_prior_finding",
    caution: "Check the prior finding before creating a new packet."
  },
  {
    relPath: "foreman/speaker/NUGGETS_OF_WISDOM_TOP_25.md",
    kind: "relevant_prior_finding",
    caution: "Check the prior finding before creating a new packet."
  },
  {
    relPath: "foreman/speaker/NUGGETS_OF_WISDOM_TOP_25.json",
    kind: "relevant_prior_finding",
    caution: "Check the prior finding before creating a new packet."
  },
  {
    relPath: "foreman/PARKED_IDEAS.md",
    kind: "related_parked_idea",
    caution: "Confirm the old parked idea still belongs in this route."
  },
  {
    relPath: "foreman/soledash/PARKED_IDEAS.md",
    kind: "related_parked_idea",
    caution: "Confirm the old parked idea still belongs in this route."
  },
  {
    relPath: "foreman/NEXT_ACTION.md",
    kind: "active_constraint",
    caution: "Keep the current hard stops and active lane in view."
  },
  {
    relPath: "foreman/CURRENT_STATE.md",
    kind: "active_constraint",
    caution: "Route against the observed current state, not stale assumptions."
  },
  {
    relPath: "foreman/soledash/MOBILE_SD_PREVIEW.md",
    kind: "previous_decision",
    caution: "Preserve the prior mobile direction unless Ben edits the intent."
  }
];

function sanitize(text: string): string {
  let out = text.trim().replace(/\s+/g, " ");
  for (const re of FORBIDDEN) {
    out = out.replace(re, "Relevant prior finding");
  }
  return out;
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

function relevanceScore(command: string, haystack: string): number {
  const cmd = new Set(tokens(command));
  const hay = tokens(haystack);
  if (cmd.size === 0 || hay.length === 0) return 0;
  let hits = 0;
  for (const t of hay) {
    if (cmd.has(t)) hits += 1;
  }
  return hits / Math.max(cmd.size, 1);
}

function kindLabel(kind: PriorFindingKind): string {
  switch (kind) {
    case "relevant_prior_finding":
      return "Relevant prior finding";
    case "known_risk":
      return "Known risk";
    case "previous_decision":
      return "Previous decision";
    case "related_parked_idea":
      return "Related parked idea";
    case "active_constraint":
      return "Active constraint";
  }
}

function confidenceFor(relevance: number): PriorFinding["confidence"] {
  if (relevance >= 0.75) return "high";
  if (relevance >= 0.25) return "medium";
  return "low";
}

function finding(input: {
  id: string;
  kind: PriorFindingKind;
  summary: string;
  detail?: string | null;
  source: string;
  why: string;
  caution: string;
  relevance: number;
  confidence?: PriorFinding["confidence"];
}): PriorFinding {
  return {
    id: input.id,
    kind: input.kind,
    label: kindLabel(input.kind),
    summary: sanitize(input.summary),
    detail: input.detail ? sanitize(input.detail) : null,
    source: input.source,
    why_it_matters_now: sanitize(input.why),
    recommended_caution: sanitize(input.caution),
    confidence: input.confidence ?? confidenceFor(input.relevance),
    relevance: input.relevance
  };
}

function isMobileSdIntent(command: string): boolean {
  const lower = command.toLowerCase();
  return /\bmobile\b/.test(lower) && /\b(sd|soledash)\b/.test(lower);
}

function mobileSdFindings(): PriorFinding[] {
  return [
    finding({
      id: "mobile_sd_active_near_term_build",
      kind: "previous_decision",
      summary: "Mobile SD is already an active near-term responsive web build.",
      detail: "The preview receipt says phone-usable SoleDash is web, not native, with frontier, human gates, relay cards, and receipts.",
      source: "foreman/soledash/MOBILE_SD_PREVIEW.md",
      why: "This means the route should continue the existing Mobile SD lane instead of reopening product shape from zero.",
      caution: "Do not restart as a native app first.",
      relevance: 2.0,
      confidence: "high"
    }),
    finding({
      id: "mobile_sd_dink_access_security",
      kind: "previous_decision",
      summary: "Dink owns access/security for Mobile SD.",
      detail: "Dink is the infrastructure, relay, automation, mobile access, fleet, and approval-memory owner.",
      source: "lib/soledash/intent-router/router.ts",
      why: "A mobile surface only matters if the access path, localhost exposure, and handoff route are real.",
      caution: "Confirm access method and blockers before treating the mobile board as live.",
      relevance: 1.9,
      confidence: "high"
    }),
    finding({
      id: "mobile_sd_maker_surface",
      kind: "previous_decision",
      summary: "Maker owns the mobile surface.",
      detail: "The preview receipt maps the mobile shell to responsive SoleDash components and touch-safe UI.",
      source: "foreman/soledash/MOBILE_SD_PREVIEW.md",
      why: "The mobile task needs UI support after Dink proves access.",
      caution: "Keep Maker as support for layout and screenshots, not as the primary access owner.",
      relevance: 1.8,
      confidence: "high"
    }),
    finding({
      id: "mobile_sd_avoid_native_first",
      kind: "known_risk",
      summary: "Avoid native app first.",
      detail: "The current receipt explicitly says responsive web, not native, with bottom-sheet modals and fixed operator bar.",
      source: "foreman/soledash/MOBILE_SD_PREVIEW.md",
      why: "Native work would spend effort before the actual mobile command loop is proven.",
      caution: "Stay web-first until mobile URL, screenshot, and access method are receipted.",
      relevance: 1.7,
      confidence: "high"
    }),
    finding({
      id: "mobile_sd_relay_or_fake_board",
      kind: "known_risk",
      summary: "Relay must work or Mobile SD becomes a fake board.",
      detail: "The mobile preview includes relay cards and receipts as operator essentials.",
      source: "foreman/soledash/MOBILE_SD_PREVIEW.md",
      why: "If relay and receipt return do not work, the phone view only displays state instead of commanding work.",
      caution: "Require the receipt to include mobile URL, screenshot, access method, and blockers.",
      relevance: 1.6,
      confidence: "high"
    })
  ];
}

function readTextFile(relPath: string): string | null {
  try {
    return fs.readFileSync(path.join(ROOT, relPath), "utf8");
  } catch {
    return null;
  }
}

function snippetsFromText(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*#>\s]+/, "").trim())
    .filter((line) => line.length >= 24 && !line.startsWith("|"))
    .slice(0, 80);
}

function snippetsFromJson(text: string): string[] {
  try {
    const parsed = JSON.parse(text) as unknown;
    const values: string[] = [];
    const visit = (value: unknown) => {
      if (values.length >= 80) return;
      if (typeof value === "string" && value.trim().length >= 24) {
        values.push(value.trim());
        return;
      }
      if (Array.isArray(value)) {
        for (const item of value) visit(item);
        return;
      }
      if (value && typeof value === "object") {
        for (const item of Object.values(value)) visit(item);
      }
    };
    visit(parsed);
    return values;
  } catch {
    return snippetsFromText(text);
  }
}

function gatherFileFindings(command: string): PriorFinding[] {
  const out: PriorFinding[] = [];

  for (const source of SOURCE_FILES) {
    const text = readTextFile(source.relPath);
    if (!text) continue;
    const snippets = source.relPath.endsWith(".json") ? snippetsFromJson(text) : snippetsFromText(text);

    snippets.forEach((snippet, index) => {
      const relevance = relevanceScore(command, snippet);
      if (relevance <= 0) return;
      out.push(
        finding({
          id: `file_${source.relPath.replace(/[^a-z0-9]+/gi, "_")}_${index}`,
          kind: source.kind,
          summary: snippet.slice(0, 180),
          detail: null,
          source: source.relPath,
          why: "This local source shares terms with the new intent.",
          caution: source.caution,
          relevance: relevance + (source.kind === "active_constraint" ? 0.08 : 0)
        })
      );
    });
  }

  return out;
}

function loadSurfaceContext(): { frontier: string | null; blocker: string | null } {
  try {
    const raw = JSON.parse(
      fs.readFileSync(path.join(ROOT, "foreman", "soledash", "DECISION_SURFACE.json"), "utf8")
    ) as {
      frontier?: { title?: string };
      current_blocker?: { headline?: string; detail?: string };
    };
    return {
      frontier: raw.frontier?.title ?? null,
      blocker: raw.current_blocker?.headline ?? null
    };
  } catch {
    return { frontier: null, blocker: null };
  }
}

function gatherSurfaceFindings(command: string): PriorFinding[] {
  const findings: PriorFinding[] = [];
  const ctx = loadSurfaceContext();

  if (ctx.frontier) {
    findings.push(
      finding({
        id: "ctx_frontier",
        kind: "previous_decision",
        summary: `Operator frontier: ${ctx.frontier}`,
        detail: "Current rank from DECISION_SURFACE.json",
        source: "foreman/soledash/DECISION_SURFACE.json",
        why: "The new intent may compete with the current frontier.",
        caution: "If this becomes dispatch work, preserve the route review step before firing.",
        relevance: relevanceScore(command, ctx.frontier) + 0.15
      })
    );
  }

  if (ctx.blocker) {
    findings.push(
      finding({
        id: "ctx_blocker",
        kind: "known_risk",
        summary: `Active blocker: ${ctx.blocker}`,
        detail: "May affect dispatch timing; not a stop unless Ben chooses to gate it.",
        source: "foreman/soledash/DECISION_SURFACE.json",
        why: "Active blockers are current constraints for route confidence.",
        caution: "Name blockers in the expected receipt instead of assuming the route is clear.",
        relevance: relevanceScore(command, ctx.blocker) + 0.1
      })
    );
  }

  return findings;
}

function gatherWisdomWatcherFindings(command: string): PriorFinding[] {
  const report = readReportJson();
  if (!report) return [];
  const state = loadWatchState();
  return topRisksForPanel(report, state)
    .slice(0, 6)
    .map((risk) =>
      finding({
        id: `wisdom_${risk.id}`,
        kind: "known_risk",
        summary: risk.summary,
        detail: risk.recommended_correction,
        source: risk.source_doctrine,
        why: "This risk has been raised by the local wisdom watcher.",
        caution: "Treat as context only; Ben decides whether it changes the route.",
        relevance: relevanceScore(command, `${risk.summary} ${risk.conflicting_task}`)
      })
    )
    .filter((f) => f.relevance > 0);
}

function gatherReceiptFindings(command: string): PriorFinding[] {
  return loadTransportReceipts(false)
    .slice(0, 16)
    .map((r) => {
      const hay = `${r.target} ${r.status} ${r.owner ?? ""} ${r.receipt_link}`;
      return finding({
        id: `receipt_${r.action_id}`,
        kind: "previous_decision",
        summary: `${r.status} - ${r.target}`,
        detail: r.receipt_link,
        source: "foreman/soledash/receipts/",
        why: "A recent receipt touches similar command language or ownership.",
        caution: "Use receipts as evidence, not as automatic permission to dispatch.",
        relevance: relevanceScore(command, hay) + 0.03
      });
    })
    .filter((f) => f.relevance > 0.08);
}

function gatherRelayFindings(command: string): PriorFinding[] {
  return RELAY_CARDS.map((card) => {
    const run = latestRunForCard(card.id);
    const state = run.receipt?.status ?? run.packet?.status ?? "READY";
    const hay = `${card.name} ${card.taskType} ${card.expectedReceipt} ${card.missionText} ${state}`;
    return finding({
      id: `relay_${card.id}`,
      kind: "active_constraint",
      summary: `${state} relay card: ${card.name}`,
      detail: card.expectedReceipt,
      source: "lib/soledash/automatica-relay/cards.ts",
      why: "Active relay cards show whether this intent can become real transport instead of display-only work.",
      caution: "If relay is relevant, require packet path and receipt path in the dispatch result.",
      relevance: relevanceScore(command, hay) + (state === "READY" ? 0.02 : 0.06)
    });
  }).filter((f) => f.relevance > 0.08);
}

function gatherParkedFindings(command: string): PriorFinding[] {
  return loadParkedIntents()
    .slice(0, 12)
    .map((parked) =>
      finding({
        id: `parked_${parked.intent_id}`,
        kind: "related_parked_idea",
        summary: parked.interpreted_command.slice(0, 160),
        detail: parked.reason,
        source: "foreman/soledash/intent-memory/parked.json",
        why: "This related idea was explicitly parked instead of dispatched.",
        caution: "Confirm whether to revive it or keep it parked.",
        relevance: relevanceScore(command, `${parked.raw_command} ${parked.interpreted_command}`) + 0.08
      })
    )
    .filter((f) => f.relevance > 0.08);
}

function gatherFindings(command: string): PriorFinding[] {
  const findings: PriorFinding[] = [
    ...(isMobileSdIntent(command) ? mobileSdFindings() : []),
    ...gatherFileFindings(command),
    ...gatherSurfaceFindings(command),
    ...gatherWisdomWatcherFindings(command),
    ...gatherReceiptFindings(command),
    ...gatherRelayFindings(command),
    ...gatherParkedFindings(command)
  ];

  const deduped = new Map<string, PriorFinding>();
  for (const f of findings) {
    const key = `${f.kind}:${f.summary.toLowerCase()}`;
    const existing = deduped.get(key);
    if (!existing || existing.relevance < f.relevance) deduped.set(key, f);
  }

  return Array.from(deduped.values())
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);
}

function buildInterpreted(command: string, classification: ReturnType<typeof classifyMission>): string {
  if (/^build mobile sd$/i.test(command.trim())) return "Build mobile SoleDash access and surface proof";

  const parts: string[] = [];
  if (classification.label) parts.push(classification.label);
  else if (classification.missionClass) parts.push(classification.missionClass.replace(/_/g, " "));
  parts.push(`- ${command.slice(0, 160)}${command.length > 160 ? "..." : ""}`);
  return sanitize(parts.join(" "));
}

function toRoute(s: { id: CousinId; machine: string; reason: string }): RouteRecommendation {
  return { cousin: s.id, machine: s.machine, reason: sanitize(s.reason) };
}

export function buildIntentMemoryPanel(input: {
  rawCommand: string;
  proposalId?: string | null;
}): IntentMemoryPanel {
  const raw = input.rawCommand.trim();
  const classification = classifyMission(raw);
  const approval = classifyApprovalAction(raw);
  const recommended = toRoute(
    classification.suggestedCousins[0] ?? {
      id: "MAKER",
      machine: "Betsy",
      reason: "Default build lane"
    }
  );
  const alternates = classification.suggestedCousins.slice(1, 4).map(toRoute);

  let routeConfidence: IntentMemoryPanel["route_confidence"] = classification.confidence;
  let confidenceNote = `Mission match: ${classification.matchedTerms.slice(0, 4).join(", ") || "general intent"}`;

  if (approval.verdict === "TRUE_HUMAN_GATE") {
    routeConfidence = "low";
    confidenceNote = sanitize(`Human gate may apply - ${approval.operatorLine}`);
  } else if (approval.verdict === "AMBIGUOUS") {
    routeConfidence = routeConfidence === "high" ? "medium" : routeConfidence;
    confidenceNote = sanitize(`${confidenceNote} - Intent has mixed signals`);
  } else if (classification.confidence === "high") {
    confidenceNote = sanitize(`${confidenceNote} - Strong keyword alignment`);
  }

  return {
    intent_id: `intent_${Date.now()}`,
    raw_command: raw,
    interpreted_command: buildInterpreted(raw, classification),
    prior_findings: gatherFindings(raw),
    recommended_owner: recommended,
    selected_owner: recommended,
    route_confidence: routeConfidence,
    route_confidence_note: confidenceNote,
    mission_class: classification.missionClass,
    mission_label: classification.label,
    alternate_routes: alternates,
    proposal_id: input.proposalId ?? null,
    generated_at: new Date().toISOString()
  };
}
