import Link from "next/link";

export const metadata = {
  title: "SoleDash v0 | Werkles",
  robots: { index: false, follow: false }
};

const PANELS = [
  {
    title: "GimpDash / dispatch",
    body: "Intent routing, packet lifecycle, and Foreman control. Legacy GD console — execution requires a connected agent.",
    href: "http://127.0.0.1:4317/#gimpdash",
    external: true,
    label: "Open Foreman GimpDash"
  },
  {
    title: "Speaker memory",
    body: "Constitutional memory office — consultation display only. Not routing, not execution.",
    href: "http://127.0.0.1:4317/#gd-speaker",
    external: true,
    label: "Open Speaker panel"
  },
  {
    title: "GD intent (Next preview)",
    body: "Deterministic intent classifier preview inside the Werkles app.",
    href: "/gd/command-console",
    external: false,
    label: "GD command console redirect"
  },
  {
    title: "Live handoffs",
    body: "Current-state working files for operator lanes. Not permanent packet history.",
    href: "/soledash#live-handoffs",
    external: false,
    label: "Scroll to live handoff list"
  }
] as const;

const LIVE_HANDOFFS = [
  { name: "Doss", path: "foreman/handoffs/live/DOSS_HANDOFF.md" },
  { name: "Machine topology", path: "foreman/MACHINE_TOPOLOGY.md" },
  { name: "Active agent", path: "foreman/ACTIVE_AGENT.md" },
  { name: "Next action", path: "foreman/NEXT_ACTION.md" }
] as const;

export default function SoleDashPage() {
  return (
    <main className="gd-console-page">
      <div className="gd-console soledash">
        <header className="gd-console__header">
          <p className="eyebrow">SoleDash v0</p>
          <h1>Visibility surface</h1>
          <p className="gd-console__lede">
            Operator status and cockpit pointers on port 3000. SoleDash displays Speaker, SpeakerSole, and dispatch
            state — it does not route, execute, or approve. Start Foreman separately for GimpDash on port 4317.
          </p>
        </header>

        <section className="gd-console__grid">
          {PANELS.map((panel) => (
            <article key={panel.title} className="panel">
              <h2 className="gd-console__output-title">{panel.title}</h2>
              <p className="gd-console__placeholder">{panel.body}</p>
              {panel.external ? (
                <a className="button button-dark" href={panel.href} target="_blank" rel="noreferrer">
                  {panel.label}
                </a>
              ) : (
                <Link className="button button-dark" href={panel.href}>
                  {panel.label}
                </Link>
              )}
            </article>
          ))}
        </section>

        <section id="live-handoffs" className="panel" style={{ marginTop: "1.5rem" }}>
          <h2 className="gd-console__output-title">Cockpit pointers</h2>
          <p className="gd-console__placeholder">
            Source of truth lives in repo files. SoleDash v0 links — it does not invent state.
          </p>
          <ul className="gd-console__packet-list">
            {LIVE_HANDOFFS.map((item) => (
              <li key={item.path}>
                <strong>{item.name}</strong>
                <span className="gd-console__meta-sub">{item.path}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="status-line" style={{ marginTop: "1.5rem" }}>
          SoleDash v0 — Sally snapshot install. Repo: <code>C:\Dev\Werkles</code>
        </p>
      </div>
    </main>
  );
}
