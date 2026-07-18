"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PairingStatus = "PENDING" | "OPERATOR_APPROVED" | "REDEEMED" | "PAGE_READY" | "ACTIVE" | "EXPIRED";

type Pairing = {
  pairing_id: string;
  status: PairingStatus;
  machine: "Betsy";
  hostname: "BETSY";
  agent_id: "handeye-betsy-betsy";
  auth_mode: "EPHEMERAL_RSA_V1";
  credential_id: string;
  public_key_sha256: string;
  pairing_code: string;
  created_at: string;
  expires_at: string;
};

type PairingResponse = { ok?: boolean; pairing?: Pairing; pairings?: Pairing[]; error?: string };

const OPERATOR_BRIDGE = "http://127.0.0.1:3002";

function operatorBridgeAvailable() {
  return typeof window !== "undefined" && ["127.0.0.1", "localhost"].includes(window.location.hostname);
}

function newPageInstanceId() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) throw new Error("BETSY_HANDEYE_CSPRNG_UNAVAILABLE");
  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function requireActivePairing(body: PairingResponse, expectedPairingId: string) {
  const pairing = body.pairing;
  if (
    !pairing
    || pairing.status !== "ACTIVE"
    || pairing.pairing_id !== expectedPairingId
    || pairing.credential_id !== expectedPairingId
    || pairing.machine !== "Betsy"
    || pairing.hostname !== "BETSY"
    || pairing.agent_id !== "handeye-betsy-betsy"
    || pairing.auth_mode !== "EPHEMERAL_RSA_V1"
  ) throw new Error("BETSY_HANDEYE_ACTIVE_RESPONSE_INVALID");
  return pairing;
}

async function parseResponse(response: Response): Promise<PairingResponse> {
  const body = await response.json().catch(() => ({})) as PairingResponse;
  if (!response.ok || body.ok !== true) throw new Error(body.error || `BETSY_HANDEYE_HTTP_${response.status}`);
  return body;
}

export default function HarveyHandeyePairing({ pairingId }: { pairingId?: string }) {
  const receiverMode = Boolean(pairingId);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [receiverStatus, setReceiverStatus] = useState<PairingStatus | "STARTING" | "BLOCKER">("STARTING");
  const [error, setError] = useState("");
  const [browserHostname, setBrowserHostname] = useState<string | null>(null);
  const pageReadyStarted = useRef(false);

  useEffect(() => { setBrowserHostname(window.location.hostname); }, []);

  const refreshOperatorPairings = useCallback(async () => {
    if (receiverMode) return;
    if (!operatorBridgeAvailable()) {
      setError("DOSS_OPERATOR_BRIDGE_LOCAL_ONLY");
      return;
    }
    try {
      const response = await fetch(`${OPERATOR_BRIDGE}/handeye-pairing/details`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}"
      });
      const body = await parseResponse(response);
      setPairings(Array.isArray(body.pairings) ? body.pairings : []);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "BETSY_PAIRING_DETAILS_FAILED");
    }
  }, [receiverMode]);

  useEffect(() => {
    if (receiverMode) return;
    void refreshOperatorPairings();
    const timer = window.setInterval(() => void refreshOperatorPairings(), 3_000);
    return () => window.clearInterval(timer);
  }, [receiverMode, refreshOperatorPairings]);

  useEffect(() => {
    if (!receiverMode || !pairingId || pageReadyStarted.current) return;
    pageReadyStarted.current = true;

    const fragment = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const capability = new URLSearchParams(fragment).get("page_capability") ?? "";
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    if (!capability) {
      setReceiverStatus("BLOCKER");
      setError("BETSY_HANDEYE_PAGE_CAPABILITY_MISSING");
      return;
    }

    let pageInstanceId: string;
    try { pageInstanceId = newPageInstanceId(); }
    catch (cause) {
      setReceiverStatus("BLOCKER");
      setError(cause instanceof Error ? cause.message : "BETSY_HANDEYE_CSPRNG_UNAVAILABLE");
      return;
    }

    const timeOrigin = typeof performance.timeOrigin === "number" ? performance.timeOrigin : 0;
    const navigationCount = typeof performance.getEntriesByType === "function"
      ? performance.getEntriesByType("navigation").length
      : 0;

    void fetch("/api/harvey/handeye-pairing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        phase: "PAGE_READY",
        pairing_id: pairingId,
        page_capability: capability,
        page_instance_id: pageInstanceId,
        time_origin: timeOrigin,
        navigation_count: navigationCount
      })
    }).then(parseResponse).then((body) => {
      const pairing = requireActivePairing(body, pairingId);
      setReceiverStatus(pairing.status);
      setError("");
    }).catch((cause) => {
      setReceiverStatus("BLOCKER");
      setError(cause instanceof Error ? cause.message : "BETSY_HANDEYE_PAGE_READY_FAILED");
    });
  }, [pairingId, receiverMode]);

  async function approve(pairing: Pairing) {
    const confirmed = window.confirm(`Approve Betsy pairing ${pairing.pairing_code}? Continue only if this exact code and key fingerprint are visible on the physical Betsy session.`);
    if (!confirmed) return;
    try {
      const response = await fetch(`${OPERATOR_BRIDGE}/handeye-pairing/approve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pairing_id: pairing.pairing_id, pairing_code: pairing.pairing_code })
      });
      await parseResponse(response);
      await refreshOperatorPairings();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "BETSY_PAIRING_APPROVAL_FAILED");
    }
  }

  if (receiverMode) {
    return (
      <section data-testid="betsy-handeye-receiver" style={{ maxWidth: 1200, margin: "12px auto", padding: 16, border: "1px solid #46755b", borderRadius: 12, background: "#101813" }}>
        <p style={{ color: "#7cda9f", letterSpacing: 1.4, margin: 0 }}>BETSY / EPHEMERAL HANDEYE</p>
        <h2 style={{ color: "#fff4d6", margin: "8px 0" }}>Browser receiver: {receiverStatus}</h2>
        <p data-testid="betsy-handeye-boundary" style={{ color: "#aeb6b0", lineHeight: 1.55 }}>
          This page proves a rendered Harvey browser for one operator-approved, 15-minute pairing. It does not prove Betsy by itself; the pinned local script supplies the separate BETSY hostname check.
        </p>
        {error && <p role="alert" data-testid="betsy-handeye-error" style={{ color: "#ff8d78" }}>{error}</p>}
      </section>
    );
  }

  const pending = pairings.filter((pairing) => pairing.status === "PENDING");
  const remoteCockpit = browserHostname !== null && !["127.0.0.1", "localhost"].includes(browserHostname);
  return (
    <section data-testid="betsy-handeye-operator" style={{ maxWidth: 1200, margin: "18px auto", padding: 16, border: "1px solid #544b36", borderRadius: 12, background: "#111316" }}>
      <p style={{ color: "#d8a84e", letterSpacing: 1.4, margin: 0 }}>BETSY HANDEYE PAIRING / DOSS LOOPBACK</p>
      <h2 style={{ color: "#fff4d6", margin: "8px 0" }}>Pending physical-session approvals</h2>
      <p style={{ color: "#aeb6b0", lineHeight: 1.55 }}>Approval binds one ephemeral public key to Betsy for no more than 15 minutes. Harvey derives the machine identity and capabilities; no reusable credential is sent to the browser.</p>
      {remoteCockpit && <p role="status" data-testid="betsy-handeye-remote-route" style={{ padding: 12, border: "1px solid #775b32", borderRadius: 8, color: "#ffcc73", background: "#211d13" }}>Remote cockpit detected over LAN. An approved Betsy Handeye makes Betsy LIVE after PAGE_READY and a fresh paired heartbeat. Command controls remain Doss-local until a separate approved operator route exists.</p>}
      {error && !remoteCockpit && <p role="status" data-testid="betsy-handeye-operator-error" style={{ color: "#ffcc73" }}>{error}</p>}
      {!error && pending.length === 0 && <p data-testid="betsy-handeye-none" style={{ color: "#89928c" }}>No pending Betsy pairing request.</p>}
      <div style={{ display: "grid", gap: 10 }}>
        {pending.map((pairing) => (
          <article key={pairing.pairing_id} style={{ border: "1px solid #92743c", borderRadius: 10, padding: 12, background: "#211d13" }}>
            <strong style={{ color: "#fff4d6" }}>Betsy / BETSY / handeye-betsy-betsy</strong>
            <p data-testid="betsy-pairing-code" style={{ color: "#fff4d6", fontSize: 22, letterSpacing: 2, margin: "8px 0", fontWeight: 900 }}>{pairing.pairing_code}</p>
            <p style={{ color: "#aeb6b0", overflowWrap: "anywhere" }}>Full key SHA-256: <strong data-testid="betsy-pairing-fingerprint">{pairing.public_key_sha256}</strong> · expires {new Date(pairing.expires_at).toLocaleTimeString()}</p>
            <button type="button" onClick={() => void approve(pairing)} style={{ border: 0, borderRadius: 8, padding: "10px 14px", fontWeight: 900, background: "#d8a84e", color: "#111" }}>APPROVE THIS EXACT BETSY CODE</button>
          </article>
        ))}
      </div>
    </section>
  );
}
