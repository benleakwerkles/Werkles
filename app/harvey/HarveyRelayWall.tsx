"use client";

import { useEffect, useState } from "react";

const PHASES = [
  "QUEUED",
  "SESSION_FOUND",
  "VISUALLY_CONFIRMED",
  "AWAITING_SEND_CONFIRMATION",
  "SENT",
  "ACKNOWLEDGED",
  "ARTIFACT_WRITTEN",
  "RECEIPTED"
];

type Delivery = {
  delivery_id: string;
  machine: "Spanzee";
  phase: string;
  terminal: boolean;
  updated_at: string;
  core: {
    workstream_id: string;
    target_aeye: string;
    source_repository: string;
    source_branch: string;
    source_commit: string;
    bird_path: string;
    bird_sha256: string;
  };
  events: Array<{
    sequence: number;
    phase: string;
    observed_at: string;
    event_sha256: string;
    proof: Record<string, string | number>;
  }>;
};

type Projection = {
  ok: boolean;
  automation: "SEND_DISABLED";
  terminal_rule: string;
  deliveries: Delivery[];
};

const statusColor = (phase: string) => {
  if (phase === "RECEIPTED") return "#75e6a4";
  if (phase === "BLOCKED") return "#ff8c75";
  if (["SENT", "ACKNOWLEDGED", "ARTIFACT_WRITTEN"].includes(phase)) return "#ffcc73";
  return "#7ac7ff";
};

export default function HarveyRelayWall() {
  const [projection, setProjection] = useState<Projection | null>(null);
  const [transport, setTransport] = useState<"CURRENT" | "WAITING">("WAITING");

  useEffect(() => {
    let active = true;
    let timer: number | undefined;
    const refresh = async () => {
      try {
        const response = await fetch("/api/harvey/relay-events", { cache: "no-store", credentials: "same-origin" });
        const body = await response.json() as Projection;
        if (!response.ok || !body.ok) throw new Error("BRIDGE_PROJECTION_UNAVAILABLE");
        if (active) {
          setProjection(body);
          setTransport("CURRENT");
        }
      } catch {
        if (active) setTransport("WAITING");
      } finally {
        if (active) timer = window.setTimeout(refresh, 2500);
      }
    };
    void refresh();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const deliveries = projection?.deliveries ?? [];
  const activeCount = deliveries.filter((delivery) => !delivery.terminal).length;
  const completedCount = deliveries.filter((delivery) => delivery.phase === "RECEIPTED").length;
  const blockerCount = deliveries.filter((delivery) => delivery.phase === "BLOCKED").length;

  return (
    <section data-testid="harvey-relay-wall" aria-labelledby="harvey-relay-wall-title" style={{ maxWidth: 1200, margin: "28px auto", border: "1px solid #4d554f", borderRadius: 14, background: "#101417", padding: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "start", gap: 16 }}>
        <div>
          <p style={{ color: "#d8a84e", letterSpacing: 2, fontWeight: 900, margin: 0 }}>HARVEY CREW BRIDGE / BIRD-FLOCK RELAY</p>
          <p style={{ color: "#ffcc73", margin: "6px 0 0", fontWeight: 800 }}>ACTIVE ADAPTER: ODDLY GODLY / SPANZEE PILOT</p>
          <h2 id="harvey-relay-wall-title" style={{ color: "#fff4d6", fontSize: 32, margin: "7px 0" }}>Chat wakes the Aeye. The repo carries truth. Receipts close the loop.</h2>
          <p style={{ maxWidth: 860, color: "#aeb6b0", lineHeight: 1.55, margin: 0 }}>
            This wall accepts sanitized lifecycle events authenticated at intake as the Spanzee Handeye. Local Harvey storage is the trusted projection boundary. It cannot send Cowork messages, inspect transcripts, run Runner jobs, or execute Git. SENT is visible but never terminal.
          </p>
        </div>
        <div style={{ border: "1px solid #664d31", background: "#1a150f", borderRadius: 10, padding: "10px 13px", minWidth: 210 }}>
          <small style={{ color: "#89928c" }}>AUTOMATION AUTHORITY</small>
          <strong data-testid="relay-automation" style={{ display: "block", color: "#ffcc73", marginTop: 4 }}>SEND DISABLED</strong>
          <small data-testid="relay-transport" style={{ color: transport === "CURRENT" ? "#75e6a4" : "#ff8c75" }}>Projection {transport}</small>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 9, margin: "18px 0" }}>
        {[["ACTIVE LOOPS", activeCount], ["RECEIPTED", completedCount], ["BLOCKED", blockerCount], ["INTAKE WRITER", "Spanzee"]].map(([label, value]) => (
          <div key={String(label)} style={{ border: "1px solid #303733", borderRadius: 10, background: "#121619", padding: 12 }}>
            <small style={{ color: "#89928c" }}>{label}</small>
            <strong style={{ display: "block", color: "#fff4d6", fontSize: typeof value === "number" ? 28 : 19, marginTop: 4 }}>{value}</strong>
          </div>
        ))}
      </div>

      <div aria-label="Crew bridge lifecycle" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(118px,1fr))", gap: 6, marginBottom: 18 }}>
        {PHASES.map((phase, index) => (
          <div key={phase} style={{ border: "1px solid #303733", borderRadius: 8, padding: 8, background: "#0d1113" }}>
            <small style={{ color: "#89928c" }}>{index + 1}</small>
            <strong style={{ color: phase === "RECEIPTED" ? "#75e6a4" : "#c9e9ff", display: "block", fontSize: 11, overflowWrap: "anywhere", marginTop: 3 }}>{phase.replaceAll("_", " ")}</strong>
          </div>
        ))}
      </div>

      {transport === "CURRENT" && deliveries.length === 0 && (
        <div data-testid="relay-empty" style={{ border: "1px dashed #59605c", borderRadius: 10, padding: 17, color: "#c8cec9" }}>
          No Spanzee-authenticated delivery receipts yet. The successful July 14 manual Doozer/Dink round-trip is historical evidence and has not been fabricated into this live ledger.
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {deliveries.map((delivery) => {
          const latest = delivery.events.at(-1);
          return (
            <article data-testid={`relay-delivery-${delivery.delivery_id}`} key={delivery.delivery_id} style={{ border: `1px solid ${statusColor(delivery.phase)}`, borderLeftWidth: 4, borderRadius: 10, padding: 14, background: "#111518" }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 9 }}>
                <div>
                  <strong style={{ color: "#fff4d6", fontSize: 18 }}>{delivery.core.target_aeye} / {delivery.core.workstream_id}</strong>
                  <small style={{ color: "#89928c", display: "block", marginTop: 3 }}>{delivery.core.source_repository} · {delivery.core.source_branch} · {delivery.core.source_commit.slice(0, 12)}</small>
                </div>
                <strong data-testid="relay-phase" style={{ color: statusColor(delivery.phase) }}>{delivery.phase.replaceAll("_", " ")}</strong>
              </div>
              <p style={{ color: "#c8cec9", fontSize: 12, overflowWrap: "anywhere", margin: "12px 0 5px" }}>{delivery.core.bird_path}</p>
              <small style={{ color: "#89928c" }}>event {latest?.sequence ?? 0} · proof {latest?.event_sha256.slice(0, 12) ?? "missing"} · observed {latest ? new Date(latest.observed_at).toLocaleString() : "unknown"}</small>
              {!delivery.terminal && ["SENT", "ACKNOWLEDGED", "ARTIFACT_WRITTEN"].includes(delivery.phase) && <p style={{ color: "#ffcc73", margin: "9px 0 0", fontSize: 12 }}>In progress — receiver-side receipt has not closed this loop.</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
