import type { Metadata } from "next";

import { TinkerDenSurfaceSwitcher } from "@/components/tinkerden/tinkerden-surface-switcher";
import { readLatestNerdkleAnswerProofs } from "@/lib/tinkerden/answer-proof";
import { readTinkerdenCommandInbox } from "@/lib/tinkerden/command-surface";

export const metadata: Metadata = {
  title: "TinkerDen Inbox",
  description: "Read-only archive of the retired TinkerDen command inbox.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function TinkerdenInboxPage() {
  const [packets, answerProofs] = await Promise.all([
    readTinkerdenCommandInbox(12),
    readLatestNerdkleAnswerProofs(6),
  ]);

  return (
    <main className="td-bridge">
      <TinkerDenSurfaceSwitcher active="inbox" />

      <header className="td-bridge__hero">
        <p className="td-bridge__eyebrow">TinkerDen / Legacy archive</p>
        <h1>Retired command inbox.</h1>
        <p>
          This read-only page preserves old packet evidence for forensic compatibility. Its receiver-hash experiment does
          not satisfy current Harvey custody standards, and this page cannot issue or relay work.
        </p>
      </header>

      <section className="td-command-section" aria-labelledby="packet-list-title">
        <header className="td-command-section__header">
          <p className="td-bridge__eyebrow">HISTORICAL EVIDENCE</p>
          <h2 id="packet-list-title">Archived command packets</h2>
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
          <p className="td-bridge__eyebrow">LEGACY ANSWER PROOF</p>
          <h2 id="answer-proof-title">Archived packet and answer records</h2>
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

