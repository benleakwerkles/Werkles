import "server-only";

import type {
  BusinessOpportunityCandidate,
  OpportunitySearchQuery
} from "@/lib/opportunities/types";

type GooglePlace = Readonly<{
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  businessStatus?: string;
  websiteUri?: string;
  googleMapsUri?: string;
}>;

type GooglePlacesResponse = Readonly<{ places?: readonly GooglePlace[] }>;

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.businessStatus",
  "places.websiteUri",
  "places.googleMapsUri"
].join(",");

function requireLiveConfiguration(): string {
  if (process.env.WERKLES_OPPORTUNITY_LIVE_SEARCH !== "enabled") {
    throw new Error("Live opportunity search is disabled.");
  }
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) throw new Error("Google Places is not configured.");
  return key;
}

export async function searchGooglePlaces(
  query: OpportunitySearchQuery
): Promise<readonly BusinessOpportunityCandidate[]> {
  const apiKey = requireLiveConfiguration();
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK
    },
    body: JSON.stringify({
      textQuery: query.textQuery,
      maxResultCount: 8
    }),
    cache: "no-store"
  });

  if (!response.ok) throw new Error(`Google Places search failed (${response.status}).`);
  const payload = await response.json() as GooglePlacesResponse;
  const observedAt = new Date().toISOString();

  return Object.freeze((payload.places ?? []).flatMap((place, index) => {
    const name = place.displayName?.text?.trim();
    const sourceUrl = place.googleMapsUri?.trim();
    if (!name || !sourceUrl?.startsWith("https://")) return [];

    const facts = [
      place.formattedAddress ? { label: "Address", value: place.formattedAddress, provenance: "provider" as const } : null,
      place.businessStatus ? { label: "Google business status", value: place.businessStatus, provenance: "provider" as const } : null
    ].filter((fact): fact is NonNullable<typeof fact> => Boolean(fact));

    return [{
      id: `google:${place.id ?? `${query.id}:${index + 1}`}`,
      category: query.category,
      name,
      locationLabel: place.formattedAddress ?? query.locationLabel,
      sourceName: "Google Places",
      sourceUrl,
      sourceRecordId: place.id ?? null,
      providerStage: "live_api_ready" as const,
      observedAt,
      facts,
      whyItAppeared: [query.reason],
      unknowns: ["Suitability, availability, delivered price, licensing, current terms, and member-specific fit are unknown."],
      sponsorship: {
        status: "none" as const,
        disclosure: "Werkles was not paid to place this result. Google supplied the place data.",
        affectedOrdering: false as const
      },
      action: {
        label: place.websiteUri ? "Open business website" : "Open in Google Maps",
        href: place.websiteUri?.startsWith("https://") ? place.websiteUri : sourceUrl,
        sendsMemberData: false as const,
        createsCommitment: false as const
      }
    } satisfies BusinessOpportunityCandidate];
  }));
}

