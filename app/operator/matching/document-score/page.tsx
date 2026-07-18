import type { Metadata } from "next";
import Link from "next/link";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { DocumentScoreClient } from "./document-score-client";
import "@/app/bellows/recommendations/squibb-recommendations.css";

export const metadata: Metadata = {
  title: "Document Score | Matching",
  description: "Score a pasted document against the Matching rules without saving it.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default function MatchingDocumentScorePage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Document score navigation">
          <Link href="/operator/matching/shadow">Shadow runs</Link>
          <Link href="/bellows/recommendations">Recommendations</Link>
          <Link href="/operator/human-gates">Human Gate Hub</Link>
        </nav>
        <DocumentScoreClient />
      </main>
    </CockpitShell>
  );
}
