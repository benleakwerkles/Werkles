import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
const MEMBRANE_ROOT = path.join(REPO_ROOT, "tinkarden", "membrane");
const SPEAKER_ROOT = path.join(REPO_ROOT, "speaker");
const BUILD_LOG_PATH = path.join(MEMBRANE_ROOT, "final_assembly_next_best_ideas.jsonl");
const BUILD_DIR = path.join(MEMBRANE_ROOT, "next_best_ideas");
const VERSION_PREVIEW_MANIFEST_PATH = path.join(MEMBRANE_ROOT, "version_preview_manifest.json");
const VERSION_DECISION_LOG_PATH = path.join(MEMBRANE_ROOT, "version_preview_decisions.jsonl");
const DECISION_LOG_PATH = path.join(MEMBRANE_ROOT, "final_assembly_decisions.jsonl");
const OPTIONAL_PACKET_LOG_PATH = path.join(MEMBRANE_ROOT, "optional_packets.jsonl");
const MOMENTUM_TAP_LOG_PATH = path.join(MEMBRANE_ROOT, "momentum_taps.jsonl");
const SWANSON_RELAY_LOG_PATH = path.join(MEMBRANE_ROOT, "swanson_functional_relays.jsonl");
const INTERFACE_NOTIFY_LOG_PATH = path.join(SPEAKER_ROOT, "logs", "interface-notify.jsonl");

type IdeaId =
  | "swanson_handoff_manifest"
  | "operator_momentum_script"
  | "let_die_ledger"
  | "operator_decision_summary"
  | "swanson_merge_checklist"
  | "receipt_health_check"
  | "version_decision_picklist"
  | "button_relay_smoke_pack"
  | "swanson_adapter_contract"
  | "live_review_agenda"
  | "merge_candidate_matrix"
  | "success_signal_index";
type JsonRecord = Record<string, unknown>;

type ModuleSnapshot = {
  id?: unknown;
  title?: unknown;
  system?: unknown;
  status?: unknown;
  merge_state?: unknown;
  proof_path?: unknown;
  next_action?: unknown;
};

type BuildRequest = {
  idea_id?: unknown;
  modules?: ModuleSnapshot[];
};

const IDEAS: Record<IdeaId, {
  title: string;
  status: string;
  output: string;
  why: string;
  next: string;
}> = {
  swanson_handoff_manifest: {
    title: "Swanson handoff manifest",
    status: "HANDOFF_MANIFEST_BUILT",
    output: "Current candidate lanes, proof paths, merge states, and open operator choices.",
    why: "Swanson should consume an explicit contract instead of inferring from UI layout.",
    next: "Feed this manifest into the final Swanson relay merge review."
  },
  operator_momentum_script: {
    title: "Operator momentum script",
    status: "MOMENTUM_SCRIPT_BUILT",
    output: "A human click path from Top Three food through optional packets, momentum taps, and Swanson relay.",
    why: "The operator should know what the conveyor belt does before tapping momentum.",
    next: "Use this as the live rehearsal script for the final page."
  },
  let_die_ledger: {
    title: "Let-die ledger",
    status: "LET_DIE_LEDGER_BUILT",
    output: "A retirement ledger for lanes that should leave the final UI while proof remains preserved.",
    why: "Killed ideas should be auditable, not invisible.",
    next: "Append operator Let Die choices here before removing any lane from the final surface."
  },
  operator_decision_summary: {
    title: "Operator decision summary",
    status: "DECISION_SUMMARY_BUILT",
    output: "Decision coverage across merge, keep, and let-die lanes.",
    why: "The operator needs to see what has been chosen and what is still open.",
    next: "Use this before Swanson consumes the handoff manifest."
  },
  swanson_merge_checklist: {
    title: "Swanson merge checklist",
    status: "SWANSON_MERGE_CHECKLIST_BUILT",
    output: "A pre-merge checklist for Swanson's final relay page.",
    why: "Swanson should only become canonical after receipt, decision, and guardrail checks pass.",
    next: "Run this immediately before the final functional relay merge."
  },
  receipt_health_check: {
    title: "Receipt health check",
    status: "RECEIPT_HEALTH_CHECK_BUILT",
    output: "A proof-path health report for every candidate lane.",
    why: "Proof paths need to exist before the UI treats a lane as merge-ready.",
    next: "Fix or mark source-missing paths before final merge."
  },
  version_decision_picklist: {
    title: "Version decision picklist",
    status: "VERSION_DECISION_PICKLIST_BUILT",
    output: "A site-only picklist for Keep, Steal Parts, or Let Die decisions across gathered dashboard versions.",
    why: "The operator needs the gathered previews turned into explicit choices before any final merge.",
    next: "Use this as the live review call sheet for the version wall."
  },
  button_relay_smoke_pack: {
    title: "Button relay smoke pack",
    status: "BUTTON_RELAY_SMOKE_PACK_BUILT",
    output: "A concrete smoke-test matrix for every visible action button and the receipt it should write.",
    why: "Buttons must visibly relay success or blocker state; decorative buttons are not enough.",
    next: "Run these checks before trusting the merged Command Dash or Swanson page."
  },
  swanson_adapter_contract: {
    title: "Swanson adapter contract",
    status: "SWANSON_ADAPTER_CONTRACT_BUILT",
    output: "A site-only adapter map from membrane decisions, packets, taps, and relays into Swanson's functional page.",
    why: "Swanson should consume explicit dashboard receipts and logs, not unrelated source material or inferred UI state.",
    next: "Use this as the integration contract when Swanson's functional relay build lands."
  },
  live_review_agenda: {
    title: "Live review agenda",
    status: "LIVE_REVIEW_AGENDA_BUILT",
    output: "An ordered operator agenda for deciding what to merge, keep, steal, repair, or let die.",
    why: "The gathered previews need to become a real-time review path, not a scrolling archive.",
    next: "Use this as the conversation order while choosing final dashboard parts."
  },
  merge_candidate_matrix: {
    title: "Merge candidate matrix",
    status: "MERGE_CANDIDATE_MATRIX_BUILT",
    output: "A version-to-module map that shows where each gathered surface belongs in the final site merge.",
    why: "The final merge needs source family alignment before Swanson or the Command Dash consumes anything.",
    next: "Use this to choose which source owns each final UI behavior."
  },
  success_signal_index: {
    title: "Success signal index",
    status: "SUCCESS_SIGNAL_INDEX_BUILT",
    output: "A receipt-backed index of which buttons and lanes currently have durable success signals.",
    why: "The operator should see which controls are proven, empty, blocked, or still only proposed.",
    next: "Use this to pick the next button smoke test or repair target."
  }
};

function rel(filePath: string) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join("/");
}

function text(value: unknown, fallback = "") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function stamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function sha256(value: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function writeJsonl(filePath: string, value: JsonRecord) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function readJsonl(filePath: string) {
  try {
    return fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as JsonRecord);
  } catch {
    return [];
  }
}

function readJsonFile(filePath: string) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as JsonRecord;
  } catch {
    return null;
  }
}

function arrayText(value: unknown) {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : [];
}

function versionPreviews() {
  const manifest = readJsonFile(VERSION_PREVIEW_MANIFEST_PATH);
  const versions = Array.isArray(manifest?.versions) ? manifest.versions as JsonRecord[] : [];
  return versions.map((version) => ({
    id: text(version.id, "unknown_version"),
    title: text(version.title, "Untitled version"),
    family: text(version.family, "unknown"),
    status: text(version.status, "UNKNOWN"),
    source_url: typeof version.source_url === "string" ? version.source_url : null,
    source_path: text(version.source_path, "source_path_missing"),
    evidence_path: text(version.evidence_path, "evidence_path_missing"),
    why_it_matters: text(version.why_it_matters, "No operator meaning recorded."),
    useful_parts: arrayText(version.useful_parts),
    honest_boundary: text(version.honest_boundary, "Boundary missing.")
  }));
}

function suggestedVersionAction(status: string) {
  if (status === "LIVE_SCREENSHOT") return "KEEP_OR_STEAL_PARTS";
  if (status === "BLOCKED_RUNTIME") return "REPAIR_BEFORE_MERGE_OR_LET_DIE";
  return "SOURCE_ONLY_REVIEW";
}

function latestCount(filePath: string) {
  return readJsonl(filePath).length;
}

function latestRecord(filePath: string) {
  const records = readJsonl(filePath);
  return records[records.length - 1] ?? null;
}

function agendaRank(versionId: string) {
  const ranks: Record<string, number> = {
    command_dash_aeye_evidence: 1,
    sally_good_soledash: 2,
    current_feral_membrane: 3,
    current_tinkerden_bridge: 4,
    thinkit_command_dash: 5,
    command_dash_proof_chain: 6,
    current_soledash_blocked: 7,
    static_packet_launcher: 8,
    wonka_mood_reference: 9,
    preserve_salvage_bundle: 10
  };
  return ranks[versionId] ?? 99;
}

function operatorQuestionForStatus(status: string) {
  if (status === "LIVE_SCREENSHOT") return "Keep as visible behavior, steal parts, or let die?";
  if (status === "BLOCKED_RUNTIME") return "Repair before merge, keep as blocker evidence, or let die?";
  return "Keep as reference material, steal specific parts, or let die?";
}

function moduleForVersion(versionId: string, family: string, sourcePath: string) {
  const haystack = `${versionId} ${family} ${sourcePath}`.toLowerCase();
  if (haystack.includes("thinkit")) return "thinkit-origin-return";
  if (haystack.includes("sally") || haystack.includes("soledash")) return "swanson-attached-relay";
  if (haystack.includes("wonka")) return "wonka-aeye-loop";
  if (haystack.includes("feral") || haystack.includes("membrane")) return "feral-membrane-motion";
  if (haystack.includes("tinkerden") || haystack.includes("packet")) return "tinkerden-command-receipts";
  return "operator-review";
}

function latestSignal(filePath: string, label: string) {
  const records = readJsonl(filePath);
  const latest = records[records.length - 1] ?? {};
  return {
    label,
    path: rel(filePath),
    count: records.length,
    latest_event: text(latest.event_type, "none"),
    latest_status: text(latest.status, text(latest.relay_status, text(latest.decision, "none"))),
    latest_title: text(latest.title, text(latest.packet_id, text(latest.receipt_id, "none"))),
    latest_artifact: text(latest.artifact_path, text(latest.receipt_path, text(latest.packet_path, "none"))),
    has_signal: records.length > 0
  };
}

function normalizeModules(modules: ModuleSnapshot[] | undefined) {
  return Array.isArray(modules)
    ? modules.map((module) => ({
        id: text(module.id, "unknown"),
        title: text(module.title, "Untitled lane"),
        system: text(module.system, "unknown"),
        status: text(module.status, "unknown"),
        merge_state: text(module.merge_state, "unknown"),
        proof_path: text(module.proof_path, "proof_path_missing"),
        next_action: text(module.next_action, "operator review")
      }))
    : [];
}

function latestBuilds() {
  const builds = new Map<string, JsonRecord>();
  for (const build of readJsonl(BUILD_LOG_PATH)) {
    const ideaId = text(build.idea_id);
    if (!ideaId) continue;
    if (!(ideaId in IDEAS)) continue;
    builds.set(ideaId, build);
  }
  return Array.from(builds.values());
}

function latestDecisions() {
  const decisions = new Map<string, JsonRecord>();
  for (const decision of readJsonl(DECISION_LOG_PATH)) {
    const moduleId = text(decision.module_id);
    if (!moduleId) continue;
    decisions.set(moduleId, decision);
  }
  return decisions;
}

function pathStatus(repoRelativePath: string) {
  const normalized = repoRelativePath.replace(/\//g, path.sep);
  const candidate = path.isAbsolute(repoRelativePath) ? repoRelativePath : path.join(REPO_ROOT, normalized);
  if (!fs.existsSync(candidate)) {
    return {
      path: repoRelativePath,
      exists: false,
      kind: "missing"
    };
  }

  const stat = fs.statSync(candidate);
  return {
    path: repoRelativePath,
    exists: true,
    kind: stat.isDirectory() ? "directory" : "file",
    size_bytes: stat.isFile() ? stat.size : null,
    updated_at: stat.mtime.toISOString()
  };
}

function buildPayload(ideaId: IdeaId, modules: ReturnType<typeof normalizeModules>) {
  if (ideaId === "live_review_agenda") {
    const versions = versionPreviews().sort((left, right) => agendaRank(left.id) - agendaRank(right.id));
    const finalDecisions = latestDecisions();
    return {
      agenda_scope: "Dashboard/site merge review only.",
      version_review_order: versions.map((version, index) => ({
        order: index + 1,
        version_id: version.id,
        title: version.title,
        family: version.family,
        status: version.status,
        operator_question: operatorQuestionForStatus(version.status),
        suggested_action: suggestedVersionAction(version.status),
        useful_parts: version.useful_parts,
        source_path: version.source_path,
        evidence_path: version.evidence_path,
        boundary: version.honest_boundary
      })),
      open_module_decisions: modules
        .filter((module) => !finalDecisions.has(module.id))
        .map((module) => ({
          module_id: module.id,
          title: module.title,
          system: module.system,
          current_state: module.merge_state,
          proof_path: module.proof_path,
          required_choice: "MERGE / KEEP / LET_DIE"
        })),
      current_receipt_counts: {
        version_preview_decisions: latestCount(VERSION_DECISION_LOG_PATH),
        final_assembly_decisions: latestCount(DECISION_LOG_PATH),
        swanson_relays: latestCount(SWANSON_RELAY_LOG_PATH)
      },
      next_human_move: "Start at order 1, decide Keep / Steal Parts / Let Die for each version, then record module-level Merge / Keep / Let Die choices."
    };
  }

  if (ideaId === "merge_candidate_matrix") {
    const moduleMap = new Map(modules.map((module) => [module.id, module]));
    return {
      matrix_scope: "Gathered route previews mapped to final assembly modules.",
      candidates: versionPreviews().map((version) => {
        const moduleId = moduleForVersion(version.id, version.family, version.source_path);
        const module = moduleMap.get(moduleId);
        return {
          version_id: version.id,
          title: version.title,
          family: version.family,
          status: version.status,
          maps_to_module: moduleId,
          module_title: module?.title ?? "Operator review",
          module_state: module?.merge_state ?? "LIVE_REVIEW",
          merge_readiness:
            version.status === "LIVE_SCREENSHOT"
              ? "CAN_REVIEW_NOW"
              : version.status === "BLOCKED_RUNTIME"
                ? "REPAIR_OR_REJECT"
                : "REFERENCE_ONLY",
          useful_parts: version.useful_parts,
          source_path: version.source_path,
          evidence_path: version.evidence_path
        };
      }),
      unresolved_modules: modules
        .filter((module) => !versionPreviews().some((version) => moduleForVersion(version.id, version.family, version.source_path) === module.id))
        .map((module) => ({
          module_id: module.id,
          title: module.title,
          proof_path: module.proof_path,
          reason: "No gathered preview maps directly to this module yet."
        })),
      merge_boundary: "Use this matrix to assign site behavior ownership only."
    };
  }

  if (ideaId === "success_signal_index") {
    const signals = [
      latestSignal(VERSION_DECISION_LOG_PATH, "Version preview decisions"),
      latestSignal(DECISION_LOG_PATH, "Final assembly decisions"),
      latestSignal(OPTIONAL_PACKET_LOG_PATH, "Optional packets"),
      latestSignal(MOMENTUM_TAP_LOG_PATH, "Momentum taps"),
      latestSignal(SWANSON_RELAY_LOG_PATH, "Swanson relays"),
      latestSignal(BUILD_LOG_PATH, "G next-best builds")
    ];
    const missing = signals.filter((signal) => !signal.has_signal).map((signal) => signal.label);
    const latestSwansonRelay = latestRecord(SWANSON_RELAY_LOG_PATH);
    return {
      signal_scope: "Receipt-backed UI and relay actions.",
      signals,
      missing_success_signals: missing,
      next_repair_or_test:
        missing.length > 0
          ? `Generate a durable receipt for: ${missing[0]}.`
          : "Run a visible smoke test for one version decision and one final assembly decision.",
      swanson_relay_truth: latestSwansonRelay
        ? {
            relay_id: text(latestSwansonRelay.relay_id, "unknown"),
            status: text(latestSwansonRelay.relay_status, "unknown"),
            clipboard_verified: Boolean(latestSwansonRelay.clipboard_verified),
            no_auto_send: Boolean(latestSwansonRelay.no_auto_send),
            receipt_path: text(latestSwansonRelay.receipt_path, "missing")
          }
        : {
            status: "NO_SWANSON_RELAY_SIGNAL"
          },
      pass_rule: "A lane is functional only when the UI reports success and the matching log or receipt path exists."
    };
  }

  if (ideaId === "version_decision_picklist") {
    const versions = versionPreviews();
    return {
      source_manifest_path: rel(VERSION_PREVIEW_MANIFEST_PATH),
      version_count: versions.length,
      picklist: versions.map((version) => ({
        version_id: version.id,
        title: version.title,
        family: version.family,
        status: version.status,
        suggested_operator_action: suggestedVersionAction(version.status),
        available_buttons: ["KEEP", "STEAL_PARTS", "LET_DIE"],
        source_url: version.source_url,
        source_path: version.source_path,
        evidence_path: version.evidence_path,
        useful_parts: version.useful_parts,
        human_meaning: version.why_it_matters,
        boundary: version.honest_boundary
      })),
      decision_receipts: {
        endpoint: "/api/version-preview/decision",
        log_path: rel(VERSION_DECISION_LOG_PATH),
        speaker_event_path: rel(INTERFACE_NOTIFY_LOG_PATH),
        success_copy: "<title>: <decision> saved."
      },
      merge_boundary: "Dashboard/site preview decisions only. Do not consume or mutate unrelated source material."
    };
  }

  if (ideaId === "button_relay_smoke_pack") {
    return {
      smoke_pack_scope: "Visible Feral Membrane and Swanson relay controls only.",
      button_contracts: [
        {
          surface: "Version Preview Wall",
          buttons: ["KEEP", "STEAL PARTS", "LET DIE"],
          endpoint: "/api/version-preview/decision",
          writes: ["tinkarden/membrane/version_preview_decisions/*.json", rel(VERSION_DECISION_LOG_PATH), rel(INTERFACE_NOTIFY_LOG_PATH)],
          success_signal: "<version title>: <decision> saved.",
          blocker_signal: "BLOCKER: <error>"
        },
        {
          surface: "Final Assembly Decision Previews",
          buttons: ["Merge", "Keep", "Let Die"],
          endpoint: "/api/final-assembly/decision",
          writes: ["tinkarden/membrane/final_assembly_decisions/{module_id}.json", rel(DECISION_LOG_PATH), rel(INTERFACE_NOTIFY_LOG_PATH)],
          success_signal: "Receipt written: tinkarden/membrane/final_assembly_decisions/{module_id}.json",
          blocker_signal: "Decision receipt failed."
        },
        {
          surface: "G / Next Three Builds",
          buttons: ["Build receipt", "Rebuild receipt"],
          endpoint: "/api/final-assembly/next-best-idea",
          writes: ["tinkarden/membrane/next_best_ideas/*.json", rel(BUILD_LOG_PATH), rel(INTERFACE_NOTIFY_LOG_PATH)],
          success_signal: "Built: tinkarden/membrane/next_best_ideas/*.json",
          blocker_signal: "Next-three build failed."
        },
        {
          surface: "Top 3 Optional Packets",
          buttons: ["Create optional packet"],
          endpoint: "/api/top-three/optional-packet",
          writes: ["tinkarden/membrane/optional_packets/*.json", rel(OPTIONAL_PACKET_LOG_PATH), rel(INTERFACE_NOTIFY_LOG_PATH)],
          success_signal: "Optional packet receipt path should be visible on the card.",
          blocker_signal: "Optional packet creation error should be visible on the card."
        },
        {
          surface: "Transaction Conveyor Belt",
          buttons: ["Momentum Tap"],
          endpoint: "/api/velocity/momentum-tap",
          writes: ["tinkarden/membrane/momentum_taps/*.json", rel(MOMENTUM_TAP_LOG_PATH), rel(INTERFACE_NOTIFY_LOG_PATH)],
          success_signal: "Momentum tapped",
          blocker_signal: "Momentum tap blocker should name the failed write."
        },
        {
          surface: "Swanson Functional Relay",
          buttons: ["KEEP", "KILL", "STEAL", "MERGE"],
          endpoint: "/api/swanson/functional-relay",
          writes: ["tinkerden/dispatch/packets/*.json", "data/tinkerden/receipts/*.json", rel(SWANSON_RELAY_LOG_PATH), rel(INTERFACE_NOTIFY_LOG_PATH)],
          success_signal: "PACKET_RELAY_COMPLETE with no_auto_send=true.",
          blocker_signal: "KEEP_KILL_STEAL_MERGE_REQUIRED or route error."
        }
      ],
      current_log_counts: {
        version_preview_decisions: latestCount(VERSION_DECISION_LOG_PATH),
        final_assembly_decisions: latestCount(DECISION_LOG_PATH),
        optional_packets: latestCount(OPTIONAL_PACKET_LOG_PATH),
        momentum_taps: latestCount(MOMENTUM_TAP_LOG_PATH),
        swanson_relays: latestCount(SWANSON_RELAY_LOG_PATH)
      },
      pass_rule: "A button passes only when the UI shows success and a durable receipt/log record exists.",
      merge_boundary: "Smoke tests cover dashboard/site controls only. No unrelated source material belongs in this action lane."
    };
  }

  if (ideaId === "swanson_adapter_contract") {
    const versions = versionPreviews();
    const decisions = latestDecisions();
    const decisionIds = new Set(Array.from(decisions.keys()));
    return {
      adapter_id: "site_review_to_swanson_functional_relay",
      target_consumer: "Swanson functional relay page",
      required_inputs: [
        {
          name: "version preview decisions",
          path: rel(VERSION_DECISION_LOG_PATH),
          event_type: "version_preview_decision",
          current_count: latestCount(VERSION_DECISION_LOG_PATH)
        },
        {
          name: "final assembly decisions",
          path: rel(DECISION_LOG_PATH),
          event_type: "final_assembly_decision",
          current_count: latestCount(DECISION_LOG_PATH)
        },
        {
          name: "optional packets",
          path: rel(OPTIONAL_PACKET_LOG_PATH),
          event_type: "optional_packet_created",
          current_count: latestCount(OPTIONAL_PACKET_LOG_PATH)
        },
        {
          name: "momentum taps",
          path: rel(MOMENTUM_TAP_LOG_PATH),
          event_type: "momentum_tap",
          current_count: latestCount(MOMENTUM_TAP_LOG_PATH)
        },
        {
          name: "Swanson relay receipts",
          path: rel(SWANSON_RELAY_LOG_PATH),
          event_type: "swanson_functional_relay",
          current_count: latestCount(SWANSON_RELAY_LOG_PATH)
        }
      ],
      required_outputs: [
        "Show selected version/module decisions before relay.",
        "Show packet_id, relay_id, receipt_id, and receipt_path after Swanson relay.",
        "Show clipboard_verified and no_auto_send instead of claiming an external send.",
        "Show source-missing or blocked route state when a candidate path cannot be proven."
      ],
      open_final_assembly_decisions: modules
        .filter((module) => !decisionIds.has(module.id))
        .map((module) => ({
          module_id: module.id,
          title: module.title,
          proof_path: module.proof_path,
          required_buttons: ["MERGE", "KEEP", "LET_DIE"]
        })),
      blocked_or_source_only_versions: versions
        .filter((version) => version.status !== "LIVE_SCREENSHOT")
        .map((version) => ({
          version_id: version.id,
          title: version.title,
          status: version.status,
          source_path: version.source_path,
          evidence_path: version.evidence_path,
          action: suggestedVersionAction(version.status)
        })),
      swanson_guardrails: [
        "No auto-send.",
        "No account automation.",
        "Operator must approve paste/send manually.",
        "Independent source-material tracks stay separate from this adapter."
      ],
      merge_boundary: "This contract adapts site/dashboard receipts into Swanson. It must not read from independent source-material folders."
    };
  }

  if (ideaId === "operator_decision_summary") {
    const decisions = latestDecisions();
    return {
      decision_coverage: modules.map((module) => {
        const decision = decisions.get(module.id);
        return {
          module_id: module.id,
          title: module.title,
          current_state: module.merge_state,
          decision: decision ? text(decision.decision, "UNKNOWN") : "UNDECIDED",
          decision_path: decision ? text(decision.decision_path, "decision_path_missing") : null,
          action_required: !decision
        };
      }),
      open_decisions: modules.filter((module) => !decisions.has(module.id)).map((module) => module.id),
      decision_log_path: rel(DECISION_LOG_PATH)
    };
  }

  if (ideaId === "swanson_merge_checklist") {
    const decisions = latestDecisions();
    return {
      checklist: [
        {
          gate: "candidate_manifest_exists",
          pass: fs.existsSync(BUILD_LOG_PATH),
          evidence_path: rel(BUILD_LOG_PATH)
        },
        {
          gate: "operator_decisions_recorded",
          pass: decisions.size === modules.length,
          evidence_path: rel(DECISION_LOG_PATH),
          open_count: Math.max(0, modules.length - decisions.size)
        },
        {
          gate: "swanson_relay_log_exists",
          pass: fs.existsSync(SWANSON_RELAY_LOG_PATH),
          evidence_path: rel(SWANSON_RELAY_LOG_PATH)
        },
        {
          gate: "no_auto_send_guardrail",
          pass: true,
          evidence: "G artifacts and Swanson relay records declare no_auto_send."
        }
      ],
      required_sources: [
        pathStatus(rel(OPTIONAL_PACKET_LOG_PATH)),
        pathStatus(rel(MOMENTUM_TAP_LOG_PATH)),
        pathStatus(rel(SWANSON_RELAY_LOG_PATH)),
        pathStatus(rel(BUILD_LOG_PATH)),
        pathStatus(rel(DECISION_LOG_PATH))
      ]
    };
  }

  if (ideaId === "receipt_health_check") {
    return {
      module_health: modules.map((module) => {
        const proof = pathStatus(module.proof_path);
        return {
          module_id: module.id,
          title: module.title,
          state: module.merge_state,
          proof,
          merge_ready_from_path_health: proof.exists
        };
      }),
      log_health: [
        pathStatus(rel(BUILD_LOG_PATH)),
        pathStatus(rel(DECISION_LOG_PATH)),
        pathStatus(rel(OPTIONAL_PACKET_LOG_PATH)),
        pathStatus(rel(MOMENTUM_TAP_LOG_PATH)),
        pathStatus(rel(SWANSON_RELAY_LOG_PATH))
      ]
    };
  }

  if (ideaId === "operator_momentum_script") {
    return {
      script_steps: [
        "Pick one Top Three move as food.",
        "Build an optional packet from that move.",
        "Momentum Tap the staged capsule.",
        "Send it through Swanson functional relay only after the operator approves paste/send.",
        "Return receipt to TinkerDen and Speaker."
      ],
      expected_sources: [
        "tinkarden/membrane/recommendation_cards.json",
        "tinkarden/membrane/optional_packets.jsonl",
        "tinkarden/membrane/momentum_taps.jsonl",
        "tinkarden/membrane/swanson_functional_relays.jsonl"
      ]
    };
  }

  if (ideaId === "let_die_ledger") {
    return {
      retirement_candidates: modules.map((module) => ({
        module_id: module.id,
        title: module.title,
        proof_path: module.proof_path,
        current_state: module.merge_state,
        retirement_rule: "Retire only after an operator Let Die decision receipt exists."
      })),
      preservation_rule: "Do not delete proof paths as part of UI pruning."
    };
  }

  return {
    manifest_modules: modules,
    merge_contract: {
      required_operator_decisions: modules.map((module) => module.id),
      no_auto_merge: true,
      final_consumer: "Swanson functional relay page"
    }
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    builds: latestBuilds(),
    build_log_path: rel(BUILD_LOG_PATH)
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BuildRequest;
    const ideaId = text(body.idea_id).replace(/[\s-]+/g, "_") as IdeaId;
    const idea = IDEAS[ideaId];
    if (!idea) {
      return NextResponse.json({ ok: false, error: "KNOWN_NEXT_BEST_IDEA_REQUIRED" }, { status: 400 });
    }

    const modules = normalizeModules(body.modules);
    const createdAt = new Date().toISOString();
    const buildId = `next_best_idea_${safeName(ideaId)}_${stamp()}_${crypto.randomBytes(3).toString("hex")}`;
    const artifactPath = path.join(BUILD_DIR, `${safeName(buildId)}.json`);
    const build = {
      schema: "feral_membrane_next_best_idea_build_v0",
      event_type: "final_assembly_next_best_idea_built",
      build_id: buildId,
      idea_id: ideaId,
      title: idea.title,
      status: idea.status,
      output: idea.output,
      why: idea.why,
      next: idea.next,
      payload: buildPayload(ideaId, modules),
      module_count: modules.length,
      artifact_path: rel(artifactPath),
      build_log_path: rel(BUILD_LOG_PATH),
      event_path: rel(INTERFACE_NOTIFY_LOG_PATH),
      operator_command: "G = build your next three best ideas",
      no_code_merge_performed: true,
      no_auto_send: true,
      created_at: createdAt
    };
    const recordWithHash = {
      ...build,
      sha256: sha256(build)
    };

    fs.mkdirSync(BUILD_DIR, { recursive: true });
    fs.writeFileSync(artifactPath, `${JSON.stringify(recordWithHash, null, 2)}\n`, "utf8");
    writeJsonl(BUILD_LOG_PATH, recordWithHash);
    writeJsonl(INTERFACE_NOTIFY_LOG_PATH, recordWithHash);

    return NextResponse.json({
      ok: true,
      build: recordWithHash
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "NEXT_BEST_IDEA_BUILD_FAILED" },
      { status: 500 }
    );
  }
}
