import type { OpportunitySearchLane } from "@/lib/opportunities/types";

type LaneResource = Readonly<{
  laneId: string;
  name: string;
  source: string;
  observedAt: string;
  href: string;
  fact: string;
  unknown: string;
}>;

const RESOURCES: readonly LaneResource[] = Object.freeze([
  {
    laneId: "participant:owner",
    name: "Invest Atlanta — Small Business Assistance",
    source: "Invest Atlanta",
    observedAt: "2026-09-01T12:00:00.000Z",
    href: "https://www.investatlanta.com/businesses/startups-creatives/startups-scaleups",
    fact: "The City of Atlanta's economic-development agency publishes assistance for entrepreneurs, startups, and small businesses operating in Atlanta.",
    unknown: "Program timing, business-location requirements, and fit for this Werkle still need checking."
  },
  {
    laneId: "participant:partner",
    name: "UGA SBDC — Columbus",
    source: "University of Georgia Small Business Development Center",
    observedAt: "2026-09-01T12:00:00.000Z",
    href: "https://georgiasbdc.org/locations/columbus/",
    fact: "The Columbus office publishes consulting and training for starting, operating, financing, and growing a business in its service area.",
    unknown: "Appointment timing, exact program fit, and any course fee still need checking. The SBDC does not provide funding."
  },
  {
    laneId: "shared:statewide-remote",
    name: "UGA SBDC statewide office finder",
    source: "University of Georgia Small Business Development Center",
    observedAt: "2026-09-01T12:00:00.000Z",
    href: "https://georgiasbdc.org/find-your-sbdc/",
    fact: "UGA publishes a statewide office finder so the Werkle can identify the office serving the chosen operating area instead of borrowing one participant's city.",
    unknown: "The correct office depends on the business location and service area the participants deliberately choose."
  }
]);

function checkedDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export function MultiLocationOpportunityMap({ lanes }: { lanes: readonly OpportunitySearchLane[] }) {
  return (
    <section className="multi-location-map" aria-labelledby="multi-location-map-title">
      <header>
        <div>
          <p className="opportunity-finder__eyebrow">Two people · two cities · one possible company</p>
          <h1 id="multi-location-map-title">Do not turn one example city into everybody&apos;s hometown.</h1>
          <p>
            These cities are a practice scenario, not locations saved to your profile. One participant is in Atlanta and
            another is in Columbus. Werkles keeps local options
            separate, asks both people to choose any shared meeting area, and adds statewide or remote paths for work
            that does not belong to either city.
          </p>
        </div>
        <div className="multi-location-map__route" aria-label="Practice locations">
          <span><strong>Atlanta</strong><small>Your local lane</small></span>
          <i>↔</i>
          <span><strong>Columbus</strong><small>Rosa&apos;s local lane</small></span>
        </div>
      </header>

      <aside className="multi-location-map__privacy">
        <strong>Location boundary</strong>
        <span>Werkles uses only the city or region each participant deliberately shares for this search. A private location is not shown to the other participant or sent to a search provider during planning.</span>
      </aside>

      <div className="multi-location-map__lanes">
        {lanes.map((lane) => {
          const resource = RESOURCES.find((item) => item.laneId === lane.id);
          return (
            <article key={lane.id} data-status={lane.status}>
              <div className="multi-location-map__scope">
                <span>{lane.scope.replaceAll("_", " ")}</span>
                <small>{lane.locationLabel ?? "No area chosen"}</small>
              </div>
              <h2>{lane.label}</h2>
              <p>{lane.explanation}</p>
              {resource ? (
                <div className="multi-location-map__resource">
                  <strong>{resource.name}</strong>
                  <small><b>Source checked:</b> {checkedDate(resource.observedAt)} · {resource.source}</small>
                  <p>{resource.fact}</p>
                  <small><b>Still unknown:</b> {resource.unknown}</small>
                  <a href={resource.href} target="_blank" rel="noreferrer">Open {resource.source} →</a>
                </div>
              ) : (
                <div className="multi-location-map__choice">
                  <strong>Werkles stops here on purpose.</strong>
                  <p>Neither city is silently treated as the default, and a geometric midpoint is not called convenient.</p>
                  <span>Next: both participants choose an area or choose remote-only.</span>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
