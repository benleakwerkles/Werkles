"use client";

import { useEffect, useMemo, useState } from "react";

export type OptionalMoveCard = {
  id?: string;
  card_id?: string;
  title?: string;
  move?: string;
  why?: string;
  why_now?: string;
  target_aeye?: string;
  target?: string;
  risk_class?: string;
  recommendation?: string;
};

type OptionalPacketReceipt = {
  card_id?: string;
  packet_id: string;
  status: string;
  awaiting?: string;
  packet_path: string;
  event_path: string;
  relay_status?: string;
  success_message?: string;
};

type OptionalPacketResponse = {
  ok?: boolean;
  error?: string;
  duplicate_ignored?: boolean;
  optional_packet?: OptionalPacketReceipt;
  optional_packets?: OptionalPacketReceipt[];
};

type OperatorSelection = "KEEP" | "KILL" | "STEAL" | "MERGE";

type SwansonRelayReceipt = {
  relay_id: string;
  packet_id: string;
  receipt_id: string;
  source_optional_packet_id: string;
  relay_status: string;
  operator_selection: OperatorSelection;
  packet_path: string;
  receipt_path: string;
  clipboard_set?: boolean;
  clipboard_verified?: boolean;
  operator_instruction?: string;
};

type SwansonRelayResponse = {
  ok?: boolean;
  error?: string;
  duplicate_ignored?: boolean;
  relay?: SwansonRelayReceipt;
  relays?: SwansonRelayReceipt[];
};

type TopThreeOptionalPacketsProps = {
  cards: OptionalMoveCard[];
  sourcePath: string;
};

function cardId(card: OptionalMoveCard, index: number) {
  return card.id || card.card_id || `top3_${index + 1}`;
}

function cardTitle(card: OptionalMoveCard) {
  return card.title || card.move || "Untitled optional packet";
}

function cardWhy(card: OptionalMoveCard) {
  return card.why || card.why_now || "No Petra/Skybro food attached.";
}

function cardTarget(card: OptionalMoveCard) {
  return card.target_aeye || card.target || "Operator chooses target after packet creation";
}

function riskTone(value?: string) {
  const risk = (value || "").toUpperCase();
  if (risk === "GNAT") return "text-teal-200 border-teal-400/40 bg-teal-400/10";
  if (risk === "MOSQUITO") return "text-cyan-100 border-teal-400/30 bg-teal-400/10";
  if (risk === "WOUND") return "text-zinc-100 border-zinc-500 bg-zinc-800";
  if (risk === "FRACTURE") return "text-zinc-950 border-teal-200 bg-teal-200";
  return "text-zinc-300 border-zinc-700 bg-zinc-900";
}

export default function TopThreeOptionalPackets({ cards, sourcePath }: TopThreeOptionalPacketsProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [relayPendingId, setRelayPendingId] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<Record<string, OptionalPacketReceipt>>({});
  const [swansonRelays, setSwansonRelays] = useState<Record<string, SwansonRelayReceipt>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [relayErrors, setRelayErrors] = useState<Record<string, string>>({});
  const [relayMessages, setRelayMessages] = useState<Record<string, string>>({});
  const [operatorSelections, setOperatorSelections] = useState<Record<string, OperatorSelection>>({});
  const cardIds = useMemo(() => cards.map(cardId).join("|"), [cards]);

  useEffect(() => {
    let cancelled = false;

    async function loadExistingPackets() {
      try {
        const response = await fetch("/api/top-three/optional-packet", { cache: "no-store" });
        const result = (await response.json()) as OptionalPacketResponse;
        if (!response.ok || !result.ok || !Array.isArray(result.optional_packets)) return;
        if (cancelled) return;

        const nextReceipts: Record<string, OptionalPacketReceipt> = {};
        const nextMessages: Record<string, string> = {};
        for (const packet of result.optional_packets) {
          if (!packet.card_id) continue;
          nextReceipts[packet.card_id] = packet;
          nextMessages[packet.card_id] =
            packet.success_message || `Relay success: optional packet queued for ${packet.awaiting || "MOMENTUM_TAP"}.`;
        }
        setReceipts(nextReceipts);
        setRelayMessages(nextMessages);
      } catch {
        // Existing packet hydration is helpful, but the create buttons still work without it.
      }
    }

    void loadExistingPackets();

    return () => {
      cancelled = true;
    };
  }, [cardIds]);

  useEffect(() => {
    let cancelled = false;

    async function loadExistingSwansonRelays() {
      try {
        const response = await fetch("/api/swanson/functional-relay", { cache: "no-store" });
        const result = (await response.json()) as SwansonRelayResponse;
        if (!response.ok || !result.ok || !Array.isArray(result.relays)) return;
        if (cancelled) return;

        const nextRelays: Record<string, SwansonRelayReceipt> = {};
        for (const relay of result.relays) {
          if (!relay.source_optional_packet_id) continue;
          nextRelays[relay.source_optional_packet_id] = relay;
        }
        setSwansonRelays(nextRelays);
      } catch {
        // The Swanson relay button can still create a relay if history hydration fails.
      }
    }

    void loadExistingSwansonRelays();

    return () => {
      cancelled = true;
    };
  }, [cardIds]);

  async function createOptionalPacket(card: OptionalMoveCard, index: number): Promise<OptionalPacketReceipt | null> {
    const id = cardId(card, index);
    setPendingId(id);
    setErrors((current) => ({ ...current, [id]: "" }));
    setRelayMessages((current) => ({ ...current, [id]: "Relaying optional packet..." }));

    try {
      const response = await fetch("/api/top-three/optional-packet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          card,
          source_path: sourcePath,
          food_sources: ["Petra", "Skybro"]
        })
      });
      const result = (await response.json()) as OptionalPacketResponse;
      if (!response.ok || !result.ok || !result.optional_packet) {
        throw new Error(result.error || "OPTIONAL_PACKET_FAILED");
      }
      setReceipts((current) => ({ ...current, [id]: result.optional_packet as OptionalPacketReceipt }));
      setRelayMessages((current) => ({
        ...current,
        [id]:
          result.optional_packet?.success_message ||
          (result.duplicate_ignored
            ? "Relay success: existing optional packet is already queued."
            : "Relay success: optional packet queued on the conveyor.")
      }));
      return result.optional_packet;
    } catch (error) {
      setErrors((current) => ({
        ...current,
        [id]: error instanceof Error ? error.message : "OPTIONAL_PACKET_FAILED"
      }));
      setRelayMessages((current) => ({ ...current, [id]: "" }));
      return null;
    } finally {
      setPendingId(null);
    }
  }

  async function swansonPacketRelay(card: OptionalMoveCard, index: number) {
    const id = cardId(card, index);
    const selection = operatorSelections[id] || "MERGE";
    setRelayPendingId(id);
    setRelayErrors((current) => ({ ...current, [id]: "" }));

    try {
      const optionalPacket = receipts[id] || (await createOptionalPacket(card, index));
      if (!optionalPacket) throw new Error("OPTIONAL_PACKET_REQUIRED");

      const response = await fetch("/api/swanson/functional-relay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          optional_packet: optionalPacket,
          card,
          operator_selection: selection,
          mode: "packet_relay"
        })
      });
      const result = (await response.json()) as SwansonRelayResponse;
      if (!response.ok || !result.ok || !result.relay) {
        throw new Error(result.error || "SWANSON_RELAY_FAILED");
      }
      setSwansonRelays((current) => ({
        ...current,
        [result.relay?.source_optional_packet_id || optionalPacket.packet_id]: result.relay as SwansonRelayReceipt
      }));
    } catch (error) {
      setRelayErrors((current) => ({
        ...current,
        [id]: error instanceof Error ? error.message : "SWANSON_RELAY_FAILED"
      }));
    } finally {
      setRelayPendingId(null);
    }
  }

  return (
    <article className="border border-teal-400/30 bg-neutral-900 p-4" aria-label="Top Three Optional Packets">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-teal-300">Bridge / NOW</p>
          <h2 className="mt-1 text-xl font-black">Top 3 Optional Packets</h2>
          <p className="mt-2 text-xs font-bold leading-5 text-zinc-400">
            Petra/Skybro food becomes optional packets here. Pick one to create velocity churn; nothing is executed until a later relay/tap consumes the packet.
          </p>
        </div>
        <code className="text-xs text-zinc-400">{sourcePath}</code>
      </div>

      <div className="mt-4 grid gap-3">
        {cards.length === 0 ? (
          <p className="border border-zinc-800 bg-neutral-950 p-3 text-sm text-zinc-400">No Petra/Skybro food cards found.</p>
        ) : (
          cards.map((card, index) => {
            const id = cardId(card, index);
            const receipt = receipts[id];
            const swansonRelay = receipt ? swansonRelays[receipt.packet_id] : null;
            const error = errors[id];
            const relayMessage = relayMessages[id];
            const relayError = relayErrors[id];
            const operatorSelection = operatorSelections[id] || "MERGE";

            return (
              <section key={id} className="border border-zinc-800 bg-neutral-950 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-amber-200">
                      Petra/Skybro food #{index + 1}
                    </p>
                    <h3 className="mt-1 text-sm font-black text-zinc-100">{cardTitle(card)}</h3>
                  </div>
                  <span className={`shrink-0 border px-2 py-1 text-[0.65rem] font-black uppercase ${riskTone(card.risk_class)}`}>
                    {card.risk_class || "UNKNOWN"}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-400">{cardWhy(card)}</p>
                <p className="mt-3 text-xs font-black uppercase text-teal-200">Suggested lane: {cardTarget(card)}</p>

                <div className="mt-3 grid gap-2 border border-amber-300/40 bg-amber-300/10 p-3">
                  <p className="text-xs font-bold leading-5 text-amber-50">
                    Actionable packet: write this move into the optional packet lane, then let the operator momentum-tap or relay it.
                  </p>
                  <button
                    className="min-h-10 border border-amber-200 bg-amber-200 px-3 text-xs font-black uppercase text-neutral-950 disabled:cursor-progress disabled:opacity-60"
                    type="button"
                    disabled={pendingId === id}
                    onClick={() => void createOptionalPacket(card, index)}
                  >
                    {pendingId === id ? "Relaying optional packet" : receipt ? "Relay success: packet queued" : "Create optional packet"}
                  </button>
                  {relayMessage ? (
                    <p className="border border-emerald-300/50 bg-emerald-300/10 px-3 py-2 text-xs font-black uppercase text-emerald-100" role="status">
                      {relayMessage}
                    </p>
                  ) : null}
                  {receipt ? (
                    <dl className="grid gap-1 text-[0.68rem]">
                      <div>
                        <dt className="font-black uppercase text-zinc-500">Packet</dt>
                        <dd className="break-all font-mono text-amber-100">{receipt.packet_id}</dd>
                      </div>
                      <div>
                        <dt className="font-black uppercase text-zinc-500">Next state</dt>
                        <dd className="break-all font-mono text-zinc-300">{receipt.status} / {receipt.awaiting || "MOMENTUM_TAP"}</dd>
                      </div>
                      <div>
                        <dt className="font-black uppercase text-zinc-500">Path</dt>
                        <dd className="break-all font-mono text-zinc-300">{receipt.packet_path}</dd>
                      </div>
                      <div>
                        <dt className="font-black uppercase text-zinc-500">Interface event</dt>
                        <dd className="break-all font-mono text-zinc-300">{receipt.event_path}</dd>
                      </div>
                    </dl>
                  ) : null}
                  {error ? <p className="text-xs font-bold text-red-200">BLOCKER: {error}</p> : null}
                </div>

                <div className="mt-3 grid gap-3 border border-cyan-300/35 bg-cyan-300/10 p-3">
                  <div>
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-cyan-100">Swanson functional relay</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-zinc-300">
                      Choose the operator intent, then create the real packet relay. This writes dispatch and receipt artifacts and loads the relay text to clipboard; it does not auto-send.
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-2" aria-label={`Swanson operator choice for ${id}`}>
                    {(["KEEP", "KILL", "STEAL", "MERGE"] as OperatorSelection[]).map((selection) => (
                      <button
                        key={selection}
                        type="button"
                        className={`min-h-9 border px-2 text-[0.68rem] font-black uppercase ${
                          operatorSelection === selection
                            ? "border-cyan-200 bg-cyan-200 text-neutral-950"
                            : "border-cyan-300/35 bg-neutral-950 text-cyan-100"
                        }`}
                        onClick={() => setOperatorSelections((current) => ({ ...current, [id]: selection }))}
                      >
                        {selection}
                      </button>
                    ))}
                  </div>
                  <button
                    className="min-h-10 border border-cyan-200 bg-cyan-200 px-3 text-xs font-black uppercase text-neutral-950 disabled:cursor-progress disabled:opacity-60"
                    type="button"
                    disabled={relayPendingId === id}
                    onClick={() => void swansonPacketRelay(card, index)}
                  >
                    {relayPendingId === id
                      ? "Writing Swanson relay"
                      : swansonRelay
                        ? "Swanson relay complete"
                        : "Swanson packet relay"}
                  </button>
                  {swansonRelay ? (
                    <div className="border border-emerald-300/50 bg-emerald-300/10 p-3 text-xs text-emerald-100" role="status">
                      <p className="font-black uppercase">Swanson relay complete: {swansonRelay.relay_status}</p>
                      <p className="mt-1 break-all font-mono">relay {swansonRelay.relay_id}</p>
                      <p className="mt-1 break-all font-mono">packet {swansonRelay.packet_id}</p>
                      <p className="mt-1 break-all font-mono">receipt {swansonRelay.receipt_id}</p>
                      <p className="mt-1 font-bold">
                        Clipboard verified: {swansonRelay.clipboard_verified ? "Y" : "N"} / no auto-send
                      </p>
                    </div>
                  ) : null}
                  {relayError ? <p className="text-xs font-bold text-red-200">SWANSON BLOCKER: {relayError}</p> : null}
                </div>
              </section>
            );
          })
        )}
      </div>
    </article>
  );
}
