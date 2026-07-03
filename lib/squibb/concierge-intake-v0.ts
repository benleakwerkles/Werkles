/**
 * Concierge Intake v0 — symptom capture for Speaker.
 * Not onboarding. Not matching. Not profiles.
 */

export type ConciergeIntakeFieldId =
  | "heaviest_lift"
  | "already_tried"
  | "time_cost"
  | "stuck_decision"
  | "success_twelve_months";

export type ConciergeIntakeQuestion = {
  id: ConciergeIntakeFieldId;
  label: string;
  hint: string;
  placeholder: string;
};

export type ConciergeIntakeAnswers = Record<ConciergeIntakeFieldId, string>;

export type SpeakerIntakeSymptomField = {
  id: ConciergeIntakeFieldId;
  question: string;
  answer: string;
};

export type SpeakerIntakePacket = {
  version: "v0";
  packetType: "concierge_intake";
  intakeMode: "symptom_only";
  capturedAt: string;
  symptoms: SpeakerIntakeSymptomField[];
  framing: {
    collected: "symptoms";
    avoided: ["partner_request", "service_request", "solution_first"];
  };
  speakerFeed: {
    headline: string;
    summary: string;
    symptomBlock: string;
  };
};

export const CONCIERGE_INTAKE_QUESTIONS: ConciergeIntakeQuestion[] = [
  {
    id: "heaviest_lift",
    label: "What is the heaviest thing you are trying to lift?",
    hint: "Name the weight — not the person or product you think will carry it.",
    placeholder: "e.g. I am trying to open a second location while running the first alone."
  },
  {
    id: "already_tried",
    label: "What have you already tried?",
    hint: "Attempts, dead ends, and partial wins count.",
    placeholder: "e.g. Hired a part-time bookkeeper, asked two friends, postponed the lease decision."
  },
  {
    id: "time_cost",
    label: "What is costing you the most time?",
    hint: "Where do the hours go that you cannot get back?",
    placeholder: "e.g. Quoting jobs, chasing invoices, redoing work because specs were unclear."
  },
  {
    id: "stuck_decision",
    label: "What decision feels stuck?",
    hint: "The fork in the road you keep circling.",
    placeholder: "e.g. Whether to borrow, bring someone in, or stay small another year."
  },
  {
    id: "success_twelve_months",
    label: "What would success look like 12 months from now?",
    hint: "Describe the outcome — not the hire or vendor you imagine getting you there.",
    placeholder: "e.g. One location profitable, second location signed, I am not the bottleneck on every order."
  }
];

export const EMPTY_INTAKE_ANSWERS: ConciergeIntakeAnswers = {
  heaviest_lift: "",
  already_tried: "",
  time_cost: "",
  stuck_decision: "",
  success_twelve_months: ""
};

export function buildSpeakerIntakePacket(
  answers: ConciergeIntakeAnswers,
  capturedAt = new Date().toISOString()
): SpeakerIntakePacket {
  const symptoms: SpeakerIntakeSymptomField[] = CONCIERGE_INTAKE_QUESTIONS.map((q) => ({
    id: q.id,
    question: q.label,
    answer: answers[q.id].trim()
  }));

  const symptomBlock = symptoms
    .map((s, index) => `${index + 1}. ${s.question}\n   ${s.answer || "(not answered)"}`)
    .join("\n\n");

  const answeredCount = symptoms.filter((s) => s.answer.length > 0).length;

  return {
    version: "v0",
    packetType: "concierge_intake",
    intakeMode: "symptom_only",
    capturedAt,
    symptoms,
    framing: {
      collected: "symptoms",
      avoided: ["partner_request", "service_request", "solution_first"]
    },
    speakerFeed: {
      headline: "Concierge intake — symptoms only",
      summary: `${answeredCount} of ${symptoms.length} fields answered. No partner or service request captured.`,
      symptomBlock
    }
  };
}

export function formatSpeakerIntakeJson(packet: SpeakerIntakePacket): string {
  return JSON.stringify(packet, null, 2);
}
