import Link from "next/link";
import type { Metadata } from "next";

import HumanGatesClient from "@/components/tinkerden/human-gates-client";
import { readHumanGateDashboard } from "@/lib/tinkerden/human-gates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Active Human Gates | Werkles",
  description: "Local cockpit surface for active Human Gate review artifacts and durable operator decisions.",
  robots: { index: false, follow: false }
};

function receiptText(receipt: Record<string, unknown>, key: string, fallback = "UNKNOWN") {
  const value = receipt[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export default async function TinkerDenHumanGatesPage() {
  const dashboard = await readHumanGateDashboard();

  return (
    <main className="td-mission-control">
      <nav className="td-surface-switcher" aria-label="TinkerDen surface switcher">
        <Link className="td-surface-switcher__link" href="/tinkerden/mission-control">
          Mission Control
        </Link>
        <Link className="td-surface-switcher__link" href="/tinkerden">
          Bridge
        </Link>
        <Link className="td-surface-switcher__link td-surface-switcher__link--active" href="/tinkerden/human-gates">
          Human Gates
        </Link>
      </nav>

      <header className="td-mission-control__hero">
        <p className="td-mission-control__eyebrow">Active Human Gates</p>
        <h1>Ben-only authority, visible and durable.</h1>
        <p>
          This surface turns gate doctrine into local artifacts: active queue, review dashboards, Markdown packets, and
          append-only approval log entries. It never approves a gate without Ben&apos;s exact phrase.
        </p>
      </header>

      <section className="td-mission-control__grid" aria-label="Human Gate status cards">
        <article className="td-mission-card">
          <header>
            <p>ACTIVE QUEUE</p>
            <h2>{dashboard.active_gate_count} gate records</h2>
          </header>
          <dl className="td-mission-card__facts">
            <div>
              <dt>Primary log</dt>
              <dd>{dashboard.approval_log_path}</dd>
            </div>
            <div>
              <dt>Decision receipts</dt>
              <dd>{dashboard.decision_receipts_dir}</dd>
            </div>
            <div>
              <dt>Active queue JSON</dt>
              <dd>{dashboard.active_queue_path}</dd>
            </div>
            <div>
              <dt>Manifest</dt>
              <dd>{dashboard.manifest_path}</dd>
            </div>
            <div>
              <dt>Current gate index</dt>
              <dd>{dashboard.current_gate_review_path}</dd>
            </div>
            <div>
              <dt>Health report</dt>
              <dd>{dashboard.health_report_path}</dd>
            </div>
            <div>
              <dt>Current packet</dt>
              <dd>{dashboard.current_gate_packet_path}</dd>
            </div>
            <div>
              <dt>Operator brief</dt>
              <dd>{dashboard.operator_brief_path}</dd>
            </div>
            <div>
              <dt>Agent handoff</dt>
              <dd>{dashboard.agent_handoff_path}</dd>
            </div>
            <div>
              <dt>Latest decision</dt>
              <dd>{dashboard.latest_decision_path}</dd>
            </div>
            <div>
              <dt>Latest health</dt>
              <dd>{receiptText(dashboard.latest_health_report ?? {}, "status", "NOT_WRITTEN")}</dd>
            </div>
            <div>
              <dt>Source of truth</dt>
              <dd>{dashboard.source_of_truth.join(" -> ")}</dd>
            </div>
            <div>
              <dt>Hard rule</dt>
              <dd>Silence is not approval. Draft/review outputs stay review-only until the phrase is logged.</dd>
            </div>
          </dl>
        </article>

        <article className="td-mission-card">
          <header>
            <p>GATE LAW</p>
            <h2>Tier 1 vs Tier 2</h2>
          </header>
          <section>
            <h3>Tier 1</h3>
            <p>HTML review dashboard plus Markdown packet for doctrine, money, deploy, SQL, secrets, public exposure, production data, legal, provider, and architecture gates.</p>
          </section>
          <section>
            <h3>Tier 2</h3>
            <p>Concise Markdown only for low-risk decisions that do not affect money, secrets, deploys, schema, production data, public exposure, legal posture, or core doctrine.</p>
          </section>
        </article>
      </section>

      <section className="td-mission-control__grid" aria-label="Active Human Gate records">
        {dashboard.gates.map((gate) => (
          <article className="td-mission-card" key={`${gate.gate_id}-${gate.source}`}>
            <header>
              <p>{gate.tier}</p>
              <h2>{gate.title}</h2>
            </header>
            <dl className="td-mission-card__facts">
              <div>
                <dt>Status</dt>
                <dd>{gate.status}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{gate.source}</dd>
              </div>
              <div>
                <dt>Markdown</dt>
                <dd>{gate.artifact_path ?? "Not created yet"}</dd>
              </div>
              <div>
                <dt>HTML</dt>
                <dd>{gate.html_path ?? "Not required or not created"}</dd>
              </div>
              <div>
                <dt>Confidence</dt>
                <dd>{gate.confidence}</dd>
              </div>
            </dl>
            <section>
              <h3>Approval Phrase</h3>
              <p>{gate.approval_phrase}</p>
            </section>
            <section>
              <h3>Rejection Phrase</h3>
              <p>{gate.rejection_phrase}</p>
            </section>
            <section>
              <h3>Patch Phrase</h3>
              <p>{gate.patch_phrase}</p>
            </section>
            {gate.what_remains_blocked.length ? (
              <section>
                <h3>Still Blocked</h3>
                <ul>
                  {gate.what_remains_blocked.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </article>
        ))}
      </section>

      <HumanGatesClient gates={dashboard.gates} />

      <section className="td-mission-control__grid" aria-label="Machine-readable decision receipts">
        {dashboard.latest_decision_receipts.length ? (
          dashboard.latest_decision_receipts.map((receipt) => (
            <article className="td-mission-card" key={receiptText(receipt, "receipt_id")}>
              <header>
                <p>DECISION RECEIPT</p>
                <h2>{receiptText(receipt, "receipt_id")}</h2>
              </header>
              <dl className="td-mission-card__facts">
                <div>
                  <dt>Status</dt>
                  <dd>{receiptText(receipt, "status")}</dd>
                </div>
                <div>
                  <dt>Kind</dt>
                  <dd>{receiptText(receipt, "kind")}</dd>
                </div>
                <div>
                  <dt>Approval log</dt>
                  <dd>{receiptText(receipt, "approval_log_path")}</dd>
                </div>
                <div>
                  <dt>Next action</dt>
                  <dd>{receiptText(receipt, "next_action_path")}</dd>
                </div>
              </dl>
            </article>
          ))
        ) : (
          <article className="td-mission-card">
            <header>
              <p>DECISION RECEIPTS</p>
              <h2>No machine receipt written yet</h2>
            </header>
            <p>Receipts appear here after Ben&apos;s exact phrase is recorded.</p>
          </article>
        )}
      </section>

      <section className="td-command-console" aria-label="Approval log tail">
        <header>
          <div>
            <p className="td-bridge__eyebrow">Durable trail</p>
            <h3>Latest approval log rows</h3>
          </div>
          <strong>append-only</strong>
        </header>
        <pre>{dashboard.approval_log_tail.join("\n")}</pre>
      </section>
    </main>
  );
}
