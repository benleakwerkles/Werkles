#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const REGISTRY_PATH = path.join(ROOT, "foreman", "soledash", "AUTOMATICA_APPROVALS.json");
const PERMISSION_FLY_REGISTRY = path.join(ROOT, "foreman", "soledash", "permission-fly", "registry.json");
const SWATTER_DIR = path.join(ROOT, "foreman", "soledash", "approval-swatter-alpha");
const INBOX_DIR = path.join(SWATTER_DIR, "inbox");
const PROCESSED_DIR = path.join(SWATTER_DIR, "processed");
const RED_DIR = path.join(SWATTER_DIR, "red");
const RECEIPTS_DIR = path.join(SWATTER_DIR, "receipts");
const LOGS_DIR = path.join(SWATTER_DIR, "logs");
const STATE_DIR = path.join(SWATTER_DIR, "state");
const STATE_PATH = path.join(STATE_DIR, "state.json");
const RESULT_PATH = path.join(SWATTER_DIR, "BACKGROUND_APPROVAL_SWATTER_ALPHA_RESULT.json");

const WATCH_INTERVAL_MS = Number(process.env.APPROVAL_SWATTER_INTERVAL_MS || 1500);
const MAX_OUTPUT_CHARS = 8000;

const HARD_STOPS = [
  { id: "credentials", label: "credentials", re: /\bcredentials?\b|\bcredential entry\b|\blogin credential\b/i },
  { id: "mfa", label: "MFA", re: /\bmfa\b|\b2fa\b|\bone[-\s]?time code\b|\botp\b/i },
  { id: "passwords", label: "passwords", re: /\bpasswords?\b|\bpasscode\b/i },
  { id: "secrets", label: "secrets", re: /\bsecrets?\b|\bapi key\b|\baccess token\b|\bprivate key\b|\btoken\b/i },
  { id: "env", label: ".env", re: /(^|[^a-z0-9])\.env([^a-z0-9]|$)|\benv(?:ironment)?\s+(?:secret|credential|change|edit|write)\b/i },
  { id: "payments", label: "payments", re: /\bpayments?\b|\bbilling\b|\bcredit card\b|\bstripe live\b/i },
  { id: "banking", label: "banking", re: /\bbanking\b|\bbank account\b|\bwire transfer\b/i },
  { id: "dns", label: "DNS", re: /\bdns\b|\bnameserver\b|\bdomain record\b/i },
  { id: "production_deploy", label: "production deploy", re: /\bproduction deploy(?:ment)?\b|\bdeploy production\b|\blive deploy\b|\bship to prod\b/i },
  { id: "git_push_merge", label: "git push / merge", re: /\bgit\s+(push|merge)\b|\bpush\s+to\s+(main|origin|remote)\b|\bmerge\s+(main|to|into)\b/i },
  { id: "account_ownership", label: "account ownership", re: /\baccount ownership\b|\btransfer account\b|\bowner change\b|\bchange owner\b/i },
  { id: "public_firewall_router_exposure", label: "public firewall/router exposure", re: /\bpublic firewall\b|\brouter\b|\bport forward\b|\bpublic exposure\b|\bmake public\b|\bopen firewall port\b|\binbound firewall\b|\bpublic network access\b/i },
  { id: "destructive_delete", label: "destructive delete", re: /\bdestructive delete\b|\brm\s+-rf\b|\bremove-item\b.*\b(-recurse|-force)\b|\bdelete\b.*\b(recursive|permanent|all)\b|\bwipe\b|\bformat\b/i },
  { id: "unknown_admin_security_change", label: "unknown admin/security change", re: /\bunknown admin\b|\badmin security change\b|\bsecurity setting\b|\bdefender exclusion\b|\bregistry change\b|\bbios\b|\binstall driver\b|\bdriver install\b/i }
];

function ensureDirs() {
  for (const dir of [SWATTER_DIR, INBOX_DIR, PROCESSED_DIR, RED_DIR, RECEIPTS_DIR, LOGS_DIR, STATE_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function stamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function slug(value) {
  return String(value || "prompt")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 72) || "prompt";
}

function truncate(value) {
  const text = String(value ?? "");
  return text.length > MAX_OUTPUT_CHARS ? `${text.slice(0, MAX_OUTPUT_CHARS)}\n[truncated]` : text;
}

function loadState() {
  return readJson(STATE_PATH, { permissionFly: {}, totals: { green: 0, blue: 0, red: 0 } });
}

function saveState(state) {
  writeJson(STATE_PATH, state);
}

function loadApprovalsRegistry() {
  const registry = readJson(REGISTRY_PATH, null);
  if (!registry?.classes) {
    return { registry: null, error: `Missing or invalid registry: ${rel(REGISTRY_PATH)}` };
  }
  return { registry, error: null };
}

function hardStopFor(text) {
  for (const stop of HARD_STOPS) {
    if (stop.re.test(text)) return stop;
  }
  return null;
}

function classifyPrompt(text, registry) {
  const prompt = String(text || "");
  const stop = hardStopFor(prompt);
  if (stop) {
    return {
      approvalClass: "RED",
      candidateId: stop.id,
      candidateLabel: stop.label,
      pattern: stop.label,
      hardStop: true,
      reason: `Hard stop: ${stop.label}. Ben must see this.`
    };
  }

  if (!registry) {
    return {
      approvalClass: "RED",
      candidateId: "registry_unavailable",
      candidateLabel: "registry unavailable",
      pattern: null,
      hardStop: false,
      reason: "AUTOMATICA_APPROVALS.json is unavailable; default RED."
    };
  }

  const lower = prompt.toLowerCase();
  const precedence = Array.isArray(registry.policy?.precedence)
    ? registry.policy.precedence
    : ["RED", "BLUE", "GREEN"];

  for (const approvalClass of precedence) {
    const candidates = registry.classes?.[approvalClass]?.candidates ?? [];
    for (const candidate of candidates) {
      for (const pattern of candidate.patterns ?? []) {
        const needle = String(pattern || "").toLowerCase();
        if (!needle) continue;
        if (lower.includes(needle)) {
          return {
            approvalClass,
            candidateId: candidate.id ?? null,
            candidateLabel: candidate.label ?? candidate.id ?? approvalClass,
            pattern,
            hardStop: false,
            reason: `Registry ${approvalClass}: ${candidate.label ?? candidate.id ?? pattern}.`
          };
        }
      }
    }
  }

  return {
    approvalClass: "RED",
    candidateId: "no_registry_match",
    candidateLabel: "no registry match",
    pattern: null,
    hardStop: false,
    reason: "No GREEN/BLUE registry match; default RED."
  };
}

function runPowerShell(command, timeoutMs = 60000) {
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
    { cwd: ROOT, encoding: "utf8", windowsHide: true, timeout: timeoutMs }
  );

  return {
    status: result.status,
    signal: result.signal ?? null,
    error: result.error ? result.error.message : null,
    stdout: truncate(result.stdout),
    stderr: truncate(result.stderr)
  };
}

function parseJsonObject(stdout) {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(stdout.slice(start, end + 1));
  } catch {
    return null;
  }
}

function executeMwbLocalRestartRecovery() {
  const command = `
$ErrorActionPreference = 'SilentlyContinue'
$names = @('MouseWithoutBorders','MouseWithoutBordersHelper')
$before = Get-Process -Name $names -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,Path
Stop-Process -Name $names -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
$paths = @(
  'C:\\Program Files (x86)\\Microsoft Garage\\Mouse without Borders\\MouseWithoutBorders.exe',
  'C:\\Program Files\\Microsoft Garage\\Mouse without Borders\\MouseWithoutBorders.exe'
)
$exe = $paths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if ($exe) { Start-Process -FilePath $exe }
Start-Sleep -Seconds 4
$after = Get-Process -Name $names -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,Path
$ports = foreach ($port in 15100,15101) {
  [pscustomobject]@{
    Port = $port
    Open = (Test-NetConnection -ComputerName 'localhost' -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue)
  }
}
[pscustomobject]@{
  Exe = $exe
  Before = $before
  After = $after
  Ports = $ports
} | ConvertTo-Json -Depth 6
`;
  const result = runPowerShell(command, 90000);
  const parsed = parseJsonObject(result.stdout);
  const ports = Array.isArray(parsed?.Ports) ? parsed.Ports : parsed?.Ports ? [parsed.Ports] : [];
  const after = Array.isArray(parsed?.After) ? parsed.After : parsed?.After ? [parsed.After] : [];
  const portsOpen = ports.length >= 2 && ports.every((p) => p.Open === true);
  const processRunning = after.length > 0;
  const ok = result.status === 0 && Boolean(parsed?.Exe) && processRunning && portsOpen;

  return {
    ok,
    executor: "codex_mwb_local_restart_recovery",
    command_summary: "Stop known MWB processes, relaunch known MWB executable, verify localhost 15100/15101.",
    parsed,
    result,
    blocker: ok
      ? null
      : "MWB relaunch or localhost port verification did not prove healthy."
  };
}

function executeBlue(decision) {
  if (decision.candidate_id === "codex_mwb_local_restart_recovery") {
    return executeMwbLocalRestartRecovery();
  }

  return {
    ok: false,
    executor: null,
    blocker: `No BLUE executor mapping for ${decision.candidate_id || "unknown policy"}.`
  };
}

function writeDecisionArtifact(decision) {
  const baseName = `${stamp()}__${decision.approval_class.toLowerCase()}__${slug(decision.id)}.json`;
  const dir = decision.approval_class === "RED" ? RED_DIR : PROCESSED_DIR;
  const file = path.join(dir, baseName);
  writeJson(file, decision);
  decision.decision_path = rel(file);

  const permissionFlySwat =
    decision.origin === "soledash_permission_fly" &&
    (decision.approval_class === "GREEN" ||
      (decision.approval_class === "BLUE" && decision.execution?.ok));

  if (decision.approval_class === "GREEN") {
    const receiptType = permissionFlySwat ? "permission_swatted" : "approval_suppressed";
    decision.swatter_event = receiptType;
    const receipt = {
      receipt_type: receiptType,
      timestamp: decision.decided_at,
      decision_id: decision.id,
      prompt_id: decision.id,
      origin: decision.origin,
      policy_id: decision.candidate_id,
      policy_label: decision.candidate_label,
      action: decision.action,
      approval_class: decision.approval_class
    };
    const receiptFile = path.join(RECEIPTS_DIR, `${stamp()}__${receiptType}__${slug(decision.id)}.json`);
    writeJson(receiptFile, receipt);
    decision.receipt_path = rel(receiptFile);
    writeJson(file, decision);
  } else if (decision.approval_class === "BLUE") {
    const receipt = {
      receipt_type: permissionFlySwat
        ? "permission_swatted"
        : "BACKGROUND_APPROVAL_SWATTER_ALPHA_BLUE",
      timestamp: decision.decided_at,
      decision_id: decision.id,
      prompt_id: decision.id,
      origin: decision.origin,
      policy_id: decision.candidate_id,
      policy_label: decision.candidate_label,
      action: decision.action,
      execution: decision.execution,
      blocker: decision.execution?.blocker ?? null
    };
    if (permissionFlySwat) {
      decision.swatter_event = "permission_swatted";
    }
    const receiptFile = path.join(
      RECEIPTS_DIR,
      `${stamp()}__${permissionFlySwat ? "permission_swatted" : "blue"}__${slug(decision.id)}.json`
    );
    writeJson(receiptFile, receipt);
    decision.receipt_path = rel(receiptFile);
    writeJson(file, decision);
  }

  return decision;
}

function buildDecision(item, registry) {
  const classified = classifyPrompt(item.prompt, registry);
  const now = new Date().toISOString();
  const decision = {
    id: item.id,
    origin: item.origin,
    source: item.source,
    prompt: item.prompt,
    received_at: item.received_at ?? null,
    decided_at: now,
    approval_class: classified.approvalClass,
    candidate_id: classified.candidateId,
    candidate_label: classified.candidateLabel,
    matched_pattern: classified.pattern,
    hard_stop: classified.hardStop,
    reason: classified.reason,
    action: null,
    execution: null,
    decision_path: null,
    receipt_path: null
  };

  if (decision.approval_class === "GREEN") {
    decision.action = "AUTO_APPROVED_SILENT";
  } else if (decision.approval_class === "BLUE") {
    decision.action = "AUTO_APPROVED_EXECUTED_RECEIPT";
    decision.execution = executeBlue(decision);
    if (!decision.execution?.ok) {
      decision.reason = `${decision.reason} BLUE executor blocker: ${decision.execution?.blocker ?? "unknown"}`;
    }
  } else {
    decision.action = "SURFACED_TO_BEN";
  }

  return writeDecisionArtifact(decision);
}

function readInboxItem(file) {
  const raw = fs.readFileSync(file, "utf8");
  const ext = path.extname(file).toLowerCase();
  let parsed = null;
  if (ext === ".json") {
    try {
      parsed = JSON.parse(raw.replace(/^\uFEFF/, ""));
    } catch {
      parsed = null;
    }
  }

  const prompt = parsed
    ? String(parsed.prompt ?? parsed.text ?? parsed.command ?? parsed.justification ?? raw)
    : raw;

  return {
    id: String(parsed?.id ?? path.basename(file, ext)),
    origin: "swatter_inbox",
    source: String(parsed?.source ?? "approval-swatter-alpha/inbox"),
    prompt,
    received_at: parsed?.received_at ?? null,
    file
  };
}

function archiveInboxFile(file, decision) {
  const originalsDir = path.join(
    decision.approval_class === "RED" ? RED_DIR : PROCESSED_DIR,
    "originals"
  );
  fs.mkdirSync(originalsDir, { recursive: true });
  const target = path.join(originalsDir, `${stamp()}__${path.basename(file)}`);
  try {
    fs.renameSync(file, target);
  } catch {
    fs.copyFileSync(file, target);
    fs.unlinkSync(file);
  }
  decision.original_path = rel(target);
  if (decision.decision_path) {
    writeJson(path.join(ROOT, decision.decision_path), decision);
  }
}

function processInbox(registry) {
  ensureDirs();
  const decisions = [];
  const files = fs.readdirSync(INBOX_DIR)
    .filter((name) => /\.(json|txt|md)$/i.test(name))
    .sort()
    .map((name) => path.join(INBOX_DIR, name));

  for (const file of files) {
    const item = readInboxItem(file);
    const decision = buildDecision(item, registry);
    archiveInboxFile(file, decision);
    decisions.push(decision);
  }
  return decisions;
}

function permissionFlyFingerprint(fly) {
  return [
    fly.id,
    fly.source,
    fly.detail,
    fly.count,
    fly.last_occurrence
  ].map((part) => String(part ?? "")).join("|");
}

function processPermissionFly(registry, state) {
  const data = readJson(PERMISSION_FLY_REGISTRY, null);
  if (!data || !Array.isArray(data.flies)) return [];

  const decisions = [];
  let changed = false;
  state.permissionFly ??= {};

  for (const fly of data.flies) {
    if (!fly?.id || fly.classification === "pre_approved") continue;
    const fingerprint = permissionFlyFingerprint(fly);
    if (state.permissionFly[fly.id] === fingerprint) continue;

    const item = {
      id: `permission_fly_${fly.id}`,
      origin: "soledash_permission_fly",
      source: fly.source ?? "SoleDash permission fly",
      prompt: `${fly.source ?? ""}\n${fly.detail ?? ""}`.trim(),
      received_at: fly.last_occurrence ?? null
    };
    const decision = buildDecision(item, registry);
    decisions.push(decision);

    if (decision.approval_class === "GREEN" || decision.approval_class === "BLUE") {
      fly.classification = "pre_approved";
      changed = true;
    } else if (fly.classification !== "human_gate") {
      fly.classification = "human_gate";
      changed = true;
    }

    state.permissionFly[fly.id] = fingerprint;
  }

  if (changed) writeJson(PERMISSION_FLY_REGISTRY, data);
  return decisions;
}

function summarize(decisions, registryError = null, state = null) {
  const counts = { green: 0, blue: 0, red: 0 };
  for (const decision of decisions) {
    if (decision.approval_class === "GREEN") counts.green += 1;
    if (decision.approval_class === "BLUE") counts.blue += 1;
    if (decision.approval_class === "RED") counts.red += 1;
  }

  const blueBlockers = decisions
    .filter((d) => d.approval_class === "BLUE" && !d.execution?.ok)
    .map((d) => ({ id: d.id, blocker: d.execution?.blocker ?? "unknown BLUE executor blocker" }));

  return {
    ok: !registryError && blueBlockers.length === 0,
    timestamp: new Date().toISOString(),
    counts,
    lifetime_totals: state?.totals ?? null,
    last_activity: state?.last_activity ?? null,
    decisions: decisions.map((d) => ({
      id: d.id,
      origin: d.origin,
      approval_class: d.approval_class,
      action: d.action,
      policy_id: d.candidate_id,
      reason: d.reason,
      decision_path: d.decision_path,
      receipt_path: d.receipt_path,
      blocker: d.execution?.blocker ?? null
    })),
    registry_error: registryError,
    blue_blockers: blueBlockers,
    paths: {
      inbox: rel(INBOX_DIR),
      processed: rel(PROCESSED_DIR),
      red: rel(RED_DIR),
      receipts: rel(RECEIPTS_DIR),
      result: rel(RESULT_PATH)
    }
  };
}

function processOnce() {
  ensureDirs();
  const { registry, error } = loadApprovalsRegistry();
  const state = loadState();
  state.totals ??= { green: 0, blue: 0, red: 0 };
  const decisions = [
    ...processInbox(registry),
    ...processPermissionFly(registry, state)
  ];

  for (const decision of decisions) {
    if (decision.approval_class === "GREEN") state.totals.green += 1;
    if (decision.approval_class === "BLUE") state.totals.blue += 1;
    if (decision.approval_class === "RED") state.totals.red += 1;
  }
  if (decisions.length) {
    state.last_activity = {
      timestamp: new Date().toISOString(),
      decisions: decisions.map((d) => ({
        id: d.id,
        origin: d.origin,
        approval_class: d.approval_class,
        action: d.action,
        policy_id: d.candidate_id,
        reason: d.reason,
        decision_path: d.decision_path,
        receipt_path: d.receipt_path,
        blocker: d.execution?.blocker ?? null
      }))
    };
  }
  saveState(state);

  const summary = summarize(decisions, error, state);
  writeJson(RESULT_PATH, summary);
  return summary;
}

function enqueue(prompt, source = "manual") {
  ensureDirs();
  const file = path.join(INBOX_DIR, `${stamp()}__${slug(prompt)}.json`);
  writeJson(file, {
    id: slug(prompt),
    source,
    received_at: new Date().toISOString(),
    prompt
  });
  return file;
}

function selfTest() {
  enqueue("local read approval prompt: local read a local workstation note", "self-test-green");
  enqueue("MWB local restart recovery", "self-test-blue");
  enqueue("production deploy approval prompt", "self-test-red");
  const summary = processOnce();
  writeJson(path.join(SWATTER_DIR, "SELF_TEST_RESULT.json"), summary);
  return summary;
}

function watch() {
  ensureDirs();
  const pidFile = path.join(STATE_DIR, "watcher.pid");
  fs.writeFileSync(pidFile, `${process.pid}\n`, "utf8");
  writeJson(path.join(STATE_DIR, "watcher.json"), {
    pid: process.pid,
    started_at: new Date().toISOString(),
    interval_ms: WATCH_INTERVAL_MS,
    inbox: rel(INBOX_DIR),
    permission_fly_registry: rel(PERMISSION_FLY_REGISTRY)
  });

  processOnce();
  setInterval(() => {
    try {
      processOnce();
    } catch (err) {
      const file = path.join(LOGS_DIR, `${stamp()}__watch_error.json`);
      writeJson(file, {
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, WATCH_INTERVAL_MS);
}

const [cmd = "once", ...args] = process.argv.slice(2);

try {
  if (cmd === "enqueue") {
    const prompt = args.join(" ").trim();
    if (!prompt) throw new Error("enqueue requires prompt text");
    const file = enqueue(prompt);
    console.log(JSON.stringify({ ok: true, enqueued: rel(file) }, null, 2));
  } else if (cmd === "self-test") {
    console.log(JSON.stringify(selfTest(), null, 2));
  } else if (cmd === "watch") {
    console.log(JSON.stringify({
      ok: true,
      status: "watching",
      pid: process.pid,
      inbox: rel(INBOX_DIR),
      permission_fly_registry: rel(PERMISSION_FLY_REGISTRY)
    }, null, 2));
    watch();
  } else if (cmd === "once") {
    console.log(JSON.stringify(processOnce(), null, 2));
  } else {
    throw new Error(`Unknown command: ${cmd}`);
  }
} catch (err) {
  console.error(JSON.stringify({
    ok: false,
    error: err instanceof Error ? err.message : String(err)
  }, null, 2));
  process.exitCode = 1;
}
