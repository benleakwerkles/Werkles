import Link from "next/link";

import { AnyoneNarrativePhoto } from "@/components/foundry/anyone-narrative-photo";
import { copy } from "@/lib/copy";
import {
  storyV2Assets,
  storyV2Attribution,
  storyV2StockFallback
} from "@/lib/anyone-narrative-v2-imagery";

const beatImages = [
  { render: storyV2Assets.beat01WrongNeed, stock: storyV2StockFallback.beat01 },
  { render: storyV2Assets.beat02SquibbMoment, stock: storyV2StockFallback.beat01 },
  { render: storyV2Assets.beat03MoneyReveal, stock: storyV2StockFallback.beat03 },
  { render: storyV2Assets.beat04EquipmentReveal, stock: storyV2StockFallback.beat04 },
  { render: storyV2Assets.beat05ShopOpen, stock: storyV2StockFallback.beat01 }
] as const;

export function VisualStorySection() {
  const { visualStory } = copy.home;

  return (
    <section id="story" className="visual-story" aria-labelledby="visualStoryTitle">
      <header className="visual-story__header">
        <p className="eyebrow">{visualStory.eyebrow}</p>
        <h2 id="visualStoryTitle">{visualStory.headline}</h2>
        <p className="visual-story__lede">{visualStory.lede}</p>
      </header>

      <ol className="visual-story__beats">
        {visualStory.beats.map((beat, index) => {
          const img = beatImages[index];
          return (
            <li key={beat.id} className={`visual-story__beat visual-story__beat--${beat.id}`}>
              <figure className="visual-story__figure">
                <AnyoneNarrativePhoto
                  renderSrc={img.render}
                  stockSrc={img.stock}
                  alt={beat.imageAlt}
                  width={960}
                  height={540}
                  className="visual-story__photo"
                  priority={index === 0}
                />
                <figcaption>
                  <span className="visual-story__beat-num">Beat {index + 1}</span> {beat.imageCaption}
                </figcaption>
              </figure>
              <div className="visual-story__copy">
                <h3>{beat.title}</h3>
                <p className="visual-story__thought">{beat.thought}</p>
                <p className="visual-story__reveal">{beat.reveal}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="visual-story__cta">
        <p>{visualStory.closing}</p>
        <Link className="button button-light" href="/membership">
          {visualStory.cta}
        </Link>
      </div>
      <p className="visual-story__note" role="note">
        {storyV2Attribution}
      </p>
    </section>
  );
}
