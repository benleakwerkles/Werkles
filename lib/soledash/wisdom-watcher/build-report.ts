import fs from "node:fs";
import path from "node:path";

import type { WisdomRisk, WisdomWatchReport } from "./types";

const ROOT = process.cwd();
const DECISION_SURFACE = path.join(ROOT, "foreman", "soledash", "DECISION_SURFACE.json");

type DecisionSurface = {
  frontier?: { title?: string; action_code?: string; owner?: string };
  machine_frontier?: { title?: string; action_code?: string };
  current_blocker?: { headline?: string; detail?: string };
  active_owner?: string;
};

function loadCurrentWork(): {
  frontier: string;
  frontierCode: string;
  machineFrontier: string;
  blocker: string;
  blockerDetail: string;
} {
  try {
    const raw = JSON.parse(fs.readFileSync(DECISION_SURFACE, "utf8")) as DecisionSurface;
    return {
      frontier: raw.frontier?.title ?? "Unknown frontier",
      frontierCode: raw.frontier?.action_code ?? "—",
      machineFrontier: raw.machine_frontier?.title ?? "Unknown",
      blocker: raw.current_blocker?.headline ?? "none",
      blockerDetail: raw.current_blocker?.detail ?? ""
    };
  } catch {
    return {
      frontier: "Workstation Uniformization",
      frontierCode: "P0-A001",
      machineFrontier: "Doss Stability Investigation",
      blocker: "blocker_maker_live_file_integration_v0_1",
      blockerDetail: "Maker file integration pending"
    };
  }
}

/** Top conflicts only — not a nugget dump. Ranked for current operator frontier. */
export function buildConflictRisks(): WisdomRisk[] {
  const work = loadCurrentWork();

  return [
    {
      id: "ww_maker_file_lane",
      summary: "Maker reading Dink-owned live files before cousin auto-dispatch is wired",
      severity: "high",
      source_doctrine: "foreman/speaker/SPEAKER_DOCTRINE.md — wire-only passes forbidden",
      conflicting_task: `${work.frontierCode} · ${work.frontier} (${work.blocker})`,
      recommended_correction:
        "Hold live Maker dispatch on Dink files; keep mock receipts honest until Dink wires transport gap."
    },
    {
      id: "ww_courier_thread_blind",
      summary: "Relay / Petra transport without thread registry — packets may land shallow",
      severity: "high",
      source_doctrine: "foreman/speaker/entries/DRAFT_20260608-thread-registry.md",
      conflicting_task: "Automatica relay cards + Focus Thief / Mobile SD fire surface",
      recommended_correction:
        "Do not trust auto-send; attach thread identity in outbox before cousin paste."
    },
    {
      id: "ww_frontier_operator_machine_split",
      summary: "Operator frontier diverges from machine rank — attention cost hidden",
      severity: "medium",
      source_doctrine: "foreman/speaker/entries/DRAFT_20260607-human-adaptation-thesis.md",
      conflicting_task: `Operator: ${work.frontier} vs Machine: ${work.machineFrontier}`,
      recommended_correction:
        "Explicit override receipt when keeping P0-A001 over machine P0-A002; surface delay cost in dispatch matrix."
    },
    {
      id: "ww_compression_handoffs",
      summary: "SoleDash feature velocity risks compressing causal doctrine into slogans",
      severity: "medium",
      source_doctrine: "foreman/speaker/entries/DRAFT_20260608-ai-compression-soul-loss.md",
      conflicting_task: "Mobile field command + wisdom/focus panels shipping fast",
      recommended_correction:
        "Handoffs must cite cause → effect → lesson; no one-paragraph 'wire-only' summaries to Petra/Bean."
    },
    {
      id: "ww_tool_mortality_context",
      summary: "Critical context still lives in chat if Dink/Maker lanes stall",
      severity: "medium",
      source_doctrine: "foreman/speaker/entries/DRAFT_20260608-tool-mortality.md",
      conflicting_task: `${work.blockerDetail || work.blocker}`,
      recommended_correction:
        "Write watch reports and receipts to foreman/soledash/ — repo memory survives tool death."
    },
    {
      id: "ww_mock_partial_live",
      summary: "Partial-live mock transport can look like success without external proof",
      severity: "low",
      source_doctrine: "foreman/HUMAN_GATES.md + SoleDash honesty badges",
      conflicting_task: "MOCK TEST MODE banner on Command layer",
      recommended_correction: "Keep SIM/MOCK labels on receipts; never hide transport_gap from operator."
    }
  ];
}

export function buildLatestReport(): WisdomWatchReport {
  const now = new Date().toISOString();
  const reportId = `wisdom_watch_${Date.now()}`;
  const risks = buildConflictRisks();
  const work = loadCurrentWork();

  return {
    report_id: reportId,
    title: "Wisdom Watch — current work conflict scan",
    generated_at: now,
    report_path: "foreman/soledash/wisdom-watch/LATEST_REPORT.json",
    markdown_path: "foreman/soledash/wisdom-watch/LATEST_REPORT.md",
    risks
  };
}

export function reportToMarkdown(report: WisdomWatchReport): string {
  const work = loadCurrentWork();
  const riskLines = report.risks
    .map(
      (r, i) => `### ${i + 1}. ${r.summary} (${r.severity})

- **Source doctrine:** \`${r.source_doctrine}\`
- **Conflicting task:** ${r.conflicting_task}
- **Recommended correction:** ${r.recommended_correction}
`
    )
    .join("\n");

  return `# Wisdom Watch Report

| Field | Value |
|-------|-------|
| Report ID | \`${report.report_id}\` |
| Generated | ${report.generated_at} |
| Operator frontier | ${work.frontierCode} · ${work.frontier} |
| Machine frontier | ${work.machineFrontier} |
| Blocker | ${work.blocker} |

## Purpose

Top conflicts between ratified Speaker doctrine and **current** SoleDash work — not a 25-nugget dump.

## Top risks (full set in JSON — panel shows top 5)

${riskLines}

## Authority

\`foreman/speaker/SPEAKER_DOCTRINE.md\` · \`foreman/HUMAN_GATES.md\`
`;
}
