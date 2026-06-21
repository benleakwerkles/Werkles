import Image from "next/image";

import {
  NARRATIVE_V1_WIRE_ENABLED,
  narrativeV1Assets,
  narrativeV1AttributionNote
} from "@/lib/homepage-narrative-imagery";
import {
  RENDER_BATCH_3_WIRE_ENABLED,
  narrativeV2Assets
} from "@/lib/render-batch-3-imagery";

export function NarrativeScrollRhyme() {
  if (!NARRATIVE_V1_WIRE_ENABLED) {
    return null;
  }

  return (
    <section className="narrative-scroll-rhyme" aria-labelledby="narrativeRhymeTitle">
      <div className="narrative-scroll-rhyme__intro">
        <p className="eyebrow">Space → Forge</p>
        <h2 id="narrativeRhymeTitle">The room empties. The crew finds the joints.</h2>
        <p className="narrative-scroll-rhyme__lede">
          First the becoming-room without people. Then the same kind of room with two sets of hands on
          the plan.
        </p>
      </div>
      <div className={`narrative-scroll-rhyme__pair${RENDER_BATCH_3_WIRE_ENABLED ? " narrative-scroll-rhyme__pair--triple" : ""}`}>
        <figure className="narrative-scroll-rhyme__panel" id="space-becoming">
          <Image
            src={narrativeV1Assets.spaceD02HalfBuilt}
            alt="Half-built commercial space mid-construction — empty, documentary preview"
            width={1280}
            height={720}
            className="narrative-scroll-rhyme__photo"
          />
          <figcaption>
            <strong>The Space</strong> — mid-build, no people yet. Latent capacity becoming real.
          </figcaption>
        </figure>
        <figure className="narrative-scroll-rhyme__panel" id="forge-pair">
          <Image
            src={narrativeV1Assets.forgeA03HalfBuiltPair}
            alt="Two people reviewing plans in a half-built space — documentary preview"
            width={1280}
            height={720}
            className="narrative-scroll-rhyme__photo"
          />
          <figcaption>
            <strong>The Forge</strong> — same register, now with complementary lanes on the work.
          </figcaption>
        </figure>
        {RENDER_BATCH_3_WIRE_ENABLED ? (
          <figure className="narrative-scroll-rhyme__panel" id="forge-nearly-open">
            <Image
              src={narrativeV2Assets.forgeA05NearlyFinishedPair}
              alt="Two people installing the last fixture in a nearly finished space — documentary preview"
              width={1280}
              height={720}
              className="narrative-scroll-rhyme__photo"
            />
            <figcaption>
              <strong>Almost open</strong> — shared attention on the last details before Foundry.
            </figcaption>
          </figure>
        ) : null}
      </div>
      <p className="narrative-scroll-rhyme__note" role="note">
        {narrativeV1AttributionNote}
      </p>
    </section>
  );
}
