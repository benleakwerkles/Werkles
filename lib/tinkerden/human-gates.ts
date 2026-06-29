import { createHash } from "node:crypto";
import { appendFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type HumanGateTier = "TIER_1" | "TIER_2";
export type HumanGateDecision = "APPROVED" | "REJECTED" | "PATCH_REQUESTED" | "PAUSED";

export type ActiveHumanGate = {
  gate_id: string;
  title: string;
  tier: HumanGateTier;
  status: string;
  source: string;
  artifact_path: string | null;
  html_path: string | null;
  approval_phrase: string;
  rejection_phrase: string;
  patch_phrase: string;
  confidence: string;
  unknowns: string[];
  blast_radius: string[];
  what_remains_blocked: string[];
  created_at: string;
};

export type HumanGateDecisionLogEntry = {
  timestamp: string;
  gate_name: string;
  gate_artifact_path: string;
  exact_ben_phrase: string;
  decision: string;
  next_gate: string;
  receipt_id: string;
  receipt_path: string;
  next_action_path: string;
};

type JsonRecord = Record<string, unknown>;

const REVIEWS_DIR = "foreman/reviews";
const APPROVAL_LOG_PATH = "foreman/gates/APPROVAL_LOG.md";
const ACTIVE_QUEUE_PATH = "foreman/gates/ACTIVE_QUEUE.json";
const MANIFEST_PATH = "foreman/gates/MANIFEST.json";
const HEALTH_REPORT_PATH = "foreman/gates/HEALTH.json";
const CURRENT_GATE_PACKET_PATH = "foreman/gates/CURRENT_GATE_PACKET.md";
const OPERATOR_BRIEF_PATH = "foreman/gates/OPERATOR_BRIEF.md";
const AGENT_HANDOFF_PATH = "foreman/gates/AGENT_HANDOFF.json";
const DECISION_RECEIPTS_DIR = "foreman/gates/decisions";
const LATEST_DECISION_PATH = "foreman/gates/LATEST_DECISION.json";
const CURRENT_GATE_REVIEW_PATH = "foreman/reviews/CURRENT_GATE_REVIEW.html";
const NEXT_ACTION_PATH = "foreman/NEXT_ACTION.md";
const HUMAN_GATES_PATH = "foreman/HUMAN_GATES.md";

function repoPath(relativePath: string) {
  return path.join(process.cwd(), relativePath);
}

function slash(value: string) {
  return value.split(path.sep).join("/");
}

function safeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "human-gate";
}

function compactStamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function receiptStamp(date = new Date()) {
  return date.toISOString().replace(/[-:.]/g, "").slice(0, 15);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function listLines(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => text(item)).filter(Boolean);
  const raw = text(value);
  if (!raw) return [];
  return raw.split(/\r?\n/).map((line) => line.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
}

async function readText(relativePath: string) {
  try {
    return await readFile(repoPath(relativePath), "utf8");
  } catch {
    return "";
  }
}

async function readJson(relativePath: string): Promise<JsonRecord | null> {
  try {
    return JSON.parse(await readFile(repoPath(relativePath), "utf8")) as JsonRecord;
  } catch {
    return null;
  }
}

async function listFiles(relativeDir: string) {
  try {
    const entries = await readdir(repoPath(relativeDir), { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => slash(path.join(relativeDir, entry.name)));
  } catch {
    return [];
  }
}

function classifyTier(title: string, blastRadius: string[] = []): HumanGateTier {
  const haystack = `${title}\n${blastRadius.join("\n")}`.toLowerCase();
  if (/(deploy|release|sql|schema|rls|policy|production|stripe|billing|secret|oauth|legal|public|doctrine|protocol|architecture|provider|budget|spend)/.test(haystack)) {
    return "TIER_1";
  }
  return "TIER_2";
}

function parseEffectiveGate(nextAction: string): ActiveHumanGate | null {
  const match = nextAction.match(/\*\*Effective gate:\*\*\s*`?([^`\r\n]+)`?/i);
  if (!match) return null;
  const gate = match[1].trim();
  const pointerStatus = /^\[AWAITING HUMAN GATE:/i.test(gate)
    ? "AWAITING_HUMAN_GATE_POINTER"
    : /^\[IN PROGRESS:/i.test(gate)
      ? "IN_PROGRESS_POINTER"
      : "ACTIVE_POINTER";
  return {
    gate_id: safeSlug(gate),
    title: gate,
    tier: classifyTier(gate),
    status: pointerStatus,
    source: NEXT_ACTION_PATH,
    artifact_path: null,
    html_path: null,
    approval_phrase: `APPROVE ${gate.replace(/^\[[^\]:]+:\s*|\]$/g, "")}`,
    rejection_phrase: `REJECT ${gate.replace(/^\[[^\]:]+:\s*|\]$/g, "")}`,
    patch_phrase: `PATCH ${gate.replace(/^\[[^\]:]+:\s*|\]$/g, "")}:`,
    confidence: "LOW",
    unknowns:
      pointerStatus === "AWAITING_HUMAN_GATE_POINTER"
        ? ["Parsed from NEXT_ACTION effective gate; no gate-specific review artifact is linked yet."]
        : ["Parsed from NEXT_ACTION effective gate."],
    blast_radius: [],
    what_remains_blocked:
      pointerStatus === "AWAITING_HUMAN_GATE_POINTER"
        ? ["Durable approval, rejection, patch, or pause must be recorded in foreman/gates/APPROVAL_LOG.md."]
        : ["No approval implied. Continue only inside approved lane limits."],
    created_at: "UNKNOWN"
  };
}

async function gateFromReview(markdownPath: string): Promise<ActiveHumanGate | null> {
  const raw = await readText(markdownPath);
  if (!raw.trim()) return null;
  const title = raw.match(/^#\s*(.+)$/m)?.[1]?.trim() || path.basename(markdownPath, ".md");
  const displayTitle = title.replace(/^Gate Review:\s*/i, "");
  const gate = raw.match(/\[AWAITING HUMAN GATE:\s*([^\]]+)\]/i)?.[1]?.trim() || title;
  const confidence = raw.match(/Confidence:\s*(HIGH|MEDIUM|LOW)/i)?.[1]?.toUpperCase() || "UNKNOWN";
  const approvalPhrase = raw.match(/## Approval Phrase[\s\S]*?```text\s*([\s\S]*?)```/i)?.[1]?.trim() || `APPROVE ${gate}`;
  const rejectionPhrase = raw.match(/## Rejection Phrase[\s\S]*?```text\s*([\s\S]*?)```/i)?.[1]?.trim() || `REJECT ${gate}`;
  const patchPhrase = raw.match(/## Patch Phrase[\s\S]*?```text\s*([\s\S]*?)```/i)?.[1]?.trim() || `PATCH ${gate}:`;
  const htmlPath = markdownPath.replace(/\.md$/i, ".html");

  return {
    gate_id: safeSlug(gate),
    title: displayTitle,
    tier: "TIER_1",
    status: "REVIEW_ARTIFACT_READY",
    source: markdownPath,
    artifact_path: markdownPath,
    html_path: (await readText(htmlPath)).trim() ? htmlPath : null,
    approval_phrase: approvalPhrase,
    rejection_phrase: rejectionPhrase,
    patch_phrase: patchPhrase,
    confidence,
    unknowns: sectionBullets(raw, "Unknowns"),
    blast_radius: sectionBullets(raw, "Blast Radius"),
    what_remains_blocked: sectionBullets(raw, "What Remains Blocked"),
    created_at: "UNKNOWN"
  };
}

function sectionBullets(markdown: string, heading: string) {
  const match = markdown.match(new RegExp(`## ${heading}\\s*([\\s\\S]*?)(?=\\n## |$)`, "i"));
  if (!match) return [];
  return match[1].split(/\r?\n/).map((line) => line.trim()).filter((line) => line.startsWith("-")).map((line) => line.replace(/^-\s*/, ""));
}

export async function readHumanGateDashboard() {
  const [nextAction, approvalLog, reviewFiles] = await Promise.all([
    readText(NEXT_ACTION_PATH),
    readText(APPROVAL_LOG_PATH),
    listFiles(REVIEWS_DIR)
  ]);
  const reviewGates = await Promise.all(
    reviewFiles.filter((file) => /^foreman\/reviews\/GATE-.+\.md$/i.test(file)).map((file) => gateFromReview(file))
  );
  const activePointer = parseEffectiveGate(nextAction);
  const gates = [
    ...(activePointer ? [activePointer] : []),
    ...reviewGates.filter((gate): gate is ActiveHumanGate => gate !== null)
  ];
  const decisionReceiptFiles = (await listFiles(DECISION_RECEIPTS_DIR))
    .filter((file) => /^foreman\/gates\/decisions\/.+\.json$/i.test(file))
    .sort()
    .reverse()
    .slice(0, 8);
  const latestDecisionReceipts = (await Promise.all(decisionReceiptFiles.map((file) => readJson(file)))).filter(
    (receipt): receipt is JsonRecord => receipt !== null
  );
  const latestHealthReport = await readJson(HEALTH_REPORT_PATH);

  return {
    ok: true,
    source_of_truth: [HUMAN_GATES_PATH, "foreman/LANES.md", "foreman/BUDGET.md", NEXT_ACTION_PATH, "foreman/AI_COUSINS_PROTOCOL.md"],
    active_gate_count: gates.length,
    gates,
    active_queue_path: ACTIVE_QUEUE_PATH,
    manifest_path: MANIFEST_PATH,
    health_report_path: HEALTH_REPORT_PATH,
    current_gate_packet_path: CURRENT_GATE_PACKET_PATH,
    operator_brief_path: OPERATOR_BRIEF_PATH,
    agent_handoff_path: AGENT_HANDOFF_PATH,
    current_gate_review_path: CURRENT_GATE_REVIEW_PATH,
    approval_log_path: APPROVAL_LOG_PATH,
    approval_log_tail: approvalLog.split(/\r?\n/).filter(Boolean).slice(-12),
    decision_receipts_dir: DECISION_RECEIPTS_DIR,
    latest_decision_path: LATEST_DECISION_PATH,
    latest_decision_receipts: latestDecisionReceipts,
    latest_health_report: latestHealthReport
  };
}

export function classifyHumanGateAction(input: JsonRecord) {
  const actionText = text(input.action_text) || text(input.proposed_action);
  if (!actionText) throw new Error("ACTION_TEXT_REQUIRED");
  const environment = text(input.environment, "local").toLowerCase();
  const lane = text(input.lane, "unspecified");
  const haystack = `${actionText}\n${environment}\n${lane}`.toLowerCase();
  const tier1Reason =
    /(login|oauth|account creation|billing|credit card|secret|api key|password|live deploy|deploy|push|merge|sql|schema|rls|policy|production data|insert|update|delete|provider account|public launch|external send|legal|compliance|spend|budget|doctrine|protocol|architecture)/.exec(
      haystack
    )?.[0] ?? null;
  const nonGateReason =
    /(typecheck|build|lint|health check|local route load|webhook callback proof|one test request|dry run|upload-path proof|scaffold verification|read-only|smoke test|local api read)/.exec(
      haystack
    )?.[0] ?? null;
  const tier2Reason =
    /(minor copy|visual|taste|scaffold review|local-only|choose between|review-only)/.exec(haystack)?.[0] ?? null;

  if (tier1Reason) {
    return {
      ok: true,
      mutation: false,
      classification: "TIER_1_HUMAN_GATE",
      stop_required: true,
      reason: `Matched Tier 1 trigger: ${tier1Reason}`,
      required_artifacts: ["foreman/reviews/GATE-<short-slug>-<yyyymmdd-HHMM>.md", "foreman/reviews/GATE-<short-slug>-<yyyymmdd-HHMM>.html"],
      approval_log_path: APPROVAL_LOG_PATH
    };
  }

  if (nonGateReason && !/(production|live|public)/.test(environment)) {
    return {
      ok: true,
      mutation: false,
      classification: "NON_GATE_TECHNICAL_PROOF",
      stop_required: false,
      reason: `Matched non-gate technical proof: ${nonGateReason}`,
      required_artifacts: [],
      approval_log_path: APPROVAL_LOG_PATH
    };
  }

  return {
    ok: true,
    mutation: false,
    classification: "TIER_2_HUMAN_GATE",
    stop_required: true,
    reason: tier2Reason ? `Matched Tier 2 review trigger: ${tier2Reason}` : "Unclassified human decision defaults to Tier 2 unless Tier 1 risk is discovered.",
    required_artifacts: ["Concise Markdown or NEXT_ACTION.md update"],
    approval_log_path: APPROVAL_LOG_PATH
  };
}

export async function writeHumanGateQueueSnapshot() {
  const dashboard = await readHumanGateDashboard();
  const now = new Date().toISOString();
  const snapshot = {
    kind: "active_human_gate_queue_v1",
    status: "ACTIVE",
    generated_at: now,
    source_of_truth: dashboard.source_of_truth,
    active_gate_count: dashboard.active_gate_count,
    current_gate_review_path: CURRENT_GATE_REVIEW_PATH,
    approval_log_path: APPROVAL_LOG_PATH,
    next_action_path: NEXT_ACTION_PATH,
    gates: dashboard.gates.map((gate, index) => ({
      queue_position: index + 1,
      ...gate
    }))
  };
  await mkdir(path.dirname(repoPath(ACTIVE_QUEUE_PATH)), { recursive: true });
  await writeFile(repoPath(ACTIVE_QUEUE_PATH), `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return {
    ok: true,
    active_queue_path: ACTIVE_QUEUE_PATH,
    active_gate_count: dashboard.active_gate_count,
    snapshot
  };
}

export async function writeCurrentGateReviewIndex() {
  const dashboard = await readHumanGateDashboard();
  const html = currentGateReviewIndexHtml(dashboard.gates);
  await mkdir(path.dirname(repoPath(CURRENT_GATE_REVIEW_PATH)), { recursive: true });
  await writeFile(repoPath(CURRENT_GATE_REVIEW_PATH), html, "utf8");
  return {
    ok: true,
    current_gate_review_path: CURRENT_GATE_REVIEW_PATH,
    active_gate_count: dashboard.active_gate_count
  };
}

export async function writeHumanGateHealthReport() {
  const dashboard = await readHumanGateDashboard();
  const issues = dashboard.gates.flatMap((gate) => {
    const gateIssues: string[] = [];
    if (!gate.approval_phrase.trim()) gateIssues.push(`${gate.title}: missing approval phrase`);
    if (!gate.rejection_phrase.trim()) gateIssues.push(`${gate.title}: missing rejection phrase`);
    if (!gate.patch_phrase.trim()) gateIssues.push(`${gate.title}: missing patch phrase`);
    if (gate.tier === "TIER_1" && !gate.artifact_path) gateIssues.push(`${gate.title}: Tier 1 missing Markdown artifact`);
    if (gate.tier === "TIER_1" && !gate.html_path) gateIssues.push(`${gate.title}: Tier 1 missing HTML artifact`);
    return gateIssues;
  });
  if (dashboard.active_gate_count === 0) issues.push("No active gate records found.");
  const warnings = dashboard.gates
    .filter((gate) => gate.status === "AWAITING_HUMAN_GATE_POINTER" && !gate.artifact_path)
    .map((gate) => `${gate.title}: active pointer has no gate-specific review artifact yet.`);
  const report = {
    kind: "human_gate_health_v1",
    status: issues.length ? "FAIL" : warnings.length ? "WARN" : "PASS",
    generated_at: new Date().toISOString(),
    active_gate_count: dashboard.active_gate_count,
    issues,
    warnings,
    paths: {
      active_queue_path: ACTIVE_QUEUE_PATH,
      current_gate_review_path: CURRENT_GATE_REVIEW_PATH,
      current_gate_packet_path: CURRENT_GATE_PACKET_PATH,
      approval_log_path: APPROVAL_LOG_PATH,
      next_action_path: NEXT_ACTION_PATH
    }
  };
  await mkdir(path.dirname(repoPath(HEALTH_REPORT_PATH)), { recursive: true });
  await writeFile(repoPath(HEALTH_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return { ok: true, health_report_path: HEALTH_REPORT_PATH, report };
}

export async function refreshAllHumanGateArtifacts() {
  const queue = await writeHumanGateQueueSnapshot();
  const index = await writeCurrentGateReviewIndex();
  const health = await writeHumanGateHealthReport();
  const packet = await writeCurrentGatePacket();
  const brief = await writeOperatorBrief();
  const handoff = await writeAgentHandoff();
  const manifest = await writeHumanGateManifest();
  return {
    ok: true,
    active_gate_count: queue.active_gate_count,
    active_queue_path: queue.active_queue_path,
    manifest_path: manifest.manifest_path,
    current_gate_review_path: index.current_gate_review_path,
    health_report_path: health.health_report_path,
    health_status: health.report.status,
    current_gate_packet_path: packet.current_gate_packet_path,
    operator_brief_path: brief.operator_brief_path,
    agent_handoff_path: handoff.agent_handoff_path
  };
}

export async function writeHumanGateManifest() {
  const artifactPaths = [
    ACTIVE_QUEUE_PATH,
    HEALTH_REPORT_PATH,
    CURRENT_GATE_PACKET_PATH,
    OPERATOR_BRIEF_PATH,
    AGENT_HANDOFF_PATH,
    CURRENT_GATE_REVIEW_PATH
  ];
  const artifacts = await Promise.all(
    artifactPaths.map(async (artifactPath) => {
      const absolutePath = repoPath(artifactPath);
      try {
        const content = await readFile(absolutePath);
        return {
          path: artifactPath,
          sha256: createHash("sha256").update(content).digest("hex"),
          bytes: content.byteLength,
          exists: true
        };
      } catch {
        return {
          path: artifactPath,
          sha256: null,
          bytes: 0,
          exists: false
        };
      }
    })
  );
  const manifest = {
    kind: "human_gate_artifact_manifest_v1",
    status: artifacts.every((artifact) => artifact.exists) ? "PASS" : "WARN",
    generated_at: new Date().toISOString(),
    approval_log_path: APPROVAL_LOG_PATH,
    next_action_path: NEXT_ACTION_PATH,
    artifacts
  };
  await mkdir(path.dirname(repoPath(MANIFEST_PATH)), { recursive: true });
  await writeFile(repoPath(MANIFEST_PATH), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { ok: true, manifest_path: MANIFEST_PATH, manifest };
}

export async function writeOperatorBrief() {
  const dashboard = await readHumanGateDashboard();
  const health = (await readJson(HEALTH_REPORT_PATH)) ?? (await writeHumanGateHealthReport()).report;
  const nextOperatorAction = buildNextOperatorAction(dashboard.gates);
  const body = `# Human Gates Operator Brief

Status: REVIEW-ONLY

Generated: ${new Date().toISOString()}

## Current State

- Active gate records: \`${dashboard.active_gate_count}\`
- Health: \`${text(health.status, "UNKNOWN")}\`
- Approval log: \`${APPROVAL_LOG_PATH}\`
- Next action source: \`${NEXT_ACTION_PATH}\`

## Next Operator Action

${nextOperatorAction}

## Most Important Paths

- Human Gates page: \`/tinkerden/human-gates\`
- Active queue: \`${ACTIVE_QUEUE_PATH}\`
- Current packet: \`${CURRENT_GATE_PACKET_PATH}\`
- Current review index: \`${CURRENT_GATE_REVIEW_PATH}\`
- Health: \`${HEALTH_REPORT_PATH}\`
- Agent handoff: \`${AGENT_HANDOFF_PATH}\`

## Reminder

Silence is not approval. This brief does not approve, reject, patch, pause, deploy, publish, spend, call providers, touch secrets, run SQL, push, merge, or mutate production data.
`;
  await mkdir(path.dirname(repoPath(OPERATOR_BRIEF_PATH)), { recursive: true });
  await writeFile(repoPath(OPERATOR_BRIEF_PATH), body, "utf8");
  return { ok: true, operator_brief_path: OPERATOR_BRIEF_PATH, active_gate_count: dashboard.active_gate_count };
}

export async function writeAgentHandoff() {
  const dashboard = await readHumanGateDashboard();
  const health = (await readJson(HEALTH_REPORT_PATH)) ?? (await writeHumanGateHealthReport()).report;
  const handoff = {
    kind: "human_gate_agent_handoff_v1",
    status: "READY",
    generated_at: new Date().toISOString(),
    instruction: "Read cockpit files before acting. Do not treat routine technical proof as a human gate.",
    next_operator_action: buildNextOperatorAction(dashboard.gates),
    health_status: text(health.status, "UNKNOWN"),
    source_of_truth: dashboard.source_of_truth,
    paths: {
      human_gates_page: "/tinkerden/human-gates",
      active_queue_path: ACTIVE_QUEUE_PATH,
      current_gate_packet_path: CURRENT_GATE_PACKET_PATH,
      current_gate_review_path: CURRENT_GATE_REVIEW_PATH,
      operator_brief_path: OPERATOR_BRIEF_PATH,
      approval_log_path: APPROVAL_LOG_PATH,
      next_action_path: NEXT_ACTION_PATH
    },
    gates: dashboard.gates.map((gate, index) => ({
      queue_position: index + 1,
      title: gate.title,
      status: gate.status,
      tier: gate.tier,
      artifact_path: gate.artifact_path,
      html_path: gate.html_path,
      approval_phrase: gate.approval_phrase,
      blocked: gate.what_remains_blocked
    }))
  };
  await mkdir(path.dirname(repoPath(AGENT_HANDOFF_PATH)), { recursive: true });
  await writeFile(repoPath(AGENT_HANDOFF_PATH), `${JSON.stringify(handoff, null, 2)}\n`, "utf8");
  return { ok: true, agent_handoff_path: AGENT_HANDOFF_PATH, health_status: handoff.health_status };
}

export async function writeCurrentGatePacket() {
  const dashboard = await readHumanGateDashboard();
  const now = new Date().toISOString();
  const nextOperatorAction = buildNextOperatorAction(dashboard.gates);
  const body = `# Current Human Gate Packet

Status: REVIEW-ONLY

Generated: ${now}

## Source Of Truth

${dashboard.source_of_truth.map((item) => `- \`${item}\``).join("\n")}

## Active Gates

${dashboard.gates
  .map(
    (gate, index) => `### ${index + 1}. ${gate.title}

- Tier: \`${gate.tier}\`
- Status: \`${gate.status}\`
- Source: \`${gate.source}\`
- Markdown: \`${gate.artifact_path ?? "NOT_CREATED"}\`
- HTML: \`${gate.html_path ?? "NOT_REQUIRED_OR_NOT_CREATED"}\`
- Approval phrase: \`${gate.approval_phrase}\`
- Rejection phrase: \`${gate.rejection_phrase}\`
- Patch phrase: \`${gate.patch_phrase}\`
- Still blocked: ${gate.what_remains_blocked.join("; ") || "UNKNOWN"}
`
  )
  .join("\n")}

## Next Operator Action

${nextOperatorAction}

## Durable Paths

- Active queue: \`${ACTIVE_QUEUE_PATH}\`
- Current review index: \`${CURRENT_GATE_REVIEW_PATH}\`
- Health report: \`${HEALTH_REPORT_PATH}\`
- Approval log: \`${APPROVAL_LOG_PATH}\`
- Decision receipts: \`${DECISION_RECEIPTS_DIR}\`

## Non-Approval Notice

This packet is generated for review and routing. It does not approve, reject, patch, pause, deploy, publish, spend, call providers, touch secrets, run SQL, push, merge, or mutate production data.
`;
  await mkdir(path.dirname(repoPath(CURRENT_GATE_PACKET_PATH)), { recursive: true });
  await writeFile(repoPath(CURRENT_GATE_PACKET_PATH), body, "utf8");
  return { ok: true, current_gate_packet_path: CURRENT_GATE_PACKET_PATH, active_gate_count: dashboard.active_gate_count };
}

function buildNextOperatorAction(gates: ActiveHumanGate[]) {
  const awaiting = gates.find((gate) => gate.status === "AWAITING_HUMAN_GATE_POINTER");
  if (awaiting) {
    return `Review \`${awaiting.artifact_path ?? awaiting.source}\`. Ben must approve, reject, patch, or pause with the listed phrase before any blocked work proceeds.`;
  }
  const inProgress = gates.find((gate) => gate.status === "IN_PROGRESS_POINTER");
  if (inProgress) {
    return `Continue \`${inProgress.title}\` only inside approved lane limits. Do not convert routine technical proof into a human gate.`;
  }
  return "No explicit awaiting gate found. Check `foreman/NEXT_ACTION.md` before proceeding.";
}

function gateMarkdown(input: JsonRecord, gate: ActiveHumanGate) {
  const unknowns = gate.unknowns.length ? gate.unknowns : ["No unknowns entered."];
  const blastRadius = gate.blast_radius.length ? gate.blast_radius : ["No blast radius entered."];
  const blocked = gate.what_remains_blocked.length ? gate.what_remains_blocked : ["Nothing listed."];
  const filesChanged = listLines(input.files_changed);
  const systemsAffected = listLines(input.systems_affected);
  const knownRisks = listLines(input.known_risks);

  return `# Gate Review: ${gate.title}

Status: ${gate.tier} GATE REVIEW - HUMAN REVIEW REQUIRED

Gate:

\`\`\`text
[AWAITING HUMAN GATE: ${gate.title}]
\`\`\`

## Confidence

Confidence: ${gate.confidence}

Confidence justification:

- ${text(input.confidence_justification, "Created from Active Human Gates local UI. Ben must review before approval.")}

## Unknowns

${unknowns.map((item) => `- ${item}`).join("\n")}

## Blast Radius

${blastRadius.map((item) => `- ${item}`).join("\n")}

## Files Changed

${filesChanged.length ? filesChanged.map((item) => `- \`${item}\``).join("\n") : "- `UNKNOWN`"}

## Systems Affected

${systemsAffected.length ? systemsAffected.map((item) => `- ${item}`).join("\n") : "- UNKNOWN"}

## Budget / Spend Implications

- ${text(input.budget_implications, "No spend authorized by this gate artifact.")}

## Lane Status

- ${text(input.lane_status, "Lane status must be checked against foreman/LANES.md before work proceeds.")}

## Known Risks

${knownRisks.length ? knownRisks.map((item) => `- ${item}`).join("\n") : "- No known risks entered."}

## What Remains Blocked

${blocked.map((item) => `- ${item}`).join("\n")}

## Approval Phrase

\`\`\`text
${gate.approval_phrase}
\`\`\`

## Rejection Phrase

\`\`\`text
${gate.rejection_phrase}
\`\`\`

## Patch Phrase

\`\`\`text
${gate.patch_phrase}
<notes>
\`\`\`
`;
}

function gateHtml(gate: ActiveHumanGate, markdownPath: string) {
  const rows = [
    ["Status", `${gate.tier} HUMAN REVIEW REQUIRED`],
    ["Markdown", markdownPath],
    ["Approval phrase", gate.approval_phrase],
    ["Rejection phrase", gate.rejection_phrase],
    ["Patch phrase", gate.patch_phrase],
    ["Confidence", gate.confidence],
    ["Blocked", gate.what_remains_blocked.join("; ") || "UNKNOWN"]
  ];
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Gate Review - ${gate.title}</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; margin: 32px; background: #11100e; color: #f3ead8; }
    main { max-width: 980px; margin: 0 auto; }
    h1 { margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; }
    th, td { border: 1px solid #4c4136; padding: 10px; text-align: left; vertical-align: top; }
    th { width: 220px; color: #ffe0ab; }
    code { color: #f3ead8; background: #28241f; padding: 2px 5px; border-radius: 4px; }
  </style>
</head>
<body>
  <main>
    <p>ACTIVE HUMAN GATE</p>
    <h1>${gate.title}</h1>
    <p>This dashboard is review-only. It does not approve the gate.</p>
    <table>
      <tbody>
        ${rows.map(([label, value]) => `<tr><th>${label}</th><td><code>${value}</code></td></tr>`).join("\n")}
      </tbody>
    </table>
  </main>
</body>
</html>
`;
}

function currentGateReviewIndexHtml(gates: ActiveHumanGate[]) {
  const rows = gates
    .map(
      (gate, index) => `<tr>
        <td>${index + 1}</td>
        <td>${gate.title}</td>
        <td>${gate.tier}</td>
        <td>${gate.status}</td>
        <td><code>${gate.artifact_path ?? gate.source}</code></td>
        <td><code>${gate.html_path ?? "N/A"}</code></td>
        <td><code>${gate.approval_phrase}</code></td>
      </tr>`
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Current Human Gate Review</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; margin: 32px; background: #11100e; color: #f3ead8; }
    main { max-width: 1180px; margin: 0 auto; }
    p, td { color: #c8bca8; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; }
    th, td { border: 1px solid #4c4136; padding: 10px; text-align: left; vertical-align: top; }
    th { color: #ffe0ab; background: #28241f; }
    code { color: #f3ead8; background: #28241f; padding: 2px 5px; border-radius: 4px; }
  </style>
</head>
<body>
  <main>
    <p>CURRENT HUMAN GATE REVIEW INDEX</p>
    <h1>Active Human Gates</h1>
    <p>This is an index only. It does not approve, reject, patch, pause, deploy, publish, spend, or mutate production data.</p>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Gate</th>
          <th>Tier</th>
          <th>Status</th>
          <th>Markdown</th>
          <th>HTML</th>
          <th>Approval phrase</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="7">No active gate records found.</td></tr>`}
      </tbody>
    </table>
  </main>
</body>
</html>
`;
}

export async function createHumanGateReview(input: JsonRecord) {
  const title = text(input.title);
  if (!title) throw new Error("GATE_TITLE_REQUIRED");
  const tier = input.tier === "TIER_1" || input.tier === "TIER_2" ? input.tier : classifyTier(title, listLines(input.blast_radius));
  const now = new Date();
  const slug = safeSlug(title);
  const markdownPath = slash(path.join(REVIEWS_DIR, `GATE-${slug}-${compactStamp(now)}.md`));
  const htmlPath = slash(path.join(REVIEWS_DIR, `GATE-${slug}-${compactStamp(now)}.html`));
  const gate: ActiveHumanGate = {
    gate_id: slug,
    title,
    tier,
    status: "REVIEW_ARTIFACT_READY",
    source: markdownPath,
    artifact_path: markdownPath,
    html_path: tier === "TIER_1" ? htmlPath : null,
    approval_phrase: text(input.approval_phrase, `APPROVE ${title.toUpperCase()}`),
    rejection_phrase: text(input.rejection_phrase, `REJECT ${title.toUpperCase()}`),
    patch_phrase: text(input.patch_phrase, `PATCH ${title.toUpperCase()}:`),
    confidence: text(input.confidence, "MEDIUM").toUpperCase(),
    unknowns: listLines(input.unknowns),
    blast_radius: listLines(input.blast_radius),
    what_remains_blocked: listLines(input.what_remains_blocked),
    created_at: now.toISOString()
  };

  await mkdir(repoPath(REVIEWS_DIR), { recursive: true });
  await writeFile(repoPath(markdownPath), gateMarkdown(input, gate), "utf8");
  if (tier === "TIER_1") {
    await writeFile(repoPath(htmlPath), gateHtml(gate, markdownPath), "utf8");
  }
  return { ok: true, gate, markdown_path: markdownPath, html_path: tier === "TIER_1" ? htmlPath : null };
}

export async function recordHumanGateDecision(input: JsonRecord) {
  const gateName = text(input.gate_name);
  const artifactPath = text(input.gate_artifact_path);
  const exactPhrase = text(input.exact_ben_phrase);
  const decision = text(input.decision).toUpperCase() as HumanGateDecision;
  const nextGate = text(input.next_gate, "[NEXT GATE: UNSPECIFIED]");
  if (!gateName) throw new Error("GATE_NAME_REQUIRED");
  if (!artifactPath) throw new Error("GATE_ARTIFACT_PATH_REQUIRED");
  if (!exactPhrase) throw new Error("EXACT_BEN_PHRASE_REQUIRED");
  if (!["APPROVED", "REJECTED", "PATCH_REQUESTED", "PAUSED"].includes(decision)) throw new Error("VALID_DECISION_REQUIRED");

  const { gate } = await validateHumanGateDecisionInput(input);

  const now = new Date();
  const timestamp = now.toISOString();
  const receiptId = `gate_decision_${receiptStamp(now)}_${Math.random().toString(36).slice(2, 8)}`;
  const receiptPath = slash(path.join(DECISION_RECEIPTS_DIR, `${receiptId}.json`));
  const row = `| ${timestamp} | ${gateName} | ${artifactPath} | ${exactPhrase.replaceAll("|", "\\|")} | ${decision} | ${nextGate.replaceAll("|", "\\|")} |\n`;
  await mkdir(path.dirname(repoPath(APPROVAL_LOG_PATH)), { recursive: true });
  await appendFile(repoPath(APPROVAL_LOG_PATH), row, "utf8");
  await updateEffectiveGate(nextGate);
  const entry: HumanGateDecisionLogEntry = {
    timestamp,
    gate_name: gateName,
    gate_artifact_path: artifactPath,
    exact_ben_phrase: exactPhrase,
    decision,
    next_gate: nextGate,
    receipt_id: receiptId,
    receipt_path: receiptPath,
    next_action_path: NEXT_ACTION_PATH
  };
  const receipt = {
    receipt_id: receiptId,
    status: "RECORDED",
    kind: "human_gate_decision_v1",
    approval_log_path: APPROVAL_LOG_PATH,
    next_action_path: NEXT_ACTION_PATH,
    entry,
    phrase_match: true,
    gate_snapshot: gate
  };
  await mkdir(repoPath(DECISION_RECEIPTS_DIR), { recursive: true });
  await writeFile(repoPath(receiptPath), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  await writeFile(repoPath(LATEST_DECISION_PATH), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return {
    ok: true,
    approval_log_path: APPROVAL_LOG_PATH,
    next_action_path: NEXT_ACTION_PATH,
    receipt_path: receiptPath,
    latest_decision_path: LATEST_DECISION_PATH,
    entry
  };
}

export async function validateHumanGateDecisionInput(input: JsonRecord) {
  const gateName = text(input.gate_name);
  const artifactPath = text(input.gate_artifact_path);
  const exactPhrase = text(input.exact_ben_phrase);
  const decision = text(input.decision).toUpperCase() as HumanGateDecision;
  if (!gateName) throw new Error("GATE_NAME_REQUIRED");
  if (!artifactPath) throw new Error("GATE_ARTIFACT_PATH_REQUIRED");
  if (!exactPhrase) throw new Error("EXACT_BEN_PHRASE_REQUIRED");
  if (!["APPROVED", "REJECTED", "PATCH_REQUESTED", "PAUSED"].includes(decision)) throw new Error("VALID_DECISION_REQUIRED");

  const dashboard = await readHumanGateDashboard();
  const gate = dashboard.gates.find(
    (item) => item.title === gateName || item.artifact_path === artifactPath || item.source === artifactPath
  );
  if (!gate) throw new Error("GATE_RECORD_NOT_FOUND");
  validateDecisionPhrase(gate, decision, exactPhrase);
  return {
    ok: true,
    mutation: false,
    phrase_match: true,
    decision,
    gate,
    expected_phrase: expectedDecisionPhrase(gate, decision)
  };
}

function validateDecisionPhrase(gate: ActiveHumanGate, decision: HumanGateDecision, exactPhrase: string) {
  const normalizedPhrase = exactPhrase.trim();
  if (decision === "APPROVED" && normalizedPhrase === gate.approval_phrase.trim()) return;
  if (decision === "REJECTED" && normalizedPhrase === gate.rejection_phrase.trim()) return;
  if (decision === "PATCH_REQUESTED" && normalizedPhrase.startsWith(gate.patch_phrase.trim())) return;
  if (decision === "PAUSED" && /^PAUSE(?:D)?\b/i.test(normalizedPhrase)) return;
  throw new Error("EXACT_GATE_PHRASE_MISMATCH");
}

function expectedDecisionPhrase(gate: ActiveHumanGate, decision: HumanGateDecision) {
  if (decision === "APPROVED") return gate.approval_phrase;
  if (decision === "REJECTED") return gate.rejection_phrase;
  if (decision === "PATCH_REQUESTED") return `${gate.patch_phrase} <notes>`;
  return "PAUSE <reason>";
}

async function updateEffectiveGate(nextGate: string) {
  const current = await readText(NEXT_ACTION_PATH);
  const normalizedNextGate = nextGate.trim();
  const nextLine = `**Effective gate:** \`${normalizedNextGate}\``;
  const updated = current.match(/\*\*Effective gate:\*\*.*(?:\r?\n)?/)
    ? current.replace(/\*\*Effective gate:\*\*.*(?:\r?\n)?/, `${nextLine}\n`)
    : `${nextLine}\n\n${current}`;
  await writeFile(repoPath(NEXT_ACTION_PATH), updated, "utf8");
}
