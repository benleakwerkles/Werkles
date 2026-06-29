import Link from "next/link";

import { listRealAeyeRelays } from "@/lib/tinkerden/real-aeye-relay";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TinkerDen Relay Proof | Werkles",
  robots: { index: false, follow: false }
};

function yesNo(value: boolean | undefined) {
  return value ? "YES" : "NO";
}

export default async function TinkerDenRelayProofPage() {
  const relays = await listRealAeyeRelays(12);
  const latest = relays[0] ?? null;
  const latestArtifact = relays.find((relay) => relay.status === "ARTIFACT") ?? latest;
  const proof = latestArtifact?.receipt?.proof_chain;
  const originReturn = latestArtifact?.receipt?.origin_return;

  return (
    <main className="td-bridge">
      <nav className="td-surface-switcher" aria-label="TinkerDen surface switcher">
        <Link className="td-surface-switcher__link" href="/tinkerden">
          Bridge
        </Link>
        <Link className="td-surface-switcher__link" href="/tinkerden/receipts">
          Receipts
        </Link>
        <Link className="td-surface-switcher__link td-surface-switcher__link--active" href="/tinkerden/relay-proof">
          Relay Proof
        </Link>
        <Link className="td-surface-switcher__link" href="/thinkit">
          ThinkIt
        </Link>
      </nav>

      <section className="td-command-section td-command-section--proof" aria-label="Real Aeye relay proof">
        <p className="td-bridge__eyebrow">Real Aeye Relay Proof</p>
        <h1>Command Dash proof chain.</h1>
        <p>
          This page reads <code>/tinkerden/aeye-relay</code> directly and renders the latest real relay receipt.
        </p>
      </section>

      {latestArtifact ? (
        <section className="td-command-section td-command-section--now" aria-label="Latest relay artifact">
          <header className="td-command-section__header">
            <div>
              <p className="td-bridge__eyebrow">Latest ARTIFACT</p>
              <h2>{latestArtifact.receipt?.status ?? latestArtifact.status}</h2>
            </div>
            <code>{latestArtifact.relay_id}</code>
          </header>

          <div className="td-proof-grid">
            <article className="td-proof-card">
              <h3>Packet</h3>
              <dl>
                <div>
                  <dt>Packet ID</dt>
                  <dd>{latestArtifact.receipt?.command_packet_id ?? latestArtifact.request.command_packet_id ?? "UNKNOWN"}</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>{latestArtifact.request.source_surface}</dd>
                </div>
                <div>
                  <dt>Destination</dt>
                  <dd>{latestArtifact.request.destination_label}</dd>
                </div>
                <div>
                  <dt>Command</dt>
                  <dd>{latestArtifact.request.command}</dd>
                </div>
              </dl>
            </article>

            <article className="td-proof-card">
              <h3>Thread Receipt</h3>
              <dl>
                <div>
                  <dt>Receipt ID</dt>
                  <dd>{latestArtifact.receipt?.receipt_id ?? "NO_RECEIPT"}</dd>
                </div>
                <div>
                  <dt>Thread ID</dt>
                  <dd>{latestArtifact.receipt?.thread_id ?? "NO_THREAD"}</dd>
                </div>
                <div>
                  <dt>Receipt path</dt>
                  <dd>{latestArtifact.receipt_path}</dd>
                </div>
                <div>
                  <dt>Missing proof</dt>
                  <dd>{latestArtifact.receipt?.missing_proof.length ? latestArtifact.receipt.missing_proof.join(" / ") : "NONE"}</dd>
                </div>
              </dl>
            </article>

            <article className="td-proof-card">
              <h3>A-G Proof</h3>
              <dl>
                <div>
                  <dt>New chat</dt>
                  <dd>{yesNo(proof?.new_chat_created)}</dd>
                </div>
                <div>
                  <dt>New query</dt>
                  <dd>{yesNo(proof?.new_query_sent)}</dd>
                </div>
                <div>
                  <dt>Packet left</dt>
                  <dd>{yesNo(proof?.packet_left)}</dd>
                </div>
                <div>
                  <dt>Packet received</dt>
                  <dd>{yesNo(proof?.packet_received_by_aeye_thread)}</dd>
                </div>
                <div>
                  <dt>Answer returned</dt>
                  <dd>{yesNo(proof?.answer_returned)}</dd>
                </div>
                <div>
                  <dt>Answer received</dt>
                  <dd>{yesNo(proof?.answer_received_by_origin)}</dd>
                </div>
                <div>
                  <dt>Origin return</dt>
                  <dd>{originReturn?.origin_return_path ?? "NO_ORIGIN_RETURN"}</dd>
                </div>
                <div>
                  <dt>Readback hash</dt>
                  <dd>{originReturn?.readback_sha256 ?? "NO_READBACK"}</dd>
                </div>
              </dl>
            </article>
          </div>

          <article className="td-proof-card">
            <h3>Returned answer</h3>
            <pre>{latestArtifact.receipt?.answer_text ?? "No answer text returned."}</pre>
          </article>
        </section>
      ) : (
        <section className="td-command-section td-command-section--proof">
          <h2>NO RELAY RECEIPTS FOUND</h2>
        </section>
      )}
    </main>
  );
}
