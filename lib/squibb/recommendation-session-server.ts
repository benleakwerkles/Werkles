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

function firstAnsweredSymptom(packet: SpeakerIntakePacket): string {
  return packet.symptoms.find((symptom) => symptom.answer.trim().length > 0)?.answer.trim() || packet.speakerFeed.summary;
}

export async function loadSquibbRecommendationSessionForBellows(): Promise<SquibbRecommendationSession> {
  const fallback = loadSquibbRecommendationSession();
  const latest = await readLatestSpeakerIntake();

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
    ranked: buildLiveIntakeRankedDeck(statedNeed, latest.packet.speakerFeed.symptomBlock)
  };
}

export async function loadBellowsPacketLedger(): Promise<BellowsPacketLedger> {
  const [intakes, optionPackets] = await Promise.all([
    readLatestSpeakerIntakeRows(5),
    readLatestSquibbRecommendationPacketRows(5)
  ]);

  return { intakes, optionPackets };
}
