"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import SkyPookaPwaRegister from "@/components/skypooka/pwa-register";
import { SkyPookaRefreshProvider, useSkyPookaRefresh } from "@/components/skypooka/refresh-context";

const NAV = [
  { href: "/skypooka", label: "Field", glyph: "◎" },
  { href: "/skypooka/intent", label: "Intent", glyph: "✦" },
  { href: "/skypooka/gates", label: "Gates", glyph: "⛨" },
  { href: "/skypooka/nerdkle", label: "Nerdkle", glyph: "◉" }
] as const;

function SkyPookaShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { refreshAll, isRefreshing, isOnline } = useSkyPookaRefresh();

  return (
    <div className="skypooka-root">
      <SkyPookaPwaRegister />
      <div className="skypooka-shell">
        <header className="skypooka-header">
          <div className="skypooka-header-row">
            <div>
              <h1>SkyPooka</h1>
              <p>Mobile Nerdkle · Mobile Werkles · what moved · what needs you</p>
            </div>
            <button
              type="button"
              className="skypooka-refresh-btn"
              onClick={() => {
                void refreshAll();
              }}
              disabled={isRefreshing}
              aria-label="Refresh SkyPooka feed"
            >
              {isRefreshing ? "…" : "↻"}
            </button>
          </div>
          {!isOnline ? (
            <div className="skypooka-offline-chip" role="status">
              Offline — showing last cached feed when available
            </div>
          ) : null}
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

export default function SkyPookaShell({ children }: { children: ReactNode }) {
  return (
    <SkyPookaRefreshProvider>
      <SkyPookaShellInner>{children}</SkyPookaShellInner>
    </SkyPookaRefreshProvider>
  );
}
