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
      {/* Squibb is canonically a Pooka (Ben, 2026-07-31 — PookaKind builds in
         tandem). "Folklore helper," not "spirit": Demo's stranger-eyes pass
         flagged spirit-language as mystical/occult risk for this audience. */}
      <p className="squibb-story-beat__intro">
        <strong>This is Squibb, the workshop&apos;s Pooka.</strong> Pookas are old folklore helpers — clever,
        truth-telling, the kind that show up when someone&apos;s about to build something real. His way of helping
        is checking your plan against real numbers and pointing at the option everyone overlooked. He doesn&apos;t
        flatter and he doesn&apos;t sell.
      </p>
      <p className="squibb-story-beat__line">{squibbBeat.line}</p>
    </aside>
  );
}
