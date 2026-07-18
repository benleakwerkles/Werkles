"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { harveyTaskBridgeRouteReady, type HarveyTaskBridgeRoute } from "./operator-bridge";

type State = "QUEUED" | "DELIVERED" | "THINKING" | "REPLIED" | "COMPLETED" | "BLOCKER";
type Binding = {
  binding_id: string;
  label: string;
  role: string;
  machine: string;
  provider: string;
  host_id: "local";
  thread_id: string;
  state: "BOUND_PROVEN";
  proof: string;
  project_scope: "CURRENT_WERKLES_CHECKOUT";
  busy: boolean;
};
type BindingSnapshot = Omit<Binding, "state" | "proof" | "busy">;
type Dispatch = {
  dispatch_id: string;
  binding_id: string;
  thread_id: string;
  binding_snapshot: BindingSnapshot;
  binding_fingerprint_sha256: string;
  created_at: string;
  state: State;
  body: string;
  reply: string | null;
  error: string | null;
  usage: { input_tokens: number; cached_input_tokens: number; output_tokens: number } | null;
  events: Array<{ sequence: number; type: State; at: string; detail: string }>;
};
type Envelope = {
  viewer: { route: "DOSS_LOOPBACK" | "SALLY_PAIRED_SESSION"; binding_scope: string; task_identity_proven_by: string };
  bridge: { truth_rule: string; limits: { max_records: number; per_thread_hour: number; per_thread_day: number; provider_billing: string; budget_basis: string }; bindings: Binding[]; dispatches: Dispatch[] };
};

const STEPS: State[] = ["QUEUED", "DELIVERED", "THINKING", "REPLIED", "COMPLETED"];

function newSubmissionId() {
  if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") throw new Error("TASK_BRIDGE_CSPRNG_UNAVAILABLE");
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function isConfirmedPrewriteRejection(status: number) {
  return [400, 401, 403, 404, 413, 422, 429].includes(status);
}

function stateColor(state: State) {
  if (state === "BLOCKER") return "#ff9a83";
  if (state === "COMPLETED" || state === "REPLIED") return "#8ef0ae";
  if (state === "THINKING") return "#8fcfff";
  if (state === "DELIVERED") return "#78f1df";
  return "#ffcc73";
}

export default function HarveyTaskBridge() {
  const [route, setRoute] = useState<HarveyTaskBridgeRoute | null>(null);
  const [envelope, setEnvelope] = useState<Envelope | null>(null);
  const [bindingId, setBindingId] = useState("");
  const [message, setMessage] = useState("");
  const [dispatchId, setDispatchId] = useState("");
  const [status, setStatus] = useState("Harvey is checking for a direct Aeye task route.");
  const [sending, setSending] = useState(false);
  const pollBusy = useRef(false);
  const pendingSubmissionRef = useRef<{ id: string; signature: string } | null>(null);

  const refresh = useCallback(async (candidate: HarveyTaskBridgeRoute) => {
    if (pollBusy.current) return false;
    pollBusy.current = true;
    try {
      const response = await fetch(candidate.url, { cache: "no-store", credentials: candidate.credentials });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "TASK_BRIDGE_READ_FAILED");
      setEnvelope(body);
      setBindingId((current) => current || body.bridge.bindings[0]?.binding_id || "");
      setStatus(`Direct task route current through ${body.viewer.route === "DOSS_LOOPBACK" ? "Doss" : "paired Sally"}.`);
      return true;
    } catch (error) {
      setRoute(null);
      setStatus(`${error instanceof Error ? error.message : "TASK_BRIDGE_READ_FAILED"}. Direct task send is unavailable.`);
      return false;
    } finally { pollBusy.current = false; }
  }, []);

  useEffect(() => {
    if (route) return;
    let disposed = false;
    let retryTimer: number | undefined;
    const discover = async () => {
      const candidate = await harveyTaskBridgeRouteReady();
      if (disposed) return;
      if (!candidate) {
        setRoute(null);
        setStatus("DIRECT TASK ROUTE UNBOUND. Harvey will retry automatically; pair this browser or open Harvey on Doss.");
        retryTimer = window.setTimeout(discover, 1_500);
        return;
      }
      const current = await refresh(candidate);
      if (disposed) return;
      if (current) setRoute(candidate);
      else retryTimer = window.setTimeout(discover, 1_500);
    };
    void discover();
    return () => {
      disposed = true;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [refresh, route]);

  useEffect(() => {
    if (!route) return;
    const timer = window.setInterval(() => void refresh(route), 1_000);
    return () => window.clearInterval(timer);
  }, [refresh, route]);

  const selected = envelope?.bridge.bindings.find((binding) => binding.binding_id === bindingId) ?? null;
  const activeDispatch = useMemo(() => {
    if (!envelope) return null;
    if (dispatchId) return envelope.bridge.dispatches.find((dispatch) => dispatch.dispatch_id === dispatchId) ?? null;
    return envelope.bridge.dispatches.find((dispatch) => dispatch.binding_id === bindingId) ?? null;
  }, [bindingId, dispatchId, envelope]);
  const selectedDispatchOutsideWindow = Boolean(dispatchId && envelope && !activeDispatch);

  async function send() {
    if (!route || sending) return;
    if (!message.trim()) {
      setStatus("Type your message first, then press SEND.");
      return;
    }
    setSending(true);
    setStatus("QUEUED · Harvey is handing this to one exact bound task.");
    const signature = JSON.stringify({ bindingId, body: message.trim() });
    let submissionId: string;
    try {
      const pending = pendingSubmissionRef.current;
      submissionId = pending?.signature === signature ? pending.id : newSubmissionId();
      pendingSubmissionRef.current = { id: submissionId, signature };
    } catch (error) {
      setStatus(`${error instanceof Error ? error.message : "TASK_BRIDGE_CSPRNG_UNAVAILABLE"}. Your draft remains here.`);
      setSending(false);
      return;
    }
    let confirmedRejected = false;
    try {
      const response = await fetch(route.url, {
        method: "POST",
        credentials: route.credentials,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId, binding_id: bindingId, body: message.trim() })
      });
      const body = await response.json();
      if (!response.ok) {
        confirmedRejected = isConfirmedPrewriteRejection(response.status);
        throw new Error(body.error ?? "TASK_BRIDGE_WRITE_FAILED");
      }
      setEnvelope(body);
      setDispatchId(body.dispatch.dispatch_id);
      setMessage("");
      pendingSubmissionRef.current = null;
      setStatus("QUEUED · Harvey durably accepted it. Waiting for the provider task to start.");
    } catch (error) {
      setStatus(confirmedRejected
        ? `${error instanceof Error ? error.message : "TASK_BRIDGE_WRITE_FAILED"}. The route rejected this attempt; your draft remains here.`
        : `${error instanceof Error ? error.message : "TASK_BRIDGE_WRITE_FAILED"}. RESULT UNKNOWN. Your draft remains here; press SEND again to retry the same submission safely.`);
    } finally { setSending(false); }
  }

  const currentState = activeDispatch?.state ?? null;
  const reached = currentState === "BLOCKER" ? -1 : currentState ? STEPS.indexOf(currentState) : -1;
  const stateMessage = selectedDispatchOutsideWindow ? "Your selected conversation is outside Harvey's two-record live window. Harvey will not substitute another task's message or reply."
    : currentState === "QUEUED" ? "Harvey accepted the message and is starting the exact bound task."
    : currentState === "DELIVERED" ? "The provider resumed the exact allowlisted task id."
      : currentState === "THINKING" ? "The exact bound task emitted turn.started and is working on its reply."
        : currentState === "REPLIED" ? "The task returned a screened reply; Harvey is waiting for turn completion."
          : currentState === "COMPLETED" ? "The exact provider turn completed after the reply."
            : currentState === "BLOCKER" ? "Harvey stopped the route fail-closed. See the blocker below."
              : status;

  return (
    <section id="harvey-direct-aeye-line" data-testid="harvey-task-bridge" aria-labelledby="harvey-task-bridge-title" style={{ maxWidth: 1200, margin: "0 auto 24px", padding: "clamp(18px,3vw,30px)", border: "3px solid #fff4d6", borderRadius: 18, background: "linear-gradient(145deg,#13211f,#111416)", boxShadow: "0 18px 60px rgba(0,0,0,.34)", scrollMarginTop: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <p style={{ color: "#78f1df", fontWeight: 950, letterSpacing: 1.5, margin: 0 }}>HARVEY DIRECT AEYE LINE · REAL PROVIDER TASK</p>
          <h2 id="harvey-task-bridge-title" style={{ color: "#fff4d6", fontSize: "clamp(28px,4vw,48px)", margin: "7px 0" }}>Speak directly to a bound Aeye.</h2>
          <p style={{ color: "#d6dbd7", lineHeight: 1.55, maxWidth: 820, margin: 0 }}>SEND resumes one exact Codex task. Harvey watches the provider event stream and shows when the task starts thinking and when it replies.</p>
        </div>
        <strong data-testid="task-bridge-route" style={{ color: route ? "#8ef0ae" : "#ffcc73", border: "1px solid #46504b", borderRadius: 999, padding: "9px 12px" }}>{route ? "DIRECT ROUTE CURRENT" : "ROUTE UNBOUND"}</strong>
      </div>

      <label style={{ display: "block", color: "#edf0e8", fontWeight: 850, marginTop: 18 }}>Talk to
        <select data-testid="task-bridge-target" value={bindingId} onChange={(event) => setBindingId(event.target.value)} style={{ display: "block", width: "100%", marginTop: 6, padding: 12, borderRadius: 9, border: "1px solid #57605b", background: "#0d1112", color: "#fff", font: "inherit" }}>
          {!envelope?.bridge.bindings.length && <option value="">NO DIRECT AEYE ROUTES LOADED</option>}
          {(envelope?.bridge.bindings ?? []).map((binding) => <option key={binding.binding_id} value={binding.binding_id}>{binding.label}@{binding.machine} · {binding.provider} · {binding.busy ? "ROUTE LOCKED / ACTIVE" : "NO ACTIVE TURN"}</option>)}
        </select>
      </label>
      {selected && <p data-testid="task-bridge-binding-proof" style={{ color: "#aeb6b0", lineHeight: 1.45, margin: "8px 0" }}><strong style={{ color: "#8ef0ae" }}>BOUND:</strong> {selected.role} · task {selected.thread_id}</p>}

      <label htmlFor="harvey-direct-message" style={{ display: "block", color: "#edf0e8", fontWeight: 850, marginTop: 12 }}>Your message</label>
      <textarea id="harvey-direct-message" data-testid="task-bridge-message" value={message} onChange={(event) => setMessage(event.target.value)} rows={4} maxLength={4096} placeholder="Tell this Aeye what you want. Harvey will show the actual provider states below." style={{ width: "100%", boxSizing: "border-box", marginTop: 7, resize: "vertical", border: "1px solid #7f754f", borderRadius: 12, padding: 15, background: "#090d0e", color: "#fff", font: "inherit", fontSize: 17, lineHeight: 1.55 }} />
      <button type="button" data-testid="task-bridge-send" disabled={!route || !bindingId || sending || selected?.busy === true} onClick={() => void send()} style={{ marginTop: 10, border: 0, borderRadius: 10, padding: "14px 28px", background: route && bindingId && !sending && !selected?.busy ? "#18c5ae" : "#38413f", color: route && bindingId && !sending && !selected?.busy ? "#07110f" : "#c0c7c3", fontWeight: 950, fontSize: 19, cursor: route && bindingId && !sending && !selected?.busy ? "pointer" : "not-allowed" }}>{sending ? "SENDING…" : "SEND"}</button>
      <p style={{ color: "#ffcc73", fontSize: 13, margin: "9px 0 0" }}>No passwords, codes, tokens, recovery material, or secrets. Codex does not expose a separate READ receipt, so Harvey will not invent one.</p>
      <p data-testid="task-bridge-cost-retention" style={{ color: "#c7d1cc", fontSize: 13, lineHeight: 1.5, margin: "5px 0 0" }}>SEND uses the currently configured Codex account or quota. Harvey does not inspect its billing mode and does not calculate dollars. This route allows 10 turns per hour and 25 per day for the exact task. Messages and replies are local plaintext runtime records, excluded from Git, capped at 200; automatic deletion is not implemented yet.</p>

      <div data-testid="task-bridge-progress" style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 7, marginTop: 18 }}>
        {STEPS.map((step, index) => <div key={step} style={{ border: `1px solid ${currentState === "BLOCKER" ? "#70463d" : index <= reached ? stateColor(step) : "#46504b"}`, borderRadius: 9, padding: "9px 5px", textAlign: "center", color: index <= reached ? stateColor(step) : "#89928c", fontWeight: 850, fontSize: 12 }}>{index <= reached ? "✓ " : "○ "}{step}</div>)}
      </div>
      <div role="status" data-testid="task-bridge-status" style={{ marginTop: 12, borderLeft: `4px solid ${currentState ? stateColor(currentState) : "#7f754f"}`, background: "#0b1012", padding: 12, color: "#edf0e8" }}>
        <strong style={{ color: currentState ? stateColor(currentState) : "#ffcc73" }}>{selectedDispatchOutsideWindow ? "OUTSIDE CURRENT WINDOW" : currentState ?? "CHECKING"}</strong>
        <p style={{ margin: "5px 0 0", color: "#c7d1cc" }}>{stateMessage}</p>
        {activeDispatch?.events.at(-1) && <small style={{ color: "#aeb6b0" }}>{activeDispatch.events.at(-1)?.detail}</small>}
      </div>
      {activeDispatch && <div data-testid="task-bridge-conversation" style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <article style={{ border: "1px solid #5b5340", borderRadius: 10, padding: 12, background: "#15130e" }}><strong style={{ color: "#fff4d6" }}>YOU</strong><p style={{ color: "#edf0e8", whiteSpace: "pre-wrap", marginBottom: 0 }}>{activeDispatch.body}</p></article>
        {activeDispatch.reply && <article style={{ border: "1px solid #346b61", borderRadius: 10, padding: 12, background: "#0d1917" }}><strong style={{ color: "#78f1df" }}>{activeDispatch.binding_snapshot.label}</strong><p style={{ color: "#edf0e8", whiteSpace: "pre-wrap", marginBottom: 0 }}>{activeDispatch.reply}</p></article>}
        {activeDispatch.error && <article style={{ border: "1px solid #7f493e", borderRadius: 10, padding: 12, color: "#ffb09d" }}>BLOCKER · {activeDispatch.error}</article>}
        {activeDispatch.usage && <small data-testid="task-bridge-usage" style={{ color: "#aeb6b0" }}>Current Codex account/quota usage: {activeDispatch.usage.input_tokens.toLocaleString()} input ({activeDispatch.usage.cached_input_tokens.toLocaleString()} cached) · {activeDispatch.usage.output_tokens.toLocaleString()} output tokens. Billing mode is uninspected; Harvey does not calculate dollars.</small>}
      </div>}
    </section>
  );
}
