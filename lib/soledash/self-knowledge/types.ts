export type SelfKnowledgeQuestionId =
  | "what_are_we_building"
  | "who_is_awake"
  | "what_shipped_today"
  | "what_needs_ben"
  | "what_is_broken"
  | "where_are_the_receipts"
  | "what_can_i_do_now";

export type SelfKnowledgeQuestion = {
  id: SelfKnowledgeQuestionId;
  label: string;
};

export const SELF_KNOWLEDGE_QUESTIONS: SelfKnowledgeQuestion[] = [
  { id: "what_are_we_building", label: "What are we building?" },
  { id: "who_is_awake", label: "Who is awake?" },
  { id: "what_shipped_today", label: "What shipped today?" },
  { id: "what_needs_ben", label: "What needs Ben?" },
  { id: "what_is_broken", label: "What is broken?" },
  { id: "where_are_the_receipts", label: "Where are the receipts?" },
  { id: "what_can_i_do_now", label: "What can I do now?" }
];

export type SelfKnowledgeAnswer = {
  id: SelfKnowledgeQuestionId;
  label: string;
  endpoint: string;
  sources: string[];
  answer: unknown;
};

export type SelfKnowledgePanel = {
  generated_at: string;
  questions: SelfKnowledgeQuestion[];
  answers: SelfKnowledgeAnswer[];
};
