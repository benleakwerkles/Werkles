import type { ReactNode } from "react";

export const metadata = {
  title: "Your Profile",
  description: "Name what you bring, what you need, and what others may see."
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
