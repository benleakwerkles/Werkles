#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const fastify = require("fastify")({ logger: true });

const TINKARDEN_ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.TINKARDEN_API_PORT || 3339);
const HOST = process.env.TINKARDEN_API_HOST || "0.0.0.0";

function existsWithHashTarget(filePath) {
  return {
    path: filePath,
    exists: fs.existsSync(filePath),
  };
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function daemonSnapshot() {
  const healthPath = path.join(TINKARDEN_ROOT, "nervous_system", "daemon_health.json");
  const heatPath = path.join(TINKARDEN_ROOT, "nervous_system", "frictional_heat.json");
  return {
    generated_at: new Date().toISOString(),
    health: readJson(healthPath, { status: "MISSING", path: healthPath }),
    heat: readJson(heatPath, { status: "MISSING", path: heatPath }),
  };
}

fastify.get("/", async (_request, reply) => {
  const snapshot = daemonSnapshot();
  const organs = Array.isArray(snapshot.health.core_organs) ? snapshot.health.core_organs : [];
  const flags = Array.isArray(snapshot.heat.flags) ? snapshot.heat.flags : [];
  const rows = organs.map((organ) => `
    <tr>
      <td>${escapeHtml(organ.name)}</td>
      <td><span class="pill ${organ.status === "ONLINE" ? "ok" : "bad"}">${escapeHtml(organ.status)}</span></td>
      <td>${escapeHtml(organ.pid ?? "")}</td>
      <td>${escapeHtml(organ.restarts ?? "")}</td>
    </tr>`).join("");
  const flagRows = flags.slice(-8).map((flag) => `
    <tr>
      <td>${escapeHtml(flag.flag || "UNKNOWN")}</td>
      <td>${escapeHtml(flag.source || "")}</td>
      <td>${escapeHtml(flag.rule || flag.error || "")}</td>
    </tr>`).join("");

  reply.type("text/html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nerdkle Daemon Health</title>
  <style>
    :root { color-scheme: dark; font-family: Arial, sans-serif; background: #101418; color: #edf2f7; }
    body { margin: 0; padding: 32px; }
    main { max-width: 980px; margin: 0 auto; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    h2 { margin-top: 28px; font-size: 18px; }
    .sub { color: #aab6c3; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .panel { border: 1px solid #2b3642; background: #151b22; border-radius: 8px; padding: 16px; }
    .label { color: #9fb0c0; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }
    .value { font-size: 24px; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; background: #151b22; border: 1px solid #2b3642; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #26313c; vertical-align: top; }
    th { color: #9fb0c0; font-size: 12px; text-transform: uppercase; }
    .pill { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .ok { background: #153c2e; color: #8df0be; }
    .warn { background: #3a3015; color: #ffd36c; }
    .bad { background: #461d25; color: #ff9aa9; }
    a { color: #8fc7ff; }
  </style>
</head>
<body>
  <main>
    <h1>Nerdkle Daemon Health</h1>
    <div class="sub">Live local preview from Doss. This is a command-health surface, not canonical promotion.</div>
    <section class="grid">
      <div class="panel"><div class="label">Daemon</div><div class="value">${escapeHtml(snapshot.health.status || "UNKNOWN")}</div></div>
      <div class="panel"><div class="label">Friction</div><div class="value">${escapeHtml(snapshot.heat.status || "UNKNOWN")}</div></div>
      <div class="panel"><div class="label">Daemon Fractures</div><div class="value">${escapeHtml(snapshot.heat.summary?.daemon_fracture_count ?? 0)}</div></div>
      <div class="panel"><div class="label">Updated</div><div class="value" style="font-size:14px">${escapeHtml(snapshot.health.generated_at || snapshot.generated_at)}</div></div>
    </section>
    <h2>Core Organs</h2>
    <table><thead><tr><th>Organ</th><th>Status</th><th>PID</th><th>Restarts</th></tr></thead><tbody>${rows}</tbody></table>
    <h2>Recent Friction Flags</h2>
    <table><thead><tr><th>Flag</th><th>Source</th><th>Rule</th></tr></thead><tbody>${flagRows || "<tr><td colspan='3'>No flags.</td></tr>"}</tbody></table>
    <p><a href="/health">JSON health</a> · <a href="/daemon">JSON daemon snapshot</a> · <a href="/friction">JSON friction</a></p>
  </main>
</body>
</html>`);
});

fastify.get("/health", async () => ({
  status: "OK",
  organ: "index",
  generated_at: new Date().toISOString(),
  surfaces: {
    circulation_db: existsWithHashTarget(path.join(TINKARDEN_ROOT, "server", "circulation.db")),
    world_state: existsWithHashTarget(path.join(TINKARDEN_ROOT, "world_state.json")),
    frictional_heat: existsWithHashTarget(path.join(TINKARDEN_ROOT, "nervous_system", "frictional_heat.json")),
    speaker_queue: existsWithHashTarget(path.join(TINKARDEN_ROOT, "intake", "speaker_queue")),
  },
  rule: "Health readback only. This API does not execute work or promote canonical state.",
}));

fastify.get("/daemon", async () => daemonSnapshot());

fastify.get("/friction", async () => {
  const heatPath = path.join(TINKARDEN_ROOT, "nervous_system", "frictional_heat.json");
  if (!fs.existsSync(heatPath)) {
    return { status: "MISSING", path: heatPath };
  }
  return JSON.parse(fs.readFileSync(heatPath, "utf8"));
});

fastify.get("/state", async () => {
  const statePath = path.join(TINKARDEN_ROOT, "world_state.json");
  if (!fs.existsSync(statePath)) {
    return { status: "MISSING", path: statePath };
  }
  return JSON.parse(fs.readFileSync(statePath, "utf8"));
});

fastify.listen({ port: PORT, host: HOST }).catch((error) => {
  fastify.log.error(error);
  process.exit(1);
});
