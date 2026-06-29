#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const TINKARDEN_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TINKARDEN_ROOT, "..");
const WORLD_STATE_PATH = path.join(TINKARDEN_ROOT, "nervous_system", "world_state.json");
const FRICTIONAL_HEAT_PATHS = [
  path.join(TINKARDEN_ROOT, "nervous_system", "frictional_heat.json"),
  path.join(TINKARDEN_ROOT, "membrane", "frictional_heat.json")
];
const DRIFT_LOG_PATH = path.join(TINKARDEN_ROOT, "membrane", "drift_log.json");

function slash(value) {
  return value.split(path.sep).join("/");
}

function rel(value) {
  return slash(path.relative(REPO_ROOT, value));
}

function ensureDirs() {
  fs.mkdirSync(path.dirname(DRIFT_LOG_PATH), { recursive: true });
}

function readJson(filePath) {
  try {
    return {
      ok: true,
      path: filePath,
      value: JSON.parse(fs.readFileSync(filePath, "utf8"))
    };
  } catch (error) {
    return {
      ok: false,
      path: filePath,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function findFrictionalHeat() {
  for (const filePath of FRICTIONAL_HEAT_PATHS) {
    if (fs.existsSync(filePath)) return readJson(filePath);
  }

  return {
    ok: false,
    path: FRICTIONAL_HEAT_PATHS[0],
    error: `frictional_heat.json not found in ${FRICTIONAL_HEAT_PATHS.map(rel).join(" or ")}`
  };
}

function stableId(code, message) {
  const hash = crypto.createHash("sha256").update(`${code}:${message}`).digest("hex").slice(0, 10);
  return `drift_${code.toLowerCase()}_${hash}`;
}

function warning(timestamp, sensor, severity, code, message, sourcePath) {
  return {
    id: stableId(code, message),
    timestamp,
    sensor,
    severity,
    code,
    message,
    source_path: rel(sourcePath)
  };
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

function compactText(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const record = value;
    return compactText(record.message) ||
      compactText(record.text) ||
      compactText(record.title) ||
      compactText(record.reason) ||
      JSON.stringify(record);
  }
  return "";
}

function portProbeWarnings(timestamp, worldState, sourcePath) {
  const probes = asArray(worldState?.ports?.probes);
  const warnings = [];
  const netProbeByPort = new Map();

  for (const probe of probes) {
    const command = compactText(probe?.command);
    const match = command.match(/LocalPort\s+(\d+)|:(\d+)/);
    const port = match ? match[1] || match[2] : "";
    if (command.includes("Get-NetTCPConnection") && port) {
      netProbeByPort.set(port, probe);
    }
  }

  for (const port of asArray(worldState?.ports?.active_ports_checked)) {
    const key = String(port);
    const probe = netProbeByPort.get(key);
    if (!probe || probe.ok !== true || !compactText(probe.stdout)) {
      warnings.push(
        warning(
          timestamp,
          "Wormeyes",
          "WOUND",
          "PORT_NOT_LISTENING",
          `Port ${key} has no confirmed listener in Wormeyes output.`,
          sourcePath
        )
      );
    }
  }

  return warnings;
}

function worldStateWarnings(timestamp, worldStateRead) {
  const sourcePath = worldStateRead.path;
  if (!worldStateRead.ok) {
    return [
      warning(
        timestamp,
        "Wormeyes",
        "FRACTURE",
        "WORLD_STATE_MISSING",
        `world_state.json could not be read: ${worldStateRead.error}`,
        sourcePath
      )
    ];
  }

  const worldState = worldStateRead.value;
  const summary = worldState?.git?.summary || {};
  const branch = compactText(worldState?.branch || worldState?.git?.branch_show_current?.stdout) || "UNKNOWN_BRANCH";
  const warnings = [];

  if (summary.dirty === true || Number(summary.dirty_count) > 0) {
    warnings.push(
      warning(
        timestamp,
        "Wormeyes",
        Number(summary.dirty_count) > 100 ? "WOUND" : "MOSQUITO",
        "UNCOMMITTED_CHURN",
        `Branch ${branch} has ${Number(summary.dirty_count || 0)} dirty entries (${Number(summary.modified_count || 0)} modified, ${Number(summary.untracked_count || 0)} untracked).`,
        sourcePath
      )
    );
  }

  if (Number(summary.untracked_count) > 50) {
    warnings.push(
      warning(
        timestamp,
        "Wormeyes",
        "WOUND",
        "UNTRACKED_CHURN",
        `Wormeyes reports ${Number(summary.untracked_count)} untracked entries that are not yet preserved.`,
        sourcePath
      )
    );
  }

  for (const scan of asArray(worldState?.directory_scans)) {
    const staleCount = Number(scan?.stale_count || 0);
    if (staleCount > 0) {
      warnings.push(
        warning(
          timestamp,
          "Wormeyes",
          staleCount > 25 ? "WOUND" : "MOSQUITO",
          "STALLED_FILES",
          `${compactText(scan.path) || "UNKNOWN_PATH"} has ${staleCount} stale files in the latest directory scan.`,
          sourcePath
        )
      );
    }
  }

  return warnings.concat(portProbeWarnings(timestamp, worldState, sourcePath));
}

function candidateFrictionArrays(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  return [
    ...asArray(value.critical_warnings),
    ...asArray(value.warnings),
    ...asArray(value.issues),
    ...asArray(value.events),
    ...asArray(value.drift),
    ...asArray(value.heat),
    ...asArray(value.items)
  ];
}

function frictionalHeatWarnings(timestamp, heatRead) {
  if (!heatRead.ok) {
    return [
      warning(
        timestamp,
        "Fleyes",
        "WOUND",
        "FRICTIONAL_HEAT_MISSING",
        heatRead.error,
        heatRead.path
      )
    ];
  }

  const sourcePath = heatRead.path;
  const rawCandidates = candidateFrictionArrays(heatRead.value);
  const warnings = [];

  for (const candidate of rawCandidates) {
    const text = compactText(candidate);
    const severity = compactText(candidate?.severity || candidate?.risk_class || candidate?.tier).toUpperCase();
    const code = compactText(candidate?.code || candidate?.type || candidate?.status).toUpperCase();
    const looksCritical = /CRITICAL|WOUND|FRACTURE|STALLED|STALL|CHURN|CRASH|FAILED|BLOCKED|PORT/.test(`${severity} ${code} ${text}`.toUpperCase());

    if (!text || !looksCritical) continue;

    warnings.push(
      warning(
        timestamp,
        "Fleyes",
        severity || "WOUND",
        code || "FRICTIONAL_HEAT_WARNING",
        text,
        sourcePath
      )
    );
  }

  if (warnings.length === 0) {
    warnings.push(
      warning(
        timestamp,
        "Fleyes",
        "GNAT",
        "FRICTIONAL_HEAT_CLEAR",
        "frictional_heat.json was present, but no critical drift warnings matched V0 filters.",
        sourcePath
      )
    );
  }

  return warnings;
}

function writeDriftLog(reason) {
  ensureDirs();
  const timestamp = new Date().toISOString();
  const worldStateRead = readJson(WORLD_STATE_PATH);
  const heatRead = findFrictionalHeat();
  const driftLog = [
    ...worldStateWarnings(timestamp, worldStateRead),
    ...frictionalHeatWarnings(timestamp, heatRead)
  ];

  fs.writeFileSync(DRIFT_LOG_PATH, `${JSON.stringify(driftLog, null, 2)}\n`, "utf8");

  return {
    status: "ARTIFACT",
    reason,
    script_path: rel(__filename),
    world_state_path: rel(WORLD_STATE_PATH),
    frictional_heat_paths: FRICTIONAL_HEAT_PATHS.map(rel),
    drift_log_path: rel(DRIFT_LOG_PATH),
    drift_count: driftLog.length
  };
}

function debounce(fn, delayMs) {
  let timer = null;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, delayMs);
  };
}

async function watchSensors() {
  const startup = writeDriftLog("startup");
  console.log(JSON.stringify(startup, null, 2));

  const regenerate = debounce(() => {
    try {
      console.log(JSON.stringify(writeDriftLog("sensor_updated"), null, 2));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
    }
  }, 150);

  const watchTargets = [
    WORLD_STATE_PATH,
    ...FRICTIONAL_HEAT_PATHS,
    path.dirname(WORLD_STATE_PATH),
    path.dirname(FRICTIONAL_HEAT_PATHS[0]),
    path.dirname(FRICTIONAL_HEAT_PATHS[1])
  ];

  try {
    const { watch } = await import("chokidar");
    const watcher = watch(watchTargets, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 }
    });
    watcher.on("add", regenerate);
    watcher.on("change", regenerate);
    console.log("[drift_aggregator] watching Wormeyes/Fleyes sensor files with chokidar");
  } catch {
    fs.watch(path.join(TINKARDEN_ROOT, "nervous_system"), regenerate);
    fs.watch(path.join(TINKARDEN_ROOT, "membrane"), regenerate);
    console.log("[drift_aggregator] watching Wormeyes/Fleyes sensor directories with fs.watch fallback");
  }
}

async function main() {
  const command = process.argv[2] || "watch";

  if (command === "once") {
    console.log(JSON.stringify(writeDriftLog("manual_once"), null, 2));
    return;
  }

  if (command === "watch") {
    await watchSensors();
    return;
  }

  throw new Error("Usage: node tinkarden/membrane/drift_aggregator.js [once|watch]");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
