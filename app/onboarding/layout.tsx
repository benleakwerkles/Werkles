import type { ReactNode } from "react";

import { LocalAwareSiteHeader } from "@/components/foundry/local-aware-site-header";

export const metadata = {
  title: "Three quick answers",
  description: "Your lane, your trade, and where you work — a minute to set up your workshop."
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <><LocalAwareSiteHeader />{children}</>;
}
