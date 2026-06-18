import { dispatchBuild } from "@/lib/soledash/command-surface/dispatch";

import { buildLatestReport, reportToMarkdown } from "./build-report";
import {
  buildPanel,
  readReportJson,
  readReportMarkdown,
  saveWatchState,
  loadWatchState,
  writeActionReceipt,
  writeReport,
  topRisksForPanel
} from "./storage";
import type { WisdomWatchAction, WisdomWatchActionResult, WisdomWatchPanel } from "./types";

export function getOrRefreshReport(): { report: ReturnType<typeof buildLatestReport>; markdown: string } {
  let report = readReportJson();
  let markdown = readReportMarkdown();

  if (!report || !markdown) {
    report = buildLatestReport();
    markdown = reportToMarkdown(report);
    writeReport(report, markdown);
  }

  return { report, markdown: markdown ?? reportToMarkdown(report) };
}

export function loadWisdomWatchPanel(): WisdomWatchPanel {
  const { report } = getOrRefreshReport();
  return buildPanel(report);
}

export async function runWisdomWatchAction(
  action: WisdomWatchAction,
  riskId?: string
): Promise<WisdomWatchActionResult> {
  const { report, markdown } = getOrRefreshReport();
  const state = loadWatchState();
  const top = topRisksForPanel(report, state);

  if (action === "mark_resolved") {
    if (!riskId) {
      return { ok: false, action, detail: "risk_id required for mark resolved" };
    }
    if (!state.resolved_ids.includes(riskId)) {
      state.resolved_ids.push(riskId);
    }
    state.last_action = `resolved:${riskId}`;
    saveWatchState(state);
    const receipt_path = writeActionReceipt({
      ok: true,
      action,
      detail: `Marked resolved: ${riskId}`,
      receipt_path: undefined
    });
    return { ok: true, action, detail: `Resolved ${riskId}`, receipt_path };
  }

  if (action === "park") {
    state.parked = true;
    state.parked_reason = "Operator parked Wisdom Watch panel";
    state.parked_at = new Date().toISOString();
    state.last_action = "park";
    saveWatchState(state);
    const receipt_path = writeActionReceipt({
      ok: true,
      action,
      detail: state.parked_reason
    });
    return { ok: true, action, detail: "Wisdom Watch parked", receipt_path };
  }

  const cousin = action === "send_petra" ? "PETRA" : "BEAN";
  const riskSummary = top.map((r) => `- [${r.severity}] ${r.summary}`).join("\n");
  const missionText = `Wisdom Watch conflict review for current SoleDash work.

Top ${top.length} doctrine conflicts (not full nugget dump):

${riskSummary}

Full report path: ${report.markdown_path}

Operator ask: comptroller verdict on whether current frontier violates Speaker doctrine; recommend correction or GO with explicit receipt.`;

  const result = await dispatchBuild({
    missionText,
    title: `[Wisdom Watch] ${report.title}`,
    cousin,
    decisionNote: `Wisdom Watch panel dispatch — ${top.length} top risks`
  });

  const detail = result.ok
    ? `Outbox written for ${cousin}`
    : result.message ?? "Dispatch failed";

  const receipt_path = writeActionReceipt({
    ok: result.ok,
    action,
    detail,
    outbound_path: result.build?.outboxPath ?? null
  });

  state.last_action = `${action}:${receipt_path}`;
  saveWatchState(state);

  return {
    ok: result.ok,
    action,
    detail,
    outbound_path: result.build?.outboxPath ?? null,
    receipt_path
  };
}

export { readReportMarkdown, reportToMarkdown };
