import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { tokens } from "@/lib/design-tokens";
import { routes } from "@/lib/copy";

const navLinks = [
  { href: routes.pricing, label: "Pricing" },
  { href: routes.membership, label: "Membership" },
  { href: routes.proof, label: "Proof" },
  { href: routes.crucible, label: "Crucible" },
  { href: routes.billing, label: "Billing" },
  { href: routes.login, label: "Login" },
  { href: routes.prototype, label: "Match prototype" },
];

export function SiteNav({ active }: { active?: string }) {
  return (
    <header style={styles.topbar}>
      <Link href={routes.home} style={styles.brand}>
        <span style={styles.brandMark}>W</span>
        <span>
          <strong style={styles.brandTitle}>Werkles</strong>
          <small style={styles.brandSub}>Main Street partner matching</small>
        </span>
      </Link>
      <nav style={styles.nav} aria-label="Primary">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              ...styles.navPill,
              ...(active === link.href ? styles.navPillActive : {}),
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function PageShell({
  title,
  eyebrow,
  children,
  active,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  active?: string;
}) {
  return (
    <div style={styles.shell}>
      <SiteNav active={active} />
      <main style={styles.main}>
        {eyebrow ? <p style={styles.eyebrow}>{eyebrow}</p> : null}
        <h1 style={styles.h1}>{title}</h1>
        {children}
      </main>
    </div>
  );
}

export function CtaRow({ children }: { children: ReactNode }) {
  return <div style={styles.ctaRow}>{children}</div>;
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} style={styles.primaryBtn}>
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} style={styles.secondaryBtn}>
      {children}
    </Link>
  );
}

export function DisabledAction({ label, reason }: { label: string; reason: string }) {
  return (
    <button type="button" disabled style={styles.disabledBtn} title={reason}>
      {label}
    </button>
  );
}

export function StatusBadge({ text }: { text: string }) {
  return <span style={styles.badge}>{text}</span>;
}

export function SquibbHint({ text }: { text: string }) {
  return (
    <aside style={styles.squibb} aria-label="Squibb foreman hint">
      <strong style={styles.squibbLabel}>Squibb</strong>
      <span>{text}</span>
    </aside>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return <section style={styles.panel}>{children}</section>;
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: "100vh",
    background: tokens.paper,
    color: tokens.ink,
    fontFamily: tokens.font,
  },
  topbar: {
    display: "grid",
    gridTemplateColumns: "minmax(190px, 280px) 1fr",
    gap: 18,
    alignItems: "center",
    padding: "14px 22px",
    borderBottom: `1px solid ${tokens.line}`,
    background: "rgba(245, 241, 232, 0.94)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  brand: {
    display: "inline-flex",
    gap: 11,
    alignItems: "center",
    color: tokens.ink,
    textDecoration: "none",
  },
  brandMark: {
    width: 40,
    height: 40,
    display: "grid",
    placeItems: "center",
    border: `2px solid ${tokens.ink}`,
    borderRadius: 7,
    background: tokens.ink,
    color: tokens.surface,
    fontWeight: 900,
  },
  brandTitle: { display: "block", lineHeight: 1.05, fontSize: "1.1rem" },
  brandSub: { display: "block", marginTop: 3, color: tokens.muted, fontSize: "0.82rem" },
  nav: { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" },
  navPill: {
    minHeight: 34,
    padding: "0 12px",
    border: `1px solid ${tokens.line}`,
    borderRadius: 999,
    color: tokens.muted,
    background: "rgba(255, 253, 248, 0.72)",
    textDecoration: "none",
    fontSize: "0.82rem",
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
  },
  navPillActive: {
    color: tokens.surface,
    borderColor: tokens.ink,
    background: tokens.ink,
  },
  main: { maxWidth: 960, margin: "0 auto", padding: "24px 20px 48px" },
  eyebrow: {
    margin: "0 0 4px",
    color: tokens.rust,
    fontSize: "0.75rem",
    fontWeight: 850,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  h1: { margin: "0 0 18px", fontSize: "1.65rem", lineHeight: 1.15 },
  ctaRow: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 },
  primaryBtn: {
    minHeight: 40,
    padding: "0 16px",
    borderRadius: 999,
    background: tokens.ink,
    color: tokens.surface,
    textDecoration: "none",
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
  },
  secondaryBtn: {
    minHeight: 40,
    padding: "0 16px",
    borderRadius: 999,
    border: `1px solid ${tokens.line}`,
    background: tokens.surface,
    color: tokens.ink,
    textDecoration: "none",
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
  },
  disabledBtn: {
    minHeight: 40,
    padding: "0 16px",
    borderRadius: 999,
    border: `1px solid ${tokens.line}`,
    background: "#ece6da",
    color: tokens.muted,
    fontWeight: 800,
    cursor: "not-allowed",
    opacity: 0.85,
  },
  badge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    background: "#e4dccd",
    color: tokens.ink,
    fontSize: "0.72rem",
    fontWeight: 800,
    textTransform: "uppercase",
  },
  squibb: {
    marginTop: 20,
    padding: "10px 12px",
    border: `1px dashed ${tokens.line}`,
    borderRadius: tokens.radius,
    background: tokens.surface,
    fontSize: "0.86rem",
    color: tokens.muted,
    display: "flex",
    gap: 8,
    alignItems: "baseline",
  },
  squibbLabel: { color: tokens.rust, fontSize: "0.75rem", textTransform: "uppercase" },
  panel: {
    marginTop: 16,
    padding: 16,
    border: `1px solid ${tokens.line}`,
    borderRadius: tokens.radius,
    background: "rgba(255, 253, 248, 0.84)",
    boxShadow: "0 18px 50px rgba(38, 32, 24, 0.08)",
  },
};
