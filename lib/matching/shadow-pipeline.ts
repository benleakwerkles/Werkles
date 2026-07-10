import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import type { ConciergeIntakeAnswers } from "@/lib/squibb/concierge-intake-v0";
import type { DiscoveryIntakeInput } from "@/lib/discovery/schema";
import { isMatchingShadowEnabled, isMatchingLlmEnabled } from "@/lib/matching/feature-flags";
import { runLayer0 } from "@/lib/matching/layer0";
import { evaluateNotMatch } from "@/lib/matching/not-match";
import { signalsFromConcierge, signalsFromDiscovery } from "@/lib/matching/signals";
import { scorePaths } from "@/lib/matching/score-paths";
import { buildSpeakerFacts, buildSquibbVoice } from "@/lib/matching/deliver";
import { newShadowRunId, persistShadowRun } from "@/lib/matching/shadow-storage";
import type { ShadowMatchingRun, StructuredSignals } from "@/lib/matching/types";

async function maybeLlmTranslate(signals: StructuredSignals): Promise<StructuredSignals> {
  if (!isMatchingLlmEnabled()) return signals;
  // Gated LLM slot — wired when OPENAI_API_KEY + APPROVE MATCHING LLM TRANSLATE
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
    receiptPath: "data/matching/shadow-runs.jsonl"
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

export async function readLatestShadowRuns(limit = 10): Promise<ShadowMatchingRun[]> {
  const indexPath = path.join(process.cwd(), "data/matching/shadow-runs.jsonl");
  let content: string;
  try {
    content = await readFile(indexPath, "utf8");
  } catch {
    return [];
  }

  const lines = content.trim().split("\n").filter(Boolean);
  return lines
    .slice(-limit)
    .map((line) => JSON.parse(line) as ShadowMatchingRun)
    .reverse();
}
