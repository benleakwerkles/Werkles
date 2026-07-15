"use client";

import { useEffect, useState } from "react";
import { harveyOperatorBridgeReady, harveyOperatorBridgeUrl } from "./operator-bridge";

export default function HarveyFleetControls({ liveMachines }: { liveMachines: string[] }) {
  const [status, setStatus] = useState("IDLE");
  const [detail, setDetail] = useState("");
  const [operatorReady, setOperatorReady] = useState(false);

  useEffect(() => {
    void harveyOperatorBridgeReady().then(setOperatorReady);
  }, []);

  async function knockAll() {
    setStatus("QUEUEING");
    try {
      const bridge = harveyOperatorBridgeUrl();
      if (!bridge) throw new Error("DOSS_OPERATOR_BRIDGE_LOCAL_ONLY");
      const response = await fetch(`${bridge}/fleet/knock`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}"
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "FLEET_COMMAND_FAILED");
      const fleetId = body.fleet.fleet_id as string;
      setStatus(body.fleet.status);
      setDetail(`${body.fleet.completed_count} completed · ${body.fleet.blocker_count} blocker · ${body.fleet.pending_count} pending · ${fleetId}`);
      for (let attempt = 0; attempt < 60; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
        const readback = await fetch(`/api/harvey/commands?fleet_id=${encodeURIComponent(fleetId)}`, { cache: "no-store" });
        const readbackBody = await readback.json();
        if (!readback.ok) continue;
        setStatus(readbackBody.fleet.status);
        setDetail(`${readbackBody.fleet.completed_count} completed · ${readbackBody.fleet.blocker_count} blocker · ${readbackBody.fleet.pending_count} pending · ${fleetId}`);
        if (readbackBody.fleet.terminal) return;
      }
      setStatus("WAITING");
      setDetail(`Local polling paused after 60 seconds · receiver terminals still pending · ${fleetId}`);
    } catch (error) {
      setStatus("BLOCKER");
      setDetail(error instanceof Error ? error.message : "FLEET_COMMAND_FAILED");
    }
  }

  return (
    <section data-testid="fleet-controls" data-live-machine-count={String(liveMachines.length)} style={{ maxWidth: 1200, margin: "0 auto 28px", padding: 18, border: "1px solid #4d554f", borderRadius: 12, background: "#111518" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <div><strong style={{ color: "#fff4d6", fontSize: 20 }}>OPERATOR CONTROLS</strong><br/><small style={{ color: "#89928c" }}>{liveMachines.length} live machine{liveMachines.length === 1 ? "" : "s"}</small></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" disabled={liveMachines.length === 0 || !operatorReady || status === "QUEUEING"} onClick={knockAll} style={{ border: 0, borderRadius: 8, padding: "10px 14px", fontWeight: 900, background: liveMachines.length && operatorReady ? "#d8a84e" : "#303532", color: liveMachines.length && operatorReady ? "#111" : "#7e8781" }}>KNOCK ALL LIVE</button>
          <button type="button" onClick={() => window.location.reload()} style={{ border: "1px solid #69736d", borderRadius: 8, padding: "10px 14px", fontWeight: 800, background: "transparent", color: "#edf0e8" }}>REFRESH PROOF</button>
        </div>
      </div>
      {!operatorReady && <small style={{ display: "block", marginTop: 10, color: "#89928c" }}>READ ONLY · Doss localhost operator bridge is not connected on this browser</small>}
      {operatorReady && <small style={{ display: "block", marginTop: 10, color: "#75e6a4" }}>DOSS LOCAL · OPERATOR BRIDGE CONNECTED</small>}
      {status !== "IDLE" && <small style={{ display: "block", marginTop: 10, color: status === "BLOCKER" ? "#ff8c75" : "#d8a84e" }}>{status} · {detail}</small>}
    </section>
  );
}
