import type { ReactNode } from "react";

export const metadata = {
  title: "Crucible Checks",
  description: "See which facts can be checked and which checks are not available yet."
};

export default function CrucibleLayout({ children }: { children: ReactNode }) {
  return children;
}
