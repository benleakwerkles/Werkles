import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import AuthorizationSurface from "./AuthorizationSurface";
import BranchDashboardSourceGallery, { type DashboardSourceManifest } from "./BranchDashboardSourceGallery";
import CommandDashRelay from "./CommandDashRelay";
import EngineRoom from "./EngineRoom";
import FinalAssemblyWorkbench, { type AssemblyModule } from "./FinalAssemblyWorkbench";
import MainDashWorkbench from "./MainDashWorkbench";
import TopThreeOptionalPackets from "./TopThreeOptionalPackets";
import VelocityFlightDeck, { type ActionCapsule, type VelocityNode } from "./VelocityFlightDeck";
import VersionPreviewWall, { type VersionPreviewManifest } from "./VersionPreviewWall";

export const dynamic = "force-dynamic";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
const TINKARDEN_ROOT = path.join(REPO_ROOT, "tinkarden");
const SPEAKER_ROOT = path.join(REPO_ROOT, "speaker");
const MEMBRANE_ROOT = path.join(TINKARDEN_ROOT, "membrane");
const NERVOUS_ROOT = path.join(TINKARDEN_ROOT, "nervous_system");
const SERVER_ROOT = path.join(TINKARDEN_ROOT, "server");
const TINKERDEN_ROOT = path.join(REPO_ROOT, "tinkerden");
const FOREMAN_ROOT = path.join(REPO_ROOT, "foreman");
const DATA_ROOT = path.join(REPO_ROOT, "data");

const PATHS = {
  bootloader: path.join(NERVOUS_ROOT, "bootloader.js"),
  activeContext: path.join(NERVOUS_ROOT, "active_context.txt"),
  recommendations: path.join(MEMBRANE_ROOT, "recommendation_cards.json"),
  branchDashboardSources: path.join(MEMBRANE_ROOT, "branch_dashboard_sources.json"),
  versionPreviews: path.join(MEMBRANE_ROOT, "version_preview_manifest.json"),
  driftLog: path.join(MEMBRANE_ROOT, "drift_log.json"),
  momentumTaps: path.join(MEMBRANE_ROOT, "momentum_taps.jsonl"),
  optionalPackets: path.join(MEMBRANE_ROOT, "optional_packets.jsonl"),
  swansonRelays: path.join(MEMBRANE_ROOT, "swanson_functional_relays.jsonl"),
  frictionalHeatMembrane: path.join(MEMBRANE_ROOT, "frictional_heat.json"),
  frictionalHeatNervous: path.join(NERVOUS_ROOT, "frictional_heat.json"),
  changeCapsules: path.join(TINKARDEN_ROOT, "change_capsules"),
  circulationDb: path.join(SERVER_ROOT, "circulation.db"),
  speakerIngestLog: path.join(SPEAKER_ROOT, "logs", "ingest.jsonl"),
  autonomicHarvestLog: path.join(SPEAKER_ROOT, "logs", "autonomic-harvest.jsonl"),
  stagedDoctrine: path.join(SPEAKER_ROOT, "doctrine", "staged"),
  stagedReceipts: path.join(SPEAKER_ROOT, "receipts", "staged"),
  rawReceiptInbox: path.join(SPEAKER_ROOT, "receipts", "raw", "inbox"),
  thinkItOriginDash: path.join(TINKERDEN_ROOT, "aeye-relay", "origin-dash", "ThinkIt_Betsy"),
  realAeyeReceipts: path.join(TINKERDEN_ROOT, "aeye-relay", "receipts"),
  tinkerdenInbox: path.join(TINKERDEN_ROOT, "inbox"),
  tinkerdenReceipts: path.join(TINKERDEN_ROOT, "receipts"),
  dataTinkerdenReceipts: path.join(DATA_ROOT, "tinkerden", "receipts"),
  wonkaLoopInbox: path.join(FOREMAN_ROOT, "soledash", "wonka-den", "aeye-loop", "inbox"),
  wonkaLoopResponses: path.join(FOREMAN_ROOT, "soledash", "wonka-den", "aeye-loop", "responses")
};

const PEARL_CANDIDATES = [
  path.join(NERVOUS_ROOT, "PEARL_0000_THE_TINKULARITY.md"),
  path.join(TINKARDEN_ROOT, "doctrine", "PEARL_0000_THE_TINKULARITY.md"),
  path.join(REPO_ROOT, "speaker", "PEARL_0000_THE_TINKULARITY.md"),
  path.join(REPO_ROOT, "foreman", "speaker", "PEARL_0000_THE_TINKULARITY.md")
];

type SourceState<T> =
  | { ok: true; path: string; data: T }
  | { ok: false; path: string; error: string; data: T };

type RecommendationCard = {
  id?: string;
  card_id?: string;
  title?: string;
  move?: string;
  why?: string;
  why_now?: string;
  target_aeye?: string;
  target?: string;
  risk_class?: string;
  recommendation?: string;
};

type DriftItem = {
  id?: string;
  sensor?: string;
  severity?: string;
  code?: string;
  message?: string;
  timestamp?: string;
  source_path?: string;
};

type MomentumTap = {
  capsule_id?: string;
  status?: string;
  awaiting?: string;
  created_at?: string;
  receipt_path?: string;
};

type ShadowRow = {
  shadow_id: string;
  created_at: string;
  action_type: string;
  payload_json: string;
  mock_diff_json: string;
};

type InitialInFlightPacket = {
  shadow_id: string;
  created_at: string;
  status: string;
  target_aeye: string;
  action: string;
  mock_diff_summary?: string;
  stalled: boolean;
  stall_tone: "TEAL" | "AMBER" | "RED" | "NONE";
  stall_reason?: string | null;
};

type Capsule = {
  name: string;
  path: string;
  last_write_time: string;
  excerpt: string;
};

type JsonRecord = Record<string, unknown>;

type MissionControl = {
  title: string;
  status: string;
  bootloaderPath: string;
  activeContextPath: string;
  pearlPath: string;
  excerpt: string;
};

function rel(filePath: string) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join("/");
}

function readText(filePath: string) {
  return fs.readFileSync(filePath, "utf8");
}

function excerpt(value: string, length = 420) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= length) return compact;
  return `${compact.slice(0, length - 3)}...`;
}

function readJson<T>(filePath: string, fallback: T): SourceState<T> {
  try {
    return { ok: true, path: rel(filePath), data: JSON.parse(readText(filePath)) as T };
  } catch (error) {
    return {
      ok: false,
      path: rel(filePath),
      error: error instanceof Error ? error.message : String(error),
      data: fallback
    };
  }
}

function loadDashboardSourceManifest(): DashboardSourceManifest | null {
  try {
    return JSON.parse(readText(PATHS.branchDashboardSources)) as DashboardSourceManifest;
  } catch {
    return null;
  }
}

function loadVersionPreviewManifest(): VersionPreviewManifest | null {
  try {
    return JSON.parse(readText(PATHS.versionPreviews)) as VersionPreviewManifest;
  } catch {
    return null;
  }
}

function firstExisting(paths: string[]) {
  return paths.find((candidate) => fs.existsSync(candidate));
}

function listFiles(directory: string, extension = ".json") {
  try {
    return fs
      .readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
      .map((entry) => {
        const filePath = path.join(directory, entry.name);
        const stat = fs.statSync(filePath);
        return { filePath, relPath: rel(filePath), mtime: stat.mtime.toISOString() };
      })
      .sort((left, right) => right.mtime.localeCompare(left.mtime));
  } catch {
    return [];
  }
}

function readLatestJson(directory: string) {
  const latest = listFiles(directory)[0];
  if (!latest) return null;
  try {
    return { ...latest, data: JSON.parse(readText(latest.filePath)) as JsonRecord };
  } catch {
    return { ...latest, data: {} as JsonRecord };
  }
}

function loadMissionControl(): MissionControl {
  const pearlPath = firstExisting(PEARL_CANDIDATES);
  const bootloaderExists = fs.existsSync(PATHS.bootloader);
  let activeContext = "";

  if (bootloaderExists) {
    try {
      execFileSync(process.execPath, [PATHS.bootloader], {
        cwd: NERVOUS_ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 120000
      });
    } catch {
      return {
        title: "Mission Control",
        status: "BOOTLOADER_ERROR",
        bootloaderPath: rel(PATHS.bootloader),
        activeContextPath: rel(PATHS.activeContext),
        pearlPath: pearlPath ? rel(pearlPath) : "PEARL_0000_THE_TINKULARITY.md missing",
        excerpt: "bootloader.js exists but did not complete during server render."
      };
    }

    if (fs.existsSync(PATHS.activeContext)) {
      activeContext = readText(PATHS.activeContext);
    }
  }

  if (pearlPath) {
    return {
      title: "Mission Control",
      status: bootloaderExists ? "BOOTLOADER_READY" : "BOOTLOADER_MISSING_PEARL_FOUND",
      bootloaderPath: rel(PATHS.bootloader),
      activeContextPath: rel(PATHS.activeContext),
      pearlPath: rel(pearlPath),
      excerpt: excerpt(activeContext || readText(pearlPath))
    };
  }

  return {
    title: "Mission Control",
    status: "SOURCE_MISSING",
    bootloaderPath: rel(PATHS.bootloader),
    activeContextPath: rel(PATHS.activeContext),
    pearlPath: "PEARL_0000_THE_TINKULARITY.md missing",
    excerpt:
      "Mission Control is waiting for BIRD_0034 physical output: bootloader.js, active_context.txt, and PEARL_0000_THE_TINKULARITY.md."
  };
}

function normalizeRecommendations(source: SourceState<unknown>): RecommendationCard[] {
  const value = source.data as { cards?: RecommendationCard[] } | RecommendationCard[];
  const cards = Array.isArray(value) ? value : Array.isArray(value?.cards) ? value.cards : [];
  return cards.slice(0, 3);
}

function loadCapsules(): Capsule[] {
  if (!fs.existsSync(PATHS.changeCapsules)) return [];

  return fs
    .readdirSync(PATHS.changeCapsules, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => {
      const filePath = path.join(PATHS.changeCapsules, entry.name);
      const stat = fs.statSync(filePath);
      return {
        name: entry.name,
        path: rel(filePath),
        last_write_time: stat.mtime.toISOString(),
        excerpt: excerpt(readText(filePath), 220)
      };
    })
    .sort((left, right) => right.last_write_time.localeCompare(left.last_write_time));
}

function loadFrictionalHeat(): SourceState<unknown> {
  const filePath = firstExisting([PATHS.frictionalHeatMembrane, PATHS.frictionalHeatNervous]) || PATHS.frictionalHeatMembrane;
  return readJson<unknown>(filePath, {
    status: "SOURCE_MISSING",
    message: "frictional_heat.json missing from tinkarden/membrane and tinkarden/nervous_system"
  });
}

function parseJsonObject(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function loadInitialInFlightPackets(): InitialInFlightPacket[] {
  if (!fs.existsSync(PATHS.circulationDb)) return [];

  try {
    const rows = JSON.parse(
      execFileSync(
        process.execPath,
        [
          "-e",
          [
            "const Database = require('better-sqlite3');",
            "const db = new Database(process.argv[1], { readonly: true });",
            "const rows = db.prepare('SELECT shadow_id, created_at, action_type, payload_json, mock_diff_json FROM shadow_cache ORDER BY created_at DESC').all();",
            "db.close();",
            "process.stdout.write(JSON.stringify(rows));"
          ].join(""),
          PATHS.circulationDb
        ],
        {
          cwd: SERVER_ROOT,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
          timeout: 30000
        }
      )
    ) as ShadowRow[];

    return rows.map((shadow) => {
      const payload = parseJsonObject(shadow.payload_json);
      const mockDiff = parseJsonObject(shadow.mock_diff_json);

      return {
        shadow_id: shadow.shadow_id,
        created_at: shadow.created_at,
        status: "WAITING_FOR_MERGE",
        target_aeye: String(payload.target_aeye || payload.target || "UNKNOWN_AEYE"),
        action: shadow.action_type,
        mock_diff_summary: typeof mockDiff.summary === "string" ? mockDiff.summary : "",
        stalled: false,
        stall_tone: "NONE",
        stall_reason: null
      };
    });
  } catch {
    return [];
  }
}

const RISK_RANK: Record<string, number> = {
  GNAT: 1,
  MOSQUITO: 2,
  WOUND: 3,
  FRACTURE: 4
};

function normalizeRisk(value?: string) {
  const risk = (value || "").toUpperCase();
  return RISK_RANK[risk] ? risk : "UNKNOWN";
}

function riskRank(value?: string) {
  return RISK_RANK[normalizeRisk(value)] || 0;
}

function highestRisk(cards: RecommendationCard[], frictionData: unknown) {
  const risks = cards.map((card) => normalizeRisk(card.risk_class));
  const frictionText = String(JSON.stringify(frictionData) || "").toUpperCase();
  for (const risk of ["FRACTURE", "WOUND", "MOSQUITO", "GNAT"]) {
    if (frictionText.includes(risk)) risks.push(risk);
  }
  return risks.sort((left, right) => riskRank(right) - riskRank(left))[0] || "UNKNOWN";
}

function containsApoptosisPending(value: unknown) {
  const text = String(JSON.stringify(value) || "").toUpperCase();
  return text.includes("APOPTOSIS") && (text.includes("PENDING") || text.includes("PATCH"));
}

function gateReasons(cards: RecommendationCard[], driftItems: DriftItem[], frictionData: unknown, risk: string, apoptosisPending: boolean) {
  const reasons: string[] = [];
  const highRiskCards = cards.filter((card) => riskRank(card.risk_class) >= RISK_RANK.WOUND);
  if (riskRank(risk) >= RISK_RANK.WOUND) reasons.push(`FRICTION_GAUGE_${risk}`);
  for (const card of highRiskCards) {
    reasons.push(`CARD_${card.id || card.card_id || "UNKNOWN"}_${normalizeRisk(card.risk_class)}`);
  }
  if (containsApoptosisPending(frictionData)) reasons.push("FRICTION_APOPTOSIS_PATCH_PENDING");
  for (const item of driftItems) {
    if (containsApoptosisPending(item)) reasons.push(`DRIFT_${item.id || item.code || "APOPTOSIS_PENDING"}`);
  }
  if (apoptosisPending && !reasons.some((reason) => reason.includes("APOPTOSIS"))) {
    reasons.push("APOPTOSIS_PATCH_PENDING");
  }
  return Array.from(new Set(reasons));
}

function shortJson(value: unknown, length = 280) {
  return excerpt(JSON.stringify(value, null, 2), length);
}

function driftTitle(item: DriftItem) {
  const code = (item.code || "").toUpperCase();
  if (code === "UNCOMMITTED_CHURN") return "The repo has too much unclosed work.";
  if (code === "UNTRACKED_CHURN") return "New files exist without preservation.";
  if (code === "STALLED_FILES") return "A handoff lane is getting stale.";
  if (code === "PORT_NOT_LISTENING") return "An expected local surface is not running.";
  if (code === "FRICTIONAL_HEAT_MISSING") return "The friction source is missing.";
  return item.message || "Drift needs review.";
}

function driftOperatorMove(item: DriftItem) {
  const code = (item.code || "").toUpperCase();
  if (code === "UNCOMMITTED_CHURN") return "Preserve or split the dirty work before starting another build lane.";
  if (code === "UNTRACKED_CHURN") return "Decide what should become a real artifact, then receipt or discard the rest.";
  if (code === "STALLED_FILES") return "Pick one stale handoff to close, refresh, or archive.";
  if (code === "PORT_NOT_LISTENING") return "Start the expected dev surface or update the expected port.";
  if (code === "FRICTIONAL_HEAT_MISSING") return "Generate frictional_heat.json or mark that source intentionally unavailable.";
  return "Read the source path and choose keep, close, or escalate.";
}

function driftTickerLine(item: DriftItem) {
  return `${item.severity || "DRIFT"}: ${driftTitle(item)} Next: ${driftOperatorMove(item)}`;
}

function readJsonl(filePath: string, limit = 25): JsonRecord[] {
  try {
    return readText(filePath)
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-limit)
      .map((line) => JSON.parse(line) as JsonRecord);
  } catch {
    return [];
  }
}

function loadFinalAssemblyModules() {
  const thinkItReturn = readLatestJson(PATHS.thinkItOriginDash);
  const realAeyeReceipt = readLatestJson(PATHS.realAeyeReceipts);
  const tinkerdenInboxCount = listFiles(PATHS.tinkerdenInbox).length;
  const tinkerdenReceiptCount = listFiles(PATHS.tinkerdenReceipts).length + listFiles(PATHS.dataTinkerdenReceipts).length;
  const latestTinkerdenReceipt = readLatestJson(PATHS.tinkerdenReceipts) || readLatestJson(PATHS.dataTinkerdenReceipts);
  const wonkaPacketCount = listFiles(PATHS.wonkaLoopInbox).length;
  const wonkaReceiptCount = listFiles(PATHS.wonkaLoopResponses).filter((file) => path.basename(file.filePath).startsWith("receipt_")).length;
  const latestWonkaReceipt = readLatestJson(PATHS.wonkaLoopResponses);
  const optionalPackets = readJsonl(PATHS.optionalPackets, 200);
  const momentumTaps = readJsonl(PATHS.momentumTaps, 200);
  const swansonRelays = readJsonl(PATHS.swansonRelays, 200);
  const latestSwansonRelay = swansonRelays[swansonRelays.length - 1];
  const modules: AssemblyModule[] = [
    {
      id: "thinkit-origin-return",
      title: "Origin return receipt",
      system: "ThinkIt",
      status: thinkItReturn ? "ORIGIN_RETURN_PROVEN" : "SOURCE_MISSING",
      merge_state: thinkItReturn ? "KEEP" : "BLOCKED",
      proof_path: thinkItReturn?.relPath || rel(PATHS.thinkItOriginDash),
      detail: thinkItReturn
        ? `Latest return answers origin dash with relay ${String(thinkItReturn.data.real_relay_id || thinkItReturn.data.relay_id || "UNKNOWN")}.`
        : "No ThinkIt origin-return JSON found.",
      next_action: "Keep origin-dash readback and expose it in the final receipt lane.",
      tone: thinkItReturn ? "teal" : "zinc"
    },
    {
      id: "tinkerden-command-receipts",
      title: "Command intake and receipts",
      system: "TinkerDen",
      status: tinkerdenInboxCount > 0 && tinkerdenReceiptCount > 0 ? "PACKET_RECEIPT_FLOW_PROVEN" : "PARTIAL",
      merge_state: tinkerdenInboxCount > 0 && tinkerdenReceiptCount > 0 ? "KEEP" : "LIVE_REVIEW",
      proof_path: latestTinkerdenReceipt?.relPath || rel(PATHS.tinkerdenReceipts),
      detail: `${tinkerdenInboxCount} command packets and ${tinkerdenReceiptCount} receipt artifacts are present across TinkerDen receipt stores.`,
      next_action: "Keep packet_id to receipt_id custody visible in the final dashboard.",
      tone: "teal"
    },
    {
      id: "wonka-aeye-loop",
      title: "Aeye loop file transport",
      system: "Wonka Den / TinkerDen",
      status: wonkaPacketCount > 0 && wonkaReceiptCount > 0 ? "FILE_BACKED_LOOP_PROVEN" : "PARTIAL",
      merge_state: wonkaPacketCount > 0 && wonkaReceiptCount > 0 ? "KEEP" : "LIVE_REVIEW",
      proof_path: latestWonkaReceipt?.relPath || rel(PATHS.wonkaLoopResponses),
      detail: `${wonkaPacketCount} inbox packets and ${wonkaReceiptCount} response receipts exist in the old Aeye loop path.`,
      next_action: "Carry forward the file-backed packet/write/receipt pattern, not just the layout.",
      tone: "cyan"
    },
    {
      id: "feral-membrane-motion",
      title: "Optional packets and motion",
      system: "Feral Membrane",
      status: optionalPackets.length > 0 ? "MOMENTUM_LANE_PROVEN" : "SOURCE_MISSING",
      merge_state: optionalPackets.length > 0 ? "KEEP" : "LIVE_REVIEW",
      proof_path: rel(PATHS.optionalPackets),
      detail: `${optionalPackets.length} optional packets and ${momentumTaps.length} momentum taps are available for the live membrane conveyor.`,
      next_action: "Keep Top 3 food as selectable packet material, then review final operator language live.",
      tone: "teal"
    },
    {
      id: "swanson-attached-relay",
      title: "Functional relay attachment",
      system: "Swanson",
      status: latestSwansonRelay ? String(latestSwansonRelay.relay_status || "ATTACHED") : "NOT_ATTACHED",
      merge_state: latestSwansonRelay ? "ATTACHED" : "LIVE_REVIEW",
      proof_path: latestSwansonRelay ? String(latestSwansonRelay.membrane_receipt_path || latestSwansonRelay.receipt_path || PATHS.swansonRelays) : rel(PATHS.swansonRelays),
      detail: latestSwansonRelay
        ? `Latest relay ${String(latestSwansonRelay.relay_id || "UNKNOWN")} is staged with clipboard_verified=${String(latestSwansonRelay.clipboard_verified)} and no_auto_send=${String(latestSwansonRelay.no_auto_send)}.`
        : "Swanson relay build is not attached yet on this membrane checkout.",
      next_action: "Use this as the live-review bridge; do not call it final until you approve the combined page behavior.",
      tone: latestSwansonRelay ? "amber" : "zinc"
    }
  ];

  return {
    modules,
    summary: {
      keep_count: modules.filter((module) => module.merge_state === "KEEP").length,
      review_count: modules.filter((module) => module.merge_state === "LIVE_REVIEW" || module.merge_state === "ATTACHED").length,
      blocker_count: modules.filter((module) => module.merge_state === "BLOCKED").length,
      generated_at: new Date().toISOString()
    }
  };
}

function loadMomentumTapMap() {
  return new Map(
    readJsonl(PATHS.momentumTaps, 200)
      .map((tap) => tap as MomentumTap)
      .filter((tap) => typeof tap.capsule_id === "string")
      .map((tap) => [tap.capsule_id as string, tap] as const)
  );
}

function applyMomentumTaps(capsules: ActionCapsule[]) {
  const taps = loadMomentumTapMap();
  return capsules.map((capsule) => {
    const tap = taps.get(capsule.id);
    return tap
      ? {
          ...capsule,
          status: tap.status || "MOMENTUM_TAPPED",
          awaiting: tap.awaiting || "SWANSON_FUNCTIONAL_RELAY_MERGE"
        }
      : capsule;
  });
}

function loadVelocityNodes(): VelocityNode[] {
  const events = [...readJsonl(PATHS.speakerIngestLog), ...readJsonl(PATHS.autonomicHarvestLog)];
  const serialized = JSON.stringify(events).toUpperCase();
  const latestMatchingTimestamp = (tokens: string[]) => {
    const matches = events
      .filter((event) => {
        const text = JSON.stringify(event).toUpperCase();
        return tokens.some((token) => text.includes(token));
      })
      .map((event) => String(event.timestamp || event.created_at || ""))
      .filter(Boolean)
      .sort()
      .reverse();

    return matches[0] || null;
  };

  return [
    {
      id: "sally",
      label: "SALLY_REPAIR",
      state: serialized.includes("RECEIPT_INBOX") ? "RECEIPT_INTAKE" : "IDLE",
      token_saturation: serialized.includes("RECEIPT_INBOX") ? 46 : 12,
      active: serialized.includes("RECEIPT_INBOX_NEW_FILE"),
      last_event_at: latestMatchingTimestamp(["RECEIPT", "INGEST"]),
      event_source: "speaker/logs/ingest.jsonl"
    },
    {
      id: "ender",
      label: "ENDER@BETSY",
      state: "COMPRESSED_THOUGHT_STREAM",
      token_saturation: serialized.includes("DOCTRINE") || serialized.includes("HARVEST") ? 74 : 28,
      active: serialized.includes("ACTIVE_DOCTRINE_NEW_MARKDOWN") || serialized.includes("TRANSACTION_CAPSULE_HARVESTED"),
      last_event_at: latestMatchingTimestamp(["DOCTRINE", "HARVEST"]),
      event_source: "speaker/logs/autonomic-harvest.jsonl"
    },
    {
      id: "thufir",
      label: "THUFIR@BETSY",
      state: serialized.includes("REBUILD_INDEX") ? "VALIDATING_INDEX" : "INDEX_STANDING_BY",
      token_saturation: serialized.includes("REBUILD_INDEX") ? 68 : 22,
      active: serialized.includes("ACTIVE_DOCTRINE_REBUILD_INDEX"),
      last_event_at: latestMatchingTimestamp(["REBUILD_INDEX"]),
      event_source: "speaker/logs/autonomic-harvest.jsonl"
    }
  ];
}

function capsuleFromEvent(event: JsonRecord): ActionCapsule | null {
  const trigger = String(event.trigger || event.event_type || "");
  const sourcePath = String(event.file_path || event.source_path || event.raw_inbox_path || "");
  if (!trigger.includes("new_") && !trigger.includes("harvested") && !trigger.includes("ingest")) return null;

  return {
    id: String(event.capsule_id || event.receipt_id || sourcePath || `capsule_${Date.now()}`),
    origin: String(event.thinker_node || event.authority || (sourcePath.includes("doctrine") ? "Ender@Betsy" : "Dink@Betsy")),
    target_mutations: [sourcePath || "speaker substrate"],
    awaiting: "PASTE_GPG_SIG",
    source_path: sourcePath || "speaker/logs/ingest.jsonl",
    status: "AWAITING_MOMENTUM_TAP",
    timestamp: String(event.timestamp || new Date().toISOString())
  };
}

function capsuleFromFile(filePath: string, origin: string): ActionCapsule {
  return {
    id: path.basename(filePath),
    origin,
    target_mutations: [rel(filePath)],
    awaiting: "PASTE_GPG_SIG",
    source_path: rel(filePath),
    status: "AWAITING_MOMENTUM_TAP",
    timestamp: fs.statSync(filePath).mtime.toISOString()
  };
}

function capsuleFromOptionalPacket(packet: JsonRecord): ActionCapsule | null {
  const packetId = String(packet.packet_id || "");
  if (!packetId) return null;

  return {
    id: packetId,
    origin: "Top 3 Petra/Skybro food",
    target_mutations: Array.isArray(packet.target_mutations) && packet.target_mutations.length > 0
      ? packet.target_mutations.map(String)
      : [`optional packet for ${String(packet.target_aeye || "operator selected target")}`],
    awaiting: String(packet.awaiting || "MOMENTUM_TAP"),
    source_path: String(packet.packet_path || packet.source_path || PATHS.optionalPackets),
    status: String(packet.status || "OPTIONAL_PACKET_CREATED"),
    timestamp: String(packet.created_at || packet.timestamp || new Date().toISOString())
  };
}

function loadInitialActionCapsules(): ActionCapsule[] {
  const eventCapsules = [...readJsonl(PATHS.speakerIngestLog), ...readJsonl(PATHS.autonomicHarvestLog)]
    .map(capsuleFromEvent)
    .filter((capsule): capsule is ActionCapsule => Boolean(capsule));
  const optionalPacketCapsules = readJsonl(PATHS.optionalPackets, 50)
    .map(capsuleFromOptionalPacket)
    .filter((capsule): capsule is ActionCapsule => Boolean(capsule));
  const stagedFiles = [PATHS.stagedDoctrine, PATHS.stagedReceipts, PATHS.rawReceiptInbox].flatMap((directory) => {
    if (!fs.existsSync(directory)) return [];
    return fs
      .readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".json")))
      .map((entry) => capsuleFromFile(path.join(directory, entry.name), directory.includes("doctrine") ? "Ender@Betsy" : "Dink@Betsy"));
  });

  return [...optionalPacketCapsules, ...stagedFiles, ...eventCapsules]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, 8);
}

export default function FeralMembranePage() {
  const mission = loadMissionControl();
  const finalAssembly = loadFinalAssemblyModules();
  const dashboardSources = loadDashboardSourceManifest();
  const versionPreviews = loadVersionPreviewManifest();
  const recommendationSource = readJson<unknown>(PATHS.recommendations, []);
  const driftSource = readJson<DriftItem[]>(PATHS.driftLog, []);
  const frictionSource = loadFrictionalHeat();
  const cards = normalizeRecommendations(recommendationSource);
  const initialInFlightPackets = loadInitialInFlightPackets();
  const capsules = loadCapsules();
  const driftItems = Array.isArray(driftSource.data) ? driftSource.data : [];
  const gateRisk = highestRisk(cards, frictionSource.data);
  const apoptosisPending =
    containsApoptosisPending(cards) ||
    containsApoptosisPending(driftItems) ||
    containsApoptosisPending(frictionSource.data) ||
    containsApoptosisPending(capsules);
  const authorizationGateReasons = gateReasons(cards, driftItems, frictionSource.data, gateRisk, apoptosisPending);
  const authorizationShadow = initialInFlightPackets[0]
    ? {
        shadow_id: initialInFlightPackets[0].shadow_id,
        created_at: initialInFlightPackets[0].created_at,
        status: initialInFlightPackets[0].status,
        target_aeye: initialInFlightPackets[0].target_aeye,
        action: initialInFlightPackets[0].action,
        mock_diff_summary: initialInFlightPackets[0].mock_diff_summary
      }
    : null;
  const velocityNodes = loadVelocityNodes();
  const actionCapsules = applyMomentumTaps(loadInitialActionCapsules());
  const driftTickerText = driftItems.length > 0
    ? driftItems.map(driftTickerLine).join("  |  ")
    : "Drift log clear: no current Wormeyes or Fleyes warnings.";

  return (
    <main className="min-h-screen bg-neutral-950 pb-14 text-zinc-100">
      <header className="border-b border-teal-400/25 bg-neutral-950 px-5 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-teal-300">ThinkIt</p>
            <h1 className="mt-1 text-2xl font-black text-zinc-50">Feral Membrane Main Dash</h1>
          </div>
          <code className="border border-teal-400/30 bg-teal-400/10 px-3 py-2 text-xs font-bold text-teal-100">
            official merge build / no chat surface
          </code>
        </div>
      </header>

      <MainDashWorkbench modules={finalAssembly.modules} versionPreviews={versionPreviews} />

      <section className="grid gap-3 p-4 xl:grid-cols-[1.12fr_0.88fr]">
        <TopThreeOptionalPackets cards={cards} sourcePath={recommendationSource.path} />
        <EngineRoom initialPackets={initialInFlightPackets} />
      </section>

      <CommandDashRelay />

      <VelocityFlightDeck initialNodes={velocityNodes} initialCapsules={actionCapsules} />

      <AuthorizationSurface
        riskLevel={gateRisk}
        gateReasons={authorizationGateReasons}
        apoptosisPending={apoptosisPending}
        shadow={authorizationShadow}
      />

      <FinalAssemblyWorkbench modules={finalAssembly.modules} summary={finalAssembly.summary} />

      <VersionPreviewWall manifest={versionPreviews} />

      <BranchDashboardSourceGallery manifest={dashboardSources} />

      <section className="grid gap-3 p-4 xl:grid-cols-[1fr_1fr]">
        <article className="border border-zinc-800 bg-neutral-900 p-4" aria-label="Mission Control WHY">
          <p className="text-xs font-black uppercase text-teal-300">Mission Control / WHY</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">{mission.title}</h2>
            <span className="border border-zinc-700 px-2 py-1 text-[0.68rem] font-black uppercase text-zinc-300">{mission.status}</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-300">{mission.excerpt}</p>
          <dl className="mt-5 grid gap-2 text-xs">
            <div>
              <dt className="font-black uppercase text-zinc-500">Bootloader</dt>
              <dd className="break-all font-mono text-zinc-300">{mission.bootloaderPath}</dd>
            </div>
            <div>
              <dt className="font-black uppercase text-zinc-500">Active context</dt>
              <dd className="break-all font-mono text-zinc-300">{mission.activeContextPath}</dd>
            </div>
            <div>
              <dt className="font-black uppercase text-zinc-500">Pearl source</dt>
              <dd className="break-all font-mono text-zinc-300">{mission.pearlPath}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="grid gap-3 px-4 pb-4 xl:grid-cols-[1fr_1fr]">
        <article className="border border-zinc-800 bg-neutral-900 p-4" aria-label="Speaker Feed MEMORY">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-teal-300">Speaker Feed / MEMORY</p>
              <h2 className="mt-1 text-xl font-black">Change Capsules</h2>
            </div>
            <span className="font-mono text-lg font-black text-teal-200">{capsules.length}</span>
          </div>
          <div className="mt-4 grid gap-3">
            {capsules.length === 0 ? (
              <p className="border border-zinc-800 bg-neutral-950 p-3 text-sm text-zinc-400">No markdown Change Capsules found.</p>
            ) : (
              capsules.map((capsule) => (
                <section key={capsule.path} className="border border-zinc-800 bg-neutral-950 p-3">
                  <h3 className="break-all text-sm font-black text-zinc-100">{capsule.name}</h3>
                  <p className="mt-1 font-mono text-[0.68rem] text-zinc-500">{capsule.path}</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">{capsule.excerpt}</p>
                </section>
              ))
            )}
          </div>
        </article>

        <article className="border border-zinc-800 bg-neutral-900 p-4" aria-label="Organism Pulse HEALTH">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-teal-300">Organism Pulse / HEALTH</p>
              <h2 className="mt-1 text-xl font-black">Drift + Friction</h2>
            </div>
            <span className="font-mono text-lg font-black text-teal-200">{driftItems.length}</span>
          </div>
          <section className="mt-4 border border-zinc-800 bg-neutral-950 p-3">
            <h3 className="text-sm font-black uppercase text-zinc-300">Frictional Heat</h3>
            <p className={`mt-2 text-xs font-bold ${frictionSource.ok ? "text-teal-200" : "text-zinc-400"}`}>
              {frictionSource.ok ? `Source online: ${frictionSource.path}` : `SOURCE_MISSING: ${frictionSource.path}`}
            </p>
            <pre className="mt-3 max-h-24 overflow-hidden whitespace-pre-wrap text-xs text-zinc-400">{shortJson(frictionSource.data, 360)}</pre>
          </section>
          <section className="mt-3 grid gap-2">
            {driftItems.length === 0 ? (
              <p className="border border-zinc-800 bg-neutral-950 p-3 text-sm text-zinc-400">No drift warnings found.</p>
            ) : (
              driftItems.slice(0, 6).map((item) => (
                <div key={item.id || item.message} className="border border-zinc-800 bg-neutral-950 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-xs uppercase text-teal-200">{item.code || "DRIFT"}</strong>
                    <span className="text-[0.65rem] uppercase text-zinc-500">{item.sensor} / {item.severity}</span>
                  </div>
                  <p className="mt-2 text-sm font-black leading-5 text-zinc-100">{driftTitle(item)}</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">{item.message}</p>
                  <p className="mt-2 border-l-2 border-teal-300/60 pl-3 text-xs font-bold leading-5 text-teal-100">
                    Next useful move: {driftOperatorMove(item)}
                  </p>
                  <p className="mt-2 break-all font-mono text-[0.66rem] text-zinc-500">{item.source_path || driftSource.path}</p>
                </div>
              ))
            )}
          </section>
        </article>
      </section>

      <footer className="fixed inset-x-0 bottom-0 z-20 grid min-h-10 grid-cols-[max-content_minmax(0,1fr)] items-center gap-3 border-t border-teal-400/25 bg-neutral-950 px-4 py-2 text-xs shadow-2xl" aria-label="Drift Log footer">
        <span className="font-black uppercase text-teal-300">Drift Log</span>
        <div className="overflow-hidden whitespace-nowrap font-mono text-zinc-300">
          <span className="inline-block animate-[ticker_140s_linear_infinite]">{driftTickerText}</span>
        </div>
      </footer>
    </main>
  );
}
