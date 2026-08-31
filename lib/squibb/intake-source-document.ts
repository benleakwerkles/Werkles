import type { SpeakerIntakePacket } from "@/lib/squibb/concierge-intake-v0";
import type { SquibbRecommendationSessionSource } from "@/lib/squibb/recommendations";

type FedDocument = NonNullable<SquibbRecommendationSessionSource["fedDocument"]>;

export function buildIntakeSourceDocument(
  intakeId: string,
  packet: SpeakerIntakePacket,
  feeds: string[]
): FedDocument {
  const answeredCount = packet.symptoms.filter((symptom) => symptom.answer.trim().length > 0).length;

  return {
    id: intakeId,
    title: "What you told Werkles",
    kind: "member_intake",
    summary: `${answeredCount} of ${packet.symptoms.length} Intake questions answered. These are your words, before Werkles's interpretation.`,
    body: packet.speakerFeed.symptomBlock,
    excerpts: packet.symptoms.map((symptom) => ({
      id: `intake-${symptom.id}`,
      label: symptom.question,
      text: symptom.answer.trim() || "Not answered",
      feeds: [...feeds]
    }))
  };
}
