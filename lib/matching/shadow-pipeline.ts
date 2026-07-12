import "server-only";

import type { ConciergeIntakeAnswers } from "@/lib/squibb/concierge-intake-v0";
import type { DiscoveryIntakeInput } from "@/lib/discovery/schema";
import { isMatchingShadowEnabled, isMatchingLlmEnabled } from "@/lib/matching/feature-flags";
import { runLayer0 } from "@/lib/matching/layer0";
import { evaluateNotMatch } from "@/lib/matching/not-match";
import { signalsFromConcierge, signalsFromDiscovery } from "@/lib/matching/signals";
import { scorePaths } from "@/lib/matching/score-paths";
import { buildSpeakerFacts, buildSquibbVoice } from "@/lib/matching/deliver";
import { newShadowRunId, persistShadowRun, readLatestShadowRuns } from "@/lib/matching/shadow-storage";
import { matchingReceiptPath } from "@/lib/matching/shadow-store";
import type { ShadowMatchingRun, StructuredSignals } from "@/lib/matching/types";

export { readLatestShadowRuns };

export function shadowRunSmokeSummary(run: ShadowMatchingRun) {
  const topEligible = run.speaker.scoredPaths.find((candidate) => !candidate.disqualified)?.kind ?? null;
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

async function runMatchingCore(signals: StructuredSignals): Promise<Omit<ShadowMatchingRun, "runId" | "createdAt">> {
  const layer0 = runLayer0(signals);
  const notMatch = evaluateNotMatch(signals, layer0);
  const scoredPaths = scorePaths(signals, layer0, notMatch);
  const speaker = buildSpeakerFacts(signals, layer0, notMatch, scoredPaths);
  const squibb = buildSquibbVoice(speaker);

  return {
    intakeId: signals.intakeId,
    source: signals.source,
    mode: "shadow",
    signals,
    layer0,
    notMatch,
    speaker,
    squibb,
    llmUsed: isMatchingLlmEnabled(),
    receiptPath: matchingReceiptPath()
  };
}

export async function runShadowMatchingFromDiscovery(
  intakeId: string,
  input: DiscoveryIntakeInput
): Promise<ShadowMatchingRun | null> {
  if (!isMatchingShadowEnabled()) return null;

  let signals = signalsFromDiscovery(intakeId, input);
  signals = await maybeLlmTranslate(signals);
  const core = await runMatchingCore(signals);

  const run: ShadowMatchingRun = {
    runId: newShadowRunId(),
    ...core,
    createdAt: new Date().toISOString()
  };

  await persistShadowRun(run);
  return run;
}

export async function runShadowMatchingFromConcierge(
  intakeId: string,
  answers: ConciergeIntakeAnswers
): Promise<ShadowMatchingRun | null> {
  if (!isMatchingShadowEnabled()) return null;

  let signals = signalsFromConcierge(intakeId, answers);
  signals = await maybeLlmTranslate(signals);
  const core = await runMatchingCore(signals);

  const run: ShadowMatchingRun = {
    runId: newShadowRunId(),
    ...core,
    createdAt: new Date().toISOString()
  };

  await persistShadowRun(run);
  return run;
}
