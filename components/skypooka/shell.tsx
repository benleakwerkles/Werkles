"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import SkyPookaPwaRegister from "@/components/skypooka/pwa-register";
import {
  SkyPookaRefreshProvider,
  useSkyPookaRefresh,
  useSkyPookaRefreshRegistration
} from "@/components/skypooka/refresh-context";
import { fetchSkyPookaFeed } from "@/lib/skypooka/client-feed";

type NavBadges = {
  field: number;
  gates: number;
  nerdkle: number;
};

function SkyPookaShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { refreshAll, isRefreshing, isOnline } = useSkyPookaRefresh();
  const [badges, setBadges] = useState<NavBadges>({ field: 0, gates: 0, nerdkle: 0 });

  const loadBadges = useCallback(async () => {
    const result = await fetchSkyPookaFeed({ offlineFallback: true });
    if (!result.feed) return;
    setBadges({
      field: result.feed.counts.blockers + result.feed.counts.queued_actions,
      gates: result.feed.counts.human_gates,
      nerdkle: result.feed.top_actions.filter((action) => action.priority === "high").length
    });
  }, []);

  useSkyPookaRefreshRegistration("shell-badges", loadBadges);

  useEffect(() => {
    void loadBadges();
  }, [loadBadges]);

  const nav = [
    { href: "/skypooka", label: "Field", glyph: "◎", badge: badges.field },
    { href: "/skypooka/intent", label: "Intent", glyph: "✦", badge: 0 },
    { href: "/skypooka/gates", label: "Gates", glyph: "⛨", badge: badges.gates },
    { href: "/skypooka/nerdkle", label: "Nerdkle", glyph: "◉", badge: badges.nerdkle }
  ];

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
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "skypooka-nav-link skypooka-nav-link--active" : "skypooka-nav-link"}
              aria-current={active ? "page" : undefined}
            >
              <span className="skypooka-nav-glyph" aria-hidden="true">
                {item.glyph}
                {item.badge > 0 ? (
                  <span className="skypooka-nav-badge" aria-hidden="true">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </span>
              {item.label}
              {item.badge > 0 ? (
                <span className="skypooka-visually-hidden">{item.badge} items need attention</span>
              ) : null}
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
