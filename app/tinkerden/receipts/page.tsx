import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

import { TinkerDenSurfaceSwitcher } from "@/components/tinkerden/tinkerden-surface-switcher";
import {
  readReceiverHandoffIndex,
  type ReceiverHandoffIndexRecord,
} from "@/lib/organism/contracts/receiver-handoff-index";
import { readReceiverHandoffPostedIndex } from "@/lib/organism/contracts/receiver-handoff-posted-index";
import { readTinkerdenCommandReceipts } from "@/lib/tinkerden/command-surface";

export const metadata: Metadata = {
  title: "TinkerDen Receipts",
  description: "Returned ACK / BLOCKER / ARTIFACT receipts for the TinkerDen command surface.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

const receiptsProvenanceFilterScript = String.raw`
(() => {
  if (window.__tinkerdenReceiptsProvenanceFilterBound) return;
  window.__tinkerdenReceiptsProvenanceFilterBound = true;

  const cardSelector = [
    "[data-receiver-handoff-ready-to-post-card]",
    "[data-receiver-handoff-template-blocked-card]",
    "[data-receiver-handoff-pending-card]",
    "[data-receiver-handoff-posted-card]"
  ].join(", ");

  function normalizeMode(mode) {
    return mode === "operator" || mode === "synthetic" ? mode : "all";
  }

  function modeFromLocation() {
    try {
      const params = new URLSearchParams(window.location.search);
      return normalizeMode(params.get("handoff_provenance") || params.get("provenance") || "all");
    } catch {
      return "all";
    }
  }

  function syncModeToLocation(mode) {
    if (!window.history?.replaceState) return;
    const safeMode = normalizeMode(mode);
    const url = new URL(window.location.href);
    if (safeMode === "all") {
      url.searchParams.delete("handoff_provenance");
    } else {
      url.searchParams.set("handoff_provenance", safeMode);
    }
    window.history.replaceState(null, "", url);
  }

  function shouldShow(mode, synthetic) {
    if (mode === "operator") return !synthetic;
    if (mode === "synthetic") return synthetic;
    return true;
  }

  function applyFilter(mode, options = {}) {
    const root = document.querySelector("[data-receiver-handoff-provenance-filter]");
    const safeMode = normalizeMode(mode);
    const items = Array.from(document.querySelectorAll("[data-receiver-handoff-provenance-item]"));
    const cards = Array.from(document.querySelectorAll(cardSelector));
    let visibleCards = 0;

    items.forEach((item) => {
      const synthetic = item.getAttribute("data-synthetic-proof") === "true";
      const visible = shouldShow(safeMode, synthetic);
      item.hidden = !visible;
      item.setAttribute("data-provenance-visible", visible ? "true" : "false");
    });

    cards.forEach((card) => {
      if (!card.hidden) visibleCards += 1;
    });

    if (root) root.setAttribute("data-active-filter", safeMode);
    document.querySelectorAll("[data-provenance-filter-mode]").forEach((button) => {
      button.setAttribute("aria-pressed", button.getAttribute("data-provenance-filter-mode") === safeMode ? "true" : "false");
    });
    const summary = document.querySelector("[data-receiver-handoff-provenance-visible-count]");
    if (summary) summary.textContent = visibleCards + " visible";
    if (options.updateUrl) syncModeToLocation(safeMode);
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-provenance-filter-mode]");
    if (!button) return;
    applyFilter(button.getAttribute("data-provenance-filter-mode") || "all", { updateUrl: true });
  });

  applyFilter(modeFromLocation());
})();
`;

function ReceiverHandoffProvenance({ record }: { record: ReceiverHandoffIndexRecord }) {
  if (!record.synthetic_proof) return null;

  return (
    <span
      className="td-receipt-pickup__provenance td-receipt-pickup__provenance--synthetic"
      data-receiver-handoff-provenance-badge
      data-synthetic-proof="true"
      data-synthetic-reason={record.synthetic_reason}
    >
      SYNTHETIC PROOF
    </span>
  );
}

export default async function TinkerdenReceiptsPage() {
  const [receipts, postedHandoffs, handoffIndex] = await Promise.all([
    readTinkerdenCommandReceipts(25),
    readReceiverHandoffPostedIndex(25),
    readReceiverHandoffIndex(250),
  ]);
  const firstReturn = receipts[0] ?? null;
  const latestPostedHandoff = postedHandoffs.latest;
  const readyToPostHandoffs = handoffIndex.records.filter((record) => record.state === "returned_unposted");
  const templateBlockedHandoffs = handoffIndex.records.filter((record) => record.state === "template_return_blocked");
  const pendingReceiverHandoffs = handoffIndex.records.filter((record) => record.state === "pending_receiver");
  const syntheticHandoffCount = handoffIndex.records.filter((record) => record.synthetic_proof).length;
  const operatorHandoffCount = handoffIndex.records.length - syntheticHandoffCount;

  return (
    <main className="td-bridge">
      <TinkerDenSurfaceSwitcher active="receipts" handoffSummary={handoffIndex} />

      <header className="td-bridge__hero">
        <p className="td-bridge__eyebrow">TinkerDen / Receipts</p>
        <h1>Returned receipts.</h1>
        <p>
          Historical receipt evidence from the retired TinkerDen command surface. These records are not current crew
          activity, and receiver hashes shown here do not establish current Harvey custody.
        </p>
      </header>

      <section
        className="td-command-section td-provenance-filter"
        aria-label="Receiver handoff provenance scope"
        data-receiver-handoff-provenance-filter
        data-total-count={handoffIndex.count}
        data-operator-count={operatorHandoffCount}
        data-synthetic-count={syntheticHandoffCount}
        data-active-filter="all"
      >
        <header className="td-command-section__header">
          <p className="td-bridge__eyebrow">PROVENANCE</p>
          <h2>Receiver handoff scope</h2>
        </header>
        <div className="td-provenance-filter__controls">
          <button type="button" data-provenance-filter-mode="all" aria-pressed="true">
            ALL {handoffIndex.count}
          </button>
          <button type="button" data-provenance-filter-mode="operator" aria-pressed="false">
            OPERATOR {operatorHandoffCount}
          </button>
          <button type="button" data-provenance-filter-mode="synthetic" aria-pressed="false">
            SYNTHETIC {syntheticHandoffCount}
          </button>
          <span data-receiver-handoff-provenance-visible-count>{handoffIndex.count} visible</span>
        </div>
      </section>

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

      <section
        id="legacy-receiver-handoffs"
        className="td-command-section"
        aria-labelledby="legacy-receiver-handoffs-title"
      >
        <header className="td-command-section__header">
          <p className="td-bridge__eyebrow">RECEIVER HANDOFFS</p>
          <h2 id="legacy-receiver-handoffs-title">Legacy returned-receipt records</h2>
          <p>Source: <code>/api/organism/contracts/receiver-handoffs</code></p>
        </header>

        <article
          className="td-command-console__receipt"
          data-receiver-handoff-ready-to-post-drawer
          data-returned-unposted-count={handoffIndex.returned_unposted_count}
          data-latest-bundle-id={readyToPostHandoffs[0]?.bundle_id ?? ""}
          data-latest-receipt-id={readyToPostHandoffs[0]?.returned_receipt_id ?? ""}
        >
          <header>
            <strong>{readyToPostHandoffs.length > 0 ? "ARCHIVED_UNPOSTED" : "EMPTY"}</strong>
            <code>{readyToPostHandoffs[0]?.returned_receipt_id ?? "NO_RETURNED_UNPOSTED_RECEIPT"}</code>
          </header>
          <dl>
            <div>
              <dt>Archived unposted count</dt>
              <dd>{handoffIndex.returned_unposted_count}</dd>
            </div>
            <div>
              <dt>Latest bundle</dt>
              <dd>{readyToPostHandoffs[0]?.bundle_id ?? "NONE"}</dd>
            </div>
            <div>
              <dt>Returned receipt</dt>
              <dd>{readyToPostHandoffs[0]?.returned_receipt_path ?? "NONE"}</dd>
            </div>
            <div>
              <dt>Contract receipt</dt>
              <dd>{readyToPostHandoffs[0]?.contract_receipt_path ?? "NO_CONTRACT_RECEIPT"}</dd>
            </div>
          </dl>
        </article>

        {readyToPostHandoffs.length > 0 ? (
          <nav
            className="td-surface-switcher"
            aria-label="Ready receiver handoff index"
            data-receiver-handoff-ready-to-post-anchor-nav
            data-returned-unposted-count={readyToPostHandoffs.length}
          >
            {readyToPostHandoffs.map((record) => (
              <Link
                className="td-surface-switcher__link"
                href={`#legacy-receiver-handoff-${record.bundle_id}`}
                key={`ready-link-${record.bundle_id}`}
                data-receiver-handoff-ready-to-post-anchor-link
                data-receiver-handoff-provenance-item
                data-bundle-id={record.bundle_id}
                data-receipt-id={record.returned_receipt_id}
                data-synthetic-proof={record.synthetic_proof ? "true" : "false"}
                data-synthetic-reason={record.synthetic_reason}
              >
                {record.bundle_id}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="td-receipt-pickup__list" data-receiver-handoff-ready-to-post-list>
          {readyToPostHandoffs.length > 0 ? (
            readyToPostHandoffs.map((record) => (
              <article
                id={`legacy-receiver-handoff-${record.bundle_id}`}
                className="td-receipt-pickup__card"
                key={record.bundle_id}
                data-receiver-handoff-ready-to-post-card
                data-receiver-handoff-provenance-item
                data-bundle-id={record.bundle_id}
                data-receipt-id={record.returned_receipt_id}
                data-synthetic-proof={record.synthetic_proof ? "true" : "false"}
                data-synthetic-reason={record.synthetic_reason}
              >
                <header>
                  <span>{record.state}</span>
                  <ReceiverHandoffProvenance record={record} />
                  <strong>{record.returned_receipt_id}</strong>
                </header>
                <dl>
                  <div>
                    <dt>Bundle</dt>
                    <dd>{record.bundle_id}</dd>
                  </div>
                  <div>
                    <dt>Packet</dt>
                    <dd>{record.packet_id}</dd>
                  </div>
                  <div>
                    <dt>Receiver</dt>
                    <dd>{record.returned_receiver}</dd>
                  </div>
                  <div>
                    <dt>Returned receipt</dt>
                    <dd>{record.returned_receipt_path}</dd>
                  </div>
                  <div>
                    <dt>Truth boundary</dt>
                    <dd>{record.truth_boundary}</dd>
                  </div>
                </dl>
              </article>
            ))
          ) : (
            <p className="td-receipt-pickup__empty">No returned-unposted receiver handoff receipts found.</p>
          )}
        </div>
      </section>

      <section
        id="receiver-handoff-template-blocked"
        className="td-command-section"
        aria-labelledby="receiver-handoff-template-blocked-title"
      >
        <header className="td-command-section__header">
          <p className="td-bridge__eyebrow">BLOCKED</p>
          <h2 id="receiver-handoff-template-blocked-title">Template returns blocked from posting</h2>
          <p>These are visible because template returns must not masquerade as receiver work.</p>
        </header>

        <div
          className="td-receipt-pickup__list"
          data-receiver-handoff-template-blocked-list
          data-template-return-blocked-count={handoffIndex.template_return_blocked_count}
        >
          {templateBlockedHandoffs.length > 0 ? (
            templateBlockedHandoffs.map((record) => (
              <article
                id={`receiver-handoff-template-blocked-${record.bundle_id}`}
                className="td-receipt-pickup__card"
                key={record.bundle_id}
                data-receiver-handoff-template-blocked-card
                data-receiver-handoff-provenance-item
                data-bundle-id={record.bundle_id}
                data-synthetic-proof={record.synthetic_proof ? "true" : "false"}
                data-synthetic-reason={record.synthetic_reason}
              >
                <header>
                  <span>{record.state}</span>
                  <ReceiverHandoffProvenance record={record} />
                  <strong>{record.bundle_id}</strong>
                </header>
                <dl>
                  <div>
                    <dt>Packet</dt>
                    <dd>{record.packet_id}</dd>
                  </div>
                  <div>
                    <dt>Blocked reason</dt>
                    <dd>{record.template_blocked_reason ?? "UNKNOWN"}</dd>
                  </div>
                  <div>
                    <dt>Returned receipt</dt>
                    <dd>{record.returned_receipt_path}</dd>
                  </div>
                  <div>
                    <dt>Truth boundary</dt>
                    <dd>{record.truth_boundary}</dd>
                  </div>
                </dl>
              </article>
            ))
          ) : (
            <p className="td-receipt-pickup__empty">No template-return blockers found.</p>
          )}
        </div>
      </section>

      <section
        id="receiver-handoff-pending"
        className="td-command-section"
        aria-labelledby="receiver-handoff-pending-title"
      >
        <header className="td-command-section__header">
          <p className="td-bridge__eyebrow">PENDING</p>
          <h2 id="receiver-handoff-pending-title">Waiting on receiver return</h2>
          <p>These bundles are waiting for non-template returned receipts.</p>
        </header>

        <div
          className="td-receipt-pickup__list"
          data-receiver-handoff-pending-list
          data-pending-count={handoffIndex.pending_count}
        >
          {pendingReceiverHandoffs.length > 0 ? (
            pendingReceiverHandoffs.map((record) => (
              <article
                id={`receiver-handoff-pending-${record.bundle_id}`}
                className="td-receipt-pickup__card"
                key={record.bundle_id}
                data-receiver-handoff-pending-card
                data-receiver-handoff-provenance-item
                data-bundle-id={record.bundle_id}
                data-synthetic-proof={record.synthetic_proof ? "true" : "false"}
                data-synthetic-reason={record.synthetic_reason}
              >
                <header>
                  <span>{record.state}</span>
                  <ReceiverHandoffProvenance record={record} />
                  <strong>{record.bundle_id}</strong>
                </header>
                <dl>
                  <div>
                    <dt>Packet</dt>
                    <dd>{record.packet_id}</dd>
                  </div>
                  <div>
                    <dt>Receiver</dt>
                    <dd>{record.receiver}</dd>
                  </div>
                  <div>
                    <dt>Handoff path</dt>
                    <dd>{record.handoff_path}</dd>
                  </div>
                  <div>
                    <dt>Truth boundary</dt>
                    <dd>{record.truth_boundary}</dd>
                  </div>
                </dl>
              </article>
            ))
          ) : (
            <p className="td-receipt-pickup__empty">No pending receiver handoffs found.</p>
          )}
        </div>
      </section>

      <section
        id="receiver-handoff-posted"
        className="td-command-section"
        aria-labelledby="receiver-handoff-posted-title"
      >
        <header className="td-command-section__header">
          <p className="td-bridge__eyebrow">RECEIVER HANDOFFS</p>
          <h2 id="receiver-handoff-posted-title">Posted receiver receipts</h2>
          <p>Source: <code>/api/organism/contracts/receiver-handoffs/posted</code></p>
        </header>

        <article
          className="td-command-console__receipt"
          data-receiver-handoff-posted-drawer
          data-latest-bundle-id={latestPostedHandoff?.bundle_id ?? ""}
          data-latest-receipt-id={latestPostedHandoff?.returned_receipt_id ?? ""}
          data-latest-contract-receipt-path={latestPostedHandoff?.contract_receipt_path ?? ""}
          data-posted-count={postedHandoffs.posted_count}
          data-source-total-count={postedHandoffs.source_total_count}
        >
          <header>
            <strong>{latestPostedHandoff ? "POSTED" : "EMPTY"}</strong>
            <code>{latestPostedHandoff?.returned_receipt_id ?? "NO_POSTED_RECEIVER_HANDOFF"}</code>
          </header>
          <dl>
            <div>
              <dt>Latest bundle</dt>
              <dd>{latestPostedHandoff?.bundle_id ?? "NONE"}</dd>
            </div>
            <div>
              <dt>Packet</dt>
              <dd>{latestPostedHandoff?.packet_id ?? "NONE"}</dd>
            </div>
            <div>
              <dt>Returned receipt</dt>
              <dd>{latestPostedHandoff?.returned_receipt_path ?? "NONE"}</dd>
            </div>
            <div>
              <dt>Contract receipt</dt>
              <dd>{latestPostedHandoff?.contract_receipt_path ?? "NONE"}</dd>
            </div>
            <div>
              <dt>Joined event</dt>
              <dd>{latestPostedHandoff?.contract_event_joined ? "YES" : "NO"}</dd>
            </div>
            <div>
              <dt>Posted / source total</dt>
              <dd>{postedHandoffs.posted_count} / {postedHandoffs.source_total_count}</dd>
            </div>
          </dl>
        </article>

        {postedHandoffs.records.length > 0 ? (
          <nav
            className="td-surface-switcher"
            aria-label="Posted receiver handoff index"
            data-receiver-handoff-posted-anchor-nav
            data-posted-count={postedHandoffs.records.length}
          >
            {postedHandoffs.records.map((record) => (
              <Link
                className="td-surface-switcher__link"
                href={`#receiver-handoff-posted-${record.bundle_id}`}
                key={`posted-link-${record.bundle_id}`}
                data-receiver-handoff-posted-anchor-link
                data-receiver-handoff-provenance-item
                data-bundle-id={record.bundle_id}
                data-receipt-id={record.returned_receipt_id}
                data-synthetic-proof={record.synthetic_proof ? "true" : "false"}
                data-synthetic-reason={record.synthetic_reason}
              >
                {record.bundle_id}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="td-receipt-pickup__list" data-receiver-handoff-posted-list>
          {postedHandoffs.records.length > 0 ? (
            postedHandoffs.records.map((record) => (
              <article
                id={`receiver-handoff-posted-${record.bundle_id}`}
                className="td-receipt-pickup__card"
                key={record.bundle_id}
                data-receiver-handoff-posted-card
                data-receiver-handoff-provenance-item
                data-bundle-id={record.bundle_id}
                data-receipt-id={record.returned_receipt_id}
                data-contract-receipt-path={record.contract_receipt_path}
                data-synthetic-proof={record.synthetic_proof ? "true" : "false"}
                data-synthetic-reason={record.synthetic_reason}
              >
                <header>
                  <span>{record.state}</span>
                  <ReceiverHandoffProvenance record={record} />
                  <strong>{record.returned_receipt_id}</strong>
                </header>
                <dl>
                  <div>
                    <dt>Bundle</dt>
                    <dd>{record.bundle_id}</dd>
                  </div>
                  <div>
                    <dt>Packet</dt>
                    <dd>{record.packet_id}</dd>
                  </div>
                  <div>
                    <dt>Receiver</dt>
                    <dd>{record.returned_receiver}</dd>
                  </div>
                  <div>
                    <dt>Contract receipt</dt>
                    <dd>{record.contract_receipt_path}</dd>
                  </div>
                  <div>
                    <dt>Joined event</dt>
                    <dd>{record.contract_event_joined ? "YES" : "NO"}</dd>
                  </div>
                </dl>
              </article>
            ))
          ) : (
            <p className="td-receipt-pickup__empty">No posted receiver handoff receipts found.</p>
          )}
        </div>
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
      <Script id="tinkerden-receipts-provenance-filter" strategy="afterInteractive">{receiptsProvenanceFilterScript}</Script>
    </main>
  );
}

