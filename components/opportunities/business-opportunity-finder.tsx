import type { BusinessOpportunityCandidate } from "@/lib/opportunities/types";

const CATEGORY_LABELS: Record<BusinessOpportunityCandidate["category"], string> = {
  supplier_equipment: "Tools & supplies",
  professional_service: "Professional help",
  meeting_customer_place: "A place to meet",
  commercial_space: "Commercial space",
  training_trade_resource: "Guidance & training",
  banking_public_funding: "Money paths",
  customer_channel: "Customers & channels",
  permit_government_help: "Permits & public help"
};

function checkedDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export function BusinessOpportunityFinder({ candidates }: { candidates: readonly BusinessOpportunityCandidate[] }) {
  return (
    <section className="opportunity-finder" aria-labelledby="opportunity-finder-title">
      <header className="opportunity-finder__heading">
        <div>
          <p className="opportunity-finder__eyebrow">Real paths near the work</p>
          <h1 id="opportunity-finder-title">Turn a landscaping idea into calls you can actually make.</h1>
          <p>
            Werkles used the project and location you supplied to assemble a first comparison set. These are leads to
            investigate—not endorsements, approvals, live quotes, or proof that any option fits.
          </p>
        </div>
        <aside aria-label="Search context">
          <strong>What this pass used</strong>
          <span>Landscaping business</span>
          <span>Decatur, Georgia</span>
          <span>Equipment, a meeting place, permits, guidance, and money paths</span>
        </aside>
      </header>

      <div className="opportunity-finder__rhythm" aria-hidden="true">
        <span>Find</span><i /><span>Compare</span><i /><span>Decide</span>
      </div>

      <div className="opportunity-finder__grid">
        {candidates.map((item) => (
          <article className={`opportunity-card opportunity-card--${item.category}`} key={item.id}>
            <div className="opportunity-card__topline">
              <span>{CATEGORY_LABELS[item.category]}</span>
              <small>Source checked {checkedDate(item.observedAt)}</small>
            </div>
            <p className="opportunity-card__trust-boundary">Source lead · fit and availability not verified by Werkles</p>
            <h2>{item.name}</h2>
            {item.locationLabel ? <p className="opportunity-card__location">{item.locationLabel}</p> : null}

            <div className="opportunity-card__reason">
              <strong>Why it showed up</strong>
              {item.whyItAppeared.map((reason) => <p key={reason}>{reason}</p>)}
            </div>

            <dl>
              {item.facts.map((fact) => (
                <div key={`${item.id}:${fact.label}`}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>

            <div className="opportunity-card__unknowns">
              <strong>Check before relying on it</strong>
              {item.unknowns.map((unknown) => <p key={unknown}>{unknown}</p>)}
            </div>

            <footer>
              <a className="button button-dark" href={item.action.href} target="_blank" rel="noreferrer">{item.action.label}</a>
              <p>{item.sponsorship.disclosure} You are leaving Werkles. Opening the source sends none of your Intake answers.</p>
            </footer>
          </article>
        ))}
      </div>

      <section className="opportunity-finder__blocked" aria-labelledby="opportunity-space-title">
        <div aria-hidden="true" className="opportunity-finder__building"><span /><span /><span /><span /></div>
        <div>
          <p className="opportunity-finder__eyebrow">Commercial space is different</p>
          <h2 id="opportunity-space-title">We will not invent the perfect vacant yard.</h2>
          <p>
            A real space result needs a licensed, current listing source plus an address-level check of asking terms,
            allowed use, access, and availability. Until that feed is connected, Werkles can prepare your search criteria
            and hand you to a current marketplace—but it cannot claim a property is vacant, zoned correctly, or in budget.
          </p>
        </div>
      </section>
    </section>
  );
}
