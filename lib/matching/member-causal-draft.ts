import "server-only";

import { RECOMMENDATION_KIND_LABELS } from "@/lib/squibb/recommendations";
import type { MatchingReadout, NotMatchResult, StructuredSignals } from "@/lib/matching/types";

/**
 * Real Speaker job inside Werkles product: preserve *why* a matching read was made
 * for this member, so future sessions can avoid repeating the same mistake.
 *
 * This is a DRAFT causal note only — not org/Harvey doctrine, not ratified Speaker
 * entries, and not a substitute for the MatchingReadout packaging layer.
 */
export function buildMemberCausalDraft(args: {
  runId: string;
  signals: StructuredSignals;
  notMatch: NotMatchResult;
  readout: MatchingReadout;
}): string {
  const { runId, signals, notMatch, readout } = args;
  const top = readout.scoredPaths.find((p) => !p.disqualified) ?? readout.scoredPaths[0];
  const topLabel = top ? RECOMMENDATION_KIND_LABELS[top.kind] : "(none)";
  const disqualified = readout.scoredPaths
    .filter((p) => p.disqualified)
    .map((p) => `- ${RECOMMENDATION_KIND_LABELS[p.kind]}: ${p.disqualifyReason ?? "disqualified"}`)
    .join("\n");

  return [
    `# Member causal draft — matching`,
    ``,
    `Status: DRAFT — member journey memory (Speaker office shape)`,
    `Run: ${runId}`,
    `Intake: ${signals.intakeId} (${signals.source})`,
    `Generated: ${readout.generatedAt}`,
    ``,
    `## Why we believe this`,
    ``,
    `- Stated need: ${signals.statedNeed || "(not provided)"}`,
    `- Translated bottleneck: ${readout.primaryBottleneck}`,
    `- Not-match: ${notMatch.outcome} — ${notMatch.headline}`,
    `- Top eligible path: ${topLabel}${top ? ` (score ${top.score})` : ""}`,
    ``,
    `## Cost / lesson to remember`,
    ``,
    `- Do not treat this as a person match or guarantee.`,
    `- Evidence on this run is mostly self-reported / inferred until Crucible proof attaches.`,
    top?.rationale[0] ? `- Top-path rationale: ${top.rationale[0]}` : `- No top-path rationale recorded.`,
    ``,
    `## What would change the read`,
    ``,
    ...readout.falsifiers.map((f) => `- ${f}`),
    ``,
    `## Proof still missing`,
    ``,
    ...readout.proofGaps.map((g) => `- ${g}`),
    ``,
    `## Paths ruled out this turn`,
    ``,
    disqualified || `- (none disqualified)`,
    ``,
    `## Speaker office note`,
    ``,
    `This draft is for member-side causal memory over time.`,
    `It must not be confused with MatchingReadout (one-shot packaging) or with Harvey/Nerdkle org Speaker doctrine.`,
    ``
  ].join("\n");
}
