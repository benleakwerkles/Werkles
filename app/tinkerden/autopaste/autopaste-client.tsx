"use client";

import { useMemo, useState } from "react";

import type { PacketRelayCard } from "@/lib/tinkerden/packet-relay";

import styles from "./autopaste.module.css";

type PacketRelayClientProps = {
  packets: PacketRelayCard[];
};

function copyFallback(text: string) {
  const node = document.createElement("textarea");
  node.value = text;
  node.setAttribute("readonly", "true");
  node.style.position = "fixed";
  node.style.left = "-9999px";
  document.body.appendChild(node);
  node.select();

  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(node);
  }
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  copyFallback(text);
}

export function PacketRelayClient({ packets }: PacketRelayClientProps) {
  const [selectedId, setSelectedId] = useState(packets[0]?.packet_id ?? "");
  const [copyStatus, setCopyStatus] = useState("READY");

  const selectedPacket = useMemo(
    () => packets.find((packet) => packet.packet_id === selectedId) ?? packets[0],
    [packets, selectedId]
  );

  async function handleCopy() {
    if (!selectedPacket) return;

    setCopyStatus("COPYING");
    try {
      await copyText(selectedPacket.packet_relay_text);
      setCopyStatus(`COPIED ${selectedPacket.packet_id}`);
    } catch (error) {
      setCopyStatus(error instanceof Error ? `COPY FAILED: ${error.message}` : "COPY FAILED");
    }
  }

  return (
    <main className={styles.autopaste}>
      <header className={styles.header}>
        <p>PACKET_RELAY_AEYE_V0</p>
        <h1>Packet Relay Copy Block</h1>
        <span>{copyStatus}</span>
      </header>

      <section className={styles.layout} aria-label="Aeye packet relay helper">
        <div className={styles.cards} aria-label="Packet cards">
          {packets.length === 0 ? (
            <article className={styles.card}>
              <strong>NO PACKETS FOUND</strong>
              <span>foreman/messages/outbox, data/tinkerden/outbox, data/packets.json</span>
            </article>
          ) : (
            packets.map((packet) => (
              <button
                className={styles.card}
                data-selected={packet.packet_id === selectedPacket?.packet_id}
                key={`${packet.source_path}:${packet.packet_id}`}
                onClick={() => {
                  setSelectedId(packet.packet_id);
                  setCopyStatus("READY");
                }}
                type="button"
              >
                <strong>{packet.packet_id}</strong>
                <span>{packet.to}</span>
                <span>{packet.mission}</span>
                <small>{packet.source_path}</small>
              </button>
            ))
          )}
        </div>

        <section className={styles.copy} aria-label="Clipboard-ready Packet Relay text">
          <div className={styles.toolbar}>
            <div>
              <strong>{selectedPacket?.to ?? "NO TARGET"}</strong>
              <span>{selectedPacket?.status ?? "NO STATUS"}</span>
            </div>
            <button disabled={!selectedPacket} onClick={handleCopy} type="button">
              COPY
            </button>
          </div>

          <textarea
            aria-label="Aeye packet relay text"
            readOnly
            value={selectedPacket?.packet_relay_text ?? ""}
          />
        </section>
      </section>
    </main>
  );
}
