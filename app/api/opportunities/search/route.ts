import { NextResponse } from "next/server";

import { opportunityCandidateSafetyErrors } from "@/lib/opportunities/candidate-safety";
import { searchGooglePlaces } from "@/lib/opportunities/providers/google-places";
import { planBusinessOpportunityQueries } from "@/lib/opportunities/query-planner";
import type { OpportunitySearchContext } from "@/lib/opportunities/types";
import { RECOMMENDATION_KINDS } from "@/lib/squibb/recommendations";

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, max) : null;
}

function parseContext(input: unknown): OpportunitySearchContext | null {
  if (!input || typeof input !== "object") return null;
  const body = input as Record<string, unknown>;
  const recommendationKind = text(body.recommendationKind, 60);
  const project = text(body.project, 220);
  if (!project || !recommendationKind || !RECOMMENDATION_KINDS.includes(recommendationKind as never)) return null;

  const specifications = Array.isArray(body.specifications)
    ? body.specifications.map((item) => text(item, 100)).filter((item): item is string => Boolean(item)).slice(0, 3)
    : [];

  return {
    recommendationKind: recommendationKind as OpportunitySearchContext["recommendationKind"],
    project,
    city: text(body.city, 100),
    state: text(body.state, 40),
    zip: text(body.zip, 12),
    specifications
  };
}

export async function POST(request: Request) {
  let input: unknown;
  try { input = await request.json(); } catch {
    return NextResponse.json({ error: "Valid JSON is required." }, { status: 400 });
  }

  const context = parseContext(input);
  if (!context) return NextResponse.json({ error: "Project and a valid next-move type are required." }, { status: 400 });

  try {
    const query = planBusinessOpportunityQueries(context)[0];
    if (!query) return NextResponse.json({ error: "No supported search path was found." }, { status: 422 });
    const candidates = (await searchGooglePlaces(query)).filter((item) => opportunityCandidateSafetyErrors(item).length === 0);
    return NextResponse.json({
      candidates,
      source: "Google Places",
      live: true,
      note: "These are current search results, not Werkles endorsements or proof of fit."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Opportunity search failed.";
    const disabled = /disabled|not configured/i.test(message);
    return NextResponse.json({ error: message }, { status: disabled ? 503 : 502 });
  }
}

