"use client";

import { useEffect, useState } from "react";
import { harveyOperatorBridgeReady, harveyOperatorBridgeUrl } from "./operator-bridge";

type Action = "PING" | "KNOCK" | "OPEN_URL";

export default function HarveyMachineControls({ machine, enabled, workstreamId }: { machine: string; enabled: boolean; workstreamId?: string }) {
  const [state, setState] = useState("IDLE");
  const [detail, setDetail] = useState("");
  const [operatorReady, setOperatorReady] = useState(false);

  useEffect(() => {
    void harveyOperatorBridgeReady().then(setOperatorReady);
  }, []);

  async function issue(action: Action) {
    setState("QUEUEING");
    setDetail("");
    try {
      const bridge = harveyOperatorBridgeUrl();
      if (!bridge) throw new Error("DOSS_OPERATOR_BRIDGE_LOCAL_ONLY");
      const response = await fetch(`${bridge}/commands`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ machine, action, ...(workstreamId ? { workstream_id: workstreamId } : {}), payload: action === "OPEN_URL" ? { url: "http://10.1.10.8:3000/harvey" } : {} })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "COMMAND_FAILED");
      const commandId = body.command.command_id as string;
      setState("QUEUED");
      setDetail(commandId);

      for (let attempt = 0; attempt < 20; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
        const readback = await fetch(`/api/harvey/commands?machine=${encodeURIComponent(machine)}`, { cache: "no-store" });
        const readbackBody = await readback.json();
        const command = readbackBody.commands?.find((item: { command_id: string }) => item.command_id === commandId);
        if (!command) continue;
        setState(command.status);
        setDetail(command.receipt?.evidence ?? commandId);
        if (command.status === "COMPLETED" || command.status === "BLOCKER") return;
      }
      setState("WAITING");
      setDetail(`Local polling paused after 20 seconds · command remains nonterminal · ${commandId}`);
    } catch (error) {
      setState("BLOCKER");
      setDetail(error instanceof Error ? error.message : "COMMAND_FAILED");
    }
  }

  const actionable = enabled && operatorReady;
  const buttonStyle = { border: "1px solid #d8a84e", borderRadius: 8, background: actionable ? "#d8a84e" : "#303532", color: actionable ? "#111" : "#7e8781", padding: "8px 10px", fontWeight: 800, cursor: actionable ? "pointer" : "not-allowed" } as const;

  return (
    <div data-testid={`controls-${machine}`} data-proof-enabled={enabled ? "true" : "false"} style={{ marginTop: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <button type="button" disabled={!actionable || state === "QUEUEING"} onClick={() => issue("PING")} style={buttonStyle}>PING</button>
        <button type="button" disabled={!actionable || state === "QUEUEING"} onClick={() => issue("KNOCK")} style={buttonStyle}>KNOCK</button>
        <button type="button" disabled={!actionable || state === "QUEUEING"} onClick={() => issue("OPEN_URL")} style={buttonStyle}>OPEN HARVEY</button>
      </div>
      {!enabled && <small style={{ display: "block", marginTop: 7, color: "#89928c" }}>Requires live Handeye</small>}
      {enabled && !operatorReady && <small style={{ display: "block", marginTop: 7, color: "#89928c" }}>Read-only here · operator controls require Doss localhost bridge</small>}
      {enabled && operatorReady && <small style={{ display: "block", marginTop: 7, color: "#75e6a4" }}>DOSS LOCAL · OPERATOR BRIDGE CONNECTED</small>}
      {state !== "IDLE" && <small style={{ display: "block", marginTop: 7, color: state === "BLOCKER" ? "#ff8c75" : state === "COMPLETED" ? "#75e6a4" : "#d8a84e" }}>{state} · {detail}</small>}
    </div>
  );
}
