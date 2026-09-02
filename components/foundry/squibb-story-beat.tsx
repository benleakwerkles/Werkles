import { AnyoneNarrativePhoto } from "@/components/foundry/anyone-narrative-photo";
import { copy } from "@/lib/copy";
import { squibbV3Assets } from "@/lib/anyone-narrative-v2-imagery";
import { squibbClassyAssets } from "@/lib/anyone-narrative-imagery";

export function SquibbStoryBeat() {
  const { squibbBeat } = copy.home;

  return (
    <aside className="squibb-story-beat" aria-label="Werkles scout moment">
      <AnyoneNarrativePhoto
        renderSrc={squibbV3Assets.scoutPoint}
        stockSrc={squibbClassyAssets.scoutPoint}
        alt="A brass workshop guide points toward an overlooked option"
        width={420}
        height={320}
        className="squibb-story-beat__photo"
      />
      {/* Squibb is canonically a Pooka (Operator, 2026-07-31 — PookaKind builds in
         tandem). "Folklore helper," not "spirit": Demo's stranger-eyes pass
         flagged spirit-language as mystical/occult risk for this audience. */}
      <p className="squibb-story-beat__intro">
        <strong>Look underneath the first answer.</strong> Werkles checks a plan against real numbers and points
        toward options that are easy to overlook. It does not flatter, sell the outcome, or make the choice for you.
      </p>
      <p className="squibb-story-beat__line">{squibbBeat.line}</p>
    </aside>
  );
}
