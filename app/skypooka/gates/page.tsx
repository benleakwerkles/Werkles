import type { Metadata } from "next";

import SkyPookaGatesView from "@/components/skypooka/gates-view";

export const metadata: Metadata = {
  title: "SkyPooka Gates | Werkles",
  robots: { index: false, follow: false }
};

export default function SkyPookaGatesPage() {
  return <SkyPookaGatesView />;
}
