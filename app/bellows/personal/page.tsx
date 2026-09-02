import { LocalAwareSiteHeader } from "@/components/foundry/local-aware-site-header";
import { AccountAwarePersonalBellows } from "@/components/bellows/account-aware-personal-bellows";
import { BellowsDeviceDraftShelf } from "@/components/bellows/bellows-device-draft-shelf";
import { BellowsVisualPause } from "@/components/bellows/bellows-visual-pause";
import { PersonalPlanCheckIn } from "@/components/bellows/personal-plan-check-in";
import { OpportunityWalkthroughDoor } from "@/components/opportunities/opportunity-walkthrough-door";
import { isGhostFleetEnabled } from "@/lib/ghost-fleet";
import { loadPublicBellowsRecommendationPageData } from "@/lib/squibb/public-recommendation-session-server";

import "../library/bellows-library.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Bellows",
  description: "A short Bellows reading path selected from the latest Intake and recommendation reasoning available to this session."
};

export default async function PersonalBellowsPage() {
  const { session } = await loadPublicBellowsRecommendationPageData();
  const isPersonal = session.source?.mode === "latest_intake";
  const fleetOn = isGhostFleetEnabled();

  return (
    <>
      <LocalAwareSiteHeader />
      <main className="bellows-library bellows-personal route-room route-room--personal-bellows workshop-route--personal-bellows">
        <header className="bellows-library__hero">
          <div>
            <p className="eyebrow">My Bellows</p>
            <h1>A shorter path through what matters now.</h1>
            <p className="bellows-library__lede">
              {isPersonal
                ? "Werkles turned your current recommendations into a few practical lessons. Each one gives you a useful exercise before asking you to read more."
                : "Your Intake creates a tailored reading path. Saved Werkle work stays available below whether or not that path is ready."}
            </p>
          </div>
          <aside className="bellows-library__promise" aria-label="What Personal Bellows does">
            <strong>Read less. Use more.</strong>
            <span>One relevant method.</span>
            <span>One useful working draft.</span>
            <span>One clear next check.</span>
          </aside>
        </header>

        <BellowsVisualPause variant="workspace" />
        <AccountAwarePersonalBellows initialSession={session} />
        {fleetOn ? <OpportunityWalkthroughDoor surface="bellows" /> : null}
        <PersonalPlanCheckIn />
        <div id="my-bellows-work">
          <BellowsDeviceDraftShelf />
        </div>
      </main>
    </>
  );
}
