import type { ReactNode } from "react";

import SkyPookaShell from "@/components/skypooka/shell";

import "./skypooka.css";

export default function SkyPookaLayout({ children }: { children: ReactNode }) {
  return <SkyPookaShell>{children}</SkyPookaShell>;
}
