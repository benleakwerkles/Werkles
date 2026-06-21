import fs from "node:fs";
import path from "node:path";
import {
  abs,
  exists,
  read,
  nowIso,
  sha256FileRaw,
  truncateHash,
} from "../../scripts/foreman/_foreman-core.mjs";

const ROUTER_DIR = "foreman/gd-intent-router";
const TEMPLATE_PATH = `${ROUTER_DIR}/templates/THREAD_REFRESH_PACKET_TEMPLATE.md`;
const RUNS_DIR = `${ROUTER_DIR}/runs`;
const OUTBOX_DIR = "foreman/handoffs/outbox";
const LATEST_OUTBOX = `${OUTBOX_DIR}/THREAD_REFRESH_PACKET.md`;

const COCKPIT_SOURCES = [
  { key: "human_gates", path: "foreman/HUMAN_GATES.md", label: "Human gates (authority order)" },
  { key: "lanes", path: "foreman/LANES.md", label: "Approved lanes" },
  { key: "budget", path: "foreman/BUDGET.md", label: "Budget caps" },
  { key: "next_action", path: "foreman/NEXT_ACTION.md", label: "Next action / effective gate" },
  { key: "current_state", path: "foreman/CURRENT_STATE.md", label: "Current state snapshot" },
  { key: "approval_log", path: "foreman/gates/APPROVAL_LOG.md", label: "Gate approval log" },
];

function expandTemplate(template, tokens) {
  let out = template;
  for (const [k, v] of Object.entries(tokens)) {
    out = out.split(`{{${k}}}`).join(String(v ?? ""));
  }
  return out;
}

function timestampSlug() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

function buildRunId() {
  return `GD_RUN_THREAD_REFRESH_PACKET_${timestampSlug()}`;
}

function readCockpit(relPath) {
  if (!exists(relPath)) return { ok: false, text: "", hash: null };
  return {
    ok: true,
    text: read(relPath),
    hash: truncateHash(sha256FileRaw(relPath)),
  };
}

function extractEffectiveGate(nextAction) {
  const m = nextAction.match(/\*\*Effective gate:\*\*\s*`([^`]+)`/);
  if (m) return m[1].trim();
  const m2 = nextAction.match(/^## Effective gate\s*\r?\n\r?\n`([^`]+)`/m);
  if (m2) return m2[1].trim();
  return "(not found — see foreman/NEXT_ACTION.md)";
}

function extractSection(md, headingPattern) {
  const re = new RegExp(
    `^##\\s+${headingPattern}[\\s\\S]*?(?=^##\\s+|\\Z)`,
    "im"
  );
  const m = md.match(re);
  return m ? m[0].trim() : "";
}

function extractNumberedList(sectionMd) {
  const items = [];
  for (const line of sectionMd.split(/\r?\n/)) {
    const m = line.match(/^\d+\.\s+(.+)/);
    if (m) items.push(m[1].replace(/\*\*/g, ""));
  }
  return items;
}

function extractTableStatusRows(md) {
  const rows = [];
  for (const line of md.split(/\r?\n/)) {
    if (!line.startsWith("|") || line.includes("---")) continue;
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length < 2) continue;
    if (/^fact$/i.test(cells[0]) || cells.join("|").toLowerCase() === "fact|status") continue;
    rows.push({ fact: cells[0], status: cells[1] });
  }
  return rows;
}

function parseLanes(lanesMd) {
  const lanes = [];
  const blocks = lanesMd.split(/^## Lane: /m).slice(1);
  for (const block of blocks) {
    const nameLine = block.split(/\r?\n/)[0]?.trim();
    if (!nameLine) continue;
    const statusMatch = block.match(/- Status: `(APPROVED|BLOCKED|PAUSED)`/);
    lanes.push({
      name: nameLine,
      status: statusMatch?.[1] || "UNKNOWN",
    });
  }
  return lanes;
}

function parseApprovalLogRecent(approvalMd, limit = 5) {
  const rows = [];
  for (const line of approvalMd.split(/\r?\n/)) {
    if (!line.startsWith("|") || line.includes("---") || line.includes("Timestamp")) continue;
    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 2) {
      rows.push({
        date: cells[0],
        gate: cells[1],
        decision: cells[4] || cells[3] || "",
      });
    }
  }
  return rows.slice(-limit);
}

function formatBullets(items, empty = "- _(none parsed)_") {
  if (!items.length) return empty;
  return items.map((i) => `- ${i}`).join("\n");
}

function buildGateStatus(nextAction, currentState) {
  const gate = extractEffectiveGate(nextAction);
  const lines = [`**Effective gate:** \`${gate}\``];

  const integration = extractSection(nextAction, "Integration status.*");
  if (integration) {
    for (const row of extractTableStatusRows(integration)) {
      lines.push(`- **${row.fact}:** ${row.status}`);
    }
  }

  const gate05 = extractSection(nextAction, "Gate 05.*");
  if (gate05) {
    if (/PAUSE/i.test(gate05)) lines.push("- **Gate 05 / Ghost Forge:** PAUSE (see NEXT_ACTION — overrides batch lane spend)");
  }

  const stateGate = currentState.match(/## Effective gate\s*\r?\n\r?\n`([^`]+)`/);
  if (stateGate && stateGate[1] !== gate) {
    lines.push(`- **CURRENT_STATE gate note:** \`${stateGate[1]}\``);
  }

  return lines.join("\n");
}

function buildActiveLane(nextAction, lanesMd) {
  const lanes = parseLanes(lanesMd);
  const approved = lanes.filter((l) => l.status === "APPROVED").map((l) => l.name);
  const blocked = lanes.filter((l) => l.status === "BLOCKED" || l.status === "PAUSED");

  const lines = [];
  const gate = extractEffectiveGate(nextAction);
  lines.push(`**Primary workstream (from effective gate):** ${gate}`);
  lines.push("");
  lines.push("**Approved lanes (from foreman/LANES.md):**");
  lines.push(formatBullets(approved.map((n) => `\`${n}\``)));

  if (blocked.length) {
    lines.push("");
    lines.push("**Blocked / paused lanes:**");
    lines.push(formatBullets(blocked.map((l) => `\`${l.name}\` — ${l.status}`)));
  }

  const maker = extractSection(nextAction, "Maker \\(Cursor\\).*");
  if (maker) {
    lines.push("");
    lines.push("**Maker scope (NEXT_ACTION):**");
    for (const line of maker.split(/\r?\n/).slice(0, 6)) {
      if (line.trim().startsWith("-")) lines.push(line.trim());
    }
  }

  return lines.join("\n");
}

function listGdRunsBrief() {
  const dir = abs(RUNS_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => exists(`${RUNS_DIR}/${name}/run-manifest.json`))
    .sort()
    .reverse()
    .slice(0, 8)
    .map((runId) => {
      try {
        const m = JSON.parse(read(`${RUNS_DIR}/${runId}/run-manifest.json`));
        return {
          runId,
          missionClass: m.missionClass,
          status: m.status,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function buildCompletedMilestones(nextAction, currentState, approvalMd, gdRuns) {
  const items = [];

  for (const row of extractTableStatusRows(nextAction)) {
    if (/PASS|Landed|Preserved|Adopted/i.test(row.status)) {
      items.push(`${row.fact}: ${row.status}`);
    }
  }

  const preview = extractSection(currentState, "Preview proof summary.*");
  if (preview) {
    for (const row of extractTableStatusRows(preview)) {
      if (/PASS/i.test(row.status)) items.push(`Preview proof — ${row.fact}: PASS`);
    }
  }

  for (const row of parseApprovalLogRecent(approvalMd, 4)) {
    if (/APPROVED|PASS|CLEARED|GO/i.test(row.decision)) {
      items.push(`${row.date}: ${row.gate} → ${row.decision}`);
    }
  }

  const completeRuns = (gdRuns || [])
    .filter((r) => r.status === "SYNTHESIS_COMPLETE")
    .slice(0, 3);
  for (const run of completeRuns) {
    items.push(`GD mission complete: \`${run.missionClass}\` (${run.runId})`);
  }

  return formatBullets([...new Set(items)].slice(0, 12));
}

function buildBlockedItems(nextAction) {
  const items = [];

  for (const row of extractTableStatusRows(nextAction)) {
    if (/Blocked|Still gated|NO-GO|PAUSE/i.test(row.status)) {
      items.push(`${row.fact}: ${row.status}`);
    }
  }

  const hardStops = extractSection(nextAction, "Hard stops");
  if (hardStops) {
    const line = hardStops.split(/\r?\n/).find((l) => l.includes("|") && !l.includes("---"));
    if (line) items.push(`Hard stops: ${line.replace(/^[^\|]*\|\s*/, "").trim()}`);
  }

  const conditions = extractSection(nextAction, "Conditions \\(active\\)");
  if (conditions) {
    for (const line of conditions.split(/\r?\n/)) {
      const t = line.trim();
      if (t.startsWith("-") && t !== "---" && !/^-+$/.test(t)) {
        items.push(t.replace(/^-\s+/, "").trim());
      }
    }
  }

  const petra = extractSection(nextAction, "Petra — pending");
  if (petra) {
    for (const line of petra.split(/\r?\n/)) {
      const t = line.trim();
      if (!t.startsWith("-") || t === "---" || /^-+$/.test(t)) continue;
      const item = t.replace(/^-\s+/, "").trim();
      if (item && item !== "---") items.push(item);
    }
  }

  return formatBullets([...new Set(items.filter((i) => i && i !== "---"))]);
}

function buildNextExecutableStep(nextAction) {
  const ben = extractSection(nextAction, "Ben \\(Operator\\).*");
  const items = extractNumberedList(ben);
  if (items.length) {
    return `**Operator:** ${items[0]}\n\n**Full queue:**\n${formatBullets(items)}`;
  }
  const maker = extractSection(nextAction, "Maker \\(Cursor\\).*");
  const makerItems = maker
    .split(/\r?\n/)
    .filter((l) => l.trim().startsWith("-"))
    .map((l) => l.replace(/^-\s+/, "").trim());
  if (makerItems.length) {
    return `**Maker:** ${makerItems[0]}\n\n${formatBullets(makerItems)}`;
  }
  return "See `foreman/NEXT_ACTION.md` — no numbered Operator step parsed.";
}

function buildSourceOfTruth(cockpit) {
  const rows = [
    "| Priority | File | Role | Hash |",
    "|----------|------|------|------|",
  ];
  cockpit.forEach((c, i) => {
    rows.push(
      `| ${i + 1} | \`${c.path}\` | ${c.label} | ${c.hash || "missing"} |`
    );
  });
  rows.push(`| — | \`AGENTS.md\` | AI worker rules | — |`);
  rows.push(`| — | \`foreman/gd-intent-router/HUMAN_CONSUMABLE_OUTPUT_RULE_V1.md\` | GD output rule | — |`);
  return rows.join("\n");
}

function buildExecSummary(gate, nextStepLine, blockedCount) {
  const step = nextStepLine.replace(/^\*\*Operator:\*\*\s*/, "").slice(0, 120);
  return (
    `Werkles cockpit snapshot: effective gate is ${gate}. ` +
    `${blockedCount} blocked/paused areas active (production deploy, Stripe live, Ghost Forge, etc.). ` +
    `Next executable step: ${step}${step.length >= 120 ? "…" : ""}. ` +
    `Authority order: HUMAN_GATES → LANES → BUDGET → NEXT_ACTION. Ben is Operator — not copy/paste mule.`
  );
}

export function generateThreadRefreshPacket() {
  const runId = buildRunId();
  const runDir = `${RUNS_DIR}/${runId}`;
  const generatedAt = nowIso();

  const cockpit = COCKPIT_SOURCES.map((s) => {
    const file = readCockpit(s.path);
    return { ...s, ok: file.ok, hash: file.hash, text: file.text };
  });

  const nextAction = cockpit.find((c) => c.key === "next_action")?.text || "";
  const currentState = cockpit.find((c) => c.key === "current_state")?.text || "";
  const lanesMd = cockpit.find((c) => c.key === "lanes")?.text || "";
  const approvalMd = cockpit.find((c) => c.key === "approval_log")?.text || "";

  let gdRuns = listGdRunsBrief();

  const gate = extractEffectiveGate(nextAction);
  const gateStatus = buildGateStatus(nextAction, currentState);
  const activeLane = buildActiveLane(nextAction, lanesMd);
  const milestones = buildCompletedMilestones(nextAction, currentState, approvalMd, gdRuns);
  const blocked = buildBlockedItems(nextAction);
  const blockedCount = blocked.split("\n").filter((l) => l.startsWith("-")).length;
  const nextStep = buildNextExecutableStep(nextAction);
  const sourceOfTruth = buildSourceOfTruth(cockpit);
  const execSummary = buildExecSummary(gate, nextStep.split("\n")[0], blockedCount);

  const metadata = {
    router: "GD_INTENT_ROUTER_V1",
    schema_version: "thread-refresh-packet/v1",
    mission_class: "THREAD_REFRESH_PACKET",
    run_id: runId,
    generated_at: generatedAt,
    cockpit_hashes: Object.fromEntries(
      cockpit.filter((c) => c.hash).map((c) => [c.key, c.hash])
    ),
    production_actions: false,
  };

  const template = read(TEMPLATE_PATH);
  const body = expandTemplate(template, {
    GENERATED_AT: generatedAt,
    RUN_ID: runId,
    EXEC_SUMMARY: execSummary,
    GATE_STATUS: gateStatus,
    ACTIVE_LANE: activeLane,
    COMPLETED_MILESTONES: milestones,
    BLOCKED_ITEMS: blocked,
    NEXT_EXECUTABLE_STEP: nextStep,
    SOURCE_OF_TRUTH: sourceOfTruth,
    RELAY_METADATA_JSON: JSON.stringify(metadata, null, 2),
  });

  fs.mkdirSync(abs(runDir), { recursive: true });
  fs.mkdirSync(abs(OUTBOX_DIR), { recursive: true });

  const runPacketRel = `${runDir}/THREAD_REFRESH_PACKET.md`;
  fs.writeFileSync(abs(runPacketRel), body, "utf8");
  fs.writeFileSync(abs(LATEST_OUTBOX), body, "utf8");

  const manifest = {
    router: "GD_INTENT_ROUTER_V1",
    runId,
    missionClass: "THREAD_REFRESH_PACKET",
    missionLabel: "Thread refresh packet",
    generationMode: "COCKPIT_DIRECT",
    recipients: [],
    createdAt: generatedAt,
    status: "COMPLETE",
    output: {
      latest: LATEST_OUTBOX,
      runPacket: runPacketRel,
    },
    cockpitSources: COCKPIT_SOURCES.map((s) => s.path),
  };

  fs.writeFileSync(
    path.join(abs(runDir), "run-manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  return {
    runId,
    latestOutbox: LATEST_OUTBOX,
    runPacket: runPacketRel,
    manifest,
    body,
    chars: body.length,
  };
}
