import { AnyoneNarrativePhoto } from "@/components/foundry/anyone-narrative-photo";
import { copy } from "@/lib/copy";
import { squibbClassyAssets, squibbClassyAttribution } from "@/lib/anyone-narrative-imagery";
import { squibbBellowsAssets } from "@/lib/render-batch-4-imagery";

export function SquibbScoutSection() {
  const { scout } = copy.squibb;

  return (
    <section className="squibb-scout-section" aria-labelledby="squibbScoutTitle">
      <figure className="squibb-scout-section__visual">
        <AnyoneNarrativePhoto
          renderSrc={squibbClassyAssets.scoutPoint}
          stockSrc={squibbBellowsAssets.bustHost}
          alt="Squibb the scout — points toward the overlooked option"
          width={560}
          height={420}
          className="squibb-scout-section__photo"
        />
        <figcaption>{squibbClassyAttribution}</figcaption>
      </figure>
      <div className="squibb-scout-section__intro">
        <p className="eyebrow">{scout.eyebrow}</p>
        <h2 id="squibbScoutTitle">{scout.headline}</h2>
        <p>{scout.body}</p>
        <p>{scout.closing}</p>
      </div>
      <ul className="squibb-scout-section__microcopy" aria-label="Squibb microcopy examples">
        {scout.microcopy.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
