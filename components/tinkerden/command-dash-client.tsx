"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

export type CommandDashDestination = {
  id: string;
  label: string;
  aeye: string;
  machine: string;
  destination_type: string;
  internal_destination: string;
};

export type CommandDashQuickCommand = {
  label: string;
  command: string;
  destination_id?: string;
  relay?: boolean;
};

type CommandReceipt = {
  packet_id: string;
  receipt_id: string;
  aeye_packet_id: string | null;
  aeye_receipt_id: string | null;
  destination_label: string;
  packet_path: string;
  receipt_path: string;
  aeye_outbox_path: string | null;
  aeye_inbox_path: string | null;
  aeye_receipt_path: string | null;
  packet_hash: string;
  receiver_read_hash: string;
  receiver_hash_match: boolean;
  aeye_payload_command_hash: string;
  aeye_inbox_packet_match: boolean;
  aeye_receipt_packet_match: boolean;
  aeye_relay_status: string;
  status: "ACK" | "BLOCKER" | "ARTIFACT";
  missing_receiver_proof: string | null;
};

type RealAeyeRelay = {
  relay_id: string;
  status: "WAITING_FOR_CODEX_THREAD_BRIDGE" | "ARTIFACT" | "BLOCKER";
  request_path: string;
  response_path: string;
  receipt_path: string;
  receipt?: {
    receipt_id: string;
    thread_id: string | null;
    prompt_sent: string;
    answer_text: string;
    proof_chain: {
      new_chat_created: boolean;
      new_query_sent: boolean;
      packet_left: boolean;
      packet_received_by_aeye_thread: boolean;
      answer_returned: boolean;
      answer_received_by_origin: boolean;
    };
    origin_return?: {
      origin_surface: string;
      origin_return_path: string;
      status: string;
      answer_sha256: string;
      readback_sha256: string;
      readback_match: boolean;
      returned_at: string;
      readback_at: string;
    } | null;
    missing_proof: string[];
  } | null;
};

type CommandDashClientProps = {
  destinations: CommandDashDestination[];
  sourceSurface: string;
  stream?: string;
  commandType?: string;
  title?: string;
  eyebrow?: string;
  badge?: string;
  submitLabel?: string;
  idleText?: string;
  initialCommand?: string;
  quickCommands?: CommandDashQuickCommand[];
};

function text(value: string | null | undefined, fallback = "UNKNOWN") {
  return value && value.trim() ? value : fallback;
}

export default function CommandDashClient({
  destinations,
  sourceSurface,
  stream = "FERAL / TINKERDEN",
  commandType = "COMMAND",
  title = "Issue command. Wait for ACK / BLOCKER / ARTIFACT.",
  eyebrow = "Command Dash",
  badge = "verified Aeye relay",
  submitLabel = "RELAY TO AEYE",
  idleText = "No command issued from this surface yet.",
  initialCommand = "",
  quickCommands = []
}: CommandDashClientProps) {
  const defaultDestination = destinations[0]?.id ?? "";
  const [command, setCommand] = useState(initialCommand);
  const [destinationId, setDestinationId] = useState(defaultDestination);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [realRelay, setRealRelay] = useState<RealAeyeRelay | null>(null);

  const selectedDestination = useMemo(
    () => destinations.find((destination) => destination.id === destinationId) ?? destinations[0] ?? null,
    [destinationId, destinations]
  );

  useEffect(() => {
    let live = true;

    async function loadLatestRealRelayProof() {
      try {
        const response = await fetch("/api/tinkerden/real-aeye-relay", { cache: "no-store" });
        const result = (await response.json()) as { ok?: boolean; relays?: RealAeyeRelay[] };
        const latest = Array.isArray(result.relays) ? result.relays[0] : null;
        if (live && response.ok && result.ok && latest) {
          setRealRelay(latest);
        }
      } catch {
        // Keep the normal empty state; proof remains available from the receipt path and API.
      }
    }

    void loadLatestRealRelayProof();
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!realRelay?.relay_id || realRelay.status !== "WAITING_FOR_CODEX_THREAD_BRIDGE") return;

    let live = true;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/tinkerden/real-aeye-relay?relay_id=${encodeURIComponent(realRelay.relay_id)}`, {
          cache: "no-store"
        });
        const result = (await response.json()) as ({ ok?: boolean; error?: string } & RealAeyeRelay) | null;
        if (!live || !response.ok || !result?.ok) return;
        setRealRelay(result);
      } catch {
        // Keep the visible WAITING status. The local relay request remains on disk for the bridge worker.
      }
    };

    void refresh();
    const interval = window.setInterval(refresh, 2500);
    return () => {
      live = false;
      window.clearInterval(interval);
    };
  }, [realRelay?.relay_id, realRelay?.status]);

  async function relayCommand(nextCommand: string, nextDestinationId: string) {
    const trimmed = nextCommand.trim();
    const targetDestination = destinations.find((destination) => destination.id === nextDestinationId) ?? null;

    if (!trimmed) {
      setError("BLOCKER: command text is required.");
      setReceipt(null);
      setRealRelay(null);
      return;
    }

    if (!targetDestination) {
      setError("BLOCKER: no verified Aeye@Machine destination is available.");
      setReceipt(null);
      setRealRelay(null);
      return;
    }

    setPending(true);
    setError(null);
    setRealRelay(null);

    try {
      const response = await fetch("/api/tinkerden/command-surface", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: trimmed,
          destination_id: targetDestination.id,
          source_surface: sourceSurface,
          stream,
          command_type: commandType
        })
      });
      const result = (await response.json()) as { ok?: boolean; error?: string } & CommandReceipt;

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "COMMAND_SURFACE_FAILED");
      }

      setReceipt(result);

      const relayResponse = await fetch("/api/tinkerden/real-aeye-relay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: trimmed,
          destination_id: targetDestination.id,
          destination_label: targetDestination.label,
          source_surface: sourceSurface,
          stream,
          command_packet_id: result.packet_id,
          command_receipt_id: result.receipt_id,
          aeye_receipt_id: result.aeye_receipt_id,
          packet_path: result.packet_path,
          receipt_path: result.receipt_path
        })
      });
      const relayResult = (await relayResponse.json()) as { ok?: boolean; error?: string } & RealAeyeRelay;
      if (relayResponse.ok && relayResult.ok) {
        setRealRelay(relayResult);
      } else {
        setRealRelay({
          relay_id: "REAL_RELAY_BLOCKED",
          status: "BLOCKER",
          request_path: "NOT_WRITTEN",
          response_path: "NOT_WRITTEN",
          receipt_path: "NOT_WRITTEN",
          receipt: {
            receipt_id: "REAL_RELAY_BLOCKER",
            thread_id: null,
            prompt_sent: "",
            answer_text: relayResult.error || "REAL_AEYE_RELAY_REQUEST_FAILED",
            proof_chain: {
              new_chat_created: false,
              new_query_sent: false,
              packet_left: false,
              packet_received_by_aeye_thread: false,
              answer_returned: false,
              answer_received_by_origin: false
            },
            missing_proof: [relayResult.error || "REAL_AEYE_RELAY_REQUEST_FAILED"]
          }
        });
      }
      setCommand("");
    } catch (submitError) {
      setReceipt(null);
      setRealRelay(null);
      setError(submitError instanceof Error ? `BLOCKER: ${submitError.message}` : "BLOCKER: command failed.");
    } finally {
      setPending(false);
    }
  }

  async function loadQuickCommand(next: CommandDashQuickCommand) {
    const nextDestinationId =
      next.destination_id && destinations.some((destination) => destination.id === next.destination_id)
        ? next.destination_id
        : destinationId;
    setCommand(next.command);
    setDestinationId(nextDestinationId);
    setError(null);
    if (next.relay) {
      await relayCommand(next.command, nextDestinationId);
    }
  }

  async function submitCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await relayCommand(command, selectedDestination?.id ?? "");
  }

  return (
    <section className="td-command-console" aria-label={`${sourceSurface} command dash`}>
      <header>
        <div>
          <p className="td-bridge__eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
        <strong>{badge}</strong>
      </header>

      {quickCommands.length > 0 ? (
        <div className="td-command-console__quick-actions" aria-label="Load queued commands">
          {quickCommands.map((quick) => (
            <button key={quick.label} type="button" disabled={pending} onClick={() => void loadQuickCommand(quick)}>
              {quick.label}
            </button>
          ))}
        </div>
      ) : null}

      <form className="td-command-console__form" onSubmit={submitCommand}>
        <label>
          <span>Operator command</span>
          <textarea
            name="command"
            rows={4}
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="Write the command here. The UI writes a file-backed packet, relays it to the verified Aeye inbox, and displays the returned receipt."
          />
        </label>
        <label>
          <span>Aeye@Machine destination</span>
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
          {pending ? "WAITING" : submitLabel}
        </button>
      </form>

      <p className="td-command-console__status" data-kind={error ? "error" : receipt ? "ok" : pending ? "pending" : "idle"}>
        {error ||
          (receipt
            ? `${receipt.status}: local custody packet ${receipt.packet_id}; Aeye receipt ${text(receipt.aeye_receipt_id)}; real thread bridge ${
                realRelay?.status ?? "REQUEST_NOT_WRITTEN"
              }.`
            : pending
              ? "Writing local packet, queueing real Aeye-thread bridge request, and waiting for receipts..."
              : idleText)}
      </p>

      <div className="td-command-console__surfaces" aria-label="Relay file-backed surfaces">
        <code>/tinkerden/inbox</code>
        <code>/tinkerden/receipts</code>
        <code>/foreman/messages/outbox</code>
        <code>/foreman/messages/inbox</code>
        <code>/foreman/messages/receipts</code>
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
                <dt>Aeye receipt</dt>
                <dd>{text(receipt.aeye_receipt_id)}</dd>
              </div>
              <div>
                <dt>Command packet path</dt>
                <dd>{receipt.packet_path}</dd>
              </div>
              <div>
                <dt>Command receipt path</dt>
                <dd>{receipt.receipt_path}</dd>
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
                <dt>Aeye relay status</dt>
                <dd>{receipt.aeye_relay_status}</dd>
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
                <dt>Aeye payload command hash</dt>
                <dd>{receipt.aeye_payload_command_hash}</dd>
              </div>
              <div>
                <dt>Aeye inbox packet link</dt>
                <dd>{receipt.aeye_inbox_packet_match ? "YES" : "NO"}</dd>
              </div>
              <div>
                <dt>Aeye receipt packet link</dt>
                <dd>{receipt.aeye_receipt_packet_match ? "YES" : "NO"}</dd>
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
          <p>Receipt will appear here after the verified Aeye relay returns.</p>
        )}
      </div>

      <div className="td-command-console__receipt-panel" aria-label="Real Aeye thread relay proof">
        {realRelay ? (
          <article className="td-command-console__receipt">
            <header>
              <strong>{realRelay.status}</strong>
              <code>{realRelay.relay_id}</code>
            </header>
            <dl>
              <div>
                <dt>Real relay request</dt>
                <dd>{realRelay.request_path}</dd>
              </div>
              <div>
                <dt>Real relay receipt</dt>
                <dd>{realRelay.receipt_path}</dd>
              </div>
              <div>
                <dt>Thread id</dt>
                <dd>{text(realRelay.receipt?.thread_id, "WAITING_FOR_CODEX_THREAD_BRIDGE")}</dd>
              </div>
              <div>
                <dt>Answer received</dt>
                <dd>{realRelay.receipt?.proof_chain.answer_received_by_origin ? "YES" : "NO"}</dd>
              </div>
              <div>
                <dt>Origin return path</dt>
                <dd>{text(realRelay.receipt?.origin_return?.origin_return_path, "NO_ORIGIN_RETURN")}</dd>
              </div>
              <div>
                <dt>Origin readback hash</dt>
                <dd>{text(realRelay.receipt?.origin_return?.readback_sha256, "NO_READBACK")}</dd>
              </div>
              <div>
                <dt>Packet received by Aeye thread</dt>
                <dd>{realRelay.receipt?.proof_chain.packet_received_by_aeye_thread ? "YES" : "NO"}</dd>
              </div>
              <div>
                <dt>Missing real-thread proof</dt>
                <dd>{realRelay.receipt?.missing_proof.length ? realRelay.receipt.missing_proof.join(" / ") : "NONE"}</dd>
              </div>
              <div className="td-command-console__receipt-wide">
                <dt>Aeye answer</dt>
                <dd>{text(realRelay.receipt?.answer_text, "No real Aeye-thread answer has returned yet.")}</dd>
              </div>
            </dl>
          </article>
        ) : (
          <p>Real Aeye-thread bridge proof will appear here after the command is queued.</p>
        )}
      </div>
    </section>
  );
}
