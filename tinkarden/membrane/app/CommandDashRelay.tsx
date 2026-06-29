"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Destination = {
  id: string;
  label: string;
  aeye: string;
  machine: string;
  destination_type: string;
};

type RelayReceipt = {
  packet_id: string;
  receipt_id: string;
  aeye_receipt_id: string | null;
  destination_label: string;
  packet_path: string;
  receipt_path: string;
  aeye_outbox_path: string | null;
  aeye_inbox_path: string | null;
  aeye_receipt_path: string | null;
  packet_hash: string;
  receiver_read_hash: string;
  aeye_payload_command_hash: string;
  receiver_hash_match: boolean;
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
    answer_text: string;
    proof_chain: {
      new_chat_created: boolean;
      new_query_sent: boolean;
      packet_left: boolean;
      packet_received_by_aeye_thread: boolean;
      answer_returned: boolean;
      answer_received_by_origin: boolean;
    };
    missing_proof: string[];
  } | null;
};

function text(value: string | null | undefined, fallback = "UNKNOWN") {
  return value && value.trim() ? value : fallback;
}

function proofTone(done: boolean, blocked = false) {
  if (blocked) return "border-red-300/50 bg-red-300/10 text-red-100";
  if (done) return "border-emerald-300/50 bg-emerald-300/10 text-emerald-100";
  return "border-zinc-800 bg-neutral-950 text-zinc-400";
}

export default function CommandDashRelay() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destinationId, setDestinationId] = useState("");
  const [command, setCommand] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("Loading verified Aeye destinations...");
  const [receipt, setReceipt] = useState<RelayReceipt | null>(null);
  const [realRelay, setRealRelay] = useState<RealAeyeRelay | null>(null);

  useEffect(() => {
    let live = true;

    async function loadDestinations() {
      try {
        const response = await fetch("/api/command-dash", { cache: "no-store" });
        const result = (await response.json()) as { ok?: boolean; destinations?: Destination[]; error?: string };
        if (!response.ok || !result.ok || !Array.isArray(result.destinations)) {
          throw new Error(result.error || "DESTINATION_DIRECTORY_UNAVAILABLE");
        }
        if (!live) return;
        setDestinations(result.destinations);
        setDestinationId(result.destinations[0]?.id ?? "");
        setStatus(result.destinations.length > 0 ? "Verified destinations loaded." : "BLOCKER: no verified destinations.");
      } catch (error) {
        if (!live) return;
        setStatus(`BLOCKER: ${error instanceof Error ? error.message : "destination load failed"}`);
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

  useEffect(() => {
    let live = true;

    async function loadLatestRealRelayProof() {
      try {
        const response = await fetch("/api/real-aeye-relay", { cache: "no-store" });
        const result = (await response.json()) as { ok?: boolean; relays?: RealAeyeRelay[] };
        const latest = Array.isArray(result.relays) ? result.relays[0] : null;
        if (live && response.ok && result.ok && latest) {
          setRealRelay(latest);
        }
      } catch {
        // Keep the normal empty state; proof remains available from the relay receipt API.
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
        const response = await fetch(`/api/real-aeye-relay?relay_id=${encodeURIComponent(realRelay.relay_id)}`, {
          cache: "no-store"
        });
        const result = (await response.json()) as ({ ok?: boolean; error?: string } & RealAeyeRelay) | null;
        if (!live || !response.ok || !result?.ok) return;
        setRealRelay(result);
      } catch {
        // The bridge request remains visible on disk and can still be serviced by the Codex thread bridge.
      }
    };

    void refresh();
    const interval = window.setInterval(refresh, 2500);
    return () => {
      live = false;
      window.clearInterval(interval);
    };
  }, [realRelay?.relay_id, realRelay?.status]);

  async function submitRelay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = command.trim();

    if (!trimmed) {
      setStatus("BLOCKER: command text is required.");
      setReceipt(null);
      setRealRelay(null);
      return;
    }

    if (!selectedDestination) {
      setStatus("BLOCKER: choose a verified Aeye@Machine destination.");
      setReceipt(null);
      setRealRelay(null);
      return;
    }

    setPending(true);
    setStatus("Writing packet, relaying to Aeye inbox, and queueing real Aeye-thread bridge...");
    setReceipt(null);
    setRealRelay(null);

    try {
      const response = await fetch("/api/command-dash", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          command: trimmed,
          destination_id: selectedDestination.id,
          source_surface: "FeralMembrane@Betsy",
          stream: "FERAL / COMMAND DASH",
          command_type: "MEMBRANE_COMMAND"
        })
      });
      const result = (await response.json()) as { ok?: boolean; error?: string } & RelayReceipt;
      if (!response.ok || !result.ok) throw new Error(result.error || "COMMAND_DASH_RELAY_FAILED");

      setReceipt(result);
      const relayResponse = await fetch("/api/real-aeye-relay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          command: trimmed,
          destination_id: selectedDestination.id,
          destination_label: selectedDestination.label,
          source_surface: "FeralMembrane@Betsy",
          stream: "FERAL / COMMAND DASH",
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
      setStatus(
        `${result.status}: ${selectedDestination.label} custody wrote packet ${result.packet_id} and receipt ${result.receipt_id}; real Aeye bridge ${relayResponse.ok && relayResult.ok ? relayResult.status : "BLOCKER"}.`
      );
    } catch (error) {
      setStatus(`BLOCKER: ${error instanceof Error ? error.message : "relay failed"}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-4 mt-4 border border-teal-400/30 bg-neutral-900 p-4" aria-label="Command Dash Aeye Relay">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-teal-300">Command Dash / Aeye Relay</p>
          <h2 className="mt-1 text-xl font-black text-zinc-50">Command relay with visible custody and return proof.</h2>
          <p className="mt-2 max-w-3xl text-xs font-bold leading-5 text-zinc-400">
            This is the merged command lane: choose a verified Aeye@Machine destination, write the command packet,
            show the local custody receipt, then watch for the real-thread/origin-return proof. Current verified
            destinations are Betsy-local custody lanes; an ACK here does not claim independent remote execution.
          </p>
        </div>
        <span className="border border-teal-400/30 bg-teal-400/10 px-2 py-1 text-[0.68rem] font-black uppercase text-teal-100">
          {destinations.length || 0} verified / no free-text routing
        </span>
      </div>

      <form className="mt-4 grid gap-3 lg:grid-cols-[1fr_260px_auto]" onSubmit={submitRelay}>
        <label className="grid gap-2 text-xs font-black uppercase text-teal-200">
          Operator command
          <textarea
            className="min-h-28 resize-y border border-zinc-700 bg-neutral-950 p-3 text-sm normal-case text-zinc-100 outline-none focus:border-teal-300"
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="Write the command. The relay writes /tinkerden/inbox, /foreman/messages/inbox, and linked receipts."
          />
        </label>
        <label className="grid gap-2 text-xs font-black uppercase text-teal-200">
          Aeye@Machine
          <select
            className="min-h-12 border border-zinc-700 bg-neutral-950 px-3 text-sm normal-case text-zinc-100 outline-none focus:border-teal-300"
            value={destinationId}
            onChange={(event) => setDestinationId(event.target.value)}
          >
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
        <button
          className="min-h-12 self-end border border-teal-300 bg-teal-300 px-4 text-xs font-black uppercase text-neutral-950 disabled:cursor-progress disabled:opacity-60"
          type="submit"
          disabled={pending || !selectedDestination}
        >
          {pending ? "Relaying" : "Relay"}
        </button>
      </form>

      <div className="mt-3 grid gap-2 border border-zinc-800 bg-neutral-950 p-3 text-xs font-bold leading-5 text-zinc-300 md:grid-cols-[1fr_1fr]">
        <p>
          Selected destination:{" "}
          <strong className="text-teal-100">{selectedDestination ? selectedDestination.label : "none yet"}</strong>
        </p>
        <p>
          Boundary: verified filesystem custody on Betsy. Cross-machine or model execution must produce separate proof.
        </p>
      </div>

      <p className="mt-3 border border-zinc-800 bg-neutral-950 p-3 text-sm font-bold text-zinc-300">{status}</p>

      <div className="mt-3 grid gap-2 md:grid-cols-4" aria-label="Command proof chain">
        <section className={`border p-3 ${proofTone(Boolean(selectedDestination))}`}>
          <p className="text-[0.65rem] font-black uppercase opacity-75">1 / Destination</p>
          <p className="mt-1 text-xs font-black">{selectedDestination?.label || "Choose Aeye@Machine"}</p>
        </section>
        <section className={`border p-3 ${proofTone(Boolean(receipt?.receiver_hash_match), Boolean(receipt && !receipt.receiver_hash_match))}`}>
          <p className="text-[0.65rem] font-black uppercase opacity-75">2 / Local custody</p>
          <p className="mt-1 break-all text-xs font-black">{receipt ? `${receipt.status} / ${receipt.receipt_id}` : "Waiting for command"}</p>
        </section>
        <section className={`border p-3 ${proofTone(Boolean(realRelay && realRelay.status !== "BLOCKER"), realRelay?.status === "BLOCKER")}`}>
          <p className="text-[0.65rem] font-black uppercase opacity-75">3 / Real-thread bridge</p>
          <p className="mt-1 break-all text-xs font-black">{realRelay ? realRelay.status : "Not requested yet"}</p>
        </section>
        <section className={`border p-3 ${proofTone(Boolean(realRelay?.receipt?.proof_chain.answer_received_by_origin), Boolean(realRelay?.receipt?.missing_proof.length))}`}>
          <p className="text-[0.65rem] font-black uppercase opacity-75">4 / Origin return</p>
          <p className="mt-1 break-all text-xs font-black">
            {realRelay?.receipt?.proof_chain.answer_received_by_origin ? "ANSWER_RETURNED" : "Waiting for return proof"}
          </p>
        </section>
      </div>

      {receipt ? (
        <dl className="mt-3 grid gap-2 border border-teal-400/30 bg-neutral-950 p-3 text-xs md:grid-cols-2">
          <div>
            <dt className="font-black uppercase text-zinc-500">Command receipt</dt>
            <dd className="break-all font-mono text-teal-100">{receipt.receipt_id}</dd>
          </div>
          <div>
            <dt className="font-black uppercase text-zinc-500">Aeye receipt</dt>
            <dd className="break-all font-mono text-teal-100">{text(receipt.aeye_receipt_id)}</dd>
          </div>
          <div>
            <dt className="font-black uppercase text-zinc-500">Packet path</dt>
            <dd className="break-all font-mono text-zinc-300">{receipt.packet_path}</dd>
          </div>
          <div>
            <dt className="font-black uppercase text-zinc-500">Aeye inbox</dt>
            <dd className="break-all font-mono text-zinc-300">{text(receipt.aeye_inbox_path)}</dd>
          </div>
          <div>
            <dt className="font-black uppercase text-zinc-500">Hash proof</dt>
            <dd className="break-all font-mono text-zinc-300">
              {receipt.receiver_hash_match ? "MATCH" : "FAILED"} / {receipt.aeye_payload_command_hash}
            </dd>
          </div>
          <div>
            <dt className="font-black uppercase text-zinc-500">Custody links</dt>
            <dd className="font-mono text-zinc-300">
              inbox {receipt.aeye_inbox_packet_match ? "YES" : "NO"} / receipt {receipt.aeye_receipt_packet_match ? "YES" : "NO"}
            </dd>
          </div>
          <div className="md:col-span-2">
            <dt className="font-black uppercase text-zinc-500">Missing proof</dt>
            <dd className="break-all font-mono text-zinc-300">{text(receipt.missing_receiver_proof, "NONE")}</dd>
          </div>
        </dl>
      ) : null}

      {realRelay ? (
        <dl className="mt-3 grid gap-2 border border-amber-300/40 bg-neutral-950 p-3 text-xs md:grid-cols-2">
          <div>
            <dt className="font-black uppercase text-zinc-500">Real relay status</dt>
            <dd className="break-all font-mono text-amber-100">{realRelay.status}</dd>
          </div>
          <div>
            <dt className="font-black uppercase text-zinc-500">Real relay id</dt>
            <dd className="break-all font-mono text-amber-100">{realRelay.relay_id}</dd>
          </div>
          <div>
            <dt className="font-black uppercase text-zinc-500">Thread id</dt>
            <dd className="break-all font-mono text-zinc-300">{text(realRelay.receipt?.thread_id, "WAITING_FOR_CODEX_THREAD_BRIDGE")}</dd>
          </div>
          <div>
            <dt className="font-black uppercase text-zinc-500">Answer received</dt>
            <dd className="font-mono text-zinc-300">{realRelay.receipt?.proof_chain.answer_received_by_origin ? "YES" : "NO"}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="font-black uppercase text-zinc-500">Request path</dt>
            <dd className="break-all font-mono text-zinc-300">{realRelay.request_path}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="font-black uppercase text-zinc-500">Aeye answer</dt>
            <dd className="whitespace-pre-wrap break-words font-mono text-zinc-300">
              {text(realRelay.receipt?.answer_text, "No real Aeye-thread answer has returned yet.")}
            </dd>
          </div>
          <div className="md:col-span-2">
            <dt className="font-black uppercase text-zinc-500">Missing real-thread proof</dt>
            <dd className="break-all font-mono text-zinc-300">
              {realRelay.receipt?.missing_proof.length ? realRelay.receipt.missing_proof.join(" / ") : "NONE"}
            </dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
