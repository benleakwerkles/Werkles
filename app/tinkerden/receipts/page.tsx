import type { Metadata } from "next";
import Link from "next/link";

import { readTinkerdenCommandReceipts } from "@/lib/tinkerden/command-surface";

export const metadata: Metadata = {
  title: "TinkerDen Receipts | Werkles",
  description: "Returned ACK / BLOCKER / ARTIFACT receipts for the TinkerDen command surface.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function TinkerdenReceiptsPage() {
  const receipts = await readTinkerdenCommandReceipts(25);
  const firstReturn = receipts[0] ?? null;

  return (
    <main className="td-bridge">
      <nav className="td-surface-switcher" aria-label="TinkerDen surface switcher">
        <Link className="td-surface-switcher__link" href="/tinkerden">
          Bridge
        </Link>
        <Link className="td-surface-switcher__link" href="/tinkerden/inbox">
          Inbox
        </Link>
        <Link className="td-surface-switcher__link td-surface-switcher__link--active" href="/tinkerden/receipts">
          Receipts
        </Link>
        <Link className="td-surface-switcher__link" href="/thinkit">
          ThinkIt
        </Link>
      </nav>

      <header className="td-bridge__hero">
        <p className="td-bridge__eyebrow">TinkerDen / Receipts</p>
        <h1>Returned receipts.</h1>
        <p>
          Read-only receipt panel for commands issued through <code>/tinkerden/inbox</code>. Sender-side writes do not
          count as delivery; the receipt must show receiver hash proof.
        </p>
      </header>

      <section className="td-command-section" aria-labelledby="first-return-title">
        <header className="td-command-section__header">
          <p className="td-bridge__eyebrow">FIRST RETURN</p>
          <h2 id="first-return-title">Latest ACK / BLOCKER / ARTIFACT</h2>
          <p>Source: <code>tinkerden/receipts</code></p>
        </header>

        {firstReturn ? (
          <article className="td-command-console__receipt">
            <header>
              <strong>{firstReturn.status_guess}</strong>
              <code>{firstReturn.receipt_id}</code>
            </header>
            <dl>
              <div>
                <dt>Packet</dt>
                <dd>{firstReturn.packet_id}</dd>
              </div>
              <div>
                <dt>Mission</dt>
                <dd>{firstReturn.mission}</dd>
              </div>
              <div>
                <dt>Receipt path</dt>
                <dd>{firstReturn.path}</dd>
              </div>
              <div>
                <dt>Packet path</dt>
                <dd>{firstReturn.packet_path}</dd>
              </div>
              <div>
                <dt>Receiver hash match</dt>
                <dd>{firstReturn.receiver_hash_match ? "YES" : "NO"}</dd>
              </div>
              <div>
                <dt>Missing receiver proof</dt>
                <dd>{firstReturn.missing_receiver_proof ?? "NONE"}</dd>
              </div>
            </dl>
          </article>
        ) : (
          <p className="td-receipt-pickup__empty">No command receipts found in <code>tinkerden/receipts</code>.</p>
        )}
      </section>

      <section className="td-command-section" aria-labelledby="receipt-list-title">
        <header className="td-command-section__header">
          <p className="td-bridge__eyebrow">PROOF</p>
          <h2 id="receipt-list-title">Receipt history</h2>
        </header>

        <div className="td-receipt-pickup__list">
          {receipts.length > 0 ? (
            receipts.map((receipt) => (
              <article className="td-receipt-pickup__card" key={receipt.receipt_id}>
                <header>
                  <span>{receipt.status_guess}</span>
                  <strong>{receipt.receipt_id}</strong>
                </header>
                <dl>
                  <div>
                    <dt>Packet</dt>
                    <dd>{receipt.packet_id}</dd>
                  </div>
                  <div>
                    <dt>Mission</dt>
                    <dd>{receipt.mission}</dd>
                  </div>
                  <div>
                    <dt>Producer</dt>
                    <dd>{receipt.producer}</dd>
                  </div>
                  <div>
                    <dt>Timestamp</dt>
                    <dd>{receipt.timestamp}</dd>
                  </div>
                  <div>
                    <dt>Hash match</dt>
                    <dd>{receipt.receiver_hash_match ? "YES" : "NO"}</dd>
                  </div>
                </dl>
              </article>
            ))
          ) : (
            <p className="td-receipt-pickup__empty">No command receipts found.</p>
          )}
        </div>
      </section>
    </main>
  );
}

