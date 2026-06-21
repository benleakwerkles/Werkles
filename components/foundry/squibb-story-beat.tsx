import { AnyoneNarrativePhoto } from "@/components/foundry/anyone-narrative-photo";
import { copy } from "@/lib/copy";
import { squibbV3Assets } from "@/lib/anyone-narrative-v2-imagery";
import { squibbClassyAssets } from "@/lib/anyone-narrative-imagery";

export function SquibbStoryBeat() {
  const { squibbBeat } = copy.home;

  return (
    <aside className="squibb-story-beat" aria-label="Squibb scout moment">
      <AnyoneNarrativePhoto
        renderSrc={squibbV3Assets.scoutPoint}
        stockSrc={squibbClassyAssets.scoutPoint}
        alt="Squibb points toward the overlooked option"
        width={420}
        height={320}
        className="squibb-story-beat__photo"
      />
      <p className="squibb-story-beat__line">{squibbBeat.line}</p>
    </aside>
  );
}
