import type { Metadata } from "next";
import { Suspense } from "react";

import SkyPookaDocViewer from "@/components/skypooka/doc-viewer";

export const metadata: Metadata = {
  title: "SkyPooka Doc | Werkles",
  robots: { index: false, follow: false }
};

export default function SkyPookaDocPage() {
  return (
    <Suspense fallback={<div className="skypooka-loading">Loading document…</div>}>
      <SkyPookaDocViewer />
    </Suspense>
  );
}
