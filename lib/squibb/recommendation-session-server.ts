import "server-only";

import {
  readLatestSpeakerIntakeForOwner,
  readLatestSpeakerIntakeRowsForOwner
} from "@/lib/squibb/concierge-intake-storage";
import type { BellowsPacketLedger } from "@/lib/squibb/bellows-ledger";
import { readLatestSquibbRecommendationPacketRows } from "@/lib/squibb/recommendation-packet-storage";
import {
  buildLiveIntakeRankedDeck,
  loadSquibbRecommendationSession,
  type SquibbRecommendationSession
} from "@/lib/squibb/recommendations";
import type { SpeakerIntakePacket } from "@/lib/squibb/concierge-intake-v0";
import { readShadowRunForIntake } from "@/lib/matching/shadow-pipeline";
import { shadowRunToRecommendationSession } from "@/lib/matching/shadow-to-recommendations";
import { isMatchingPublicEnabled } from "@/lib/matching/feature-flags";
import { buildIntakeSourceDocument } from "@/lib/squibb/intake-source-document";

function firstAnsweredSymptom(packet: SpeakerIntakePacket): string {
  return (
    packet.symptoms.find((symptom) => symptom.answer.trim().length > 0)?.answer.trim() ||
    packet.speakerFeed.summary
  );
}

function emptyPersonalSession(fallback: SquibbRecommendationSession): SquibbRecommendationSession {
  return {
    ...fallback,
    statedNeed: "Submit intake to see your ranked next steps.",
    ranked: [],
    source: {
      mode: "demo",
      label: "No intake for this session yet",
      detail: "Your answers stay bound to this browser session. Answer the Werkles questions to generate a personal readout."
    }
  };
}

/** Owner-bound personal readout. Never reads another owner's intake. */
export async function loadSquibbRecommendationSessionForBellows(
  ownerId: string
): Promise<SquibbRecommendationSession> {
  const fallback = loadSquibbRecommendationSession();
  if (!ownerId) return emptyPersonalSession(fallback);

  const latest = await readLatestSpeakerIntakeForOwner(ownerId);

  if (!latest) {
    return emptyPersonalSession(fallback);
  }

  const matchingShadow = await readShadowRunForIntake(latest.stored.intakeId);

  if (matchingShadow && (isMatchingPublicEnabled() || matchingShadow.mode === "shadow")) {
    const session = shadowRunToRecommendationSession(matchingShadow);
    const feeds = session.ranked.map((path) => path.kind);

    return {
      ...session,
      source: {
        ...session.source!,
        capturedAt: latest.packet.capturedAt,
        answeredCount: latest.stored.answeredCount,
        totalQuestions: latest.stored.totalQuestions,
        symptomBlock: latest.packet.speakerFeed.symptomBlock,
        fedDocument: buildIntakeSourceDocument(latest.stored.intakeId, latest.packet, feeds)
      }
    };
  }

  const statedNeed = firstAnsweredSymptom(latest.packet);
  const operatorContext = `Your Bellows intake - ${latest.stored.answeredCount} of ${latest.stored.totalQuestions} fields answered - ${latest.stored.createdAt}`;

  return {
    ...fallback,
    statedNeed,
    operatorContext,
    squibbIntro:
      "Werkles is comparing possible next steps with what you wrote. These are working ideas—not matches, introductions, or orders.",
    source: {
      mode: "latest_intake",
      label: "Your intake",
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

export async function loadBellowsPacketLedger(ownerId: string): Promise<BellowsPacketLedger> {
  if (!ownerId) {
    return { intakes: [], optionPackets: [] };
  }

  const [intakes, optionPackets] = await Promise.all([
    readLatestSpeakerIntakeRowsForOwner(ownerId, 5),
    readLatestSquibbRecommendationPacketRows(5)
  ]);

  const intakeIds = new Set(intakes.map((row) => row.intakeId));
  return {
    intakes,
    optionPackets: optionPackets.filter(
      (row) => !row.sourceIntakeId || intakeIds.has(row.sourceIntakeId)
    )
  };
}
