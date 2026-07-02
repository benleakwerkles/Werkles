import Image from "next/image";

import { Tier2HybridIconTile } from "@/components/foundry/tier2-hybrid-icon-tile";
import {
  TIER2_IMAGERY_ENABLED,
  tier2HybridIcons,
  tier2ImageryAttribution,
  tier2PageImagery,
  type Tier2FeaturedImage,
  type Tier2PageKey
} from "@/lib/tier2-page-imagery";

type Props = {
  page: Tier2PageKey;
  /** Show featured hero image (split layout). */
  featured?: boolean;
  /** Show secondary forge band below copy. */
  forgeBand?: boolean;
  /** Show hybrid icon rail. */
  iconRail?: boolean;
  /** Draft attribution line (default true). */
  showAttribution?: boolean;
};

function FeaturedFigure({ image }: { image: Tier2FeaturedImage }) {
  return (
    <figure
      className={`tier2-visual__figure${image.featured ? " tier2-visual__figure--featured" : ""}`}
    >
      <p className="eyebrow">{image.eyebrow}</p>
      <Image
        src={image.path}
        alt={image.alt}
        width={960}
        height={540}
        className="tier2-visual__photo"
        priority={Boolean(image.featured)}
        unoptimized
      />
      <figcaption className="tier2-visual__caption">{image.caption}</figcaption>
    </figure>
  );
}

export function Tier2PageVisual({
  page,
  featured = false,
  forgeBand = false,
  iconRail = false,
  showAttribution = true
}: Props) {
  if (!TIER2_IMAGERY_ENABLED) return null;

  const config = tier2PageImagery[page];
  if (!config) return null;

  const showFeatured = featured && config.featured;
  const showForge = forgeBand && config.forgeBand;
  const showIcons = iconRail && config.showIconRail;

  if (!showFeatured && !showForge && !showIcons) return null;

  return (
    <div className="tier2-visual" data-tier2-act={config.act} data-tier2-page={page}>
      {showFeatured && config.featured ? <FeaturedFigure image={config.featured} /> : null}
      {showForge && config.forgeBand ? <FeaturedFigure image={config.forgeBand} /> : null}
      {showIcons ? (
        <div className="tier2-visual__icon-rail" aria-label="Lane prop icons">
          {tier2HybridIcons.map((icon) => (
            <Tier2HybridIconTile
              key={icon.id}
              label={icon.label}
              primary={icon.path}
              fallback={icon.fallback}
            />
          ))}
        </div>
      ) : null}
      {showAttribution ? (
        <p className="tier2-visual__note" role="note">
          {tier2ImageryAttribution}
        </p>
      ) : null}
    </div>
  );
}
