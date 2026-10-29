import type { Metadata } from "next";

import SkyPookaIntentForm from "@/components/skypooka/intent-form";

export const metadata: Metadata = {
  title: "SkyPooka Intent | Werkles",
  robots: { index: false, follow: false }
};

export default function SkyPookaIntentPage() {
  return <SkyPookaIntentForm />;
}
