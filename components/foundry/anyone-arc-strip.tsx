import { copy } from "@/lib/copy";
import {
  anyoneNarrativeAssets,
  anyoneNarrativeAttribution,
  anyoneStockAssets
} from "@/lib/anyone-narrative-imagery";
import { AnyoneNarrativePhoto } from "@/components/foundry/anyone-narrative-photo";

const beats = [
  {
    id: "lost",
    label: "Lost",
    render: anyoneNarrativeAssets.arcLost,
    stock: anyoneStockAssets.batchMomentumHero.bakerWorking,
    alt: "Baker with unnamed need — documentary, mid-work"
  },
  {
    id: "searching",
    label: "Searching",
    render: anyoneNarrativeAssets.arcSearching,
    stock: anyoneStockAssets.batchMomentumHero.electricianTools,
    alt: "Electrician noticing something off the obvious path"
  },
  {
    id: "discovery-money",
    label: "Discovery · Money",
    render: anyoneNarrativeAssets.arcDiscoveryMoney,
    stock: anyoneStockAssets.batchPeopleMoney.creditDesk,
    alt: "Local lender desk — accessible finance"
  },
  {
    id: "discovery-equipment",
    label: "Discovery · Equipment",
    render: anyoneNarrativeAssets.arcDiscoveryEquipment,
    stock: anyoneStockAssets.batchSpaceEquipment.usedOven,
    alt: "Used commercial equipment — closer than assumed"
  },
  {
    id: "momentum",
    label: "Momentum",
    render: anyoneNarrativeAssets.arcMomentum,
    stock: anyoneStockAssets.batchMomentumHero.bakerWorking,
    alt: "Small business running — same person further along"
  }
] as const;

export function AnyoneArcStrip() {
  const { door } = copy.home.anyone;

  return (
    <section className="anyone-arc-strip" aria-labelledby="anyoneArcTitle">
      <div className="anyone-arc-strip__intro">
        <p className="eyebrow">{door.eyebrow}</p>
        <h2 id="anyoneArcTitle">{door.headline}</h2>
        <p>{door.body}</p>
      </div>
      <div className="anyone-arc-strip__grid">
        {beats.map((beat) => (
          <article key={beat.id} className={`anyone-arc-strip__beat anyone-arc-strip__beat--${beat.id}`}>
            <figure className="anyone-arc-strip__figure">
              <AnyoneNarrativePhoto
                renderSrc={beat.render}
                stockSrc={beat.stock}
                alt={beat.alt}
                width={640}
                height={360}
                className="anyone-arc-strip__photo"
              />
              <figcaption>{beat.label}</figcaption>
            </figure>
          </article>
        ))}
      </div>
      <p className="anyone-arc-strip__note" role="note">
        {anyoneNarrativeAttribution}
      </p>
    </section>
  );
}
