import { LocalAwareSiteHeader } from "@/components/foundry/local-aware-site-header";
import { AccountAwareRecommendationSurface } from "@/components/squibb/account-aware-recommendation-surface";
import { AccountAwarePeopleContinuation } from "@/components/ghost-fleet/account-aware-people-continuation";
import { loadPublicBellowsRecommendationPageData } from "@/lib/squibb/public-recommendation-session-server";
import { isRecommendationKind } from "@/lib/squibb/recommendations";

import "./squibb-recommendations.css";

export const metadata = {
  title: "Werkles Recommendations | Bellows",
  description: "Compare practical next steps, see why they fit, and choose what to explore next."
};

export const dynamic = "force-dynamic";

export default async function SquibbRecommendationsPage({
  searchParams
}: {
  searchParams: Promise<{ option?: string }>;
}) {
  const { session, ledger, ghostFleetBridge } = await loadPublicBellowsRecommendationPageData();
  const requestedOption = (await searchParams).option;
  const initialKind = isRecommendationKind(requestedOption) ? requestedOption : undefined;

  return (
    <>
      <LocalAwareSiteHeader />
      <main className="bellows-main narrative-act-page workshop-route--bellows squibb-rec-page">

        <AccountAwareRecommendationSurface initialSession={session} ledger={ledger} initialKind={initialKind} />

        <AccountAwarePeopleContinuation initialBridge={ghostFleetBridge} />

      </main>
      <footer className="site-footer">
        <p>Werkles helps you compare possible next steps. It does not guarantee funding, verification, legal clearance, or a particular outcome.</p>
      </footer>
    </>
  );
}
