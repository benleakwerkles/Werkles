"use client";

import { useEffect, useState } from "react";

import type { HarveyPasswordActionReceipt, HarveyPasswordIncidentProjection } from "@/lib/harvey/password-incident";
import { harveyOperatorBridgeReady, harveyOperatorBridgeUrl } from "./operator-bridge";

type SurfaceState = "CHECKING" | "PROTECTED" | "READY" | "BLOCKED";
type ActionInput = Record<string, string | boolean>;

const buttonStyle = {
  appearance: "none",
  border: "1px solid #d8a84e",
  borderRadius: 9,
  background: "#2a2115",
  color: "#fff4d6",
  cursor: "pointer",
  fontWeight: 800,
  padding: "10px 13px"
} as const;

export default function HarveyPasswordIncident() {
  const [surfaceState, setSurfaceState] = useState<SurfaceState>("CHECKING");
  const [projection, setProjection] = useState<HarveyPasswordIncidentProjection | null>(null);
  const [actionReceipt, setActionReceipt] = useState<HarveyPasswordActionReceipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function callPrivateAction(input: ActionInput) {
    const bridge = harveyOperatorBridgeUrl();
    if (!bridge) throw new Error("PROTECTED_OPERATOR_ROUTE_UNAVAILABLE");
    const response = await fetch(`${bridge}/password-incident`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store"
    });
    const body = await response.json();
    if (!response.ok || !body.projection || !("action_receipt" in body)) throw new Error("PRIVATE_ACTION_NOT_RECORDED");
    setProjection(body.projection as HarveyPasswordIncidentProjection);
    setActionReceipt(body.action_receipt as HarveyPasswordActionReceipt | null);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ready = await harveyOperatorBridgeReady();
      const bridge = harveyOperatorBridgeUrl();
      if (cancelled) return;
      if (!ready || !bridge) {
        setSurfaceState("PROTECTED");
        return;
      }
      try {
        const response = await fetch(`${bridge}/password-incident`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}", cache: "no-store" });
        const body = await response.json();
        if (!response.ok || !body.projection || !("action_receipt" in body)) throw new Error("PASSWORD_INCIDENT_READ_FAILED");
        if (!cancelled) {
          setProjection(body.projection as HarveyPasswordIncidentProjection);
          setActionReceipt(body.action_receipt as HarveyPasswordActionReceipt | null);
          setSurfaceState("READY");
        }
      } catch {
        if (!cancelled) setSurfaceState("BLOCKED");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function perform(input: ActionInput, success: string) {
    setBusy(true);
    setNotice("");
    try {
      await callPrivateAction(input);
      setNotice(success);
    } catch {
      setNotice("Private action was not recorded. The prior state is preserved.");
    } finally {
      setBusy(false);
    }
  }

  if (surfaceState !== "READY" || !projection) {
    return (
      <section aria-labelledby="harvey-password-protected-heading" data-testid="harvey-password-incident-protected" style={{ maxWidth: 1200, margin: "0 auto 18px", padding: 16, border: "1px solid #514a39", borderRadius: 12, background: "#111513" }}>
        <h2 id="harvey-password-protected-heading" style={{ margin: 0, color: "#d8a84e", fontSize: 16, fontWeight: 900, letterSpacing: 1.2 }}>PASSWORD SAFETY · PROTECTED OPERATOR SURFACE</h2>
        <p role="status" aria-live="polite" style={{ margin: "7px 0 0", color: surfaceState === "BLOCKED" ? "#ff9a83" : "#aeb6b0" }}>
          {surfaceState === "CHECKING" ? "Checking the local operator boundary." : surfaceState === "BLOCKED" ? "Protected readback unavailable. The local operator bridge must be safely reloaded before this status can be shown." : "Incident details are not sent to an unpaired LAN browser. Pair a protected operator seat to view them."}
        </p>
      </section>
    );
  }

  const active = projection.counts.open + projection.counts.in_progress + projection.counts.blocked;
  const state = actionReceipt?.state;
  return (
    <section aria-labelledby="harvey-password-incident-heading" data-testid="harvey-password-incident" style={{ maxWidth: 1200, margin: "0 auto 18px", padding: "clamp(18px,3vw,28px)", border: "2px solid #d86b54", borderRadius: 16, background: "linear-gradient(145deg,#21120f,#111513)" }}>
      <p style={{ margin: 0, color: "#ff9a83", fontWeight: 900, letterSpacing: 1.3 }}>PASSWORD SAFETY INCIDENT</p>
      <h2 id="harvey-password-incident-heading" style={{ margin: "7px 0", color: "#fff4d6", fontSize: "clamp(25px,3vw,38px)" }}>Action required · account takeover is not proven</h2>
      <p style={{ color: "#d6dbd7", lineHeight: 1.6, maxWidth: 900 }}>
        Harvey has a sanitized incident projection and a structured private-action receipt. Neither surface accepts a password, username, email, account, provider identity, URL, path, or free-text evidence.
      </p>
      <div role="status" aria-live="polite" aria-atomic="true" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginTop: 14 }}>
        {[
          ["Active protected incidents", active],
          ["Private action", state ?? "Not prepared"],
          ["Priority hold", actionReceipt?.priority_hold ?? "ACTIVE"],
          ["Routine cleanup", actionReceipt?.routine_cleanup ?? "PRESERVED"]
        ].map(([label, value]) => <div key={String(label)} style={{ border: "1px solid #5b5243", borderRadius: 10, padding: 12, background: "#0e1212" }}><small style={{ color: "#aeb6b0" }}>{label}</small><strong style={{ display: "block", marginTop: 4, color: "#fff4d6", overflowWrap: "anywhere" }}>{value}</strong></div>)}
      </div>

      <div style={{ marginTop: 15, padding: 14, borderRadius: 10, background: "#231b13", color: "#ffda8a" }}>
        <strong>Security incident has priority.</strong><br />
        Routine cleanup position is preserved.<br />
        Routine cleanup resumes only after private closure proof.
      </div>

      <div aria-label="Private action controls" style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 15 }}>
        {!actionReceipt && <button type="button" disabled={busy} style={buttonStyle} onClick={() => void perform({ operation: "PREPARE" }, "Private action receipt prepared. No private result was asserted.")}>Prepare private action receipt</button>}
      </div>
      {state === "REPORTED" && <p style={{ color: "#ffda8a", fontWeight: 800 }}>Prepared for private human action. Harvey cannot record private completion or release the hold until an independently trusted human channel is bound.</p>}
      <p role="status" aria-live="polite" style={{ minHeight: 22, color: "#d6dbd7", margin: "12px 0 0" }}>{busy ? "Recording the structured private action…" : notice}</p>
      <p style={{ color: "#aeb6b0", margin: "4px 0 0" }}>Automation remains PREPARED_FOR_PRIVATE_HUMAN_ACTION. Source completion alone cannot release the hold.</p>
    </section>
  );
}
