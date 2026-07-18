"use client";

import { useEffect, useState } from "react";
import { harveyOperatorBridgeReady, harveyOperatorBridgeUrl } from "./operator-bridge";

export default function HarveyFleetControls({ knockCapableMachines }: { knockCapableMachines: string[] }) {
  const [status, setStatus] = useState("IDLE");
  const [detail, setDetail] = useState("");
  const [operatorReady, setOperatorReady] = useState(false);

  useEffect(() => {
    void harveyOperatorBridgeReady().then(setOperatorReady);
  }, []);

  async function knockAll() {
    if (status === "QUEUEING") {
      setDetail("A fleet command is already being queued. Your click was not sent twice.");
      return;
    }
    if (knockCapableMachines.length === 0 || !operatorReady) {
      setStatus("BLOCKER");
      setDetail(knockCapableMachines.length === 0 ? "NO_KNOCK_CAPABLE_LIVE_MACHINES" : "OPERATOR_ROUTE_NOT_PAIRED_FOR_THIS_BROWSER");
      return;
    }
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
    <section data-testid="fleet-controls" data-knock-capable-machine-count={String(knockCapableMachines.length)} style={{ maxWidth: 1200, margin: "0 auto 28px", padding: 18, border: "1px solid #4d554f", borderRadius: 12, background: "#111518" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <div><strong style={{ color: "#fff4d6", fontSize: 20 }}>OPERATOR CONTROLS</strong><br/><small style={{ color: "#89928c" }}>{knockCapableMachines.length} KNOCK-capable live machine{knockCapableMachines.length === 1 ? "" : "s"}</small></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" data-route-enabled={knockCapableMachines.length > 0 && operatorReady && status !== "QUEUEING" ? "true" : "false"} onClick={knockAll} style={{ border: 0, borderRadius: 8, padding: "10px 14px", fontWeight: 900, background: knockCapableMachines.length && operatorReady ? "#d8a84e" : "#303532", color: knockCapableMachines.length && operatorReady ? "#111" : "#aab1ad", cursor: "pointer", opacity: knockCapableMachines.length && operatorReady ? 1 : 0.78 }}>KNOCK ALL LIVE</button>
          <button type="button" onClick={() => window.location.reload()} style={{ border: "1px solid #69736d", borderRadius: 8, padding: "10px 14px", fontWeight: 800, background: "transparent", color: "#edf0e8" }}>REFRESH PROOF</button>
        </div>
      </div>
      {!operatorReady && <small style={{ display: "block", marginTop: 10, color: "#ffcc73" }}>CONTROL ROUTE NOT YET PAIRED · the cockpit is visible; command authority stays locked until this browser has an approved route</small>}
      {operatorReady && <small style={{ display: "block", marginTop: 10, color: "#75e6a4" }}>DOSS LOCAL · OPERATOR BRIDGE CONNECTED</small>}
      {status !== "IDLE" && <small style={{ display: "block", marginTop: 10, color: status === "BLOCKER" ? "#ff8c75" : "#d8a84e" }}>{status} · {detail}</small>}
    </section>
  );
}
