import type { CousinId } from "@/lib/soledash/command-surface/types";

export type PriorFindingKind =
  | "relevant_prior_finding"
  | "known_risk"
  | "previous_decision"
  | "related_parked_idea"
  | "active_constraint";

export type PriorFinding = {
  id: string;
  kind: PriorFindingKind;
  label: string;
  summary: string;
  detail: string | null;
  source: string;
  why_it_matters_now: string;
  recommended_caution: string;
  confidence: "high" | "medium" | "low";
  relevance: number;
};

export type RouteRecommendation = {
  cousin: CousinId;
  machine: string;
  reason: string;
};

export type IntentMemoryPanel = {
  intent_id: string;
  raw_command: string;
  interpreted_command: string;
  prior_findings: PriorFinding[];
  recommended_owner: RouteRecommendation;
  selected_owner: RouteRecommendation;
  route_confidence: "high" | "medium" | "low";
  route_confidence_note: string;
  mission_class: string | null;
  mission_label: string | null;
  alternate_routes: RouteRecommendation[];
  proposal_id: string | null;
  generated_at: string;
};

export type IntentMemoryAction =
  | "continue"
  | "edit_route"
  | "send_petra"
  | "send_bean"
  | "park";

export type IntentMemoryActionResult = {
  ok: boolean;
  action: IntentMemoryAction;
  detail: string;
  receipt_path?: string | null;
  outbound_path?: string | null;
};
