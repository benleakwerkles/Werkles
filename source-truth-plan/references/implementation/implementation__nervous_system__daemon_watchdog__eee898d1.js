#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const TINKARDEN_ROOT = path.resolve(__dirname, "..");
const PM2_BIN = path.join(TINKARDEN_ROOT, "node_modules", "pm2", "bin", "pm2");
const HEAT_PATH = path.join(TINKARDEN_ROOT, "nervous_system", "frictional_heat.json");
const HEALTH_PATH = path.join(TINKARDEN_ROOT, "nervous_system", "daemon_health.json");
const CORE_ORGANS = (process.env.DAEMON_CORE_ORGANS || "brainstem,index,crawler,ender_apoptosis")
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);
const INTERVAL_MS = Number(process.env.DAEMON_WATCHDOG_INTERVAL_MS || 30_000);
const MAX_UNSTABLE_RESTARTS = Number(process.env.DAEMON_MAX_UNSTABLE_RESTARTS || 3);

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function pm2List() {
  const output = execFileSync(process.execPath, [PM2_BIN, "jlist"], {
    cwd: TINKARDEN_ROOT,
    encoding: "utf8",
    windowsHide: true,
  });
  return JSON.parse(output || "[]");
}

function classify(processInfo) {
  if (!processInfo) return { status: "MISSING", fracture: true };
  const pm2 = processInfo.pm2_env || {};
  if (pm2.status !== "online") return { status: pm2.status || "UNKNOWN", fracture: true };
  if (Number(pm2.unstable_restarts || 0) >= MAX_UNSTABLE_RESTARTS) {
    return { status: "UNSTABLE_RESTARTS", fracture: true };
  }
  return { status: "ONLINE", fracture: false };
}

function scan() {
  const now = new Date().toISOString();
  const processes = pm2List();
  const byName = new Map(processes.map((processInfo) => [processInfo.name, processInfo]));
  const organs = CORE_ORGANS.map((name) => {
    const processInfo = byName.get(name);
    const verdict = classify(processInfo);
    return {
      name,
      status: verdict.status,
      fracture: verdict.fracture,
      pid: processInfo?.pid || null,
      restarts: processInfo?.pm2_env?.restart_time ?? null,
      unstable_restarts: processInfo?.pm2_env?.unstable_restarts ?? null,
      pm2_status: processInfo?.pm2_env?.status || null,
    };
  });
  const fractures = organs.filter((organ) => organ.fracture);
  const health = {
    sensor: "DAEMON_HEALTH_MONITOR",
    packet_id: "BIRD_0039_SWANSON_DAEMON_HEALTH_MONITOR",
    generated_at: now,
    status: fractures.length > 0 ? "FRACTURE" : "OK",
    core_organs: organs,
    rule: "FRACTURE when a core PM2 organ is missing, stopped, errored, or exceeds unstable restart threshold.",
  };
  writeJson(HEALTH_PATH, health);

  const heat = readJson(HEAT_PATH, {
    sensor: "FLEYES_MULE_SENSOR_V0",
    generated_at: now,
    status: "UNKNOWN",
    flags: [],
    summary: {},
  });
  heat.daemon_watchdog = health;
  heat.daemon_updated_at = now;
  if (fractures.length > 0) {
    heat.status = "FRACTURE";
    heat.flags = Array.isArray(heat.flags) ? heat.flags : [];
    heat.flags.push({
      flag: "FRACTURE",
      source: "daemon_watchdog",
      generated_at: now,
      failed_organs: fractures.map((organ) => organ.name),
      rule: "Core nervous-system process failed PM2 health check.",
    });
    heat.summary = {
      ...(heat.summary || {}),
      daemon_fracture_count: fractures.length,
    };
  } else {
    const flags = Array.isArray(heat.flags) ? heat.flags : [];
    const nonDaemonFriction = flags.some((flag) => ["STALLED", "CHURN"].includes(flag.flag));
    heat.status = nonDaemonFriction ? "FRICTION_DETECTED" : "OK";
    heat.summary = {
      ...(heat.summary || {}),
      daemon_fracture_count: 0,
    };
  }
  writeJson(HEAT_PATH, heat);
  process.stdout.write(`${JSON.stringify(health)}\n`);
  return health;
}

function run() {
  try {
    scan();
  } catch (error) {
    const now = new Date().toISOString();
    const health = {
      sensor: "DAEMON_HEALTH_MONITOR",
      packet_id: "BIRD_0039_SWANSON_DAEMON_HEALTH_MONITOR",
      generated_at: now,
      status: "FRACTURE",
      error: error.message,
      rule: "Watchdog failure is itself a FRACTURE because daemon health cannot be observed.",
    };
    writeJson(HEALTH_PATH, health);
    const heat = readJson(HEAT_PATH, { flags: [], summary: {} });
    heat.status = "FRACTURE";
    heat.daemon_watchdog = health;
    heat.flags = Array.isArray(heat.flags) ? heat.flags : [];
    heat.flags.push({
      flag: "FRACTURE",
      source: "daemon_watchdog",
      generated_at: now,
      error: error.message,
    });
    writeJson(HEAT_PATH, heat);
    process.stderr.write(`${JSON.stringify(health)}\n`);
  }
}

run();
if (!process.argv.includes("--once")) {
  setInterval(run, INTERVAL_MS);
}
