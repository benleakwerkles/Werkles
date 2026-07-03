#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_PATH = "foreman/artifacts/nerdkle_work_so_far.html";

const INPUTS = {
  kernel: "foreman/artifacts/nerdkle_kernel_v0_status.json",
  github: "foreman/artifacts/nerdkle_github_source_material_status.json",
  materialized: "foreman/artifacts/nerdkle_materialized_source_status.json",
  queue: "foreman/artifacts/nerdkle_source_work_queue.json",
  nmclr: "foreman/artifacts/nmclr_sandbox_execution_status.json",
  threadClaims: "foreman/artifacts/thread_identity_claims_status.json",
  relayEvidence: "foreman/artifacts/aeye_relay_evidence.json",
};

function abs(relPath) {
  return path.join(ROOT, relPath);
}

function exists(relPath) {
  return fs.existsSync(abs(relPath));
}

function readJson(relPath) {
  if (!exists(relPath)) return null;
  return JSON.parse(fs.readFileSync(abs(relPath), "utf8"));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusClass(status) {
  if (!status) return "unknown";
  if (String(status).includes("PASS")) return "pass";
  if (String(status).includes("PARTIAL")) return "partial";
  if (String(status).includes("BLOCK")) return "block";
  if (String(status).includes("FAIL")) return "fail";
  return "unknown";
}

function fileLink(relPath) {
  const href = `file:///${abs(relPath).replace(/\\/g, "/")}`;
  return `<a href="${escapeHtml(href)}">${escapeHtml(relPath)}</a>`;
}

function badge(status) {
  return `<span class="badge ${statusClass(status)}">${escapeHtml(status || "UNKNOWN")}</span>`;
}

function metric(label, value, note = "") {
  return `<div class="metric"><div class="metric-value">${escapeHtml(value)}</div><div class="metric-label">${escapeHtml(label)}</div>${note ? `<div class="metric-note">${escapeHtml(note)}</div>` : ""}</div>`;
}

function renderChecks(checks = []) {
  return checks.map((check) => `
    <tr>
      <td>${escapeHtml(check.id)}</td>
      <td>${badge(check.status)}</td>
      <td>${check.missing?.length ? `<code>${escapeHtml(check.missing.join("\n"))}</code>` : `<span class="quiet">none</span>`}</td>
      <td>${(check.evidence || []).slice(0, 4).map((item) => `<div><code>${escapeHtml(item)}</code></div>`).join("")}</td>
    </tr>
  `).join("");
}

function renderSourceCards(github) {
  return (github?.sources || []).map((source) => `
    <article class="source-card">
      <div class="source-head">
        <h3>${escapeHtml(source.title)}</h3>
        ${badge(source.status)}
      </div>
      <dl>
        <dt>Branch</dt><dd><code>${escapeHtml(source.branch)}</code></dd>
        <dt>Commit</dt><dd><code>${escapeHtml(source.actual_commit || source.expected_commit)}</code></dd>
        <dt>Canonicality</dt><dd>${badge(source.canonicality)}</dd>
        <dt>Boundary</dt><dd>${escapeHtml(source.proof_boundary)}</dd>
      </dl>
      <div class="artifact-list">
        ${(source.artifact_checks || []).map((artifact) => `
          <div class="artifact-row">
            <span>${artifact.exists ? "OK" : "MISSING"}</span>
            <code>${escapeHtml(artifact.path)}</code>
          </div>
        `).join("")}
      </div>
    </article>
  `).join("");
}

function renderMaterialized(materialized) {
  return (materialized?.materialized || []).map((item) => `
    <tr>
      <td>${escapeHtml(item.source_id)}</td>
      <td>${badge(item.canonicality)}</td>
      <td>${escapeHtml(item.file_count)}</td>
      <td>${fileLink(item.manifest_path)}</td>
      <td>${escapeHtml(item.proof_boundary)}</td>
    </tr>
  `).join("");
}

function renderLoops(kernel) {
  return (kernel?.loops || []).slice(0, 8).map((loop) => `
    <tr>
      <td><code>${escapeHtml(loop.packet_id)}</code></td>
      <td>${escapeHtml(loop.target_address)}</td>
      <td>${badge(loop.status)}</td>
      <td>${escapeHtml(loop.evidence?.latest_observed_at || "")}</td>
      <td>${escapeHtml((loop.evidence?.event_types || []).join(", "))}</td>
    </tr>
  `).join("");
}

function renderQueue(queue) {
  return (queue?.items || []).map((item) => `
    <article class="queue-card">
      <div class="source-head">
        <h3>${escapeHtml(item.queue_id)}</h3>
        ${badge(item.queue_state)}
      </div>
      <p>${escapeHtml(item.recommended_next_step)}</p>
      <dl>
        <dt>Source</dt><dd>${escapeHtml(item.source_id)}</dd>
        <dt>Priority</dt><dd>${escapeHtml(item.priority)}</dd>
        <dt>Boundary</dt><dd>${escapeHtml(item.proof_boundary)}</dd>
      </dl>
      <div class="queue-lists">
        <div>
          <h4>Proof Needed</h4>
          <ul>${(item.proof_needed || []).map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>
        </div>
        <div>
          <h4>Blockers</h4>
          <ul>${(item.blockers?.length ? item.blockers : ["none"]).map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>
        </div>
        <div>
          <h4>Forbidden</h4>
          <ul>${(item.forbidden || []).map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>
        </div>
      </div>
    </article>
  `).join("");
}

function renderNmclrProof(nmclr) {
  if (!nmclr) {
    return `<p class="quiet">No NMCLR sandbox proof has been generated.</p>`;
  }
  const fileRows = Object.entries(nmclr.files || {}).map(([label, file]) => `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td><code>${escapeHtml(file.relative_to_run_build)}</code></td>
      <td>${escapeHtml(file.byte_count)}</td>
      <td><code>${escapeHtml(file.sha256)}</code></td>
    </tr>
  `).join("");
  return `
    <div class="proof-summary">
      <div>${badge(nmclr.status)}</div>
      <dl>
        <dt>Run</dt><dd><code>${escapeHtml(nmclr.run_id)}</code></dd>
        <dt>Movement</dt><dd>${nmclr.movement_chain?.pass ? "PASS" : "MISSING"}</dd>
        <dt>Causal Chain</dt><dd>${nmclr.causal_chain?.pass ? "PASS" : "MISSING"}</dd>
        <dt>Boundary</dt><dd>${escapeHtml(nmclr.rule)}</dd>
      </dl>
    </div>
    <table>
      <thead><tr><th>File</th><th>Path</th><th>Bytes</th><th>SHA256</th></tr></thead>
      <tbody>${fileRows}</tbody>
    </table>
  `;
}

function render() {
  const kernel = readJson(INPUTS.kernel);
  const github = readJson(INPUTS.github);
  const materialized = readJson(INPUTS.materialized);
  const queue = readJson(INPUTS.queue);
  const nmclr = readJson(INPUTS.nmclr);
  const threadClaims = readJson(INPUTS.threadClaims);
  const generatedAt = new Date().toISOString();
  const remainingBoundaries = github?.remaining_boundaries || [];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nerdkle Work So Far</title>
  <style>
    :root {
      --ink: #141414;
      --muted: #60656f;
      --line: #d8dde6;
      --paper: #f7f4ec;
      --panel: #ffffff;
      --green: #1d7f4f;
      --amber: #9b6515;
      --red: #b73737;
      --blue: #255c99;
      --shadow: 0 10px 30px rgba(18, 24, 40, 0.08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    header {
      padding: 28px clamp(18px, 4vw, 48px) 18px;
      border-bottom: 1px solid var(--line);
      background: #fbfaf6;
    }
    main { padding: 24px clamp(18px, 4vw, 48px) 48px; }
    h1 { margin: 0 0 8px; font-size: clamp(28px, 5vw, 48px); line-height: 1.02; letter-spacing: 0; }
    h2 { margin: 0 0 14px; font-size: 19px; letter-spacing: 0; }
    h3 { margin: 0; font-size: 15px; letter-spacing: 0; }
    p { margin: 0; color: var(--muted); max-width: 920px; }
    a { color: var(--blue); text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
      font-size: 12px;
    }
    .topline { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 14px; }
    .grid { display: grid; gap: 16px; }
    .metrics { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); margin: 18px 0 24px; }
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
      padding: 18px;
      margin-bottom: 18px;
    }
    .metric {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
      min-height: 98px;
    }
    .metric-value { font-size: 28px; font-weight: 750; line-height: 1; }
    .metric-label { color: var(--muted); margin-top: 8px; }
    .metric-note { color: var(--muted); font-size: 12px; margin-top: 6px; }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      border-radius: 999px;
      padding: 3px 9px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid currentColor;
      background: #fff;
    }
    .pass { color: var(--green); }
    .partial { color: var(--amber); }
    .block, .fail { color: var(--red); }
    .unknown { color: var(--muted); }
    .quiet { color: var(--muted); }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border-top: 1px solid var(--line); text-align: left; vertical-align: top; padding: 10px; }
    th { color: var(--muted); font-size: 12px; font-weight: 700; }
    .source-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .source-card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 15px;
    }
    .queue-grid { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
    .queue-card {
      background: #fffdfa;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 15px;
    }
    .source-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 12px; }
    h4 { margin: 10px 0 6px; font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0; }
    ul { margin: 0; padding-left: 18px; color: var(--muted); }
    li + li { margin-top: 4px; }
    .queue-lists { display: grid; gap: 8px; margin-top: 12px; }
    .proof-summary {
      display: grid;
      gap: 12px;
      margin-bottom: 14px;
    }
    dl { display: grid; grid-template-columns: 96px 1fr; gap: 8px 10px; margin: 0 0 12px; }
    dt { color: var(--muted); }
    dd { margin: 0; overflow-wrap: anywhere; }
    .artifact-list { border-top: 1px solid var(--line); padding-top: 10px; display: grid; gap: 8px; }
    .artifact-row { display: grid; grid-template-columns: 52px 1fr; gap: 8px; align-items: baseline; }
    .artifact-row span { color: var(--green); font-size: 12px; font-weight: 800; }
    .footer { margin-top: 18px; color: var(--muted); font-size: 12px; }
    @media (max-width: 760px) {
      table { table-layout: auto; }
      th:nth-child(4), td:nth-child(4), th:nth-child(5), td:nth-child(5) { display: none; }
      dl { grid-template-columns: 1fr; }
      .source-head { display: grid; }
    }
  </style>
</head>
<body>
  <header>
    <div class="topline">
      ${badge(kernel?.overall_status)}
      ${badge(github?.status)}
      ${badge(materialized?.status)}
      ${badge(queue?.status)}
      ${badge(nmclr?.status)}
    </div>
    <h1>Nerdkle Work So Far</h1>
    <p>Generated from local proof artifacts at ${escapeHtml(generatedAt)}. This page shows what exists, what was verified, and what is still blocked. It does not claim review branches are canon.</p>
  </header>
  <main>
    <section class="grid metrics">
      ${metric("Complete return loops", kernel?.complete_loop_count ?? 0, "packet -> Aeye -> answer -> origin")}
      ${metric("Valid Speaker receipts", kernel?.valid_receipt_count ?? 0, "schema-valid inbox receipts")}
      ${metric("GitHub sources verified", github?.verified_count ?? 0, "branch + commit + artifact checks")}
      ${metric("Local snapshots", materialized?.materialized_count ?? 0, "read-only materialized source copies")}
      ${metric("Ready queue items", queue?.ready_count ?? 0, queue?.next_recommended_queue_id || "no recommended next item")}
      ${metric("NMCLR sandbox proof", nmclr?.status === "PASS_NMCLR_SANDBOX_EXECUTION_PROOF" ? "PASS" : "MISSING", nmclr?.run_id || "no run")}
      ${metric("Canonical promotions", github?.canonical_count ?? 0, "must remain 0 without human gate")}
      ${metric("Missing external IDs", threadClaims?.missing_external_thread_ids?.length ?? 0, "external Aeye thread identity")}
    </section>

    <section class="panel">
      <h2>NMCLR Sandbox Proof</h2>
      ${renderNmclrProof(nmclr)}
    </section>

    <section class="panel">
      <h2>Next Work Queue</h2>
      <div class="grid queue-grid">${renderQueue(queue)}</div>
    </section>

    <section class="panel">
      <h2>Proof Checks</h2>
      <table>
        <thead><tr><th>Check</th><th>Status</th><th>Missing</th><th>Evidence</th></tr></thead>
        <tbody>${renderChecks(kernel?.checks)}</tbody>
      </table>
    </section>

    <section class="panel">
      <h2>GitHub Source Branches</h2>
      <div class="grid source-grid">${renderSourceCards(github)}</div>
    </section>

    <section class="panel">
      <h2>Materialized Snapshots</h2>
      <table>
        <thead><tr><th>Source</th><th>Canonicality</th><th>Files</th><th>Manifest</th><th>Boundary</th></tr></thead>
        <tbody>${renderMaterialized(materialized)}</tbody>
      </table>
    </section>

    <section class="panel">
      <h2>Return Loop Evidence</h2>
      <table>
        <thead><tr><th>Packet</th><th>Target</th><th>Status</th><th>Latest</th><th>Events</th></tr></thead>
        <tbody>${renderLoops(kernel)}</tbody>
      </table>
    </section>

    <section class="panel">
      <h2>Remaining Boundaries</h2>
      <table>
        <thead><tr><th>Source</th><th>Canonicality</th><th>Status</th><th>Boundary</th></tr></thead>
        <tbody>${remainingBoundaries.map((item) => `
          <tr>
            <td>${escapeHtml(item.source_id)}</td>
            <td>${badge(item.canonicality)}</td>
            <td>${escapeHtml(item.source_status)}</td>
            <td>${escapeHtml(item.proof_boundary)}</td>
          </tr>
        `).join("")}</tbody>
      </table>
    </section>

    <section class="panel">
      <h2>Source Artifacts</h2>
      <p>${fileLink(INPUTS.kernel)} - ${fileLink(INPUTS.github)} - ${fileLink(INPUTS.materialized)} - ${fileLink(INPUTS.queue)} - ${fileLink(INPUTS.nmclr)} - ${fileLink("foreman/handoffs/NERDKLE_GITHUB_SOURCE_INTAKE_RECEIPT.md")}</p>
    </section>

    <div class="footer">Generated by <code>foreman/nerdkle/build-work-so-far-report.mjs</code>.</div>
  </main>
</body>
</html>`;
}

function main() {
  const html = render();
  fs.mkdirSync(abs(path.dirname(OUTPUT_PATH)), { recursive: true });
  fs.writeFileSync(abs(OUTPUT_PATH), html, "utf8");
  console.log(`ARTIFACT: wrote ${OUTPUT_PATH}`);
}

main();
