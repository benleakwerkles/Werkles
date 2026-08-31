/**
 * Concierge Intake — one plain-language conversation that produces both a
 * next-move readout and an unpublished starter profile. Legacy packet fields
 * retain their old names so previously saved browser intakes still load.
 */

export type ConciergeIntakeFieldId =
  | "heaviest_lift"
  | "business_stage"
  | "already_tried"
  | "time_cost"
  | "stuck_decision"
  | "success_twelve_months"
  | "resources_on_hand"
  | "what_you_offer"
  | "constraints";

export type ConciergeIntakeQuestion = {
  id: ConciergeIntakeFieldId;
  label: string;
  hint: string;
  placeholder: string;
  purpose: "solutions" | "profile" | "both";
  responseSize: "short" | "long";
  required: boolean;
};

export type ConciergeIntakeAnswers = Record<ConciergeIntakeFieldId, string>;

export const CONCIERGE_INTAKE_DEFAULT_FIELD_LIMIT = 600;
export const CONCIERGE_INTAKE_GOAL_FIELD_LIMIT = 1600;

export function conciergeIntakeFieldLimit(id: ConciergeIntakeFieldId): number {
  return id === "heaviest_lift"
    ? CONCIERGE_INTAKE_GOAL_FIELD_LIMIT
    : CONCIERGE_INTAKE_DEFAULT_FIELD_LIMIT;
}

export type SpeakerIntakeSymptomField = {
  id: ConciergeIntakeFieldId;
  question: string;
  answer: string;
};

export type SpeakerIntakePacket = {
  version: "v0" | "v1";
  packetType: "concierge_intake";
  intakeMode: "symptom_only" | "dual_purpose";
  capturedAt: string;
  symptoms: SpeakerIntakeSymptomField[];
  framing: {
    collected: "symptoms" | "solutions_and_profile_inputs";
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
    label: "What are you trying to make real?",
    hint: "Tell us what you are building, changing, opening, fixing, or trying to earn.",
    placeholder: "For example: I want to turn my weekend catering work into a dependable business.",
    purpose: "both",
    responseSize: "long",
    required: true
  },
  {
    id: "business_stage",
    label: "Where is it today?",
    hint: "Choose the closest answer. This keeps Werkles from recommending a later-stage move too early.",
    placeholder: "Choose one stage",
    purpose: "both",
    responseSize: "short",
    required: true
  },
  {
    id: "already_tried",
    label: "What have you already tried?",
    hint: "Attempts, dead ends, and partial wins count. We will not mistake these for what you want now.",
    placeholder: "For example: I asked two friends, tried a loan application, and tested weekend sales.",
    purpose: "solutions",
    responseSize: "long",
    required: false
  },
  {
    id: "time_cost",
    label: "What is getting in the way right now?",
    hint: "Name the main snag: money, customers, time, tools, skills, paperwork, a decision, or something else.",
    placeholder: "For example: I keep rebuilding the product instead of finding the first paying customer.",
    purpose: "both",
    responseSize: "long",
    required: true
  },
  {
    id: "stuck_decision",
    label: "What decision do you need to make next?",
    hint: "If no decision is stuck, say what must happen next instead.",
    placeholder: "For example: Decide whether to sell a small pilot first or start looking for funding.",
    purpose: "solutions",
    responseSize: "long",
    required: false
  },
  {
    id: "success_twelve_months",
    label: "What would a good next 12 months look like?",
    hint: "Use ordinary words. This becomes the first draft of the goal on your Werkles profile.",
    placeholder: "For example: Ten repeat customers, steady monthly income, and weekends back with my family.",
    purpose: "both",
    responseSize: "long",
    required: false
  },
  {
    id: "resources_on_hand",
    label: "What do you already have to work with?",
    hint: "Skills, customers, money, tools, a place, a prototype, a team, or useful relationships all count.",
    placeholder: "For example: A working prototype, bookkeeping skills, three customers, and a garage workspace.",
    purpose: "both",
    responseSize: "short",
    required: false
  },
  {
    id: "what_you_offer",
    label: "What can you already do well enough to help someone else?",
    hint: "This is the beginning of matching. We will not invent an offer from your goal.",
    placeholder: "For example: Repair small engines, price jobs, train new hires, and introduce local suppliers.",
    purpose: "profile",
    responseSize: "short",
    required: false
  },
  {
    id: "constraints",
    label: "What cannot change?",
    hint: "Location, family time, budget, ownership, schedule, risk, or any firm no-go belongs here.",
    placeholder: "For example: I cannot move, quit my job yet, or risk more than $2,000.",
    purpose: "both",
    responseSize: "short",
    required: false
  }
];

export const EMPTY_INTAKE_ANSWERS: ConciergeIntakeAnswers = {
  heaviest_lift: "",
  business_stage: "",
  already_tried: "",
  time_cost: "",
  stuck_decision: "",
  success_twelve_months: "",
  resources_on_hand: "",
  what_you_offer: "",
  constraints: ""
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
    version: "v1",
    packetType: "concierge_intake",
    intakeMode: "dual_purpose",
    capturedAt,
    symptoms,
    framing: {
      collected: "solutions_and_profile_inputs",
      avoided: ["partner_request", "service_request", "solution_first"]
    },
    speakerFeed: {
      headline: "Werkles Intake — next moves and starter profile",
      summary: `${answeredCount} of ${symptoms.length} questions answered. Your answers can shape next-step suggestions and a private starter profile; nothing is published or sent.`,
      symptomBlock
    }
  };
}

export function formatSpeakerIntakeJson(packet: SpeakerIntakePacket): string {
  return JSON.stringify(packet, null, 2);
}
