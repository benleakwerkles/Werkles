"use client";

import { useEffect, useMemo, useState } from "react";

type JsonRecord = Record<string, unknown>;

type RelaySnapshot = {
  contract: JsonRecord | null;
  coverage: JsonRecord | null;
  originReturn: JsonRecord | null;
  threadBridge: JsonRecord | null;
  actionableReturns: JsonRecord | null;
};

type ActionResult = {
  label: string;
  endpoint: string;
  timestamp: string;
  ok: boolean;
  statusCode: number;
  result: JsonRecord | null;
  error?: string;
};

const emptySnapshot: RelaySnapshot = {
  contract: null,
  coverage: null,
  originReturn: null,
  threadBridge: null,
  actionableReturns: null
};

function valueAt(source: unknown, path: string[]) {
  let current = source;
  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) return null;
    current = (current as JsonRecord)[key];
  }
  return current;
}

function asText(value: unknown, fallback = "UNKNOWN") {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" ? (value as JsonRecord) : null;
}

function humanTargetName(target: string) {
  if (!target || target === "UNKNOWN_TARGET") return "Unknown receiver";
  return target.replace(".", "@");
}

function findReceiver(threadBridge: JsonRecord | null, target: string) {
  const targetThreads = asArray(valueAt(threadBridge, ["known_target_threads"]));
  const fromList = targetThreads.find((item) => asText(asRecord(item)?.target, "") === target);
  if (fromList) return asRecord(fromList);

  const knownTarget = valueAt(threadBridge, ["known_targets", target]);
  return asRecord(knownTarget);
}

function receiverTitle(threadBridge: JsonRecord | null, target: string) {
  const receiver = findReceiver(threadBridge, target);
  return asText(receiver?.title, humanTargetName(target));
}

function receiverSurface(receiver: JsonRecord | null) {
  const mode = asText(receiver?.relay_mode, "");
  const status = asText(receiver?.route_status, "");
  if (mode === "CODEX_THREAD_BRIDGE") return "Codex receiver thread";
  if (mode === "FILE_INBOX_LAN") return "LAN receiver inbox";
  if (mode === "DO_NOT_ROUTE" || status === "HELD_BY_TOPOLOGY") return "Held by routing rules";
  if (mode === "LOCAL_ONLY") return "Local control thread";
  return "Receiver surface";
}

function receiverInstruction(receiver: JsonRecord | null, target: string) {
  const title = asText(receiver?.title, humanTargetName(target));
  const mode = asText(receiver?.relay_mode, "");
  const inboxUrl = asText(receiver?.file_inbox_url, "");
  if (mode === "CODEX_THREAD_BRIDGE") {
    return `Continue directly in the Codex thread named "${title}". ThinkIt is showing the receipt that thread wrote back.`;
  }
  if (inboxUrl && inboxUrl !== "UNKNOWN") {
    return `Open the receiver inbox for ${humanTargetName(target)}. ThinkIt is waiting for that inbox to write back.`;
  }
  return "This return is file-backed. ThinkIt can show the proof, but no friendly receiver surface is linked yet.";
}

function humanLabel(value: unknown, fallback = "Review") {
  return asText(value, fallback).replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function humanizeTargetText(value: unknown, target: string, fallback: string) {
  return asText(value, fallback).replaceAll(target, humanTargetName(target));
}

function returnedWorkHeadline(record: JsonRecord, target: string) {
  const channel = asText(record.channel, "");
  const advancement = asText(record.advancement_type, "");
  const packet = asText(record.packet_id, "");
  const receiver = humanTargetName(target);

  if (advancement === "SESSION_BOOTSTRAP" || channel === "brainboot") {
    return `${receiver} finished Brainboot and is ready for the next move.`;
  }
  if (packet.startsWith("BOOK_CHAPTER_EDIT")) {
    return `${receiver} returned a book edit.`;
  }
  if (asText(record.answer_status, "") === "COMPLETED") {
    return `${receiver} returned a completed answer.`;
  }
  return `${receiver} returned work for review.`;
}

function summarizePackets(value: unknown) {
  const packets = asArray(value);
  return packets
    .map((packet) => {
      const record = packet && typeof packet === "object" ? (packet as JsonRecord) : {};
      return asText(record.packet_id ?? record.relay_id ?? record.id, "UNKNOWN_PACKET");
    })
    .slice(0, 3)
    .join(", ");
}

async function readJson(endpoint: string): Promise<JsonRecord> {
  const response = await fetch(endpoint, { cache: "no-store" });
  const result = (await response.json()) as JsonRecord;
  if (!response.ok) {
    throw new Error(asText(result.error, `HTTP_${response.status}`));
  }
  return result;
}

async function postJson(endpoint: string, payload: JsonRecord): Promise<{ statusCode: number; result: JsonRecord }> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = (await response.json()) as JsonRecord;
  return { statusCode: response.status, result };
}

export default function SwansonRelayControl() {
  const [snapshot, setSnapshot] = useState<RelaySnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<ActionResult | null>(null);
  const [target, setTarget] = useState("Skybro.Betsy");
  const [proofBody, setProofBody] = useState(
    "Return ACK / BLOCKER / ARTIFACT proving this packet reached the Aeye thread, was understood, and came back to the ThinkIt origin dash."
  );

  async function refresh(reason = "Relay state refreshed") {
    setLoading(true);
    setError(null);
    try {
      const [contract, coverage, originReturn, threadBridge, actionableReturns] = await Promise.all([
        readJson("/api/thinkit/swanson/thinkit/relay_merge_contract"),
        readJson("/api/thinkit/swanson/relay/coverage"),
        readJson("/api/thinkit/swanson/relay/origin_return"),
        readJson("/api/thinkit/swanson/relay/thread_bridge/status?limit=12"),
        readJson("/api/thinkit/swanson/relay/actionable_returns")
      ]);
      setSnapshot({ contract, coverage, originReturn, threadBridge, actionableReturns });
      setLastAction((current) =>
        current ?? {
          label: reason,
          endpoint: "GET relay readback bundle",
          timestamp: new Date().toISOString(),
          ok: true,
          statusCode: 200,
          result: { status: reason }
        }
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Relay readback failed");
    } finally {
      setLoading(false);
    }
  }

  async function runAction(label: string, endpoint: string, payload: JsonRecord = {}) {
    setActionPending(label);
    setError(null);
    try {
      const { statusCode, result } = await postJson(endpoint, payload);
      const ok = statusCode >= 200 && statusCode < 300;
      setLastAction({
        label,
        endpoint,
        timestamp: new Date().toISOString(),
        ok,
        statusCode,
        result,
        error: ok ? undefined : asText(result.error, "REQUEST_FAILED")
      });
      await refresh(`${label} returned`);
    } catch (actionError) {
      setLastAction({
        label,
        endpoint,
        timestamp: new Date().toISOString(),
        ok: false,
        statusCode: 0,
        result: null,
        error: actionError instanceof Error ? actionError.message : "Action failed"
      });
      setError(actionError instanceof Error ? actionError.message : "Action failed");
    } finally {
      setActionPending(null);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const coverageSummary = valueAt(snapshot.coverage, ["summary"]) as JsonRecord | null;
  const contractReadiness = valueAt(snapshot.contract, ["readiness"]) as JsonRecord | null;
  const latestReturn = valueAt(snapshot.originReturn, ["origin_return", "latest_return"]) as JsonRecord | null;
  const directLatestReturn = valueAt(snapshot.originReturn, ["latest_return"]) as JsonRecord | null;
  const latest = latestReturn ?? directLatestReturn ?? snapshot.originReturn;
  const actuator = valueAt(snapshot.coverage, ["actuator"]) as JsonRecord | null;
  const queued = asArray(valueAt(snapshot.threadBridge, ["queued"]));
  const blocked = asArray(valueAt(snapshot.threadBridge, ["blocked"]));
  const actionable =
    valueAt(snapshot.actionableReturns, ["actionable_returns", "actionable"]) ??
    valueAt(snapshot.actionableReturns, ["actionable_returns", "items"]) ??
    valueAt(snapshot.actionableReturns, ["items"]);
  const actionables = asArray(actionable);

  const contractStatus = asText(snapshot.contract?.status, "NO_CONTRACT");
  const relayReady = contractStatus.includes("THINKIT_RELAY_MERGE_READY");
  const readinessLabel = contractStatus.includes("WITH_BLOCKERS")
    ? "CONDITIONAL GO"
    : relayReady
      ? "MERGE READY"
      : "READBACK BLOCKED";
  const roundTrip = asNumber(coverageSummary?.round_trip_proven ?? valueAt(snapshot.contract, ["current_readback", "coverage_summary", "round_trip_proven"]));
  const targetCount = asNumber(coverageSummary?.target_count ?? valueAt(snapshot.contract, ["current_readback", "coverage_summary", "target_count"]));
  const held = asNumber(coverageSummary?.held ?? valueAt(snapshot.contract, ["current_readback", "coverage_summary", "held"]));
  const bridgeStatus = asText(actuator?.status ?? valueAt(snapshot.threadBridge, ["actuator", "status"]), "UNKNOWN");
  const latestPacket = asText(latest?.packet_id ?? latest?.relay_id, "NO_RETURN_YET");
  const latestTarget = asText(latest?.target ?? latest?.destination_label, "UNKNOWN_TARGET");
  const latestStatus = asText(latest?.packet_status ?? latest?.answer_status ?? latest?.origin_readback_status ?? latest?.status, "UNKNOWN_STATUS");
  const latestAnswer = asText(latest?.answer_evidence ?? latest?.answer_text, "No returned answer has been read back yet.");
  const latestReceiver = findReceiver(snapshot.threadBridge, latestTarget);
  const latestReceiverTitle = receiverTitle(snapshot.threadBridge, latestTarget);
  const latestReceiptId = asText(latest?.receiver_receipt_id, "NO_RECEIPT_YET");
  const latestReceiptPath = asText(latest?.receiver_receipt_path, "No receipt file read back yet.");
  const latestSourcePacketPath = asText(latest?.source_packet_path, "No source packet path read back yet.");

  const actionSummary = useMemo(() => {
    if (!lastAction?.result) return "No action result yet.";
    return JSON.stringify(lastAction.result, null, 2).slice(0, 2200);
  }, [lastAction]);

  return (
    <section className="thinkit-relay" aria-label="Swanson relay control">
      <header className="thinkit-relay__header">
        <div>
          <p className="td-bridge__eyebrow">Swanson Relay Build / live transport</p>
          <h2>Relay first. Receipts visible. Return proof or it did not happen.</h2>
          <p>
            This is the runtime bridge between ThinkIt and the working Swanson relay core on <code>127.0.0.1:3339</code>.
            Buttons below call the relay endpoints and immediately show the packet/queue/return evidence they get back.
          </p>
        </div>
        <strong data-state={relayReady ? "ready" : "blocked"}>{readinessLabel}</strong>
      </header>

      <div className="thinkit-relay__metrics" aria-label="Relay proof metrics">
        <article>
          <span>Round-trip proof</span>
          <strong>{roundTrip}/{targetCount || "?"}</strong>
          <small>{held} held target(s)</small>
        </article>
        <article>
          <span>Thread bridge</span>
          <strong>{bridgeStatus}</strong>
          <small>{queued.length} queued / {blocked.length} blocked</small>
        </article>
        <article>
          <span>Latest return</span>
          <strong>{latestStatus}</strong>
          <small>{humanTargetName(latestTarget)}</small>
        </article>
        <article>
          <span>Action cards</span>
          <strong>{actionables.length}</strong>
          <small>returned decisions available</small>
        </article>
      </div>

      <div className="thinkit-relay__controls" aria-label="Relay buttons">
        <button type="button" disabled={loading || actionPending !== null} onClick={() => void refresh("Manual refresh")}>
          {loading ? "Refreshing" : "Refresh Proof"}
        </button>
        <button
          type="button"
          disabled={actionPending !== null}
          onClick={() => void runAction("Dispatch Startup", "/api/thinkit/swanson/relay/dispatch_startup", { targets: ["Skybro.Betsy", "Petra.Betsy"] })}
        >
          {actionPending === "Dispatch Startup" ? "Sending" : "Dispatch Startup"}
        </button>
        <button
          type="button"
          disabled={actionPending !== null}
          onClick={() => void runAction("Brainboot Aeyes", "/api/thinkit/swanson/action/brainboot_dispatch", { targets: ["Skybro.Betsy", "Petra.Betsy"] })}
        >
          {actionPending === "Brainboot Aeyes" ? "Sending" : "Brainboot Aeyes"}
        </button>
        <button
          type="button"
          disabled={actionPending !== null}
          onClick={() =>
            void runAction("Send Proof Packet", "/api/thinkit/swanson/relay/dispatch", {
              packet_type: "THINKIT_OPERABILITY_PROOF",
              target,
              title: "ThinkIt relay operability proof",
              body: proofBody
            })
          }
        >
          {actionPending === "Send Proof Packet" ? "Sending" : "Send Proof Packet"}
        </button>
        <button
          type="button"
          disabled={actionPending !== null}
          onClick={() =>
            void runAction("Send Next Book Chapter", "/api/thinkit/swanson/book/dispatch_next_chapter", {
              target,
              editing_mode: "developmental_edit",
              strategy: "first_unsent",
              operator_note:
                "Send the next unsent source-truth chapter for editing. Return access gaps, continuity issues, and the recommended next edit."
            })
          }
        >
          {actionPending === "Send Next Book Chapter" ? "Sending" : "Send Next Book Chapter"}
        </button>
        <button
          type="button"
          disabled={actionPending !== null}
          onClick={() => void runAction("Run Chaser Once", "/api/thinkit/swanson/relay/run_chaser", {})}
        >
          {actionPending === "Run Chaser Once" ? "Chasing" : "Run Chaser Once"}
        </button>
      </div>

      <div className="thinkit-relay__operator">
        <label>
          <span>Target for proof/book packet</span>
          <input value={target} onChange={(event) => setTarget(event.target.value)} />
        </label>
        <label>
          <span>Proof packet body</span>
          <textarea rows={3} value={proofBody} onChange={(event) => setProofBody(event.target.value)} />
        </label>
      </div>

      <section className="thinkit-relay__return" aria-label="Latest origin return">
        <header>
          <h3>Latest returned answer on the origin dash</h3>
          <code>{latestPacket}</code>
        </header>
        <div className="thinkit-relay__provenance" aria-label="Where the latest answer came from">
          <article>
            <span>Answered by</span>
            <strong>{latestReceiverTitle}</strong>
            <small>{receiverSurface(latestReceiver)}</small>
          </article>
          <article>
            <span>Where to continue</span>
            <strong>{humanTargetName(latestTarget)}</strong>
            <small>{receiverInstruction(latestReceiver, latestTarget)}</small>
          </article>
          <article>
            <span>Proof ThinkIt read</span>
            <strong>{latestReceiptId}</strong>
            <small>{latestReceiptPath}</small>
          </article>
          <article>
            <span>Original packet</span>
            <strong>{latestPacket}</strong>
            <small>{latestSourcePacketPath}</small>
          </article>
        </div>
        <p>{latestAnswer}</p>
      </section>

      <section className="thinkit-relay__actions" aria-label="Returned work waiting on operator decision">
        <header>
          <h3>Returned work waiting on you</h3>
          <span>{actionables.length} usable return(s)</span>
        </header>
        <div className="thinkit-relay__action-list">
          {actionables.slice(0, 4).map((item, index) => {
            const record = asRecord(item) ?? {};
            const itemTarget = asText(record.target, "UNKNOWN_TARGET");
            const itemPacket = asText(record.packet_id, `RETURN_${index + 1}`);
            const itemReceiver = findReceiver(snapshot.threadBridge, itemTarget);
            return (
              <article key={itemPacket}>
                <header>
                  <div>
                    <strong>{returnedWorkHeadline(record, itemTarget)}</strong>
                    <small>{receiverTitle(snapshot.threadBridge, itemTarget)} / {receiverSurface(itemReceiver)}</small>
                  </div>
                  <span>{humanLabel(record.recommendation, "Review")}</span>
                </header>
                <dl>
                  <div>
                    <dt>What advanced</dt>
                    <dd>{humanizeTargetText(record.advanced, itemTarget, "The receiver returned a terminal proof receipt.")}</dd>
                  </div>
                  <div>
                    <dt>What this helps decide</dt>
                    <dd>{humanizeTargetText(record.helps_decide, itemTarget, "Review whether this return needs a next packet, assimilation, or no action.")}</dd>
                  </div>
                  <div>
                    <dt>Your useful choices</dt>
                    <dd>{asArray(record.operator_choices).map((choice) => humanLabel(choice)).join(" / ") || "Review / Hold"}</dd>
                  </div>
                  <div>
                    <dt>Receipt</dt>
                    <dd>{asText(record.receiver_receipt_id, "NO_RECEIPT_ID")}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
          {actionables.length === 0 ? <p>No returned work is waiting on an operator decision right now.</p> : null}
        </div>
      </section>

      <section className="thinkit-relay__result" aria-label="Last relay action result">
        <header>
          <h3>{lastAction ? lastAction.label : "No button run yet"}</h3>
          <code>{lastAction ? `${lastAction.statusCode} / ${lastAction.endpoint}` : "Click a button to create readback"}</code>
        </header>
        {error ? <p className="thinkit-relay__error">BLOCKER: {error}</p> : null}
        {lastAction ? (
          <dl>
            <div>
              <dt>Status</dt>
              <dd>{lastAction.ok ? "REQUEST_RETURNED" : "REQUEST_BLOCKED"}</dd>
            </div>
            <div>
              <dt>Timestamp</dt>
              <dd>{lastAction.timestamp}</dd>
            </div>
            <div>
              <dt>Packets</dt>
              <dd>{summarizePackets(lastAction.result?.relay_packets ?? lastAction.result?.brainboot_packets ?? lastAction.result?.packets)}</dd>
            </div>
            <div>
              <dt>Proof boundary</dt>
              <dd>Created/queued/sent is not success until receiver and origin-return receipts come back.</dd>
            </div>
          </dl>
        ) : null}
        <pre>{actionSummary}</pre>
      </section>
    </section>
  );
}
