"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/skypooka", label: "Field", glyph: "◎" },
  { href: "/skypooka/gates", label: "Gates", glyph: "⛨" },
  { href: "/skypooka/nerdkle", label: "Nerdkle", glyph: "◉" }
] as const;

export default function SkyPookaShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="skypooka-root">
      <div className="skypooka-shell">
        <header className="skypooka-header">
          <h1>SkyPooka</h1>
          <p>Mobile Nerdkle · Mobile Werkles · what moved · what needs you</p>
        </header>
        <main className="skypooka-main">{children}</main>
      </div>
      <nav className="skypooka-nav" aria-label="SkyPooka">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "skypooka-nav-link skypooka-nav-link--active" : "skypooka-nav-link"}
              aria-current={active ? "page" : undefined}
            >
              <span aria-hidden="true">{item.glyph}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
