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
      <p className="squibb-story-beat__intro">
        <strong>This is Squibb.</strong> He&apos;s the workshop&apos;s scout — when you tell Werkles what&apos;s
        stuck, he checks it against real numbers and points at the option everyone overlooked. He doesn&apos;t
        flatter and he doesn&apos;t sell.
      </p>
      <p className="squibb-story-beat__line">{squibbBeat.line}</p>
    </aside>
  );
}
