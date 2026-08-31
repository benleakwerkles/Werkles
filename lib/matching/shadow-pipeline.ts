import "server-only";

import type { ConciergeIntakeAnswers } from "@/lib/squibb/concierge-intake-v0";
import type { DiscoveryIntakeInput } from "@/lib/discovery/schema";
import { isMatchingShadowEnabled, isMatchingLlmEnabled } from "@/lib/matching/feature-flags";
import { runLayer0 } from "@/lib/matching/layer0";
import { evaluateNotMatch } from "@/lib/matching/not-match";
import { signalsFromConcierge, signalsFromDiscovery, signalsFromDocumentText } from "@/lib/matching/signals";
import { scorePaths } from "@/lib/matching/score-paths";
import { buildMatchingReadout, buildSquibbVoice } from "@/lib/matching/deliver";
import { buildMemberCausalDraft } from "@/lib/matching/member-causal-draft";
import {
  newShadowRunId,
  persistShadowRun,
  readLatestShadowRuns,
  readShadowRunForIntake
} from "@/lib/matching/shadow-storage";
import { matchingReceiptPath } from "@/lib/matching/shadow-store";
import type { ShadowMatchingRun, StructuredSignals } from "@/lib/matching/types";

export { readLatestShadowRuns, readShadowRunForIntake };

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

async function runMatchingCore(signals: StructuredSignals): Promise<{
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
    llmUsed: isMatchingLlmEnabled(),
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
 * Builds the current deterministic member readout without writing a shadow-run
 * receipt. Durable member Intake custody and operator matching audit custody
 * remain separate concerns.
 */
export async function runEphemeralMatchingFromConcierge(
  intakeId: string,
  answers: ConciergeIntakeAnswers
): Promise<ShadowMatchingRun | null> {
  if (!isMatchingShadowEnabled()) return null;
  const signals = await maybeLlmTranslate(signalsFromConcierge(intakeId, answers));
  return finalizeRun(await runMatchingCore(signals), newShadowRunId());
}

/**
 * Score a pasted real-world document against Autonomous Matching.
 * Ephemeral: does not write to Supabase / shadow-runs store.
 */
export async function runEphemeralMatchingFromDocument(input: {
  title: string;
  body: string;
}): Promise<ShadowMatchingRun | null> {
  if (!isMatchingShadowEnabled()) return null;
  const title = input.title.trim().slice(0, 200) || "Pasted document";
  const body = input.body.trim().slice(0, 20000);
  if (body.length < 40) return null;

  const intakeId = `doc_${Date.now().toString(36)}`;
  const signals = await maybeLlmTranslate(signalsFromDocumentText(intakeId, title, body));
  return finalizeRun(await runMatchingCore(signals), newShadowRunId());
}
