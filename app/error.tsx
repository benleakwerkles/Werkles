"use client";

import Link from "next/link";

// Branded recovery page so a runtime error never shows a raw stack to a
// visitor. Next.js requires this to be a client component.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="dashboard-main" style={{ maxWidth: "680px", margin: "0 auto", padding: "56px 22px" }}>
      <p className="eyebrow">Something slipped</p>
      <h1>That didn&apos;t work. It&apos;s on us.</h1>
      <p>Something went wrong loading this page. Trying again usually fixes it — nothing you did caused this.</p>
      <div className="member-selected-surface__actions" style={{ marginTop: "1.25rem" }}>
        <button className="button button-dark" type="button" onClick={() => reset()}>
          Try again
        </button>
        <Link className="button button-outline" href="/">
          Back to the floor
        </Link>
      </div>
    </main>
  );
}
