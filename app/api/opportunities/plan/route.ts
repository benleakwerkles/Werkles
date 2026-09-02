import { NextResponse } from "next/server";

import {
  planMultiLocationOpportunityLanes,
  type MultiLocationOpportunityContext
} from "@/lib/opportunities/multi-location-planner";
import type { OpportunityParticipantLocation } from "@/lib/opportunities/types";
import { RECOMMENDATION_KINDS } from "@/lib/squibb/recommendations";

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, max) : null;
}

function participantLocation(value: unknown): OpportunityParticipantLocation | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const city = text(item.city, 100);
  const state = text(item.state, 40);
  const participantId = text(item.participantId, 80);
  const participantLabel = text(item.participantLabel, 80);
  if (!city || !state || !participantId || !participantLabel) return null;

  const radius = typeof item.travelRadiusMiles === "number" && Number.isFinite(item.travelRadiusMiles)
    ? Math.max(1, Math.min(250, Math.round(item.travelRadiusMiles)))
    : null;

  return {
    participantId,
    participantLabel,
    city,
    state,
    zip: text(item.zip, 12),
    travelRadiusMiles: radius,
    locationUse: item.locationUse === "private" ? "private" as const : "shared_for_search" as const
  };
}

function namedLocation(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const label = text(item.label, 100);
  const city = text(item.city, 100);
  const state = text(item.state, 40);
  return label && city && state ? { label, city, state, zip: text(item.zip, 12) } : null;
}

function parseContext(input: unknown): MultiLocationOpportunityContext | null {
  if (!input || typeof input !== "object") return null;
  const body = input as Record<string, unknown>;
  const project = text(body.project, 220);
  const recommendationKind = text(body.recommendationKind, 60);
  if (!project || !recommendationKind || !RECOMMENDATION_KINDS.includes(recommendationKind as never)) return null;

  const participants = Array.isArray(body.participants)
    ? body.participants
        .map((item) => participantLocation(item))
        .filter((item): item is OpportunityParticipantLocation => Boolean(item))
        .slice(0, 8)
    : [];
  if (participants.length === 0) return null;

  const specifications = Array.isArray(body.specifications)
    ? body.specifications.map((item) => text(item, 100)).filter((item): item is string => Boolean(item)).slice(0, 3)
    : [];

  return {
    project,
    recommendationKind: recommendationKind as MultiLocationOpportunityContext["recommendationKind"],
    participants,
    projectLocation: namedLocation(body.projectLocation),
    mutuallyChosenMeetingArea: namedLocation(body.mutuallyChosenMeetingArea),
    specifications
  };
}

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Valid JSON is required." }, { status: 400 });
  }

  const context = parseContext(input);
  if (!context) {
    return NextResponse.json(
      { error: "A project, valid next-move type, and at least one participant location are required." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    lanes: planMultiLocationOpportunityLanes(context),
    liveSearchStarted: false,
    note: "This plans location lanes only. No participant location was sent to an outside search provider."
  });
}
