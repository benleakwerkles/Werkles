import type { Metadata } from "next";

import SkyPookaNerdkleView from "@/components/skypooka/nerdkle-view";

export const metadata: Metadata = {
  title: "SkyPooka Nerdkle | Werkles",
  robots: { index: false, follow: false }
};

export default function SkyPookaNerdklePage() {
  return <SkyPookaNerdkleView />;
}
