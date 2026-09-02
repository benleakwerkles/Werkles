import { planBusinessOpportunityQueries } from "@/lib/opportunities/query-planner";
import type {
  OpportunityParticipantLocation,
  OpportunitySearchContext,
  OpportunitySearchLane
} from "@/lib/opportunities/types";

export type MultiLocationOpportunityContext = Readonly<{
  project: string;
  recommendationKind: OpportunitySearchContext["recommendationKind"];
  participants: readonly OpportunityParticipantLocation[];
  projectLocation?: Readonly<{ label: string; city: string; state: string; zip?: string | null }> | null;
  mutuallyChosenMeetingArea?: Readonly<{ label: string; city: string; state: string; zip?: string | null }> | null;
  specifications?: readonly string[];
}>;

function clean(value: string, max = 100): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function locationLabel(city: string, state: string): string {
  return [clean(city), clean(state, 40)].filter(Boolean).join(", ");
}

function participantLocalExplanation(participantLabel: string): string {
  const cleanedLabel = clean(participantLabel, 80);
  return cleanedLabel.toLowerCase() === "you"
    ? "Options near the location you chose to share. This lane does not assume your partner can travel there."
    : `Options near the location ${cleanedLabel} chose to share. This lane does not assume you can travel there.`;
}

function queriesFor(
  context: MultiLocationOpportunityContext,
  location: { city: string; state: string; zip?: string | null },
  extraSpecification?: string
) {
  return planBusinessOpportunityQueries({
    recommendationKind: context.recommendationKind,
    project: context.project,
    city: location.city,
    state: location.state,
    zip: location.zip,
    specifications: [...(context.specifications ?? []), ...(extraSpecification ? [extraSpecification] : [])].slice(0, 3)
  });
}

export function planMultiLocationOpportunityLanes(
  context: MultiLocationOpportunityContext
): readonly OpportunitySearchLane[] {
  const lanes: OpportunitySearchLane[] = [];
  const sharedParticipants = context.participants.filter((participant) => participant.locationUse === "shared_for_search");

  for (const participant of sharedParticipants) {
    const label = locationLabel(participant.city, participant.state);
    lanes.push(Object.freeze({
      id: `participant:${participant.participantId}`,
      scope: "participant_local",
      label: `Near ${participant.participantLabel}`,
      servesParticipantId: participant.participantId,
      locationLabel: label,
      travelRadiusMiles: participant.travelRadiusMiles ?? null,
      status: "ready",
      explanation: participantLocalExplanation(participant.participantLabel),
      queries: queriesFor(context, participant)
    }));
  }

  if (context.projectLocation) {
    lanes.push(Object.freeze({
      id: "project:operating-location",
      scope: "project_local",
      label: context.projectLocation.label,
      servesParticipantId: null,
      locationLabel: locationLabel(context.projectLocation.city, context.projectLocation.state),
      travelRadiusMiles: null,
      status: "ready",
      explanation: "Options near the deliberately supplied operating location. This is not inferred from either participant's home location.",
      queries: queriesFor(context, context.projectLocation)
    }));
  }

  if (context.mutuallyChosenMeetingArea) {
    lanes.push(Object.freeze({
      id: "meeting:chosen-area",
      scope: "shared_meeting",
      label: context.mutuallyChosenMeetingArea.label,
      servesParticipantId: null,
      locationLabel: locationLabel(context.mutuallyChosenMeetingArea.city, context.mutuallyChosenMeetingArea.state),
      travelRadiusMiles: null,
      status: "ready",
      explanation: "A meeting area both participants deliberately selected. Werkles did not infer convenience from a geometric midpoint.",
      queries: queriesFor(context, context.mutuallyChosenMeetingArea, "meeting place")
    }));
  } else if (sharedParticipants.length > 1) {
    lanes.push(Object.freeze({
      id: "meeting:choice-required",
      scope: "shared_meeting",
      label: "Choose a shared meeting area",
      servesParticipantId: null,
      locationLabel: null,
      travelRadiusMiles: null,
      status: "requires_member_choice",
      explanation: "Werkles will not call a midpoint convenient. Both participants need to name a workable area or choose remote-only meetings.",
      queries: Object.freeze([])
    }));
  }

  const states = new Set(sharedParticipants.map((participant) => clean(participant.state, 40).toUpperCase()).filter(Boolean));
  const commonState = states.size === 1 ? [...states][0] : null;
  lanes.push(Object.freeze({
    id: "shared:statewide-remote",
    scope: "statewide_remote",
    label: commonState ? `${commonState} statewide or remote` : "Statewide or remote",
    servesParticipantId: null,
    locationLabel: commonState,
    travelRadiusMiles: null,
    status: "ready",
    explanation: "Resources that can serve the shared work without pretending both people live in the same city.",
    queries: planBusinessOpportunityQueries({
      recommendationKind: context.recommendationKind,
      project: context.project,
      state: commonState,
      specifications: [...(context.specifications ?? []), "statewide remote service"].slice(0, 3)
    })
  }));

  return Object.freeze(lanes);
}
