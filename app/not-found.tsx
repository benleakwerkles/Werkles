import Link from "next/link";

import { SiteHeader } from "@/components/foundry/site-header";
import { copy } from "@/lib/copy";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="dashboard-main" style={{ maxWidth: "680px", margin: "0 auto", padding: "56px 22px" }}>
        <p className="eyebrow">404</p>
        <h1>That bench is empty.</h1>
        <p>
          The page you were looking for isn&apos;t in the workshop — the link may be old, or the address mistyped.
          The floor is still open.
        </p>
        <div className="member-selected-surface__actions" style={{ marginTop: "1.25rem" }}>
          <Link className="button button-dark" href="/">
            Back to the floor
          </Link>
          <Link className="button button-outline" href="/bellows/intake">
            {copy.nav.cta}
          </Link>
          <Link className="button button-outline" href="/login">
            Sign in
          </Link>
        </div>
      </main>
      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
