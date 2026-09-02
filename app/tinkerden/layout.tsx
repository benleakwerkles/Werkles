import type { ReactNode } from "react";

import { LocalAwareSiteHeader } from "@/components/foundry/local-aware-site-header";
import { InternalOperatorBoundary } from "@/components/foundry/internal-operator-boundary";

export default function TinkerDenLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <LocalAwareSiteHeader />
      <InternalOperatorBoundary tool="TinkerDen" />
      {children}
    </>
  );
}
