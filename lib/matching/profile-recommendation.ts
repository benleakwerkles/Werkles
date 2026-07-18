import "server-only";

import { buildMatchingReadout, buildSquibbVoice } from "@/lib/matching/deliver";
import { runLayer0 } from "@/lib/matching/layer0";
import { evaluateNotMatch } from "@/lib/matching/not-match";
import { scorePaths } from "@/lib/matching/score-paths";
import {
  signalsFromMemberProfile,
  type MemberMatchingProfile
} from "@/lib/matching/signals";
import { shadowRunToRecommendationSession } from "@/lib/matching/shadow-to-recommendations";
import type { ShadowMatchingRun } from "@/lib/matching/types";
import type { SquibbRecommendationSession } from "@/lib/squibb/recommendations";

const PRIVATE_IN_MEMORY_DATE = "1970-01-01T00:00:00.000Z";

/**
 * Builds the member's rules-based result without a storage, logging, LLM, or
 * service-role path. The returned session contains no account or profile ID.
 */
export function recommendationSessionFromMemberProfile(
  profile: MemberMatchingProfile
): SquibbRecommendationSession | null {
  const signals = signalsFromMemberProfile(profile);
  if (!signals) return null;

  const layer0 = runLayer0(signals);
  const notMatch = evaluateNotMatch(signals, layer0);
  const scoredPaths = scorePaths(signals, layer0, notMatch);
  const readout = buildMatchingReadout(signals, layer0, notMatch, scoredPaths);
  const inMemoryRun: ShadowMatchingRun = {
    runId: "private-in-memory",
    intakeId: signals.intakeId,
    source: signals.source,
    mode: "shadow",
    signals,
    layer0,
    notMatch,
    readout,
    squibb: buildSquibbVoice(readout),
    memberCausalDraft: null,
    llmUsed: false,
    createdAt: PRIVATE_IN_MEMORY_DATE,
    receiptPath: ""
  };
  const session = shadowRunToRecommendationSession(inMemoryRun);

  return {
    ...session,
    operatorContext: "Rules-based recommendation generated in memory from your saved profile.",
    squibbIntro:
      "Werkles ranked these paths from the self-reported information in your saved profile. They are suggestions, not decisions, verified matches, or guaranteed outcomes.",
    source: {
      mode: "authenticated_profile",
      label: "Private to this signed-in account",
      detail: "Generated in memory from your own saved profile. Nothing is saved or sent."
    }
  };
}
