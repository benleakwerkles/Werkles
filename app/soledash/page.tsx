import type { Metadata } from "next";

import { DecisionSurface } from "@/components/soledash/decision-surface";
import { loadSoleDashData } from "@/lib/soledash/cockpit-data";
import { buildMegaWorkHomeView } from "@/lib/soledash/megawork-home/build-view";

export const metadata: Metadata = {
  title: "SoleDash Command | AEYE",
  description: "Guillotine command surface — frontier, working, receipts.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function SoleDashPage() {
  const data = await loadSoleDashData();
  const homeView = buildMegaWorkHomeView(data.machineCard.werklesName);
  return <DecisionSurface initialView={homeView.decisionView} homeView={homeView} />;
}
