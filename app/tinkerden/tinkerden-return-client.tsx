"use client";

import { useState, type ReactNode } from "react";

type Packet = {
  packet_id: string;
  target: string;
  machine: string;
  mission: string;
};

type InFlightPacket = Packet & {
  sent_at: string;
  status: "SENT";
};

type Receipt = {
  receipt_id: string;
  packet_id: string;
  returned_by: string;
  summary: string;
};

type AssimilatedReceipt = Receipt & {
  speaker_update: "required";
  status: "ASSIMILATED";
};

function Pane({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="td-spine-pane" aria-label={title}>
      <h2>{title}</h2>
      <div className="td-spine-pane__body">{children}</div>
    </section>
  );
}

export function TinkerDenSpinalCord({
  initialPackets,
  initialReceipts
}: {
  initialPackets: Packet[];
  initialReceipts: Receipt[];
}) {
  const [outbox, setOutbox] = useState<Packet[]>(initialPackets);
  const [inFlight, setInFlight] = useState<InFlightPacket[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
  const [assimilation, setAssimilation] = useState<AssimilatedReceipt[]>([]);

  function fire(packet: Packet) {
    setOutbox((current) => current.filter((item) => item.packet_id !== packet.packet_id));
    setInFlight((current) => [
      {
        ...packet,
        sent_at: new Date().toLocaleTimeString(),
        status: "SENT"
      },
      ...current
    ]);
  }

  function assimilate(receipt: Receipt) {
    setReceipts((current) => current.filter((item) => item.receipt_id !== receipt.receipt_id));
    setAssimilation((current) => [
      {
        ...receipt,
        speaker_update: "required",
        status: "ASSIMILATED"
      },
      ...current
    ]);
  }

  return (
    <main className="td-spine">
      <h1>TinkerDen</h1>
      <div className="td-spine-grid">
        <Pane title="OUTBOX">
          {outbox.map((packet) => (
            <article className="td-spine-card" key={packet.packet_id}>
              <p><strong>packet_id</strong> {packet.packet_id}</p>
              <p><strong>target</strong> {packet.target}</p>
              <p><strong>machine</strong> {packet.machine}</p>
              <p><strong>mission</strong> {packet.mission}</p>
              <button type="button" onClick={() => fire(packet)}>FIRE</button>
            </article>
          ))}
        </Pane>

        <Pane title="IN-FLIGHT">
          {inFlight.map((packet) => (
            <article className="td-spine-card" key={packet.packet_id}>
              <p><strong>packet_id</strong> {packet.packet_id}</p>
              <p><strong>sent_at</strong> {packet.sent_at}</p>
              <p><strong>target</strong> {packet.target}</p>
              <p><strong>status</strong> {packet.status}</p>
            </article>
          ))}
        </Pane>

        <Pane title="RECEIPTS">
          {receipts.map((receipt) => (
            <article className="td-spine-card" key={receipt.receipt_id}>
              <p><strong>receipt_id</strong> {receipt.receipt_id}</p>
              <p><strong>packet_id</strong> {receipt.packet_id}</p>
              <p><strong>returned_by</strong> {receipt.returned_by}</p>
              <p><strong>summary</strong> {receipt.summary}</p>
              <button type="button" onClick={() => assimilate(receipt)}>ASSIMILATE</button>
            </article>
          ))}
        </Pane>

        <Pane title="ASSIMILATION">
          {assimilation.map((receipt) => (
            <article className="td-spine-card" key={receipt.receipt_id}>
              <p><strong>receipt_id</strong> {receipt.receipt_id}</p>
              <p><strong>speaker_update</strong> {receipt.speaker_update}</p>
              <p><strong>status</strong> {receipt.status}</p>
            </article>
          ))}
        </Pane>
      </div>
    </main>
  );
}
