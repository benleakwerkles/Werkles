import Link from "next/link";

import { BusinessOpportunityFinder } from "@/components/opportunities/business-opportunity-finder";
import { MultiLocationOpportunityMap } from "@/components/opportunities/multi-location-opportunity-map";
import { ResourceLifecycleStudio } from "@/components/opportunities/resource-lifecycle-studio";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { DECATUR_LANDSCAPING_WALKTHROUGH, GEORGIA_MULTI_LOCATION_WALKTHROUGH_LEAD } from "@/lib/opportunities/walkthrough-fixtures";
import { planMultiLocationOpportunityLanes } from "@/lib/opportunities/multi-location-planner";
import { RESOURCE_SURFACES, type ResourceSurface } from "@/lib/opportunities/resource-lifecycle";

export default async function BusinessOpportunitiesDraftReviewPage({ searchParams }: { searchParams: Promise<{ surface?: string }> }) {
  const requestedSurface = (await searchParams).surface;
  const surface: ResourceSurface = RESOURCE_SURFACES.includes(requestedSurface as ResourceSurface) ? requestedSurface as ResourceSurface : "workshop";
  const multiLocationLanes = planMultiLocationOpportunityLanes({
    recommendationKind: "find_equipment",
    project: "landscaping company",
    participants: [
      { participantId: "owner", participantLabel: "You", city: "Atlanta", state: "GA", travelRadiusMiles: 25, locationUse: "shared_for_search" },
      { participantId: "partner", participantLabel: "Rosa", city: "Columbus", state: "GA", travelRadiusMiles: 20, locationUse: "shared_for_search" }
    ],
    specifications: ["commercial landscaping equipment"]
  });

  return (
    <CockpitShell>
      <main className="opportunity-review-page route-room route-room--bellows">
        <MultiLocationOpportunityMap lanes={multiLocationLanes} />
        <ResourceLifecycleStudio candidate={GEORGIA_MULTI_LOCATION_WALKTHROUGH_LEAD} surface={surface} />
        <div className="opportunity-review-page__fixture-break">
          <span>Earlier single-city source audit</span>
          <strong>Decatur remains below as a test fixture—not a user default.</strong>
        </div>
        <BusinessOpportunityFinder candidates={DECATUR_LANDSCAPING_WALKTHROUGH} />
        <nav className="opportunity-review-page__next" aria-label="Draft review navigation">
          <div>
            <strong>Walkthrough boundary</strong>
            <span>This review page uses dated source-checked examples. Live provider search is not switched on.</span>
          </div>
          <Link className="button button-outline" href="/dashboard/blueprints">Return to Workshop</Link>
        </nav>
      </main>
    </CockpitShell>
  );
}
