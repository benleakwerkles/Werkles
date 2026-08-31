import type { ReactNode } from "react";
import { LocalAwareSiteHeader } from "@/components/foundry/local-aware-site-header";

export const metadata = {
  title: "Your workshop",
  description: "Your Werkles member dashboard."
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <><LocalAwareSiteHeader />{children}</>;
}
