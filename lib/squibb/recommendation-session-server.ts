import "server-only";

import {
  readLatestSpeakerIntake,
  readLatestSpeakerIntakeRows
} from "@/lib/squibb/concierge-intake-storage";
import type { BellowsPacketLedger } from "@/lib/squibb/bellows-ledger";
import { readLatestSquibbRecommendationPacketRows } from "@/lib/squibb/recommendation-packet-storage";
import {
  buildLiveIntakeRankedDeck,
  loadSquibbRecommendationSession,
  type SquibbRecommendationSession
} from "@/lib/squibb/recommendations";
import type { SpeakerIntakePacket } from "@/lib/squibb/concierge-intake-v0";
import { readLatestShadowRuns } from "@/lib/matching/shadow-pipeline";
import { shadowRunToRecommendationSession } from "@/lib/matching/shadow-to-recommendations";
import { isMatchingPublicEnabled } from "@/lib/matching/feature-flags";

function firstAnsweredSymptom(packet: SpeakerIntakePacket): string {
  return packet.symptoms.find((symptom) => symptom.answer.trim().length > 0)?.answer.trim() || packet.speakerFeed.summary;
}

export async function loadSquibbRecommendationSessionForBellows(): Promise<SquibbRecommendationSession> {
  const fallback = loadSquibbRecommendationSession();
  const [latest, shadowRuns] = await Promise.all([readLatestSpeakerIntake(), readLatestShadowRuns(5)]);

  const matchingShadow = shadowRuns.find(
    (run) => run.source === "bellows_concierge" && (!latest || run.intakeId === latest.stored.intakeId)
  );

  if (matchingShadow && (isMatchingPublicEnabled() || matchingShadow.mode === "shadow")) {
    return shadowRunToRecommendationSession(matchingShadow);
  }

  if (!latest) {
    return {
      ...fallback,
      source: {
        mode: "demo",
        label: "Demo scenario",
        detail: "No Bellows intake packet was found, so this page is using the original bakery demo deck."
      }
    };
  }

  const statedNeed = firstAnsweredSymptom(latest.packet);
  const operatorContext = `Latest Bellows intake - ${latest.stored.answeredCount} of ${latest.stored.totalQuestions} fields answered - ${latest.stored.createdAt}`;
  const liveDeck = buildLiveIntakeRankedDeck(statedNeed, latest.packet.speakerFeed.symptomBlock);

  return {
    ...fallback,
    statedNeed,
    operatorContext,
    squibbIntro:
      "Squibb is reading the latest Bellows intake as source material. These are staged hypotheses - not matches, intros, or orders.",
    source: {
      mode: "latest_intake",
      label: "Latest Bellows intake",
      detail: latest.stored.meaning,
      intakeId: latest.stored.intakeId,
      packetPath: latest.stored.packetPath,
      speakerEntryPath: latest.stored.speakerEntryPath,
      capturedAt: latest.packet.capturedAt,
      answeredCount: latest.stored.answeredCount,
      totalQuestions: latest.stored.totalQuestions,
      symptomBlock: latest.packet.speakerFeed.symptomBlock
    },
    ranked: liveDeck,
    catalog: liveDeck
  };
}

export async function loadBellowsPacketLedger(): Promise<BellowsPacketLedger> {
  const [intakes, optionPackets] = await Promise.all([
    readLatestSpeakerIntakeRows(5),
    readLatestSquibbRecommendationPacketRows(5)
  ]);

  return { intakes, optionPackets };
}
