import type { Metadata, Viewport } from "next";

import SkyPookaFieldView from "@/components/skypooka/field-view";

export const metadata: Metadata = {
  title: "SkyPooka Field | Werkles",
  description: "Mobile Nerdkle field view — relay cards, receipts, gates, and blockers.",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "SkyPooka"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#14110e"
};

export default function SkyPookaHomePage() {
  return <SkyPookaFieldView />;
}
