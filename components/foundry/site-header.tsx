"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/foundry/brand-mark";

import { copy } from "@/lib/copy";
import { getClientAccessToken } from "@/lib/client-auth";

import { memberNavIsCurrent, memberNavItems, memberRouteContext, primaryNavItems } from "@/lib/site-nav";

const MEMBER_NAV_PRESENTATION_KEY = "werkles_member_nav_present";

function roomForPath(pathname: string) {
  if (pathname.startsWith("/bellows/personal")) return "personal-bellows";
  if (pathname.startsWith("/bellows")) return "bellows";
  if (pathname.startsWith("/proof") || pathname.startsWith("/dashboard/crucible")) return "proof";
  if (pathname.startsWith("/membership") || pathname.startsWith("/pricing") || pathname.startsWith("/dashboard/billing")) return "membership";
  if (pathname.startsWith("/dashboard/werkles")) return "werkle";
  if (pathname.startsWith("/formation") || pathname.startsWith("/dashboard/intros")) return "people";
  if (pathname.startsWith("/dashboard")) return "workshop";
  if (pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/onboarding")) return "welcome";
  return "home";
}

const roomLabels: Record<string, string> = {
  home: "Home",
  people: "People",
  bellows: "Public Bellows",
  "personal-bellows": "Private Bellows",
  proof: "Proof Workspace",
  membership: "Membership",
  workshop: "Workshop",
  werkle: "Shared Werkle",
  welcome: "Welcome",
};

export function SiteHeader({ localWalkthrough = false }: { localWalkthrough?: boolean }) {
  const pathname = usePathname();
  const [memberMode, setMemberMode] = useState(localWalkthrough);

  useEffect(() => {
    /* A server-confirmed HttpOnly walkthrough session is stronger than the
       browser's storage check. JavaScript cannot read that cookie by design,
       so it must never downgrade member navigation after hydration. */
    if (localWalkthrough) {
      window.sessionStorage.setItem(MEMBER_NAV_PRESENTATION_KEY, "1");
      setMemberMode(true);
      return;
    }
    /* Presentation continuity only. This marker grants no route or data
       access; every member surface still performs its own auth check. */
    if (window.sessionStorage.getItem(MEMBER_NAV_PRESENTATION_KEY) === "1") {
      setMemberMode(true);
      return;
    }
    let active = true;
    void getClientAccessToken()
      .then((token) => {
        if (!active) return;
        setMemberMode(Boolean(token));
        if (token) window.sessionStorage.setItem(MEMBER_NAV_PRESENTATION_KEY, "1");
      })
      .catch(() => { if (active) setMemberMode(localWalkthrough); });
    return () => { active = false; };
  }, [localWalkthrough]);

  const entryHref = memberMode ? "/dashboard" : "/login";
  const entryLabel = memberMode ? "Member Home" : copy.nav.login;
  const routeContext = memberMode ? memberRouteContext(pathname) : null;
  const room = roomForPath(pathname);
  function isCurrent(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  }

  return (

    <header id="werkles-site-header" data-room={room} data-werkles-room={room} className={`site-header site-header--nav-doc site-header--room-${room}${memberMode ? " site-header--member" : ""}`}>
      <div className="site-header__primary-row">
        <Link className="brand brand--tight" href="/" aria-label="Werkles home">
          <BrandMark size="header" presentation="board" />
          <span className="brand-word brand-word--workshop-serif">erkles</span>
          <span className="site-header__room-tag" aria-hidden="true">{roomLabels[room] ?? "Home"}</span>
        </Link>

        <nav aria-label="Primary navigation">
          {primaryNavItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="site-nav-link"
              title={item.symbol}
              aria-current={isCurrent(item.href) ? "page" : undefined}
            >
              <span className="site-nav-link__label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="site-header__actions">
          <Link
            className="site-header__login"
            href={entryHref}
            aria-label={memberMode ? "Open member home" : undefined}
          >
            {entryLabel}
          </Link>

          <Link className="header-cta" href="/bellows/intake">
            {memberMode ? "Update Intake" : copy.nav.cta}
          </Link>
        </div>
      </div>

      {memberMode ? (
        <nav className="site-header__member-nav" aria-label="Member navigation">
          <span className="site-header__member-label">Your Werkles</span>
          {memberNavItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="site-nav-link site-nav-link--member"
              aria-current={memberNavIsCurrent(item.id, pathname) ? "page" : undefined}
            >
              <span className="site-nav-link__label">{item.label}</span>
            </Link>
          ))}
        </nav>
      ) : null}
      {routeContext ? (
        <div className="site-header__route-line" role="region" aria-label="Your current Werkles location">
          <p><strong>Here: {routeContext.label}</strong><span>{routeContext.purpose}</span></p>
          <div>
            {pathname !== "/dashboard" ? <Link href="/dashboard">Member Home</Link> : null}
            <Link href={routeContext.nextHref}>Next: {routeContext.nextLabel} <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      ) : null}
    </header>

  );

}
