import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

import SkyPookaShell from "@/components/skypooka/shell";

import "./skypooka.css";

export const metadata: Metadata = {
  title: "SkyPooka | Werkles",
  description: "Mobile Nerdkle · Mobile Werkles operator field view.",
  robots: { index: false, follow: false },
  manifest: "/skypooka-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SkyPooka",
    statusBarStyle: "black-translucent"
  },
  icons: {
    apple: "/assets/werkles-app-icon-board.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#14110e"
};

export default function SkyPookaLayout({ children }: { children: ReactNode }) {
  return <SkyPookaShell>{children}</SkyPookaShell>;
}
