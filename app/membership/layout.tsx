import type { ReactNode } from "react";

import { LocalAwareSiteHeader } from "@/components/foundry/local-aware-site-header";

/* Client pages can't export metadata; the route layout carries the title
   (Locke, correction-side review 2026-07-31). */
export const metadata = {
  title: "Membership",
  description: "Use Werkles free. Join for $9.99/month when the included tools and shared Werkle earn it."
};

export default function MembershipLayout({ children }: { children: ReactNode }) {
  return <><LocalAwareSiteHeader />{children}</>;
}
