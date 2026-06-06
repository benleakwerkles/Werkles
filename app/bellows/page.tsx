import Link from "next/link";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { copy } from "@/lib/copy";
import { routeAtmosphere } from "@/lib/workshop-facets";

/** Route shell — see foreman/SITE_MAP.md. Full Bellows build is separately gated. */
export default function BellowsPage() {
  return (
    <CockpitShell className="bellows-cockpit">
      <main className={`bellows-main ${routeAtmosphere.bellows}`}>
        <section className="bellows-hero panel">
          <p className="eyebrow">{copy.bellows.eyebrow}</p>
          <h1>{copy.bellows.headline}</h1>
          <p>{copy.bellows.body}</p>
          <p className="muted">{copy.bellows.host}</p>
          <p className="trust-badge">{copy.bellows.shellNote}</p>
          <div className="actions" style={{ marginTop: "1rem" }}>
            <Link className="button button-outline" href="/proof">
              Inspect proof first
            </Link>
            <Link className="button button-dark" href="/membership">
              Foundry Dues
            </Link>
          </div>
        </section>
      </main>
    </CockpitShell>
  );
}
