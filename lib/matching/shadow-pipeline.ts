import "server-only";

import type { ConciergeIntakeAnswers } from "@/lib/squibb/concierge-intake-v0";
import type { DiscoveryIntakeInput } from "@/lib/discovery/schema";
import { isMatchingShadowEnabled, isMatchingLlmEnabled } from "@/lib/matching/feature-flags";
import { runLayer0 } from "@/lib/matching/layer0";
import { evaluateNotMatch } from "@/lib/matching/not-match";
import {
  signalsFromConcierge,
  signalsFromDiscovery,
  signalsFromDocumentText
} from "@/lib/matching/signals";
import { scorePaths } from "@/lib/matching/score-paths";
import { buildMatchingReadout, buildSquibbVoice } from "@/lib/matching/deliver";
import { buildMemberCausalDraft } from "@/lib/matching/member-causal-draft";
import { newShadowRunId, persistShadowRun, readLatestShadowRuns } from "@/lib/matching/shadow-storage";
import { matchingReceiptPath } from "@/lib/matching/shadow-store";
import type { ShadowMatchingRun, StructuredSignals } from "@/lib/matching/types";

export { readLatestShadowRuns };

export function shadowRunSmokeSummary(run: ShadowMatchingRun) {
  const topEligible = run.readout.scoredPaths.find((candidate) => !candidate.disqualified)?.kind ?? null;
  const disqualifiedKinds = run.notMatch.disqualified.map((item) => item.kind);
  return {
    shadow_top_eligible_path: topEligible,
    shadow_disqualified_kinds: disqualifiedKinds
  };
}

async function maybeLlmTranslate(signals: StructuredSignals): Promise<StructuredSignals> {
  if (!isMatchingLlmEnabled()) return signals;
  return signals;
}

async function runMatchingCore(signals: StructuredSignals, llmUsed = isMatchingLlmEnabled()): Promise<{
  intakeId: string;
  source: StructuredSignals["source"];
  mode: "shadow";
  signals: StructuredSignals;
  layer0: ShadowMatchingRun["layer0"];
  notMatch: ShadowMatchingRun["notMatch"];
  readout: ShadowMatchingRun["readout"];
  squibb: ShadowMatchingRun["squibb"];
  llmUsed: boolean;
  receiptPath: string;
}> {
  const layer0 = runLayer0(signals);
  const notMatch = evaluateNotMatch(signals, layer0);
  const scoredPaths = scorePaths(signals, layer0, notMatch);
  const readout = buildMatchingReadout(signals, layer0, notMatch, scoredPaths);
  const squibb = buildSquibbVoice(readout);

  return {
    intakeId: signals.intakeId,
    source: signals.source,
    mode: "shadow",
    signals,
    layer0,
    notMatch,
    readout,
    squibb,
    llmUsed,
    receiptPath: matchingReceiptPath()
  };
}

function finalizeRun(
  core: Awaited<ReturnType<typeof runMatchingCore>>,
  runId: string
): ShadowMatchingRun {
  return {
    ...core,
    runId,
    createdAt: new Date().toISOString(),
    memberCausalDraft: buildMemberCausalDraft({
      runId,
      signals: core.signals,
      notMatch: core.notMatch,
      readout: core.readout
    })
  };
}

export async function runShadowMatchingFromDiscovery(
  intakeId: string,
  input: DiscoveryIntakeInput
): Promise<ShadowMatchingRun | null> {
  if (!isMatchingShadowEnabled()) return null;
  const signals = await maybeLlmTranslate(signalsFromDiscovery(intakeId, input));
  const run = finalizeRun(await runMatchingCore(signals), newShadowRunId());
  await persistShadowRun(run);
  return run;
}

export async function runShadowMatchingFromConcierge(
  intakeId: string,
  answers: ConciergeIntakeAnswers
): Promise<ShadowMatchingRun | null> {
  if (!isMatchingShadowEnabled()) return null;
  const signals = await maybeLlmTranslate(signalsFromConcierge(intakeId, answers));
  const run = finalizeRun(await runMatchingCore(signals), newShadowRunId());
  await persistShadowRun(run);
  return run;
}

/**
 * Score an operator-supplied document without writing a shadow run or source
 * document to storage.
 */
export async function runEphemeralMatchingFromDocument(input: {
  title: string;
  body: string;
}): Promise<ShadowMatchingRun | null> {
  if (!isMatchingShadowEnabled()) return null;

  const intakeId = `doc_${Date.now().toString(36)}`;
  const signals = signalsFromDocumentText(intakeId, input.title, input.body);
  return finalizeRun(await runMatchingCore(signals, false), newShadowRunId());
}
