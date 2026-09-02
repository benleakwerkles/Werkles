import { readReceiverHandoffIndex } from "@/lib/organism/contracts/receiver-handoff-index";
import { readTinkerdenCommandInbox, readTinkerdenCommandReceipts } from "@/lib/tinkerden/command-surface";
import { listRealAeyeRelays } from "@/lib/tinkerden/real-aeye-relay";

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export async function HarveyLegacyEvidence() {
  const [packets, receipts, handoffs, relays] = await Promise.all([
    readTinkerdenCommandInbox(10_000),
    readTinkerdenCommandReceipts(10_000),
    readReceiverHandoffIndex(10_000),
    listRealAeyeRelays(10_000),
  ]);
  const latestThinkItReturn = relays.find((relay) => relay.request.source_surface === "ThinkIt@Betsy") ?? null;
  const latestThinkItReceipt = latestThinkItReturn?.receipt ?? null;

  return (
    <section className="harvey-legacy-evidence" aria-labelledby="harvey-legacy-evidence-title">
      <header>
        <div>
          <p>Harvey evidence bridge</p>
          <h2 id="harvey-legacy-evidence-title">What survived the old control plane</h2>
        </div>
        <strong>READ-ONLY MIGRATION SOURCE</strong>
      </header>

      <p className="harvey-legacy-evidence__lead">
        TinkerDen and ThinkIt no longer send work. Harvey keeps this evidence summary so the useful history can be
        migrated without pretending the old transport or its receiver hashes meet current custody standards.
      </p>

      <div className="harvey-legacy-evidence__grid">
        <article>
          <span>Packet history</span>
          <strong>{countLabel(packets.length, "archived packet")}</strong>
          <p>Original packet files remain untouched for forensic compatibility.</p>
        </article>
        <article>
          <span>Receipt history</span>
          <strong>{countLabel(receipts.length, "archived receipt")}</strong>
          <p>Useful as historical evidence only—not proof of current crew activity.</p>
        </article>
        <article>
          <span>Receiver handoffs</span>
          <strong>{countLabel(handoffs.count, "record")}</strong>
          <p>
            {handoffs.posted_count} posted · {handoffs.pending_count} pending · {handoffs.returned_unposted_count} returned
            unposted · {handoffs.template_return_blocked_count} template-blocked
          </p>
        </article>
        <article>
          <span>Provenance warning</span>
          <strong>{countLabel(handoffs.records.filter((record) => record.synthetic_proof).length, "synthetic record")}</strong>
          <p>Synthetic rows stay visibly separate so they cannot masquerade as cousin work.</p>
        </article>
      </div>

      <div className="harvey-legacy-evidence__latest">
        <div>
          <span>Latest archived ThinkIt return</span>
          <strong>{latestThinkItReturn?.relay_id ?? "No archived ThinkIt return found"}</strong>
        </div>
        <dl>
          <div>
            <dt>Status</dt>
            <dd>{latestThinkItReceipt?.status ?? latestThinkItReturn?.status ?? "NONE"}</dd>
          </div>
          <div>
            <dt>Origin readback</dt>
            <dd>{latestThinkItReceipt?.origin_return?.readback_match ? "MATCHED" : "NOT PROVEN"}</dd>
          </div>
        </dl>
      </div>

      <p className="harvey-legacy-evidence__boundary">
        Preserved: historical files, counts, provenance, and readback facts. Not preserved as live capability: dispatch,
        polling, posting, approvals, or command composition. The legacy UI remains diagnostic-only until Harvey has
        replacement proof.
      </p>
    </section>
  );
}
