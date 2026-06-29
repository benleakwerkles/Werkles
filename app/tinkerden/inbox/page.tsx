import type { Metadata } from "next";
import Link from "next/link";

import CommandDashClient from "@/components/tinkerden/command-dash-client";
import { readLatestNerdkleAnswerProofs } from "@/lib/tinkerden/answer-proof";
import { readTinkerdenCommandDestinations, readTinkerdenCommandInbox } from "@/lib/tinkerden/command-surface";

export const metadata: Metadata = {
  title: "TinkerDen Inbox | Werkles",
  description: "Minimal file-backed command surface for TinkerDen.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function TinkerdenInboxPage() {
  const [packets, destinations, answerProofs] = await Promise.all([
    readTinkerdenCommandInbox(12),
    readTinkerdenCommandDestinations(),
    readLatestNerdkleAnswerProofs(6)
  ]);

  return (
    <main className="td-bridge">
      <nav className="td-surface-switcher" aria-label="TinkerDen surface switcher">
        <Link className="td-surface-switcher__link" href="/tinkerden">
          Bridge
        </Link>
        <Link className="td-surface-switcher__link td-surface-switcher__link--active" href="/tinkerden/inbox">
          Inbox
        </Link>
        <Link className="td-surface-switcher__link" href="/tinkerden/receipts">
          Receipts
        </Link>
        <Link className="td-surface-switcher__link" href="/thinkit">
          ThinkIt
        </Link>
      </nav>

      <header className="td-bridge__hero">
        <p className="td-bridge__eyebrow">TinkerDen / Command Surface / Build Lane</p>
        <h1>Command inbox.</h1>
        <p>
          First usable command surface: write a command, create a packet in <code>tinkerden/inbox</code>, require a receiver
          hash read, and show the returned ACK / BLOCKER / ARTIFACT.
        </p>
      </header>

      <section className="td-command-section" aria-labelledby="command-form-title">
        <header className="td-command-section__header">
          <p className="td-bridge__eyebrow">NOW</p>
          <h2 id="command-form-title">Issue command</h2>
        </header>
        <CommandDashClient
          destinations={destinations}
          sourceSurface="TinkerDenInbox@Betsy"
          title="Write one packet, relay it to a verified Aeye, and show the returned custody receipt."
          eyebrow="Command Inbox"
          badge="no free-text routing"
          submitLabel="RELAY PACKET"
        />
      </section>

      <section className="td-command-section" aria-labelledby="packet-list-title">
        <header className="td-command-section__header">
          <p className="td-bridge__eyebrow">PROOF</p>
          <h2 id="packet-list-title">Latest command packets</h2>
          <p>Source: <code>tinkerden/inbox</code></p>
        </header>

        <div className="td-receipt-pickup__list">
          {packets.length > 0 ? (
            packets.map((packet) => (
              <article className="td-receipt-pickup__card" key={packet.packet_id}>
                <header>
                  <span>{packet.status}</span>
                  <strong>{packet.packet_id}</strong>
                </header>
                <dl>
                  <div>
                    <dt>Command</dt>
                    <dd>{packet.command}</dd>
                  </div>
                  <div>
                    <dt>Target</dt>
                    <dd>{packet.target}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{packet.created_at}</dd>
                  </div>
                  <div>
                    <dt>Packet path</dt>
                    <dd>{packet.packet_path}</dd>
                  </div>
                  <div>
                    <dt>Packet hash</dt>
                    <dd>{packet.packet_hash}</dd>
                  </div>
                </dl>
              </article>
            ))
          ) : (
            <p className="td-receipt-pickup__empty">No command packets found in <code>tinkerden/inbox</code>.</p>
          )}
        </div>
      </section>

      <section className="td-command-section" aria-labelledby="answer-proof-title">
        <header className="td-command-section__header">
          <p className="td-bridge__eyebrow">REAL ANSWER LOOP</p>
          <h2 id="answer-proof-title">Packet left, received, answered, returned</h2>
          <p>Source: <code>foreman/messages/receipts/nerdkle_answer_receipt_*.json</code></p>
        </header>

        <div className="td-receipt-pickup__list">
          {answerProofs.length > 0 ? (
            answerProofs.map((proof) => (
              <article className="td-receipt-pickup__card" key={proof.receipt_id}>
                <header>
                  <span>{proof.status}</span>
                  <strong>{proof.packet_id}</strong>
                </header>
                <dl>
                  <div>
                    <dt>Receipt</dt>
                    <dd>{proof.receipt_id}</dd>
                  </div>
                  <div>
                    <dt>Packet left</dt>
                    <dd>{proof.source_outbox_path}</dd>
                  </div>
                  <div>
                    <dt>Packet received</dt>
                    <dd>{proof.received_path}</dd>
                  </div>
                  <div>
                    <dt>Packet answered</dt>
                    <dd>{proof.answer_path}</dd>
                  </div>
                  <div>
                    <dt>Answer returned</dt>
                    <dd>{proof.returned_path}</dd>
                  </div>
                  <div>
                    <dt>Answer hash</dt>
                    <dd>{proof.answer_sha256}</dd>
                  </div>
                  <div>
                    <dt>Message</dt>
                    <dd>{proof.message}</dd>
                  </div>
                  <div>
                    <dt>Limit</dt>
                    <dd>{proof.limitation}</dd>
                  </div>
                </dl>
              </article>
            ))
          ) : (
            <p className="td-receipt-pickup__empty">No Nerdkle answer receipts found yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}

