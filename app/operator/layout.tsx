import type { ReactNode } from "react";

import { LocalAwareSiteHeader } from "@/components/foundry/local-aware-site-header";

/** Operator tools remain visually inside Werkles. Their local sub-navigation
 * supplements the shared public/member header; it never replaces it. */
export default function OperatorLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <LocalAwareSiteHeader />
      {children}
    </>
  );
}
