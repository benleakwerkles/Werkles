"use client";

import { useEffect, useMemo, useState } from "react";

type GateShadow = {
  shadow_id: string;
  created_at: string;
  status: string;
  target_aeye: string;
  action: string;
  mock_diff_summary?: string;
};

type AuthorizationSurfaceProps = {
  riskLevel: string;
  gateReasons: string[];
  apoptosisPending: boolean;
  shadow: GateShadow | null;
};

type MergeResponse = {
  ok: boolean;
  status?: string;
  receipt_id?: string;
  decision_receipt_path?: string;
  error?: string;
};

type EngineRoomResponse = {
  ok: boolean;
  in_flight: GateShadow[];
};

const SIGNATURE_PREFIX = "operator_approval_";

function normalizeRisk(value: string) {
  return (value || "UNKNOWN").toUpperCase();
}

function isHighGateRisk(value: string) {
  const risk = normalizeRisk(value);
  return risk === "WOUND" || risk === "FRACTURE";
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default function AuthorizationSurface({ riskLevel, gateReasons, apoptosisPending, shadow }: AuthorizationSurfaceProps) {
  const [liveShadow, setLiveShadow] = useState<GateShadow | null>(shadow);
  const [detachedSignature, setDetachedSignature] = useState("");
  const [status, setStatus] = useState<MergeResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const normalizedRisk = normalizeRisk(riskLevel);
  const gateRequired = isHighGateRisk(normalizedRisk) || apoptosisPending;
  const signatureReady = detachedSignature.trim().length > 0;
  const hardwareLockActive = Boolean(liveShadow && gateRequired);
  const proceedLocked = !liveShadow || busy || (gateRequired && !signatureReady);
  const signCommand = liveShadow ? `bash tinker-sign.sh ${liveShadow.shadow_id}` : "bash tinker-sign.sh [id]";
  const hardwareTone =
    normalizedRisk === "FRACTURE"
      ? "border-amber-300 bg-amber-300 text-zinc-950"
      : "border-teal-300 bg-teal-300 text-zinc-950";
  const hardwareSoftTone =
    normalizedRisk === "FRACTURE"
      ? "border-amber-300/50 bg-amber-300/10 text-amber-100"
      : "border-teal-400/40 bg-teal-400/10 text-teal-100";

  async function loadLiveShadow() {
    try {
      const response = await fetch("/api/feral/v1/engine-room", { cache: "no-store" });
      const result = (await response.json()) as EngineRoomResponse;
      if (response.ok && result.ok) setLiveShadow(result.in_flight?.[0] ?? null);
    } catch {
      setLiveShadow((current) => current);
    }
  }

  useEffect(() => {
    loadLiveShadow();
    const poll = window.setInterval(loadLiveShadow, 2500);
    return () => window.clearInterval(poll);
  }, []);

  const lockReason = useMemo(() => {
    if (!liveShadow) return "NO_SHADOW_EXECUTION_SELECTED";
    if (busy) return "DECISION_POST_IN_FLIGHT";
    if (gateRequired && !signatureReady) return "OPERATOR_SIGNATURE_REQUIRED";
    return "UNLOCKED_BY_OPERATOR_SIGNATURE";
  }, [busy, gateRequired, liveShadow, signatureReady]);

  async function proceed() {
    if (!liveShadow) {
      setError("NO_SHADOW_EXECUTION_SELECTED");
      return;
    }
    if (gateRequired && !signatureReady) {
      setError("OPERATOR_SIGNATURE_REQUIRED");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const signedAt = new Date().toISOString();
      const signatureHash = await sha256Hex(detachedSignature.trim());
      const approvalId = `${SIGNATURE_PREFIX}${signatureHash.slice(0, 48)}`;
      const operatorSignature = await sha256Hex([
        detachedSignature.trim(),
        liveShadow.shadow_id,
        liveShadow.action,
        normalizedRisk,
        signedAt
      ].join("\n"));
      const decisionReceipt = {
        receipt_type: "DECISION",
        decision: "PROCEED",
        operator_approval_receipt_id: approvalId,
        shadow_id: liveShadow.shadow_id,
        target_aeye: liveShadow.target_aeye,
        action: liveShadow.action,
        risk_level: normalizedRisk,
        gate_required: gateRequired,
        gate_reasons: gateReasons,
        apoptosis_pending: apoptosisPending,
        sign_command: signCommand,
        detached_gpg_signature_sha256: signatureHash,
        detached_gpg_signature: detachedSignature.trim(),
        signed_at: signedAt,
        operator_signature_sha256: operatorSignature
      };

      const response = await fetch("/api/feral/v1/action/shadow_merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shadow_id: liveShadow.shadow_id,
          operator_signature: operatorSignature,
          operator_approval_receipt_id: approvalId,
          detached_gpg_signature: detachedSignature.trim(),
          decision_receipt: decisionReceipt
        })
      });
      const result = (await response.json()) as MergeResponse;
      if (!response.ok || !result.ok) throw new Error(result.error || "DECISION_RECEIPT_POST_FAILED");
      setStatus(result);
      setLiveShadow(null);
      setDetachedSignature("");
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : "DECISION_RECEIPT_POST_FAILED");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid gap-3 px-4 pb-4 xl:grid-cols-[1fr_0.85fr_1fr]" aria-label="Human Gate Authorization Surface">
      <article className="border border-zinc-800 bg-neutral-900 p-4" aria-label="Draft pane">
        <p className="text-xs font-black uppercase text-teal-300">Draft Pane</p>
        <h2 className="mt-1 text-xl font-black">Pending Shadow</h2>
        {liveShadow ? (
          <dl className="mt-4 grid gap-2 text-xs">
            <div>
              <dt className="font-black uppercase text-zinc-500">Shadow ID</dt>
              <dd className="break-all font-mono text-zinc-300">{liveShadow.shadow_id}</dd>
            </div>
            <div>
              <dt className="font-black uppercase text-zinc-500">Target</dt>
              <dd className="text-zinc-200">{liveShadow.target_aeye}</dd>
            </div>
            <div>
              <dt className="font-black uppercase text-zinc-500">Action</dt>
              <dd className="text-zinc-200">{liveShadow.action}</dd>
            </div>
            {liveShadow.mock_diff_summary ? (
              <div>
                <dt className="font-black uppercase text-zinc-500">Mock diff</dt>
                <dd className="text-zinc-400">{liveShadow.mock_diff_summary}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="mt-4 border border-zinc-800 bg-neutral-950 p-3 text-sm text-zinc-400">No pending shadow row.</p>
        )}
      </article>

      <article className="border border-teal-400/50 bg-neutral-950 p-4 shadow-[0_0_24px_rgba(45,212,191,0.08)]" aria-label="Authorization Surface">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-teal-300">Authorization Surface</p>
            <h2 className="mt-1 text-xl font-black">Human Gate / YubiKey Signature</h2>
            <p className="mt-2 max-w-md text-xs font-bold leading-5 text-zinc-400">
              The YubiKey touch happens in your local signing shell. This page does not read the key directly; it waits for the detached signature produced after that touch.
            </p>
          </div>
          <span className="border border-teal-400/40 bg-teal-400/10 px-2 py-1 text-[0.65rem] font-black uppercase text-teal-100">
            {normalizedRisk}
          </span>
        </div>

        {hardwareLockActive ? (
          <div className={`mt-4 border px-3 py-3 ${hardwareTone}`} aria-label="Hardware Lock Active">
            <p className="text-xs font-black uppercase">YUBIKEY SIGNATURE REQUIRED</p>
            <p className="mt-1 text-[0.68rem] font-black uppercase">
              {normalizedRisk} requires a local detached signature before execution.
            </p>
          </div>
        ) : null}

        <div className="mt-4 grid gap-2 text-[0.68rem] font-black uppercase">
          <span className={`border px-2 py-1 ${gateRequired ? "border-teal-300 bg-teal-300 text-zinc-950" : "border-zinc-800 text-zinc-400"}`}>
            Gate: {gateRequired ? "LOCKED" : "LOW RISK"}
          </span>
          <span className={`border px-2 py-1 ${signatureReady ? "border-teal-400/40 text-teal-200" : "border-zinc-700 text-zinc-400"}`}>
            Signature: {signatureReady ? "PRESENT" : "MISSING"}
          </span>
        </div>

        {hardwareLockActive ? (
          <div className={`mt-4 border p-3 ${hardwareSoftTone}`} aria-label="Local signing command">
            <p className="text-[0.68rem] font-black uppercase">Run locally, touch YubiKey when prompted</p>
            <code className="mt-2 block select-all break-all border border-zinc-700 bg-neutral-950 px-3 py-2 font-mono text-xs text-zinc-100">
              {signCommand}
            </code>
          </div>
        ) : null}

        <label className="mt-4 block text-xs font-black uppercase text-zinc-500" htmlFor="detached-gpg-signature">
          Paste detached signature produced after YubiKey touch
        </label>
        <textarea
          id="detached-gpg-signature"
          aria-label="Paste detached signature produced after YubiKey touch"
          value={detachedSignature}
          onChange={(event) => {
            setDetachedSignature(event.target.value);
            setError("");
          }}
          className="mt-2 min-h-32 w-full resize-y border border-zinc-700 bg-neutral-900 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-teal-300"
          placeholder="-----BEGIN PGP SIGNATURE-----"
          spellCheck={false}
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <code className="border border-zinc-800 bg-neutral-900 px-3 py-2 text-xs font-black uppercase text-zinc-400">
            local signature bay
          </code>
          <button
            type="button"
            onClick={proceed}
            disabled={proceedLocked}
            aria-disabled={proceedLocked}
            data-lock-state={proceedLocked ? "locked" : "unlocked"}
            className="border border-teal-300 bg-teal-300 px-3 py-2 text-xs font-black uppercase text-zinc-950 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-500"
          >
            {proceedLocked ? "PROCEED LOCKED" : "PROCEED"}
          </button>
        </div>

        <p className="mt-3 break-all font-mono text-[0.68rem] text-zinc-500">{lockReason}</p>
        {gateReasons.length ? (
          <ul className="mt-3 grid gap-1 text-xs text-zinc-400">
            {gateReasons.map((reason) => (
              <li key={reason} className="border border-zinc-800 bg-neutral-900 px-2 py-1">{reason}</li>
            ))}
          </ul>
        ) : null}
        {error ? <p className="mt-3 border border-red-400/50 bg-red-500/10 p-2 text-xs font-bold text-red-200">{error}</p> : null}
        {status?.ok ? (
          <div className="mt-3 border border-teal-400/40 bg-teal-400/10 p-2 text-xs text-teal-100">
            <p className="font-black uppercase">{status.status}</p>
            <p className="mt-1 break-all font-mono">{status.receipt_id}</p>
            <p className="mt-1 break-all font-mono text-teal-200">{status.decision_receipt_path}</p>
          </div>
        ) : null}
      </article>

      <article className="border border-zinc-800 bg-neutral-900 p-4" aria-label="Live pane">
        <p className="text-xs font-black uppercase text-teal-300">Live Pane</p>
        <h2 className="mt-1 text-xl font-black">Execution Lock</h2>
        <dl className="mt-4 grid gap-2 text-xs">
          <div>
            <dt className="font-black uppercase text-zinc-500">Proceed state</dt>
            <dd className="font-mono text-zinc-200">{proceedLocked ? "LOCKED" : "UNLOCKED"}</dd>
          </div>
          <div>
            <dt className="font-black uppercase text-zinc-500">Decision receipt</dt>
            <dd className="break-all font-mono text-zinc-300">{status?.decision_receipt_path || "WAITING_FOR_OPERATOR_SIGNATURE"}</dd>
          </div>
          <div>
            <dt className="font-black uppercase text-zinc-500">Backend post</dt>
            <dd className="break-all font-mono text-zinc-300">{status?.receipt_id || "/api/feral/v1/action/shadow_merge"}</dd>
          </div>
        </dl>
      </article>
    </section>
  );
}
