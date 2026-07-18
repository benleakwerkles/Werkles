import Link from "next/link";

import { SiteHeader } from "@/components/foundry/site-header";
import { PersonalRecommendationDelivery } from "@/components/squibb/personal-recommendation-delivery";
import { copy } from "@/lib/copy";
import { loadPublicBellowsRecommendationPageData } from "@/lib/squibb/public-recommendation-session-server";

import "./squibb-recommendations.css";

export const metadata = {
  title: "Werkles Recommendations",
  description: "Compare possible next steps with their reasoning, evidence, limitations, and required human review."
};

export const dynamic = "force-dynamic";

export default async function SquibbRecommendationsPage() {
  const { session, ledger } = await loadPublicBellowsRecommendationPageData();

  return (
    <>
      <SiteHeader />
      <main className="bellows-main narrative-act-page workshop-route--bellows squibb-rec-page">
        <nav className="squibb-rec-page__nav" aria-label="Bellows">
          <Link className="squibb-rec-page__back" href="/bellows">
            ← Bellows
          </Link>
          <span aria-current="page">Recommendations</span>
          <Link className="squibb-rec-page__intake-link" href="/bellows/intake">
            Review the intake
          </Link>
        </nav>

        <PersonalRecommendationDelivery exampleSession={session} ledger={ledger} />
      </main>
      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
