"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { harveySynapseRouteReady, type HarveySynapseRoute } from "./operator-bridge";

type Seat = "BEN" | "SWANSON_DOSS" | "DINK_SALLY";
type Entry = {
  sequence: number;
  entry_id: string;
  kind: "INSTRUCTION" | "BEN_FOLLOWUP" | "PRESENTED" | "REPLY" | "BLOCKER";
  author_seat: Seat;
  body: string | null;
  reply_to: string | null;
  authenticated_route: "OPERATOR_INPUT" | "DOSS_LOOPBACK" | "SALLY_PAIRED_SESSION";
  created_at: string;
  entry_sha256: string;
};
type SeatState = {
  seat: Seat;
  role_claim: string;
  machine: "Doss" | "Sally" | null;
  state: "OPERATOR_MESSAGE_POSTED" | "ROUTE_UNBOUND" | "SESSION_PRESENTED_TASK_UNPROVEN" | "ROLE_REPLY_RECORDED" | "BLOCKER";
  last_entry_at: string | null;
};
type Synapse = {
  synapse_id: string;
  verb: "VERIFY" | "PREPARE" | "GO" | "KNOCK";
  subject: string;
  revision: number;
  updated_at: string;
  entries: Entry[];
  seat_states: SeatState[];
  aggregate_state: "WAITING_FOR_BOTH_ROLE_REPLIES" | "BOTH_ROLE_REPLIES_RECORDED" | "ROLE_BLOCKER_RECORDED";
};
type Envelope = {
  ok: boolean;
  viewer: { route: "DOSS_LOOPBACK" | "SALLY_PAIRED_SESSION"; seat: Exclude<Seat, "BEN">; proof: string; task_identity_proven: false };
  projection: {
    classification: "NON_SECRET_LAN_TRANSCRIPT_PILOT";
    truth_rule: "PAIRING_OR_PRESENTATION_DOES_NOT_PROVE_AEYE_TASK_RECEIPT";
    synapse: Synapse | null;
  };
};
type PendingSynapseWrite = { id: string; signature: string; request: Record<string, unknown> };
type SynapseWriteError = Error & { confirmedRejected?: boolean };

const SEAT_COPY: Record<Seat, { title: string; subtitle: string }> = {
  BEN: { title: "BEN", subtitle: "OPERATOR" },
  SWANSON_DOSS: { title: "SWANSON", subtitle: "DOSS ROLE CLAIM" },
  DINK_SALLY: { title: "DINK", subtitle: "PHYSICAL SALLY ROLE CLAIM" }
};

const STATE_COPY: Record<SeatState["state"], string> = {
  OPERATOR_MESSAGE_POSTED: "MESSAGE POSTED",
  ROUTE_UNBOUND: "Aeye task route unbound",
  SESSION_PRESENTED_TASK_UNPROVEN: "Visible in authenticated machine view · Aeye task not proven",
  ROLE_REPLY_RECORDED: "Role reply recorded · task identity not proven",
  BLOCKER: "Role blocker recorded"
};

function newSubmissionId() {
  if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") throw new Error("SYNAPSE_CSPRNG_UNAVAILABLE");
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function isConfirmedPrewriteRejection(status: number) {
  return [400, 401, 403, 404, 413, 422, 429].includes(status);
}

function seatColor(state: SeatState["state"]) {
  if (state === "BLOCKER") return "#ff9a83";
  if (state === "ROLE_REPLY_RECORDED") return "#8ef0ae";
  if (state === "SESSION_PRESENTED_TASK_UNPROVEN") return "#8fcfff";
  if (state === "OPERATOR_MESSAGE_POSTED") return "#fff4d6";
  return "#ffcc73";
}

function entryLabel(entry: Entry) {
  if (entry.kind === "PRESENTED") return "SESSION PRESENTATION";
  if (entry.kind === "BLOCKER") return "BLOCKER";
  if (entry.author_seat === "BEN") return entry.kind === "INSTRUCTION" ? "OPERATOR MESSAGE" : "OPERATOR FOLLOW-UP";
  return "ROLE REPLY";
}

export default function HarveySynapse() {
  const [route, setRoute] = useState<HarveySynapseRoute | null>(null);
  const [envelope, setEnvelope] = useState<Envelope | null>(null);
  const [transport, setTransport] = useState<"CHECKING" | "CURRENT" | "BLOCKED">("CHECKING");
  const [subject, setSubject] = useState("BrAeyenstation shared command");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [replyKind, setReplyKind] = useState<"REPLY" | "BLOCKER">("REPLY");
  const [status, setStatus] = useState("Harvey is checking whether this browser has a Synapse route.");
  const [busy, setBusy] = useState(false);
  const pendingBenWriteRef = useRef<PendingSynapseWrite | null>(null);
  const pendingRoleWriteRef = useRef<PendingSynapseWrite | null>(null);

  const refresh = useCallback(async (activeRoute: HarveySynapseRoute) => {
    const response = await fetch(activeRoute.url, { cache: "no-store", credentials: activeRoute.credentials });
    const body = await response.json() as Envelope & { error?: string };
    if (!response.ok || !body.ok) throw new Error(body.error ?? "SYNAPSE_READ_FAILED");
    setEnvelope(body);
    setTransport("CURRENT");
    return body;
  }, []);

  const post = useCallback(async (activeRoute: HarveySynapseRoute, body: Record<string, unknown>) => {
    const response = await fetch(activeRoute.url, {
      method: "POST",
      credentials: activeRoute.credentials,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    let result: Envelope & { error?: string };
    try {
      result = await response.json() as Envelope & { error?: string };
    } catch {
      const error = new Error(response.ok ? "SYNAPSE_WRITE_RESPONSE_INVALID" : "SYNAPSE_WRITE_REJECTED") as SynapseWriteError;
      error.confirmedRejected = isConfirmedPrewriteRejection(response.status);
      throw error;
    }
    if (!response.ok) {
      const error = new Error(result.error ?? "SYNAPSE_WRITE_REJECTED") as SynapseWriteError;
      error.confirmedRejected = isConfirmedPrewriteRejection(response.status);
      throw error;
    }
    if (!result.ok) throw new Error(result.error ?? "SYNAPSE_WRITE_RESULT_UNKNOWN");
    setEnvelope(result);
    setTransport("CURRENT");
    return result;
  }, []);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;
    const connect = async () => {
      const readyRoute = await harveySynapseRouteReady();
      if (!active) return;
      setRoute(readyRoute);
      if (!readyRoute) {
        setTransport("BLOCKED");
        setStatus("No authenticated Synapse route is bound yet. Harvey will retry automatically; nothing has been posted or read.");
        timer = window.setTimeout(connect, 1_500);
        return;
      }
      setStatus(readyRoute.mode === "DOSS_LOOPBACK"
        ? "Doss loopback is connected. Swanson remains a role claim until a task-local receiver reads back the message."
        : "Sally's paired browser session is connected. Dink remains a role claim until a task-local receiver reads back the message.");
      const poll = async () => {
        try {
          await refresh(readyRoute);
          if (active) timer = window.setTimeout(poll, 2500);
        }
        catch (error) {
          if (active) {
            setRoute(null);
            setTransport("BLOCKED");
            setStatus(`${error instanceof Error ? error.message : "SYNAPSE_READ_FAILED"}. The transcript was not replaced with guessed state.`);
            timer = window.setTimeout(connect, 1_500);
          }
        }
      };
      void poll();
    };
    void connect();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [refresh]);

  const synapse = envelope?.projection.synapse ?? null;
  const latestBenEntry = useMemo(() => [...(synapse?.entries ?? [])].reverse().find((entry) => entry.author_seat === "BEN" && ["INSTRUCTION", "BEN_FOLLOWUP"].includes(entry.kind)), [synapse]);

  async function submitBenMessage() {
    if (!route || transport !== "CURRENT" || busy) return;
    if (!message.trim()) {
      setStatus("Type the shared message first, then press SEND.");
      return;
    }
    setBusy(true);
    const signature = JSON.stringify({ subject: subject.trim(), body: message.trim() });
    try {
      const pending = pendingBenWriteRef.current;
      const submissionId = pending?.signature === signature ? pending.id : newSubmissionId();
      const request = pending?.signature === signature
        ? pending.request
        : synapse
          ? { action: "BEN_FOLLOWUP", synapse_id: synapse.synapse_id, submission_id: submissionId, body: message.trim() }
          : { action: "CREATE", submission_id: submissionId, verb: "VERIFY", subject: subject.trim(), body: message.trim() };
      pendingBenWriteRef.current = { id: submissionId, signature, request };
      await post(route, request);
      pendingBenWriteRef.current = null;
      setMessage("");
      setStatus("SENT TO HARVEY'S SHARED LEDGER. Awaiting Aeye readback; no task receipt has been claimed yet.");
    } catch (error) {
      const confirmedRejected = error instanceof Error && Boolean((error as SynapseWriteError).confirmedRejected);
      setStatus(confirmedRejected
        ? `BLOCKED — NOT RECORDED. ${error.message}. Your draft remains here.`
        : `${error instanceof Error ? error.message : "SYNAPSE_WRITE_FAILED"}. RESULT UNKNOWN. Your draft remains here; press SEND again to retry the same submission safely.`);
    } finally { setBusy(false); }
  }

  async function submitRoleReply() {
    if (!route || transport !== "CURRENT" || !synapse || !latestBenEntry || busy) return;
    if (!reply.trim()) {
      setStatus("Type the role reply first. Nothing was recorded.");
      return;
    }
    setBusy(true);
    const signature = JSON.stringify({ kind: replyKind, body: reply.trim() });
    try {
      const pending = pendingRoleWriteRef.current;
      const submissionId = pending?.signature === signature ? pending.id : newSubmissionId();
      const request = pending?.signature === signature ? pending.request : {
          action: "REPLY",
          synapse_id: synapse.synapse_id,
          submission_id: submissionId,
          reply_to: latestBenEntry.entry_id,
          kind: replyKind,
          body: reply.trim()
        };
      pendingRoleWriteRef.current = { id: submissionId, signature, request };
      await post(route, request);
      pendingRoleWriteRef.current = null;
      setReply("");
      setStatus("Role reply recorded in the shared transcript. It proves this authenticated machine session wrote the reply; it does not prove a specific Codex task identity.");
    } catch (error) {
      const confirmedRejected = error instanceof Error && Boolean((error as SynapseWriteError).confirmedRejected);
      setStatus(confirmedRejected
        ? `BLOCKED — NOT RECORDED. ${error.message}. Your reply remains here.`
        : `${error instanceof Error ? error.message : "SYNAPSE_REPLY_FAILED"}. RESULT UNKNOWN. Your reply remains here; press ADD TO SHARED TIMELINE again to retry the same submission safely.`);
    } finally { setBusy(false); }
  }

  const viewerCopy = envelope?.viewer.seat ? SEAT_COPY[envelope.viewer.seat] : null;

  return (
    <section id="harvey-shared-ledger" data-testid="harvey-synapse" aria-labelledby="harvey-synapse-title" style={{ maxWidth: 1200, margin: "0 auto 24px", padding: "clamp(18px,3vw,30px)", border: "2px solid #18c5ae", borderRadius: 18, background: "linear-gradient(145deg,#10211f,#0d1214)", boxShadow: "0 18px 60px rgba(0,0,0,.3)", scrollMarginTop: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "start", gap: 16 }}>
        <div>
          <p style={{ color: "#78f1df", fontWeight: 950, letterSpacing: 1.6, margin: 0 }}>COMMAND LINE 2 · SHARED SYNAPSE / THREE SEATS</p>
          <h2 id="harvey-synapse-title" style={{ color: "#fff4d6", fontSize: "clamp(26px,4vw,44px)", margin: "7px 0" }}>What do you want all three of us to hear?</h2>
          <strong style={{ display: "block", color: "#fff4d6", marginBottom: 7 }}>Ben + Swanson@Doss + Dink@Sally</strong>
          <p style={{ color: "#d6dbd7", lineHeight: 1.55, maxWidth: 850, margin: 0 }}>Post once. Both authenticated machine views display the same ledger and can add role-claimed responses to one timeline. Pairing proves a machine session—not an Aeye task—so Harvey keeps those truths separate.</p>
        </div>
        <div data-testid="synapse-route" style={{ border: "1px solid #41645f", background: "#0a1716", borderRadius: 10, padding: "10px 13px", minWidth: 230 }}>
          <small style={{ color: "#aeb6b0" }}>THIS VIEW</small>
          <strong style={{ display: "block", color: transport === "CURRENT" ? "#8ef0ae" : "#ffcc73", marginTop: 4 }}>{transport === "CURRENT" && viewerCopy ? `${viewerCopy.title} · ${viewerCopy.subtitle}` : "ROUTE UNBOUND"}</strong>
          <small style={{ color: "#c7d1cc" }}>Projection {transport.toLowerCase()}</small>
          {synapse && <small data-testid="synapse-aggregate" style={{ display: "block", color: "#fff4d6", marginTop: 6, fontWeight: 800 }}>{synapse.aggregate_state.replaceAll("_", " ")}</small>}
        </div>
      </div>

      <div data-testid="synapse-seat-wall" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(220px,100%),1fr))", gap: 10, margin: "18px 0" }}>
        {(synapse?.seat_states ?? ([
          { seat: "BEN", role_claim: "Operator", machine: null, state: "OPERATOR_MESSAGE_POSTED", last_entry_at: null },
          { seat: "SWANSON_DOSS", role_claim: "Swanson", machine: "Doss", state: "ROUTE_UNBOUND", last_entry_at: null },
          { seat: "DINK_SALLY", role_claim: "Dink", machine: "Sally", state: "ROUTE_UNBOUND", last_entry_at: null }
        ] as SeatState[])).map((seat) => (
          <article key={seat.seat} data-testid={`synapse-seat-${seat.seat.toLowerCase()}`} style={{ border: `1px solid ${seatColor(seat.state)}`, borderLeftWidth: 4, borderRadius: 11, padding: 13, background: "#0d1415" }}>
            <strong style={{ color: "#fff4d6", fontSize: 18 }}>{SEAT_COPY[seat.seat].title}</strong>
            <small style={{ display: "block", color: "#aeb6b0", margin: "3px 0 8px" }}>{SEAT_COPY[seat.seat].subtitle}</small>
            <span style={{ color: seatColor(seat.state), fontWeight: 850 }}>{STATE_COPY[seat.state]}</span>
          </article>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(320px,100%),1fr))", gap: 16 }}>
        <div style={{ border: "1px solid #46504b", borderRadius: 12, padding: 15, background: "#0b1012" }}>
          <h3 style={{ color: "#fff4d6", margin: 0 }}>Ben writes once</h3>
          {!synapse && <label style={{ color: "#d6dbd7", display: "block", marginTop: 10 }}>Subject
            <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={120} style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 5, padding: 11, borderRadius: 9, border: "1px solid #57605b", background: "#111719", color: "#fff", font: "inherit" }} />
          </label>}
          <label style={{ color: "#d6dbd7", display: "block", marginTop: 10 }}>Shared message
            <textarea data-testid="synapse-ben-message" value={message} onChange={(event) => setMessage(event.target.value)} rows={4} maxLength={1024} placeholder="Tell both Aeyes the same thing here." style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 5, padding: 12, borderRadius: 9, border: "1px solid #57605b", background: "#111719", color: "#fff", font: "inherit", lineHeight: 1.5, resize: "vertical" }} />
          </label>
          <button type="button" data-testid="synapse-post-once" disabled={!route || transport !== "CURRENT" || busy} onClick={() => void submitBenMessage()} style={{ marginTop: 10, border: 0, borderRadius: 9, padding: "13px 24px", background: route && transport === "CURRENT" && !busy ? "#18c5ae" : "#38413f", color: route && transport === "CURRENT" && !busy ? "#07110f" : "#c0c7c3", fontWeight: 950, fontSize: 18, cursor: route && transport === "CURRENT" && !busy ? "pointer" : "not-allowed" }}>{busy ? "SENDINGâ€¦" : "SEND TO SHARED HARVEY"}</button>
          <p style={{ color: "#ffcc73", fontSize: 13, lineHeight: 1.45, margin: "9px 0 0" }}>No passwords, codes, tokens, recovery material, or secrets. Posted is not read back.</p>
        </div>

        <div style={{ border: "1px solid #46504b", borderRadius: 12, padding: 15, background: "#0b1012" }}>
          <h3 style={{ color: "#fff4d6", margin: 0 }}>{viewerCopy ? `${viewerCopy.title} role response` : "Aeye role response"}</h3>
          <p style={{ color: "#aeb6b0", fontSize: 13, lineHeight: 1.45 }}>This records the authenticated machine-session role. It does not prove which Codex task authored the words.</p>
          <label style={{ color: "#d6dbd7" }}>Response type
            <select value={replyKind} onChange={(event) => setReplyKind(event.target.value as "REPLY" | "BLOCKER")} style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 5, padding: 10, borderRadius: 9, border: "1px solid #57605b", background: "#111719", color: "#fff", font: "inherit" }}><option value="REPLY">REPLY</option><option value="BLOCKER">BLOCKER</option></select>
          </label>
          <textarea data-testid="synapse-role-reply" value={reply} onChange={(event) => setReply(event.target.value)} rows={4} maxLength={1024} placeholder="The machine-local Aeye's reply belongs here." style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 10, padding: 12, borderRadius: 9, border: "1px solid #57605b", background: "#111719", color: "#fff", font: "inherit", lineHeight: 1.5, resize: "vertical" }} />
          <button type="button" data-testid="synapse-post-reply" disabled={!route || transport !== "CURRENT" || !synapse || !latestBenEntry || busy} onClick={() => void submitRoleReply()} style={{ marginTop: 10, border: "1px solid #78f1df", borderRadius: 9, padding: "10px 14px", background: route && transport === "CURRENT" && synapse && latestBenEntry && !busy ? "#14302c" : "#252b2a", color: route && transport === "CURRENT" && synapse && latestBenEntry && !busy ? "#a6fff1" : "#89928c", fontWeight: 900, cursor: route && transport === "CURRENT" && synapse && latestBenEntry && !busy ? "pointer" : "not-allowed" }}>ADD TO SHARED TIMELINE</button>
        </div>
      </div>

      <div role="status" aria-live="polite" data-testid="synapse-status" style={{ marginTop: 14, border: "1px solid #46504b", borderRadius: 10, padding: 12, background: "#0b1012", color: "#d6dbd7" }}>{status}</div>

      <div data-testid="synapse-timeline" aria-label="Shared Synapse timeline" style={{ display: "grid", gap: 9, marginTop: 16 }}>
        {!synapse && <div style={{ border: "1px dashed #59605c", borderRadius: 10, padding: 16, color: "#c8cec9" }}>No shared workstream exists yet. Ben's first post creates one envelope addressed to both machine seats.</div>}
        {synapse?.entries.map((entry) => (
          <article key={entry.entry_id} data-testid={`synapse-entry-${entry.sequence}`} style={{ marginLeft: entry.author_seat === "BEN" ? 0 : "clamp(0px,6vw,64px)", border: `1px solid ${entry.kind === "BLOCKER" ? "#a55343" : entry.kind === "PRESENTED" ? "#365b68" : "#43524d"}`, borderRadius: 11, padding: entry.kind === "PRESENTED" ? 10 : 14, background: entry.author_seat === "BEN" ? "#17160f" : "#0d1516" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
              <strong style={{ color: entry.author_seat === "BEN" ? "#fff4d6" : "#a6fff1" }}>{SEAT_COPY[entry.author_seat].title} · {entryLabel(entry)}</strong>
              <small style={{ color: "#aeb6b0" }}>{new Date(entry.created_at).toLocaleString()}</small>
            </div>
            <p style={{ color: "#edf0e8", lineHeight: 1.55, whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: "8px 0 0" }}>{entry.body ?? "This machine session displayed the exact operator message. Aeye-task receipt is still unproven."}</p>
            <details style={{ marginTop: 7, color: "#aeb6b0", fontSize: 12 }}><summary>Proof</summary><code style={{ overflowWrap: "anywhere" }}>{entry.entry_id} · {entry.entry_sha256.slice(0, 16)} · {entry.authenticated_route}</code></details>
          </article>
        ))}
      </div>
    </section>
  );
}
