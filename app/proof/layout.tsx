import type { ReactNode } from "react";

import { LocalAwareSiteHeader } from "@/components/foundry/local-aware-site-header";

export default function ProofLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <><LocalAwareSiteHeader />{children}</>;
}
