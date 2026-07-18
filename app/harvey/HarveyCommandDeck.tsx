"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useHarveySnapshotState } from "./HarveyLiveCockpit";
import { harveyCommandRouteReady, harveyTaskBridgeRouteReady, type HarveyCommandRoute, type HarveyTaskBridgeRoute } from "./operator-bridge";

type Verb = "VERIFY" | "PREPARE" | "GO" | "KNOCK";
type Stage = "DRAFT" | "QUEUING" | "QUEUED_LOCAL" | "QUEUED_CLOUD" | "ROUTE_BLOCKED" | "RESULT_UNKNOWN";
type DirectAttemptStage = "IDLE" | "DRAFT" | "SENDING" | "REJECTED" | "RESULT_UNKNOWN";
type HarveyProjectCommandDetail = { target: string; instruction?: string };
type DirectState = "QUEUED" | "DELIVERED" | "THINKING" | "REPLIED" | "COMPLETED" | "BLOCKER";
type DirectBinding = {
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
type DirectDispatch = {
  dispatch_id: string;
  binding_id: string;
  thread_id: string;
  binding_snapshot: Omit<DirectBinding, "state" | "proof" | "busy">;
  state: DirectState;
  body: string;
  reply: string | null;
  error: string | null;
  usage: { input_tokens: number; cached_input_tokens: number; output_tokens: number } | null;
  events: Array<{ sequence: number; type: DirectState; at: string; detail: string }>;
};
type DirectEnvelope = {
  viewer: { route: "DOSS_LOOPBACK" | "SALLY_PAIRED_SESSION"; binding_scope: string; task_identity_proven_by: string };
  bridge: {
    truth_rule: string;
    limits: { max_records: number; per_thread_hour: number; per_thread_day: number; provider_billing: string; budget_basis: string };
    bindings: DirectBinding[];
    dispatches: DirectDispatch[];
  };
};
type CloudCounts = { total: number; queued: number; claimed: number; working: number; completed: number; blocked: number; awaiting_receiver: number };
type CloudCommand = { command_id: string; verb: Verb; target: string; instruction: string; status: string };
type CloudReceipt = { receipt_id: string; delivery_id: string; receiver_id: string; state: "CLAIMED" | "WORKING" | "REPLIED" | "COMPLETED" | "BLOCKED"; detail: string; reply: string | null; recorded_at: string; sequence: number };

const STAGES = ["Draft", "Queued", "Sending", "Received", "Working", "Completed / Blocked"] as const;
const DIRECT_STEPS: DirectState[] = ["QUEUED", "DELIVERED", "THINKING", "REPLIED", "COMPLETED"];
const VERB_HELP: Record<Verb, string> = {
  VERIFY: "Check authoritative truth without changing the target.",
  PREPARE: "Prepare reversible work and evidence, but do not launch the final action.",
  GO: "Authorize the described work inside the target lane's existing authority.",
  KNOCK: "Ask the target to fetch its current cockpit assignment."
};

function newSubmissionId() {
  if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") throw new Error("WORK_ORDER_CSPRNG_UNAVAILABLE");
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function isConfirmedPrewriteRejection(status: number) {
  return [400, 401, 403, 404, 413, 422, 429].includes(status);
}

async function readHarveyJson(response: Response) {
  const text = await response.text();
  if (text.length > 128 * 1024) throw new Error("HARVEY_RESPONSE_TOO_LARGE");
  try { return JSON.parse(text) as Record<string, any>; }
  catch { throw new Error(response.ok ? "HARVEY_RESPONSE_INVALID" : `HARVEY_HTTP_${response.status}_NON_JSON`); }
}

export default function HarveyCommandDeck({ targets }: { targets: string[] }) {
  const { snapshot, transport } = useHarveySnapshotState();
  const [instruction, setInstruction] = useState("");
  const [target, setTarget] = useState(targets[0] ?? "Harvey crew");
  const [verb, setVerb] = useState<Verb>("VERIFY");
  const [stage, setStage] = useState<Stage>("DRAFT");
  const [commandRoute, setCommandRoute] = useState<HarveyCommandRoute | null>(null);
  const [taskRoute, setTaskRoute] = useState<HarveyTaskBridgeRoute | null>(null);
  const [taskEnvelope, setTaskEnvelope] = useState<DirectEnvelope | null>(null);
  const [dispatchId, setDispatchId] = useState("");
  const [taskStatus, setTaskStatus] = useState("Harvey is checking for one exact direct Aeye task.");
  const [directAttemptStage, setDirectAttemptStage] = useState<DirectAttemptStage>("IDLE");
  const [directAttemptMessage, setDirectAttemptMessage] = useState("");
  const [directSending, setDirectSending] = useState(false);
  const [message, setMessage] = useState("Type what you want done. Harvey will keep it here until you choose an order.");
  const [workOrderId, setWorkOrderId] = useState("");
  const [cloudCommandId, setCloudCommandId] = useState("");
  const [cloudCommandStatus, setCloudCommandStatus] = useState("");
  const [cloudCounts, setCloudCounts] = useState<CloudCounts | null>(null);
  const [cloudCommand, setCloudCommand] = useState<CloudCommand | null>(null);
  const [cloudReceipts, setCloudReceipts] = useState<CloudReceipt[]>([]);
  const queueingRef = useRef(false);
  const instructionRef = useRef<HTMLTextAreaElement>(null);
  const pendingSubmissionRef = useRef<{ id: string; signature: string } | null>(null);
  const pendingDirectSubmissionRef = useRef<{ id: string; signature: string } | null>(null);
  const taskPollBusyRef = useRef(false);
  const targetTouchedRef = useRef(false);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;
    const checkRoute = async () => {
      const readyRoute = await harveyCommandRouteReady();
      if (!active) return;
      setCommandRoute(readyRoute);
      timer = window.setTimeout(checkRoute, readyRoute ? 5_000 : 1_500);
    };
    void checkRoute();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!cloudCommandId || commandRoute?.mode !== "HARVEY_CLOUD") return;
    let disposed = false;
    let busy = false;
    const refresh = async () => {
      if (busy) return;
      busy = true;
      try {
        const response = await fetch(`${commandRoute.url}?command_id=${encodeURIComponent(cloudCommandId)}`, { cache: "no-store", credentials: commandRoute.credentials });
        const body = await readHarveyJson(response);
        if (!response.ok) throw new Error(body.error ?? "HARVEY_RELAY_STATUS_READ_FAILED");
        if (disposed) return;
        const counts = body.relay.counts as CloudCounts;
        setCloudCounts(counts);
        setCloudCommand(body.relay.command as CloudCommand);
        setCloudReceipts(Array.isArray(body.relay.receipts) ? body.relay.receipts as CloudReceipt[] : []);
        setCloudCommandStatus(String(body.relay.command.status));
        setMessage(`${counts.total} named Harvey inboxes · ${counts.queued} waiting pickup · ${counts.claimed} claimed · ${counts.working} working/replied · ${counts.completed} completed · ${counts.blocked} blocked · ${counts.awaiting_receiver} awaiting a receiver.`);
      } catch (error) {
        if (!disposed) setMessage(`${error instanceof Error ? error.message : "HARVEY_RELAY_STATUS_READ_FAILED"}. The command id is preserved; delivery status is temporarily unavailable.`);
      } finally {
        busy = false;
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2_000);
    return () => { disposed = true; window.clearInterval(timer); };
  }, [cloudCommandId, commandRoute]);

  const refreshTaskBridge = useCallback(async (candidate: HarveyTaskBridgeRoute) => {
    if (taskPollBusyRef.current) return false;
    taskPollBusyRef.current = true;
    try {
      const response = await fetch(candidate.url, { cache: "no-store", credentials: candidate.credentials });
      const body = await readHarveyJson(response) as unknown as DirectEnvelope & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "TASK_BRIDGE_READ_FAILED");
      setTaskEnvelope(body);
      const firstBinding = body.bridge.bindings[0];
      if (firstBinding && !targetTouchedRef.current && !(instructionRef.current?.value ?? "").trim()) setTarget(`direct:${firstBinding.binding_id}`);
      setTaskStatus(`Direct route current to ${firstBinding ? `${firstBinding.label}@${firstBinding.machine}` : "no bound Aeye"}.`);
      return true;
    } catch (error) {
      setTaskRoute(null);
      setTaskStatus(`${error instanceof Error ? error.message : "TASK_BRIDGE_READ_FAILED"}. Direct task send is unavailable; Harvey will retry.`);
      return false;
    } finally {
      taskPollBusyRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (taskRoute) return;
    let disposed = false;
    let retryTimer: number | undefined;
    const discover = async () => {
      const candidate = await harveyTaskBridgeRouteReady();
      if (disposed) return;
      if (!candidate) {
        setTaskRoute(null);
        setTaskStatus("DIRECT TASK ROUTE UNBOUND. Harvey will retry automatically.");
        retryTimer = window.setTimeout(discover, 1_500);
        return;
      }
      const current = await refreshTaskBridge(candidate);
      if (disposed) return;
      if (current) setTaskRoute(candidate);
      else retryTimer = window.setTimeout(discover, 1_500);
    };
    void discover();
    return () => {
      disposed = true;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [refreshTaskBridge, taskRoute]);

  useEffect(() => {
    if (!taskRoute) return;
    const timer = window.setInterval(() => void refreshTaskBridge(taskRoute), 1_000);
    return () => window.clearInterval(timer);
  }, [refreshTaskBridge, taskRoute]);
  useEffect(() => {
    function receiveProjectCommand(event: Event) {
      if (queueingRef.current) {
        setMessage("Harvey is still writing the current order. Wait for that result before changing projects.");
        return;
      }
      const detail = (event as CustomEvent<HarveyProjectCommandDetail>).detail;
      if (!detail || !targets.includes(detail.target)) return;
      targetTouchedRef.current = true;
      setTarget(detail.target);
      pendingSubmissionRef.current = null;
      pendingDirectSubmissionRef.current = null;
      setStage("DRAFT");
      setWorkOrderId("");
      setInstruction((current) => {
        if (detail.instruction && !current.trim()) {
          setMessage(`Loaded ${detail.target}'s next two recorded moves. Review or edit them, then choose V, P, G, or K.`);
          return detail.instruction;
        }
        setMessage(current.trim()
          ? `Target changed to ${detail.target}. Your existing draft was preserved.`
          : `${detail.target} is now addressed. Type the instruction, then choose V, P, G, or K.`);
        return current;
      });
      window.requestAnimationFrame(() => {
        document.getElementById("harvey-command-deck")?.scrollIntoView({ behavior: "smooth", block: "start" });
        instructionRef.current?.focus({ preventScroll: true });
      });
    }
    window.addEventListener("harvey:command-project", receiveProjectCommand);
    return () => window.removeEventListener("harvey:command-project", receiveProjectCommand);
  }, [targets]);
  const directBindingId = target.startsWith("direct:") ? target.slice("direct:".length) : "";
  const selectedBinding = taskEnvelope?.bridge.bindings.find((binding) => binding.binding_id === directBindingId) ?? null;
  const activeDirectDispatch = useMemo(() => {
    if (!taskEnvelope || !selectedBinding) return null;
    if (dispatchId) return taskEnvelope.bridge.dispatches.find((dispatch) => dispatch.dispatch_id === dispatchId && dispatch.binding_id === selectedBinding.binding_id) ?? null;
    return taskEnvelope.bridge.dispatches.find((dispatch) => dispatch.binding_id === selectedBinding.binding_id) ?? null;
  }, [dispatchId, selectedBinding, taskEnvelope]);
  const displayedDirectDispatch = directAttemptStage === "IDLE" && !directSending ? activeDirectDispatch : null;
  const targetLabel = selectedBinding ? `${selectedBinding.label}@${selectedBinding.machine} · ${selectedBinding.provider} · DIRECT` : target;
  const liveCount = useMemo(() => transport === "CURRENT" ? snapshot.machines.filter((machine) => machine.connectivity === "LIVE").length : 0, [snapshot, transport]);
  const reached = stage === "QUEUED_LOCAL" ? 1
    : stage === "QUEUED_CLOUD" && cloudCounts && cloudCounts.total > 0 && cloudCounts.completed + cloudCounts.blocked === cloudCounts.total ? 5
      : stage === "QUEUED_CLOUD" && cloudCounts && cloudCounts.working > 0 ? 4
        : stage === "QUEUED_CLOUD" && cloudCounts && cloudCounts.claimed > 0 ? 3
          : stage === "QUEUED_CLOUD" ? 1 : 0;
  const directState = displayedDirectDispatch?.state ?? null;
  const directReached = directState === "BLOCKER" ? -1 : directState ? DIRECT_STEPS.indexOf(directState) : -1;
  const directDispatchOutsideWindow = Boolean(directAttemptStage === "IDLE" && dispatchId && taskEnvelope && !activeDirectDispatch);
  const directDisplayState = directAttemptStage === "SENDING" || directSending ? "SENDING — ACCEPTANCE NOT CONFIRMED"
    : directAttemptStage === "RESULT_UNKNOWN" ? "RESULT UNKNOWN — SAFE RETRY AVAILABLE"
      : directAttemptStage === "REJECTED" ? "BLOCKED — NOT SENT"
        : directAttemptStage === "DRAFT" ? "DRAFT — NOT SENT"
    : directDispatchOutsideWindow ? "OUTSIDE CURRENT WINDOW"
      : directState ?? (taskRoute ? "DIRECT READY" : "DIRECT ROUTE UNBOUND");
  const directStateMessage = directAttemptStage !== "IDLE" ? directAttemptMessage
    : directDispatchOutsideWindow ? "Your selected conversation is outside Harvey's two-record live window. Harvey will not substitute another task's message or reply."
    : directState === "QUEUED" ? "Harvey durably accepted the message and is starting the exact bound task."
    : directState === "DELIVERED" ? "The provider resumed the exact allowlisted task id."
      : directState === "THINKING" ? "The exact bound task emitted turn.started and is working."
        : directState === "REPLIED" ? "The exact task returned a screened reply; Harvey is waiting for turn completion."
          : directState === "COMPLETED" ? "The exact provider turn completed after the reply."
            : directState === "BLOCKER" ? "Harvey stopped the direct route fail-closed. See the blocker below."
              : taskStatus;

  function reviseDraft() {
    pendingSubmissionRef.current = null;
    pendingDirectSubmissionRef.current = null;
    setCloudCommandId("");
    setCloudCommandStatus("");
    setCloudCounts(null);
    setCloudCommand(null);
    setCloudReceipts([]);
    setDirectAttemptStage("DRAFT");
    setDirectAttemptMessage("This instruction is a draft for the selected Aeye. Nothing was sent.");
    if (stage !== "DRAFT") {
      setStage("DRAFT");
      setWorkOrderId("");
      setMessage("Your edited instruction is a new draft. The earlier queued order, if any, was not changed.");
    }
  }

  async function sendDirect(binding: DirectBinding) {
    if (!taskRoute || directSending || binding.busy) {
      setDirectAttemptStage("REJECTED");
      setDirectAttemptMessage(binding.busy ? "The exact Aeye task already has an active turn. Harvey will not overlap it." : "DIRECT TASK ROUTE UNBOUND. Your instruction remains here; nothing was sent.");
      return;
    }
    const directBody = `${verb} · ${instruction.trim()}`;
    const signature = JSON.stringify({ bindingId: binding.binding_id, body: directBody });
    let submissionId: string;
    try {
      const pending = pendingDirectSubmissionRef.current;
      submissionId = pending?.signature === signature ? pending.id : newSubmissionId();
      pendingDirectSubmissionRef.current = { id: submissionId, signature };
    } catch (error) {
      setDirectAttemptStage("REJECTED");
      setDirectAttemptMessage(`${error instanceof Error ? error.message : "TASK_BRIDGE_CSPRNG_UNAVAILABLE"}. Your instruction remains here; nothing was sent.`);
      return;
    }
    setDirectSending(true);
    setDirectAttemptStage("SENDING");
    setDirectAttemptMessage(`SENDING · Harvey is attempting delivery to exact task ${binding.thread_id}. Durable acceptance is not confirmed yet.`);
    let confirmedRejected = false;
    try {
      const response = await fetch(taskRoute.url, {
        method: "POST",
        credentials: taskRoute.credentials,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId, binding_id: binding.binding_id, body: directBody })
      });
      confirmedRejected = isConfirmedPrewriteRejection(response.status);
      const body = await readHarveyJson(response) as unknown as DirectEnvelope & { dispatch: DirectDispatch; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "TASK_BRIDGE_WRITE_FAILED");
      }
      setTaskEnvelope(body);
      setDispatchId(body.dispatch.dispatch_id);
      pendingDirectSubmissionRef.current = null;
      setDirectAttemptStage("IDLE");
      setDirectAttemptMessage("");
      setTaskStatus("QUEUED · Harvey durably accepted the message and is starting the exact bound task.");
    } catch (error) {
      setDirectAttemptStage(confirmedRejected ? "REJECTED" : "RESULT_UNKNOWN");
      setDirectAttemptMessage(confirmedRejected
        ? `${error instanceof Error ? error.message : "TASK_BRIDGE_WRITE_FAILED"}. The exact route rejected this attempt; your instruction remains here.`
        : `${error instanceof Error ? error.message : "TASK_BRIDGE_WRITE_FAILED"}. RESULT UNKNOWN. Your instruction remains here; press SEND again to retry the same submission safely.`);
    } finally {
      setDirectSending(false);
    }
  }

  async function queueOrder() {
    if (queueingRef.current) {
      setMessage("Harvey is already writing this order. The second click was not queued.");
      return;
    }
    setWorkOrderId("");
    setCloudCommand(null);
    setCloudReceipts([]);
    if (!instruction.trim()) {
      if (selectedBinding) {
        setDirectAttemptStage("DRAFT");
        setDirectAttemptMessage("Type what you want the bound Aeye to do first. Nothing was sent.");
      }
      else {
        setStage("ROUTE_BLOCKED");
        setMessage("Tell Harvey what you want done first. Nothing was queued.");
      }
      return;
    }
    if (selectedBinding) {
      await sendDirect(selectedBinding);
      return;
    }
    if (!commandRoute) {
      setStage("ROUTE_BLOCKED");
      setMessage("This browser can see Harvey, but it is not a paired operator seat. Your instruction is still here and nothing was sent.");
      return;
    }
    const signature = JSON.stringify({ verb, target, instruction: instruction.trim() });
    let submissionId: string;
    try {
      const pending = pendingSubmissionRef.current;
      submissionId = pending?.signature === signature ? pending.id : newSubmissionId();
      pendingSubmissionRef.current = { id: submissionId, signature };
    } catch (error) {
      setStage("ROUTE_BLOCKED");
      setMessage(`${error instanceof Error ? error.message : "WORK_ORDER_CSPRNG_UNAVAILABLE"}. Your instruction is still here and nothing was sent.`);
      return;
    }
    setStage("QUEUING");
    queueingRef.current = true;
    setMessage(commandRoute.mode === "HARVEY_CLOUD" ? "Harvey is writing one durable delivery per addressed Aeye inbox." : "Harvey is writing your order to the local command queue.");
    let confirmedRejected = false;
    try {
      const response = await fetch(commandRoute.url, {
        method: "POST",
        credentials: commandRoute.credentials,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId, verb, target, instruction })
      });
      confirmedRejected = isConfirmedPrewriteRejection(response.status);
      const body = await readHarveyJson(response);
      if (!response.ok) {
        throw new Error(body.error ?? "WORK_ORDER_CREATE_FAILED");
      }
      setWorkOrderId(String(body.work_order.work_order_id));
      pendingSubmissionRef.current = null;
      if (commandRoute.mode === "HARVEY_CLOUD") {
        const counts: CloudCounts = {
          total: Number(body.work_order.recipient_count ?? 0),
          queued: Number(body.work_order.queued_count ?? 0),
          claimed: Number(body.work_order.claimed_count ?? 0),
          working: Number(body.work_order.working_count ?? 0),
          completed: Number(body.work_order.terminal_count ?? 0),
          blocked: 0,
          awaiting_receiver: Number(body.work_order.awaiting_receiver_count ?? 0)
        };
        setCloudCommandId(String(body.work_order.command_id));
        setCloudCommandStatus(String(body.work_order.status));
        setCloudCounts(counts);
        setStage("QUEUED_CLOUD");
        setMessage(`${counts.total} named Harvey inboxes created · ${counts.queued} queued for receiver pickup · ${counts.awaiting_receiver} awaiting a receiver. Inbox delivery is proven; Aeye receipt is not claimed until pickup.`);
      } else {
        setStage("QUEUED_LOCAL");
        setMessage("Queued safely on Doss. No courier route has claimed it yet, so Harvey has not called it sent or received.");
      }
    } catch (error) {
      setStage(confirmedRejected ? "ROUTE_BLOCKED" : "RESULT_UNKNOWN");
      setMessage(confirmedRejected
        ? `${error instanceof Error ? error.message : "WORK_ORDER_CREATE_FAILED"}. The route rejected this attempt; your instruction is still here and nothing was queued.`
        : `${error instanceof Error ? error.message : "WORK_ORDER_CREATE_FAILED"}. RESULT UNKNOWN. Your instruction is still here; press SEND again to retry the same submission safely.`);
    } finally {
      queueingRef.current = false;
    }
  }

  return (<>
    <a
      href="#harvey-command-deck"
      data-testid="harvey-command-jump"
      style={{ position: "fixed", right: 16, bottom: 16, zIndex: 100, border: "2px solid #fff4d6", borderRadius: 999, padding: "11px 16px", background: "#18c5ae", color: "#07110f", boxShadow: "0 8px 28px rgba(0,0,0,.55)", fontWeight: 950, fontSize: 14, textDecoration: "none", letterSpacing: 0.5 }}
    >
      COMMAND HARVEY
    </a>
    <section id="harvey-command-deck" data-testid="harvey-command-deck" aria-labelledby="harvey-local-work-order-title" style={{ maxWidth: 1200, margin: "0 auto 24px", padding: "clamp(18px,3vw,30px)", border: "3px solid #ffcc73", borderRadius: 18, background: "linear-gradient(145deg,#19170f,#101615)", boxShadow: "0 18px 60px rgba(0,0,0,.28)", scrollMarginTop: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "start", gap: 16 }}>
        <div>
          <p style={{ color: "#ffcc73", fontWeight: 900, letterSpacing: 1.4, margin: 0 }}>COMMAND LINE 1 · DIRECT AEYE / HARVEY CLOUD INBOX</p>
          <h1 id="harvey-local-work-order-title" style={{ color: "#fff4d6", fontSize: "clamp(25px,3.5vw,40px)", margin: "7px 0" }}>What do you want done?</h1>
          <p style={{ color: "#d6dbd7", lineHeight: 1.5, maxWidth: 800, margin: 0 }}>From private Harvey, SEND writes a durable inbox delivery for every addressed Aeye. Harvey calls it received only after a receiver claims it, and completed only after a receipt returns.</p>
        </div>
        <div style={{ display: "grid", gap: 7 }}>
          <div data-testid="harvey-command-route" style={{ padding: "9px 12px", borderRadius: 999, background: commandRoute ? "#183725" : "#392d18", color: commandRoute ? "#8ef0ae" : "#ffcc73", fontWeight: 800 }}>
            {commandRoute?.mode === "HARVEY_CLOUD" ? "Private Harvey cloud route connected" : commandRoute ? "Doss operator route connected" : "Viewing only · operator route unbound"}
          </div>
          <div data-testid="harvey-direct-route" style={{ padding: "9px 12px", borderRadius: 999, background: taskRoute && taskEnvelope?.bridge.bindings.length ? "#163334" : "#392d18", color: taskRoute && taskEnvelope?.bridge.bindings.length ? "#78f1df" : "#ffcc73", fontWeight: 800 }}>
            {taskRoute && taskEnvelope?.bridge.bindings.length ? `${taskEnvelope.bridge.bindings.length} DIRECT AEYE BOUND` : "DIRECT AEYE ROUTE UNBOUND"}
          </div>
        </div>
      </div>

      <div data-testid="harvey-command-address-bar" style={{ position: "sticky", top: 12, zIndex: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(280px,100%),1fr))", gap: 12, alignItems: "end", marginTop: 16, padding: 12, border: "2px solid #78f1df", borderRadius: 14, background: "rgba(9,18,18,.97)", boxShadow: "0 10px 30px rgba(0,0,0,.5)" }}>
        <label style={{ color: "#fff4d6", fontWeight: 950, letterSpacing: 1 }}>TO / ADDRESSEE
          <select data-testid="harvey-target" value={target} disabled={stage === "QUEUING" || directSending} onChange={(event) => { targetTouchedRef.current = true; setTarget(event.target.value); reviseDraft(); }} style={{ display: "block", width: "100%", marginTop: 6, padding: 13, borderRadius: 9, border: "2px solid #ffcc73", background: "#111719", color: "#fff", font: "inherit", fontSize: 17, fontWeight: 800 }}>
            <optgroup label="LIVE DIRECT AEYES">
              {(taskEnvelope?.bridge.bindings ?? []).map((binding) => <option key={binding.binding_id} value={`direct:${binding.binding_id}`}>{binding.label}@{binding.machine} · {binding.provider} · {binding.busy ? "WORKING" : "DIRECT"}</option>)}
              {!taskEnvelope?.bridge.bindings.length && <option value="direct-unbound" disabled>NO DIRECT AEYE ROUTE YET</option>}
            </optgroup>
            <optgroup label="HARVEY CLOUD INBOXES">
              {targets.map((item) => <option key={item} value={item}>{item} · CLOUD INBOX</option>)}
            </optgroup>
          </select>
        </label>
        <button
          type="button"
          data-testid="harvey-command-send"
          disabled={stage === "QUEUING" || directSending || Boolean(selectedBinding && (!taskRoute || selectedBinding.busy))}
          onClick={() => void queueOrder()}
          style={{ display: "block", width: "100%", border: "3px solid #fff4d6", borderRadius: 12, padding: "15px 20px", background: "#18c5ae", color: "#07110f", boxShadow: "0 8px 24px rgba(24,197,174,.26)", cursor: stage === "QUEUING" || directSending || Boolean(selectedBinding && (!taskRoute || selectedBinding.busy)) ? "not-allowed" : "pointer", opacity: stage === "QUEUING" || directSending || Boolean(selectedBinding && (!taskRoute || selectedBinding.busy)) ? .66 : 1, fontWeight: 1000, fontSize: 20, letterSpacing: 1.1 }}
        >
          {stage === "QUEUING" || directSending ? "SENDING…" : `SEND · ${verb} · ${selectedBinding ? `${selectedBinding.label}@${selectedBinding.machine}` : targetLabel}`}
        </button>
        <div data-testid="harvey-inline-status" role="status" aria-live="polite" style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: 8, padding: "9px 11px", borderRadius: 9, background: "#111719", color: "#d6dbd7", lineHeight: 1.4 }}>
          <strong style={{ color: selectedBinding ? directState === "THINKING" ? "#8fcfff" : directState === "COMPLETED" || directState === "REPLIED" ? "#8ef0ae" : directState === "BLOCKER" ? "#ff9a83" : "#78f1df" : stage === "ROUTE_BLOCKED" ? "#ff9a83" : stage === "RESULT_UNKNOWN" ? "#ffcc73" : stage === "QUEUED_LOCAL" || stage === "QUEUED_CLOUD" ? "#8ef0ae" : "#fff4d6" }}>
            STATUS: {selectedBinding ? directDisplayState : stage === "ROUTE_BLOCKED" ? "BLOCKED — NOT SENT" : stage === "RESULT_UNKNOWN" ? "RESULT UNKNOWN" : stage === "QUEUED_CLOUD" ? `CLOUD ${cloudCommandStatus || "QUEUED"}` : stage === "QUEUED_LOCAL" ? "QUEUED LOCALLY — NOT SENT" : stage}
          </strong>
          <span>{selectedBinding ? directStateMessage : message}</span>
        </div>
      </div>

      {selectedBinding && <div data-testid="harvey-direct-binding-proof" style={{ marginTop: 10, padding: 11, border: "1px solid #346b61", borderRadius: 10, background: "#0d1917", color: "#c7d1cc", lineHeight: 1.45 }}>
        <strong style={{ color: "#78f1df" }}>EXACT THREAD BOUND:</strong> {selectedBinding.label}@{selectedBinding.machine} · {selectedBinding.role} · task <code>{selectedBinding.thread_id}</code> · scope {selectedBinding.project_scope}
        <small style={{ display: "block", marginTop: 5, color: "#d6dbd7" }}><strong style={{ color: "#fff4d6" }}>CONTEXT:</strong> the current canonical Werkles checkout only. Harvey assumes no other account, machine, repository, or private thread context.</small>
        <small style={{ display: "block", marginTop: 5, color: "#aeb6b0" }}>{taskEnvelope?.bridge.truth_rule} No separate READ state is claimed.</small>
        <small data-testid="harvey-direct-cost-retention" style={{ display: "block", marginTop: 5, color: "#ffcc73" }}>Uses the currently configured Codex account or quota; billing mode and dollar cost are uninspected. Limit: {taskEnvelope?.bridge.limits.per_thread_hour} turns/hour and {taskEnvelope?.bridge.limits.per_thread_day} turns/day for this exact task. Messages and replies are local plaintext runtime records, excluded from Git, capped at {taskEnvelope?.bridge.limits.max_records}; automatic deletion is not implemented.</small>
      </div>}

      <label htmlFor="harvey-instruction" style={{ display: "block", color: "#edf0e8", fontWeight: 800, marginTop: 12 }}>Your instruction</label>
      <p data-testid="harvey-secret-warning" style={{ color: "#ffcc73", margin: "6px 0 0", fontSize: 14 }}>Direct messages and Harvey cloud inbox orders create durable records. Do not paste passwords, codes, tokens, recovery keys, or other secrets here.</p>
      <textarea
        ref={instructionRef}
        id="harvey-instruction"
        data-testid="harvey-instruction"
        value={instruction}
        readOnly={stage === "QUEUING" || directSending}
        onChange={(event) => { if (stage === "QUEUING" || directSending) return; setInstruction(event.target.value); reviseDraft(); }}
        placeholder="Example: Check every Harvey route, show me what is actually working, and prepare the next safe build slice."
        rows={5}
        style={{ width: "100%", boxSizing: "border-box", marginTop: 8, resize: "vertical", border: "1px solid #7f754f", borderRadius: 12, padding: 15, background: "#0d1112", color: "#fff", font: "inherit", fontSize: 17, lineHeight: 1.55, outlineColor: "#d8a84e" }}
      />

      <div style={{ color: "#aeb6b0", marginTop: 10 }}><strong style={{ color: "#edf0e8" }}>{liveCount}</strong> machine{liveCount === 1 ? "" : "s"} currently live · snapshot {transport.toLowerCase()}</div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 16 }}>
        {(["VERIFY", "PREPARE", "GO", "KNOCK"] as const).map((item) => (
          <button key={item} type="button" aria-pressed={verb === item} disabled={stage === "QUEUING" || directSending} data-queueing={stage === "QUEUING" || directSending ? "true" : "false"} onClick={() => {
            if (stage === "QUEUING" || directSending) return;
            setVerb(item);
            reviseDraft();
            setMessage(`${item} selected. Review the recipient and instruction, then press SEND.`);
          }} style={{ border: "1px solid #d8a84e", borderRadius: 10, padding: "11px 16px", background: verb === item ? "#d8a84e" : "#22251f", color: verb === item ? "#111" : "#fff4d6", cursor: stage === "QUEUING" || directSending ? "not-allowed" : "pointer", fontWeight: 900, fontSize: 15, opacity: stage === "QUEUING" || directSending ? 0.72 : 1 }}>
            {item === "VERIFY" ? "V · VERIFY" : item === "PREPARE" ? "P · PREPARE" : item === "GO" ? "G · GO" : "K · KNOCK"}
          </button>
        ))}
      </div>
      <p style={{ color: "#aeb6b0", margin: "10px 0 0" }}>{VERB_HELP[verb]}</p>

      {selectedBinding ? <>
        <div role="status" aria-live="polite" data-testid="harvey-command-status" style={{ marginTop: 18, padding: 15, border: `1px solid ${directState === "BLOCKER" ? "#a55343" : directState === "THINKING" ? "#47799b" : directState === "COMPLETED" || directState === "REPLIED" ? "#497b59" : "#5a563d"}`, borderRadius: 11, background: "#0e1212" }}>
          <strong style={{ color: directState === "BLOCKER" ? "#ff9a83" : directState === "THINKING" ? "#8fcfff" : directState === "COMPLETED" || directState === "REPLIED" ? "#8ef0ae" : "#78f1df" }}>{directDisplayState}</strong>
          <p style={{ color: "#d6dbd7", margin: "7px 0 0", lineHeight: 1.5 }}>{directStateMessage}</p>
          {displayedDirectDispatch?.events.at(-1) && <small style={{ color: "#aeb6b0" }}>{displayedDirectDispatch.events.at(-1)?.detail}</small>}
        </div>
        <ol aria-label="Direct Aeye message progress" data-testid="harvey-direct-progress" style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 7, padding: 0, margin: "14px 0 0", listStyle: "none" }}>
          {DIRECT_STEPS.map((item, index) => <li key={item} style={{ padding: "9px 5px", borderRadius: 8, textAlign: "center", background: index <= directReached ? "#16413a" : "#202524", color: index <= directReached ? "#8ef0da" : "#89928c", fontSize: 12, fontWeight: 850 }}>{index <= directReached ? "✓ " : "○ "}{item}</li>)}
        </ol>
        {displayedDirectDispatch && <div data-testid="harvey-direct-conversation" style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <article style={{ border: "1px solid #5b5340", borderRadius: 10, padding: 12, background: "#15130e" }}><strong style={{ color: "#fff4d6" }}>YOU</strong><p style={{ color: "#edf0e8", whiteSpace: "pre-wrap", marginBottom: 0 }}>{displayedDirectDispatch.body}</p></article>
          {displayedDirectDispatch.reply && <article style={{ border: "1px solid #346b61", borderRadius: 10, padding: 12, background: "#0d1917" }}><strong style={{ color: "#78f1df" }}>{displayedDirectDispatch.binding_snapshot.label}</strong><p style={{ color: "#edf0e8", whiteSpace: "pre-wrap", marginBottom: 0 }}>{displayedDirectDispatch.reply}</p></article>}
          {displayedDirectDispatch.error && <article style={{ border: "1px solid #7f493e", borderRadius: 10, padding: 12, color: "#ffb09d" }}>BLOCKER · {displayedDirectDispatch.error}</article>}
          {displayedDirectDispatch.usage && <small data-testid="harvey-direct-usage" style={{ color: "#aeb6b0" }}>Current Codex account/quota usage: {displayedDirectDispatch.usage.input_tokens.toLocaleString()} input ({displayedDirectDispatch.usage.cached_input_tokens.toLocaleString()} cached) · {displayedDirectDispatch.usage.output_tokens.toLocaleString()} output tokens. Billing mode is uninspected; Harvey does not calculate dollars.</small>}
        </div>}
      </> : <>
        <div role="status" aria-live="polite" data-testid="harvey-command-status" style={{ marginTop: 18, padding: 15, border: `1px solid ${stage === "ROUTE_BLOCKED" ? "#a55343" : stage === "RESULT_UNKNOWN" ? "#ae7d36" : stage === "QUEUED_LOCAL" || stage === "QUEUED_CLOUD" ? "#497b59" : "#5a563d"}`, borderRadius: 11, background: "#0e1212" }}>
          <strong style={{ color: stage === "ROUTE_BLOCKED" ? "#ff9a83" : stage === "RESULT_UNKNOWN" ? "#ffcc73" : stage === "QUEUED_LOCAL" || stage === "QUEUED_CLOUD" ? "#8ef0ae" : "#ffda8a" }}>{stage === "ROUTE_BLOCKED" ? "BLOCKED — NOT SENT" : stage === "RESULT_UNKNOWN" ? "RESULT UNKNOWN — SAFE RETRY AVAILABLE" : stage === "QUEUED_CLOUD" ? `DELIVERED TO HARVEY INBOXES · ${cloudCommandStatus || "QUEUED"}` : stage === "QUEUED_LOCAL" ? "QUEUED LOCALLY — NOT SENT YET" : stage === "QUEUING" ? "WRITING ORDER" : "DRAFT"}</strong>
          <p style={{ color: "#d6dbd7", margin: "7px 0 0", lineHeight: 1.5 }}>{message}</p>
          {workOrderId && <details style={{ marginTop: 8, color: "#89928c" }}><summary>Proof details</summary><code style={{ overflowWrap: "anywhere" }}>{workOrderId}</code></details>}
        </div>
        <ol aria-label="Command progress" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(105px,1fr))", gap: 7, padding: 0, margin: "14px 0 0", listStyle: "none" }}>
          {STAGES.map((item, index) => <li key={item} style={{ padding: "9px 8px", borderRadius: 8, textAlign: "center", background: index <= reached ? "#25432f" : "#202524", color: index <= reached ? "#9ef2b7" : "#89928c", fontSize: 12, fontWeight: 800 }}>{index <= reached ? "✓ " : "○ "}{item}</li>)}
        </ol>
        {stage === "QUEUED_CLOUD" && cloudCommand && <div data-testid="harvey-cloud-conversation" style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <article style={{ border: "1px solid #5b5340", borderRadius: 10, padding: 12, background: "#15130e" }}>
            <strong style={{ color: "#fff4d6" }}>YOU · {cloudCommand.verb} · {cloudCommand.target}</strong>
            <p style={{ color: "#edf0e8", whiteSpace: "pre-wrap", marginBottom: 0 }}>{cloudCommand.instruction}</p>
          </article>
          {cloudReceipts.filter((receipt) => Boolean(receipt.reply)).map((receipt) => <article key={receipt.receipt_id} style={{ border: "1px solid #346b61", borderRadius: 10, padding: 12, background: "#0d1917" }}>
            <strong style={{ color: "#78f1df" }}>{receipt.receiver_id} · {receipt.state}</strong>
            <p style={{ color: "#edf0e8", whiteSpace: "pre-wrap", marginBottom: 0 }}>{receipt.reply}</p>
          </article>)}
          {cloudReceipts.filter((receipt) => receipt.state === "BLOCKED").map((receipt) => <article key={receipt.receipt_id} style={{ border: "1px solid #7f493e", borderRadius: 10, padding: 12, color: "#ffb09d" }}>
            BLOCKER · {receipt.receiver_id} · {receipt.detail}
          </article>)}
        </div>}
      </>}
    </section>
  </>);
}
