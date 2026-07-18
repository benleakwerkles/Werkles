"use client";

import { useEffect, useState } from "react";
import { harveyOperatorBridgeReady, harveyOperatorBridgeUrl } from "./operator-bridge";

type Action = "PING" | "KNOCK" | "OPEN_URL" | "SWATEYE_GIT_LFS_RECOVERY";

export default function HarveyMachineControls({ machine, enabled, capabilities, workstreamId }: { machine: string; enabled: boolean; capabilities: Action[]; workstreamId?: string }) {
  const [state, setState] = useState("IDLE");
  const [detail, setDetail] = useState("");
  const [operatorReady, setOperatorReady] = useState(false);

  useEffect(() => {
    void harveyOperatorBridgeReady().then(setOperatorReady);
  }, []);

  async function issue(action: Action) {
    if (state === "QUEUEING") {
      setDetail("A command is already being queued. Your click was not sent twice.");
      return;
    }
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

  function explainLockedRoute(action: Action) {
    setState("BLOCKER");
    setDetail(!enabled
      ? `${machine.toUpperCase()}_HANDEYE_PAGE_READY_AND_HEARTBEAT_REQUIRED`
      : !capabilities.includes(action)
        ? `ACTION_NOT_SUPPORTED_BY_CURRENT_HANDEYE:${action}`
        : "OPERATOR_ROUTE_NOT_PAIRED_FOR_THIS_BROWSER");
  }

  const actionable = (action: Action) => enabled && operatorReady && capabilities.includes(action) && state !== "QUEUEING";
  const expectedCapabilities = machine === "Spanzee" ? 4 : 3;
  const buttonStyle = (action: Action) => ({ border: "1px solid #d8a84e", borderRadius: 8, background: actionable(action) ? "#d8a84e" : "#303532", color: actionable(action) ? "#111" : "#aab1ad", padding: "8px 10px", fontWeight: 800, cursor: "pointer", opacity: actionable(action) ? 1 : 0.78 } as const);
  const click = (action: Action) => actionable(action) ? void issue(action) : explainLockedRoute(action);

  return (
    <div data-testid={`controls-${machine}`} data-proof-enabled={enabled ? "true" : "false"} style={{ marginTop: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <button type="button" data-route-enabled={actionable("PING") ? "true" : "false"} onClick={() => click("PING")} style={buttonStyle("PING")}>PING</button>
        <button type="button" data-route-enabled={actionable("KNOCK") ? "true" : "false"} onClick={() => click("KNOCK")} style={buttonStyle("KNOCK")}>KNOCK</button>
        <button type="button" data-route-enabled={actionable("OPEN_URL") ? "true" : "false"} onClick={() => click("OPEN_URL")} style={buttonStyle("OPEN_URL")}>OPEN HARVEY</button>
        {machine === "Spanzee" && <button type="button" data-route-enabled={actionable("SWATEYE_GIT_LFS_RECOVERY") ? "true" : "false"} onClick={() => click("SWATEYE_GIT_LFS_RECOVERY")} style={buttonStyle("SWATEYE_GIT_LFS_RECOVERY")}>SWAT ORPHANED GIT LFS</button>}
      </div>
      {!enabled && <small style={{ display: "block", marginTop: 7, color: machine === "Betsy" ? "#ffcc73" : "#89928c" }}>{machine === "Betsy" ? "BETSY CONTROL ROUTE LOCKED · waiting for approved Handeye PAGE_READY + heartbeat" : "CONTROL ROUTE LOCKED · requires a fresh Handeye heartbeat"}</small>}
      {enabled && !operatorReady && <small style={{ display: "block", marginTop: 7, color: "#ffcc73" }}>MACHINE LIVE · this browser still needs an approved operator route</small>}
      {enabled && operatorReady && <small style={{ display: "block", marginTop: 7, color: "#75e6a4" }}>DOSS LOCAL · OPERATOR BRIDGE CONNECTED</small>}
      {enabled && operatorReady && capabilities.length < expectedCapabilities && <small style={{ display: "block", marginTop: 7, color: "#ffcc73" }}>THIS HANDEYE CAN RUN: {capabilities.join(", ") || "NO COMMANDS"}</small>}
      {state !== "IDLE" && <small style={{ display: "block", marginTop: 7, color: state === "BLOCKER" ? "#ff8c75" : state === "COMPLETED" ? "#75e6a4" : "#d8a84e" }}>{state} · {detail}</small>}
    </div>
  );
}
