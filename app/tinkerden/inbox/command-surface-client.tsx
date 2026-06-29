"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Destination = {
  id: string;
  label: string;
  aeye: string;
  machine: string;
  destination_type: string;
};

type CommandReceipt = {
  packet_id: string;
  receipt_id: string;
  destination_label?: string;
  aeye_packet_id: string | null;
  aeye_receipt_id: string | null;
  packet_path: string;
  receipt_path: string;
  aeye_outbox_path: string | null;
  aeye_inbox_path: string | null;
  aeye_receipt_path: string | null;
  packet_hash: string;
  receiver_read_hash: string;
  receiver_hash_match: boolean;
  status: "ACK" | "BLOCKER" | "ARTIFACT";
  aeye_relay_status: string;
  missing_receiver_proof: string | null;
};

function text(value: string | null | undefined, fallback = "UNKNOWN") {
  return value && value.trim() ? value : fallback;
}

export function CommandSurfaceClient() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destinationId, setDestinationId] = useState("");
  const [command, setCommand] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [loadStatus, setLoadStatus] = useState("Loading verified destinations...");

  useEffect(() => {
    let live = true;

    async function loadDestinations() {
      try {
        const response = await fetch("/api/tinkerden/command-surface", { cache: "no-store" });
        const result = (await response.json()) as { ok?: boolean; destinations?: Destination[]; error?: string };
        if (!response.ok || !result.ok || !Array.isArray(result.destinations)) {
          throw new Error(result.error || "DESTINATION_DIRECTORY_UNAVAILABLE");
        }
        if (!live) return;
        setDestinations(result.destinations);
        setDestinationId(result.destinations[0]?.id ?? "");
        setLoadStatus(result.destinations.length ? "Verified destinations loaded." : "BLOCKER: no verified destinations.");
      } catch (loadError) {
        if (!live) return;
        setLoadStatus(`BLOCKER: ${loadError instanceof Error ? loadError.message : "destination load failed"}`);
      }
    }

    void loadDestinations();
    return () => {
      live = false;
    };
  }, []);

  const selectedDestination = useMemo(
    () => destinations.find((destination) => destination.id === destinationId) ?? null,
    [destinationId, destinations]
  );

  async function submitCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = command.trim();

    if (!trimmed) {
      setError("BLOCKER: command text is required.");
      setReceipt(null);
      return;
    }

    if (!selectedDestination) {
      setError("BLOCKER: choose a verified Aeye@Machine destination.");
      setReceipt(null);
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/tinkerden/command-surface", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: trimmed, destination_id: selectedDestination.id })
      });
      const result = (await response.json()) as { ok?: boolean; error?: string } & CommandReceipt;

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "COMMAND_SURFACE_FAILED");
      }

      setReceipt(result);
      setCommand("");
    } catch (submitError) {
      setReceipt(null);
      setError(submitError instanceof Error ? `BLOCKER: ${submitError.message}` : "BLOCKER: command failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="td-command-console" aria-label="TinkerDen command surface">
      <header>
        <div>
          <p className="td-bridge__eyebrow">Command Surface</p>
          <h3>Issue command. Wait for ACK / BLOCKER / ARTIFACT.</h3>
        </div>
        <strong>Betsy receiver hash proof</strong>
      </header>

      <form className="td-command-console__form" onSubmit={submitCommand}>
        <label>
          <span>Operator command</span>
          <textarea
            name="command"
            rows={4}
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="Write the command here. The UI writes a file-backed packet and displays the returned receipt."
          />
        </label>
        <label>
          <span>Aeye@Machine</span>
          <select value={destinationId} onChange={(event) => setDestinationId(event.target.value)}>
            {destinations.length === 0 ? (
              <option value="">No verified destinations</option>
            ) : (
              destinations.map((destination) => (
                <option key={destination.id} value={destination.id}>
                  {destination.label}
                </option>
              ))
            )}
          </select>
        </label>
        <button type="submit" disabled={pending || !selectedDestination}>
          {pending ? "WAITING" : "ISSUE COMMAND"}
        </button>
      </form>

      <p className="td-command-console__status" data-kind={error ? "error" : receipt ? "ok" : pending ? "pending" : "idle"}>
        {error ||
          (receipt
            ? `${receipt.status}: packet ${receipt.packet_id} relayed to ${text(receipt.destination_label, selectedDestination?.label || "Aeye")} and returned receipt ${receipt.receipt_id}.`
            : pending
              ? "Writing packet, relaying to Aeye inbox, and waiting for receipt..."
              : `No command issued from this surface yet. ${loadStatus}`)}
      </p>

      <div className="td-command-console__surfaces" aria-label="Required file-backed surfaces">
        <code>/tinkerden/inbox</code>
        <code>/tinkerden/receipts</code>
        <code>/tinkerden/recommendations/recommendation_cards.json</code>
        <code>/tinkerden/feedback/decision-ledger.jsonl</code>
      </div>

      <div className="td-command-console__receipt-panel">
        {receipt ? (
          <article className="td-command-console__receipt">
            <header>
              <strong>{receipt.status}</strong>
              <code>{receipt.receipt_id}</code>
            </header>
            <dl>
              <div>
                <dt>Packet</dt>
                <dd>{receipt.packet_id}</dd>
              </div>
              <div>
                <dt>Packet path</dt>
                <dd>{receipt.packet_path}</dd>
              </div>
              <div>
                <dt>Receipt path</dt>
                <dd>{receipt.receipt_path}</dd>
              </div>
              <div>
                <dt>Aeye relay status</dt>
                <dd>{text(receipt.aeye_relay_status)}</dd>
              </div>
              <div>
                <dt>Aeye packet</dt>
                <dd>{text(receipt.aeye_packet_id)}</dd>
              </div>
              <div>
                <dt>Aeye receipt</dt>
                <dd>{text(receipt.aeye_receipt_id)}</dd>
              </div>
              <div>
                <dt>Aeye outbox</dt>
                <dd>{text(receipt.aeye_outbox_path)}</dd>
              </div>
              <div>
                <dt>Aeye inbox</dt>
                <dd>{text(receipt.aeye_inbox_path)}</dd>
              </div>
              <div>
                <dt>Aeye receipt path</dt>
                <dd>{text(receipt.aeye_receipt_path)}</dd>
              </div>
              <div>
                <dt>Packet hash</dt>
                <dd>{receipt.packet_hash}</dd>
              </div>
              <div>
                <dt>Receiver read hash</dt>
                <dd>{receipt.receiver_read_hash}</dd>
              </div>
              <div>
                <dt>Hash match</dt>
                <dd>{receipt.receiver_hash_match ? "YES" : "NO"}</dd>
              </div>
              <div>
                <dt>Missing receiver proof</dt>
                <dd>{text(receipt.missing_receiver_proof, "NONE")}</dd>
              </div>
            </dl>
          </article>
        ) : (
          <p>Receipt will appear here after receiver hash proof.</p>
        )}
      </div>
    </section>
  );
}

