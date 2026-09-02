import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { DocumentScoreClient } from "./document-score-client";

import "@/app/bellows/recommendations/squibb-recommendations.css";

export const metadata: Metadata = {
  title: "Document Score | Matching",
  description: "Paste a real-world document and score it against Autonomous Matching without saving it.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default function MatchingDocumentScorePage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Matching document score navigation">
          <Link href="/operator/matching/shadow">Shadow runs</Link>
          <Link href="/bellows/recommendations">Public recommendations</Link>
          <Link href="/operator/human-gates">Human Gate Hub</Link>
        </nav>
        <DocumentScoreClient />
      </main>
    </CockpitShell>
  );
}
