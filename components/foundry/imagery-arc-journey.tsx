import { AnyoneNarrativePhoto } from "@/components/foundry/anyone-narrative-photo";
import { copy } from "@/lib/copy";
import {
  anyoneNarrativeAssets,
  anyoneStockAssets
} from "@/lib/anyone-narrative-imagery";

const resourceOrder = ["people", "money", "space", "equipment"] as const;

const resourceImagery = {
  people: {
    render: anyoneNarrativeAssets.revealPeople,
    stock: anyoneStockAssets.batchPeopleMoney.kitchenTable,
    alt: "People at kitchen table — real resource"
  },
  money: {
    render: anyoneNarrativeAssets.arcDiscoveryMoney,
    stock: anyoneStockAssets.batchPeopleMoney.creditDesk,
    alt: "Local lender desk — money within reach"
  },
  space: {
    render: anyoneNarrativeAssets.revealSpace,
    stock: anyoneStockAssets.batchSpaceEquipment.smallBay,
    alt: "Small bay available — space within reach"
  },
  equipment: {
    render: anyoneNarrativeAssets.arcDiscoveryEquipment,
    stock: anyoneStockAssets.batchSpaceEquipment.usedOven,
    alt: "Used commercial equipment — cheaper than assumed"
  }
} as const;

export function ImageryArcJourney() {
  const { resources, momentum } = copy.home.anyone;

  return (
    <section id="imagery-arc" className="imagery-arc-journey" aria-labelledby="resourcesTitle">
      <div className="imagery-arc-journey__intro">
        <p className="eyebrow">{resources.eyebrow}</p>
        <h2 id="resourcesTitle">The four reachable resources</h2>
      </div>

      <div className="imagery-reveal-grid">
        {resourceOrder.map((key) => {
          const resource = resources[key];
          const img = resourceImagery[key];
          return (
            <article key={key} className="imagery-reveal-card imagery-reveal-card--visual">
              <figure className="imagery-reveal-card__figure">
                <AnyoneNarrativePhoto
                  renderSrc={img.render}
                  stockSrc={img.stock}
                  alt={img.alt}
                  width={480}
                  height={270}
                  className="imagery-reveal-card__photo"
                />
              </figure>
              <strong>{resource.headline}</strong>
              <p>{resource.body}</p>
            </article>
          );
        })}
      </div>

      <div className="imagery-arc-journey__momentum">
        <figure className="imagery-arc-journey__momentum-figure">
          <AnyoneNarrativePhoto
            renderSrc={anyoneNarrativeAssets.arcMomentum}
            stockSrc={anyoneStockAssets.batchMomentumHero.bakerWorking}
            alt="Small business momentum — real progress"
            width={960}
            height={540}
            className="imagery-arc-journey__momentum-photo"
          />
        </figure>
        <p className="eyebrow">{momentum.eyebrow}</p>
        <h3>{momentum.headline}</h3>
        <p>{momentum.body}</p>
        <p className="imagery-arc-journey__lede">{momentum.closing}</p>
      </div>
    </section>
  );
}
