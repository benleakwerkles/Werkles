"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { harveyOperatorBridgeReady, harveyOperatorBridgeUrl } from "./operator-bridge";
import { useHarveySnapshotState } from "./HarveyLiveCockpit";

type Witness = {
  challenge_id: string;
  status: "CHALLENGE_ISSUED" | "PAIRING_PENDING" | "PAIRING_APPROVED" | "HOST_READY" | "PING_QUEUED" | "COMPLETED" | "BLOCKER" | "EXPIRED";
  created_at: string;
  expires_at: string;
  expired: boolean;
  sally_live_claimed: false;
  evidence_environment: "LIVE_CONTROL_PLANE" | "FIXTURE_ONLY" | "UNCLASSIFIED";
  sally_connectivity_before: string;
  pairing_status: "NONE" | "PENDING" | "APPROVED" | "REDEEMED";
  host_ready?: { receipt_id: string; observed_at: string; initial_revision: string };
  page_ready?: { receipt_id: string; observed_at: string; page_instance_id: string; time_origin: number; navigation_count: 1 };
  command?: { command_id: string; workstream_id: string };
  command_status: string | null;
  browser_completed?: { receipt_id: string; observed_at: string; observed_revision: string; terminal_receipt_id: string; sally_connectivity_after: string };
  operator_session?: { status: "ACTIVE"; receipt_id: string; activated_at: string; expires_at: string; active: boolean };
  blocker?: { code: string; observed_at: string };
};

type Pairing = { request_id: string; status: "PENDING" | "APPROVED" | "REDEEMED" | "REJECTED"; pairing_code: string; public_key_sha256: string; requested_at: string };

const steps = ["CHALLENGE ISSUED", "PAIRING REQUESTED", "PAIRING APPROVED", "HOST READY", "PAGE READY", "PING QUEUED", "PING RECEIVED", "PING COMPLETED", "BROWSER COMPLETED"];

function createPageInstanceId() {
  if (typeof window === "undefined" || typeof window.crypto?.getRandomValues !== "function") return "";
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => (byte + 256).toString(16).slice(1)).join("");
}

function currentStep(witness: Witness | null) {
  if (!witness) return -1;
  if (witness.status === "COMPLETED") return 8;
  if (witness.command_status === "COMPLETED") return 7;
  if (witness.command_status === "RECEIVED") return 6;
  if (witness.command) return 5;
  if (witness.page_ready) return 4;
  if (witness.host_ready) return 3;
  if (witness.pairing_status === "APPROVED") return 2;
  if (witness.pairing_status === "PENDING") return 1;
  return 0;
}

function proofState(witness: Witness | null) {
  if (!witness) return "NO ACTIVE CHALLENGE";
  if (witness.status === "COMPLETED") return "BROWSER COMPLETED";
  if (witness.status === "EXPIRED") return "EXPIRED";
  if (witness.status === "BLOCKER") return witness.blocker?.code ?? "BLOCKER";
  if (witness.command_status === "COMPLETED") return "PING COMPLETED";
  if (witness.command_status === "RECEIVED") return "PING RECEIVED";
  if (witness.command) return "PING QUEUED";
  if (witness.page_ready) return "PAGE READY";
  if (witness.host_ready) return "HOST READY";
  if (witness.pairing_status === "APPROVED") return "PAIRING APPROVED";
  if (witness.pairing_status === "PENDING") return "PAIRING REQUESTED";
  return "CHALLENGE ISSUED";
}

export default function HarveySallyWitness() {
  const { snapshot, transport } = useHarveySnapshotState();
  const [witness, setWitness] = useState<Witness | null>(null);
  const [operatorReady, setOperatorReady] = useState(false);
  const [receiverMode, setReceiverMode] = useState(false);
  const [receiverState, setReceiverState] = useState("IDLE");
  const [error, setError] = useState("");
  const [readError, setReadError] = useState("");
  const [scriptSha256, setScriptSha256] = useState("");
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const pageInstanceId = useRef("");
  if (!pageInstanceId.current) pageInstanceId.current = createPageInstanceId();
  const timeOrigin = useRef(typeof performance === "undefined" ? 0 : performance.timeOrigin);
  const navigationCount = useRef(typeof performance === "undefined" ? 0 : performance.getEntriesByType("navigation").length);
  const capabilityRef = useRef<string | null>(null);
  const completionSent = useRef(false);
  const pollingStopped = useRef(false);

  async function refresh() {
    const response = await fetch("/api/harvey/witness", { cache: "no-store", credentials: "same-origin" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "SALLY_WITNESS_READ_FAILED");
    setReadError("");
    setScriptSha256(String(body.witness_script_sha256 ?? ""));
    const next = body.witness as Witness | null;
    if (next && (next.expired || ["COMPLETED", "BLOCKER"].includes(next.status))) pollingStopped.current = true;
    setWitness(next ?? null);
    return next;
  }

  async function refreshPairings() {
    const bridge = harveyOperatorBridgeUrl();
    if (!bridge || receiverMode) return;
    const response = await fetch(`${bridge}/sally-witness/pairings`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "SALLY_PAIRING_DETAILS_FAILED");
    setPairings(Array.isArray(body.pairings) ? body.pairings : []);
  }

  useEffect(() => {
    void harveyOperatorBridgeReady().then(setOperatorReady);
    const timer = window.setInterval(() => {
      if (!pollingStopped.current) void refresh().catch((reason) => setReadError(reason instanceof Error ? reason.message : "SALLY_WITNESS_READ_FAILED"));
    }, 1000);
    void refresh().catch((reason) => setReadError(reason instanceof Error ? reason.message : "SALLY_WITNESS_READ_FAILED"));
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!operatorReady || receiverMode) return;
    const timer = window.setInterval(() => void refreshPairings().catch((reason) => setReadError(reason instanceof Error ? reason.message : "SALLY_PAIRING_DETAILS_FAILED")), 1000);
    void refreshPairings().catch((reason) => setReadError(reason instanceof Error ? reason.message : "SALLY_PAIRING_DETAILS_FAILED"));
    return () => window.clearInterval(timer);
  }, [operatorReady, receiverMode]);

  useEffect(() => {
    const challengeId = new URLSearchParams(window.location.search).get("sally_acceptance");
    if (!challengeId) return;
    setReceiverMode(true);
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const capability = fragment.get("witness");
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    if (!/^[a-f0-9]{64}$/.test(capability ?? "")) {
      setReceiverState("RELOADED OR CAPABILITY MISSING");
      setError("SALLY_WITNESS_CAPABILITY_MISSING");
      return;
    }
    if (!pageInstanceId.current) {
      setReceiverState("BLOCKER");
      setError("SALLY_WITNESS_CSPRNG_UNAVAILABLE");
      return;
    }
    capabilityRef.current = capability;
    setReceiverState("ATTACHING PAGE");
    let cancelled = false;
    const attach = async () => {
      let lastError = "SALLY_WITNESS_PAGE_READY_FAILED";
      for (let attempt = 0; attempt < 12 && !cancelled; attempt += 1) {
        try {
          const response = await fetch("/api/harvey/witness", {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              phase: "PAGE_READY",
              challenge_id: challengeId,
              capability,
              page_instance_id: pageInstanceId.current,
              time_origin: timeOrigin.current,
              navigation_count: navigationCount.current
            })
          });
          const body = await response.json();
          if (response.ok) {
            capabilityRef.current = null;
            setWitness(body.witness);
            setReceiverState("PAGE READY");
            setError("");
            window.setTimeout(() => { if (!cancelled) setReceiverState(""); }, 2000);
            return;
          }
          lastError = body.error ?? lastError;
          if (response.status < 500) {
            setReceiverState("REISSUE REQUIRED");
            setError(lastError);
            return;
          }
        } catch (reason) {
          lastError = reason instanceof Error ? reason.message : lastError;
        }
        await new Promise((resolve) => window.setTimeout(resolve, Math.min(4000, 250 * (2 ** attempt))));
      }
      if (!cancelled) {
        setReceiverState("BLOCKER");
        setError(lastError);
      }
    };
    void attach();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!receiverMode || !pageInstanceId.current || completionSent.current || !witness?.host_ready || !witness.command || witness.command_status !== "COMPLETED" || transport !== "CURRENT") return;
    if (snapshot.revision === witness.host_ready.initial_revision) return;
    const completionEvidence = {
      challenge_id: witness.challenge_id,
      command_id: witness.command.command_id,
      initial_revision: witness.host_ready.initial_revision,
      observed_revision: snapshot.revision
    };
    completionSent.current = true;
    setReceiverState("PING COMPLETED");
    window.setTimeout(() => {
      setReceiverState("RETURNING BROWSER RECEIPT");
      void fetch("/api/harvey/witness", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        phase: "BROWSER_COMPLETED",
        ...completionEvidence,
        page_instance_id: pageInstanceId.current,
        time_origin: timeOrigin.current,
        navigation_count: navigationCount.current
      })
      }).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "SALLY_WITNESS_COMPLETION_FAILED");
      setWitness(body.witness);
      setReceiverState("BROWSER COMPLETED");
      setError("");
      }).catch((reason) => {
      completionSent.current = false;
      setReceiverState("BLOCKER");
      setError(reason instanceof Error ? reason.message : "SALLY_WITNESS_COMPLETION_FAILED");
      });
    }, 750);
  }, [receiverMode, snapshot.revision, transport, witness]);

  async function createChallenge(reissue = false) {
    setError("");
    const bridge = harveyOperatorBridgeUrl();
    if (!bridge) return setError("DOSS_OPERATOR_BRIDGE_LOCAL_ONLY");
    if (reissue && !window.confirm("Invalidate the current Sally acceptance challenge and issue a new one?")) return;
    const response = await fetch(`${bridge}/sally-witness${reissue ? "?reissue=1" : ""}`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    const body = await response.json();
    if (!response.ok) return setError(body.error ?? "SALLY_WITNESS_CREATE_FAILED");
    pollingStopped.current = false;
    setWitness(body.witness);
    await refresh();
    await refreshPairings();
  }

  async function approvePairing(pairing: Pairing) {
    const bridge = harveyOperatorBridgeUrl();
    if (!bridge) return setError("DOSS_OPERATOR_BRIDGE_LOCAL_ONLY");
    if (!witness) return setError("SALLY_WITNESS_CHALLENGE_NOT_FOUND");
    const confirmed = window.confirm(`Approve Sally pairing ${pairing.pairing_code}? Continue only if this exact code is visible on the physical Sally session. Key ${pairing.public_key_sha256.slice(0, 16)}.`);
    if (!confirmed) return;
    setError("");
    const response = await fetch(`${bridge}/sally-witness/approve`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ challenge_id: witness.challenge_id, request_id: pairing.request_id, pairing_code: pairing.pairing_code }) });
    const body = await response.json();
    if (!response.ok) return setError(body.error ?? "SALLY_PAIRING_APPROVAL_FAILED");
    await Promise.all([refresh(), refreshPairings()]);
  }

  const activeStep = currentStep(witness);
  const publicPacket = "http://10.1.10.8:3000/api/harvey/witness?format=packet";
  const transientReceiverState = ["ATTACHING PAGE", "PAGE READY", "PING COMPLETED", "RETURNING BROWSER RECEIPT", "REISSUE REQUIRED", "BLOCKER"].includes(receiverState) ? receiverState : "";
  const announcement = transientReceiverState || proofState(witness);
  const sally = snapshot.machines.find((machine) => machine.machine === "Sally");
  const finalProved = witness?.status === "COMPLETED" && witness.browser_completed && witness.evidence_environment === "LIVE_CONTROL_PLANE";
  const visibleError = error || readError;
  const statusColor = finalProved ? "#75e6a4" : visibleError || witness?.status === "BLOCKER" ? "#ff8c75" : "#ffcc73";
  const expiry = useMemo(() => witness ? new Date(witness.expires_at).toLocaleString() : null, [witness]);
  const activeChallenge = Boolean(witness && !witness.expired && !["COMPLETED", "BLOCKER"].includes(witness.status));

  return (
    <section style={{ maxWidth: 1200, margin: "0 auto 28px", border: "1px solid #66552d", borderRadius: 14, padding: 22, background: "#17150f" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 14, alignItems: "start" }}>
        <div>
          <p style={{ color: "#d8a84e", letterSpacing: 2, fontWeight: 800, margin: 0 }}>{receiverMode ? "SALLY ACCEPTANCE WITNESS" : "SALLY ACCEPTANCE CHALLENGE"}</p>
          <h2 style={{ color: "#fff4d6", margin: "7px 0" }}>{finalProved ? "SALLY ACCEPTANCE PROVED" : announcement}</h2>
          <p style={{ color: "#aeb6b0", maxWidth: 800, lineHeight: 1.5 }}>{receiverMode ? "Keep this page open. Harvey is checking automatically; no copy/paste or refresh required." : "One bounded Sally browser session proves an already-open page observed one exact Doss PING complete."}</p>
        </div>
        {!receiverMode && <button type="button" data-route-enabled={operatorReady ? "true" : "false"} onClick={() => void createChallenge(activeChallenge)} style={{ border: 0, borderRadius: 8, padding: "10px 14px", fontWeight: 900, background: operatorReady ? "#d8a84e" : "#303532", color: operatorReady ? "#111" : "#aab1ad", cursor: "pointer", opacity: operatorReady ? 1 : 0.78 }}>{activeChallenge ? "REISSUE SALLY ACCEPTANCE" : "CREATE SALLY ACCEPTANCE"}</button>}
      </div>

      <p data-testid="sally-witness-boundary" style={{ padding: 10, border: "1px solid #775b32", borderRadius: 8, color: "#ffcc73" }}>
        This does not mark Sally LIVE or invent a machine heartbeat. A completed physical-Sally acceptance activates only the short-lived universal command deck; machine controls and receiver delivery remain separately proved. Current Sally topology: <strong>{sally?.connectivity ?? "DISCONNECTED"}</strong> · sally_live_claimed: false.
      </p>

      {receiverMode && finalProved && witness.operator_session?.active && (
        <div data-testid="sally-operator-ready" style={{ margin: "14px 0", padding: 16, border: "2px solid #42d7c2", borderRadius: 12, background: "#102522" }}>
          <strong style={{ color: "#8ef0ae", fontSize: 18 }}>SALLY OPERATOR ROUTE CONNECTED</strong>
          <p style={{ color: "#e7e3d8", lineHeight: 1.5 }}>This browser may now write durable Harvey work orders until {new Date(witness.operator_session.expires_at).toLocaleString()}. Queued is still not delivered.</p>
          <a href="/harvey" data-testid="open-sally-harvey-command" style={{ display: "inline-block", borderRadius: 9, padding: "12px 16px", background: "#18c5ae", color: "#07110f", fontWeight: 950, textDecoration: "none" }}>OPEN HARVEY COMMAND</a>
        </div>
      )}

      <div role="status" aria-live="polite" aria-atomic="true" data-testid="sally-witness-announcement" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>Sally acceptance: {announcement}</div>
      {(visibleError || witness?.blocker) && <p role="alert" style={{ color: "#ff8c75" }}>{visibleError || witness?.blocker?.code}</p>}

      {!receiverMode && pairings.some((pairing) => pairing.status === "PENDING") && (
        <div data-testid="sally-pairing-requests" style={{ display: "grid", gap: 10, margin: "14px 0" }}>
          {pairings.filter((pairing) => pairing.status === "PENDING").map((pairing) => (
            <article key={pairing.request_id} style={{ border: "1px solid #92743c", borderRadius: 10, padding: 12, background: "#211d13" }}>
              <p style={{ color: "#ffcc73", margin: "0 0 6px", fontWeight: 900 }}>PAIRING REQUEST — NOT MACHINE IDENTITY YET</p>
              <p data-testid="sally-pairing-code" style={{ color: "#fff4d6", fontSize: 22, letterSpacing: 2, margin: "6px 0", fontWeight: 900 }}>{pairing.pairing_code}</p>
              <p style={{ color: "#aeb6b0", overflowWrap: "anywhere" }}>Ephemeral key {pairing.public_key_sha256.slice(0, 16)}… · requested {new Date(pairing.requested_at).toLocaleTimeString()}</p>
              <button type="button" onClick={() => void approvePairing(pairing)} style={{ border: 0, borderRadius: 8, padding: "10px 14px", fontWeight: 900, background: "#d8a84e", color: "#111" }}>APPROVE THIS EXACT SALLY CODE</button>
            </article>
          ))}
        </div>
      )}

      {witness && (
        <>
          <dl style={{ display: "grid", gridTemplateColumns: "minmax(min(150px,100%),.5fr) minmax(0,2fr)", gap: 8, overflowWrap: "anywhere" }}>
            <dt style={{ color: "#89928c" }}>Challenge</dt><dd data-testid="sally-witness-challenge" style={{ margin: 0 }}>{witness.challenge_id}</dd>
            <dt style={{ color: "#89928c" }}>Expires</dt><dd style={{ margin: 0 }}>{expiry}</dd>
            <dt style={{ color: "#89928c" }}>Command</dt><dd data-testid="sally-witness-command" style={{ margin: 0 }}>{witness.command?.command_id ?? "Not queued"}</dd>
            <dt style={{ color: "#89928c" }}>Latest proof</dt><dd data-testid="sally-witness-status" style={{ margin: 0, color: statusColor }}>{announcement}</dd>
          </dl>
          <ol style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(150px,100%),1fr))", gap: 8, listStyle: "none", padding: 0, marginTop: 18 }}>
            {steps.map((step, index) => <li key={step} aria-current={index === activeStep ? "step" : undefined} style={{ padding: 10, border: `1px solid ${index <= activeStep ? "#6a824f" : "#343a36"}`, borderRadius: 8, color: index <= activeStep ? "#edf0e8" : "#89928c" }}>{index < activeStep ? "DONE" : index === activeStep ? "NOW" : "NEXT"} {step}</li>)}
          </ol>
          {!receiverMode && <p style={{ color: "#aeb6b0", overflowWrap: "anywhere" }}>One required K: <strong>KNOCK SALLY HARVEY - open <a href={publicPacket} target="_blank" rel="noreferrer" style={{ color: "#ffcc73" }}>{publicPacket}</a> - WITNESS_SCRIPT_SHA256 {scriptSha256 || "LOADING"}</strong></p>}
        </>
      )}
    </section>
  );
}
