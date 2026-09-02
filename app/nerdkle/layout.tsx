import type { ReactNode } from "react";

import { LocalAwareSiteHeader } from "@/components/foundry/local-aware-site-header";

export default function NerdkleLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <><LocalAwareSiteHeader />{children}</>;
}
