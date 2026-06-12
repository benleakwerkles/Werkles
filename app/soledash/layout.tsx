import type { ReactNode } from "react";

import "./soledash.css";

export default function SoleDashLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="sole-dash-layout">{children}</div>;
}
