"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";

import type {
  ActionLifecycle,
  DecisionButton,
  DecisionReceipt,
  DecisionSurfaceView,
  FrontierQueueItem,
  MegaWorkHomeView,
  MockTestFailureMode,
  MockTestResult,
  MockTestRoute,
  OperatorChatEntry,
  OperatorIntent,
  QueueOverrideAction,
  QueueRankSource,
  Rationale,
  ReceiptCenterEntry,
  ThreadHealthItem
} from "@/protocol/index";
import { RATIONALE_FIELDS } from "@/protocol/index";
import {
  CurrentBlockerPanel,
  CurrentRealityBanner,
  FrontierComparisonPanel,
  HonestyBadge,
  InspectDetail,
  QueueOverridePanel,
  QueueVisibilityPanel,
  ReceiptCenterPanel
} from "@/components/soledash/decision-surface-panels";
import { mergeRouteButtons } from "@/lib/soledash/decision-surface/action-routes";
import { idleLifecycle, LIFECYCLE_PHASES } from "@/lib/soledash/decision-surface/action-lifecycle";
import { realityModeDetail } from "@/lib/soledash/decision-surface/reality-mode";
import type { PetraTransportEnvelope } from "@/lib/soledash/petra-transport/types";
import {
  AmbientLayer,
  CommandLayerShell,
  CompactReceiptRail,
  LeavePointTracker,
  loadLeavePoints,
  saveLeavePoint,
  type LeavePointEntry,
  type LeavePointReason
} from "@/components/soledash/ambient-command-layers";
import {
  filterReceiptEntries,
  FleetRow,
  ReceiptSearchBar
} from "@/components/soledash/megawork-home-panels";
import { CommandActionsPanel } from "@/components/soledash/command-actions";
import { OperatorBar, type DispatchStatus, type OperatorCousinTarget } from "@/components/soledash/operator-bar";
import { SoleDashHome } from "@/components/soledash/sole-dash-home";
import { IntentRouterPanel } from "@/components/soledash/intent-router-panel";
import { FocusTheftReportCard } from "@/components/soledash/focus-theft-report-card";
import { PermissionFlyPanel } from "@/components/soledash/permission-fly-panel";
import { DispatchMatrixPanel } from "@/components/soledash/dispatch-matrix-panel";
import { WisdomWatcherPanel } from "@/components/soledash/wisdom-watcher-panel";
import { IntentMemoryPanelView } from "@/components/soledash/intent-memory-panel";
import { HumanGatePanel } from "@/components/soledash/human-gate-panel";
import { MobileSdSurface } from "@/components/soledash/mobile-sd-surface";
import { resolveHumanGate } from "@/lib/soledash/human-gate/tiers";
import type { IntentMemoryPanel } from "@/lib/soledash/intent-memory/types";
import {
  MobileOperatorStrip
} from "@/components/soledash/mobile-operator-strip";
import { MockTestBanner, MockTestHarness } from "@/components/soledash/mock-test-harness";
import {
  executeMockTest,
  loadClientMockReceipts,
  loadLastMockTest,
  mergeMockReceipts,
  saveLastMockTest,
  upsertSessionReceipt
} from "@/lib/soledash/mock-test/client-runner";
import { routeForAction } from "@/lib/soledash/mock-test/shared";
import { patchFleetWithDecisionView } from "@/lib/soledash/megawork-home/fleet-utils";
import { OptionsDeck } from "@/components/soledash/options-deck";
import { optionMissionText } from "@/lib/soledash/options-deck/build-options";
import type { CompanyOption, OptionBoardState, OptionVerb, ReactionEntry, SalvoSlot } from "@/lib/soledash/options-deck/types";
import {
  lifecycleFromReceipt,
  lifecycleFromVerbResult,
  receiptMatchesOption
} from "@/lib/soledash/options-deck/lifecycle";
import { buildCompanyOptions } from "@/lib/soledash/options-deck/build-options";
import { salvoAllowed } from "@/lib/soledash/options-deck/conflicts";

type DecisionSurfaceProps = {
  initialView: DecisionSurfaceView;
  homeView?: MegaWorkHomeView | null;
};

const SOLEDASH_LOGO = "/assets/soledash/branding/logo-a-transparent.png";
const POLL_MS = 20_000;

function postureLine(health: ThreadHealthItem): { label: string; tone: "ok" | "warn" | "bad" } {
  const status = health.status.toLowerCase();
  if (status.includes("block")) {
    return { label: "Blocked — stop and read before acting", tone: "bad" };
  }
  if (status.includes("degrad") || status.includes("warn")) {
    return { label: "Attention needed — thread degraded", tone: "warn" };
  }
  if (status.includes("health") || status === "ok" || status === "green") {
    return { label: "Okay — thread healthy", tone: "ok" };
  }
  return { label: health.status, tone: "warn" };
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    const ss = String(d.getUTCSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss} UTC`;
  } catch {
    return iso;
  }
}

function MissionPosture({
  view,
  lastRefresh,
  refreshing,
  onRefresh
}: {
  view: DecisionSurfaceView;
  lastRefresh: string;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const { payload, machine_label, data_source } = view;
  const posture = postureLine(payload.thread_health);
  const isLive = data_source === "dink";
  const isUnavailable = data_source === "unavailable";

  return (
    <header className="fm-posture" aria-label="Mission and posture">
      <div className="fm-posture__logo-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SOLEDASH_LOGO}
          alt="AEYE Inc"
          className="fm-posture__logo"
          width={280}
          height={48}
        />
      </div>
      <div className="fm-posture__brand">
        <div className="fm-posture__copy">
          <div className="fm-posture__meta">
            <p className="fm-eyebrow">SoleDash</p>
            <span className="fm-machine">{machine_label}</span>
          </div>
          <p className="fm-posture__mission">{payload.mission.label}</p>
          <p className={`fm-posture__status fm-posture__status--${posture.tone}`}>
            {isUnavailable ? "LIVE PAYLOAD UNAVAILABLE" : posture.label}
          </p>
        </div>
      </div>
      <div className="fm-live-bar">
        <span className="fm-live-bar__time">Updated {formatTime(lastRefresh)}</span>
        <button type="button" className="fm-live-bar__btn" disabled={refreshing} onClick={onRefresh}>
          {refreshing ? "Refreshing…" : "Refresh now"}
        </button>
      </div>
    </header>
  );
}

function EvidenceStatusLine({ status }: { status: string | undefined }) {
  const value = status?.trim() || "UNSET";
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <p className={`fm-evidence fm-evidence--${slug}`} aria-label="Evidence status">
      <span className="fm-evidence__label">Evidence:</span>{" "}
      <span className="fm-evidence__value">{value}</span>
    </p>
  );
}

function ActionStatusRail({ lifecycle }: { lifecycle: ActionLifecycle }) {
  if (lifecycle.phase === "idle") return null;

  const phaseForIdx =
    lifecycle.phase === "failed" ? "working" : lifecycle.phase;
  const activeIdx = LIFECYCLE_PHASES.indexOf(
    phaseForIdx as (typeof LIFECYCLE_PHASES)[number]
  );
  const failed = lifecycle.phase === "failed";
  const simulated = lifecycle.simulated === true;

  return (
    <div
      className={`fm-action-rail ${failed ? "fm-action-rail--failed" : ""} ${lifecycle.mock ? "fm-action-rail--mock" : ""} ${simulated ? "fm-action-rail--simulated" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Action status"
    >
      <div className="fm-action-rail__head">
        <p className="fm-action-rail__heading">Action rail</p>
        {simulated ? (
          <span className="fm-action-rail__mock-badge">MOCK TEST</span>
        ) : lifecycle.mock ? (
          <span className="fm-action-rail__mock-badge">MOCK ACTION</span>
        ) : (
          <span className="fm-action-rail__mock-badge fm-action-rail__mock-badge--live">LIVE</span>
        )}
      </div>
      <ol className="fm-action-rail__steps">
        {LIFECYCLE_PHASES.map((phase, i) => {
          const done = failed ? i < activeIdx : activeIdx >= i;
          const current = !failed && lifecycle.phase === phase;
          const label =
            phase === "received" && lifecycle.mock && !simulated
              ? "sim received"
              : phase.replace(/_/g, " ");
          return (
            <li
              key={phase}
              className={`fm-action-rail__step ${done ? "fm-action-rail__step--done" : ""} ${current ? "fm-action-rail__step--current" : ""}`}
            >
              <span className="fm-action-rail__dot" />
              <span className="fm-action-rail__phase">{label}</span>
            </li>
          );
        })}
        {failed ? (
          <li className="fm-action-rail__step fm-action-rail__step--failed fm-action-rail__step--current">
            <span className="fm-action-rail__dot" />
            <span className="fm-action-rail__phase">failed</span>
          </li>
        ) : null}
      </ol>
      {lifecycle.message ? <p className="fm-action-rail__message">{lifecycle.message}</p> : null}
      {lifecycle.route_owner ? (
        <p className="fm-action-rail__owner">
          Route owner: <strong>{lifecycle.route_owner}</strong>
        </p>
      ) : null}
      {lifecycle.failure_reason ? (
        <p className="fm-action-rail__fail">{lifecycle.failure_reason}</p>
      ) : null}
      <p className="fm-action-rail__meta">
        {lifecycle.action?.toUpperCase()}
        {lifecycle.action_id ? ` · ${lifecycle.action_id}` : ""} · {formatTime(lifecycle.updated_at)}
      </p>
    </div>
  );
}

function ExpandWhyPanel({ rationale }: { rationale: Rationale }) {
  return (
    <dl className="ds-why__dl">
      {RATIONALE_FIELDS.map(({ key, label }) => (
        <div key={key}>
          <dt>{label}</dt>
          <dd>{rationale[key]}</dd>
        </div>
      ))}
    </dl>
  );
}

function ReceiptBlock({ receipt, mock }: { receipt: DecisionReceipt; mock?: boolean }) {
  if (!receipt.last_action && !receipt.outcome && !receipt.next_state) {
    return null;
  }

  return (
    <div className="ds-receipt" role="status" aria-label="Receipt status">
      {mock || receipt.kind === "mock_action" ? (
        <p className="ds-receipt__mock">MOCK ACTION receipt</p>
      ) : null}
      {receipt.kind ? <p className="ds-receipt__type">{receipt.kind.replace(/_/g, " ")}</p> : null}
      {receipt.outcome ? <p className="ds-receipt__outcome">{receipt.outcome}</p> : null}
      {receipt.route_owner ? (
        <p className="ds-receipt__owner">
          Route owner: <strong>{receipt.route_owner}</strong>
        </p>
      ) : null}
      {receipt.next_state ? <p className="ds-receipt__next">{receipt.next_state}</p> : null}
      {receipt.receipt_id ? <p className="ds-mono ds-receipt__id">action_id: {receipt.receipt_id}</p> : null}
      {receipt.written_to ? <p className="ds-mono ds-receipt__path">{receipt.written_to}</p> : null}
    </div>
  );
}

function OperatorIntentCard({ intent }: { intent: OperatorIntent }) {
  return (
    <div className="ds-intent" aria-label="Operator intent">
      <p className="ds-intent__label">OperatorIntent</p>
      <dl className="ds-intent__dl">
        <div>
          <dt>Kind</dt>
          <dd>{intent.kind}</dd>
        </div>
        {intent.parsed_command ? (
          <div>
            <dt>Command</dt>
            <dd>{intent.parsed_command}</dd>
          </div>
        ) : null}
        <div>
          <dt>Summary</dt>
          <dd>{intent.summary}</dd>
        </div>
      </dl>
    </div>
  );
}

function PetraTransportReceipt({ envelope }: { envelope: PetraTransportEnvelope }) {
  const statusClass = envelope.delivery_confirmed
    ? "fm-petra-receipt--confirmed"
    : envelope.delivery_status === "failed"
      ? "fm-petra-receipt--failed"
      : "fm-petra-receipt--attempted";

  return (
    <div className={`fm-petra-receipt ${statusClass}`} aria-label="Petra transport receipt">
      <p className="fm-petra-receipt__label">Petra transport</p>
      <p className="fm-petra-receipt__status">{envelope.delivery_status.replace(/_/g, " ")}</p>
      {envelope.failure_reason ? <p className="fm-petra-receipt__fail">{envelope.failure_reason}</p> : null}
    </div>
  );
}

function ChatEntry({ entry }: { entry: OperatorChatEntry }) {
  if (entry.entry_type === "operator_intent") {
    return <OperatorIntentCard intent={entry.intent} />;
  }

  const { message } = entry;
  return (
    <div className={`ds-chat__msg ds-chat__msg--${message.role}`}>
      <span className="ds-chat__role">{message.role === "operator" ? "Ben" : "System"}</span>
      <p>{message.text}</p>
    </div>
  );
}

function busyLabelFor(slot: DecisionButton): string {
  if (slot.id === "yea") return "Sending…";
  if (slot.id === "nay") return "Declining…";
  if (slot.route_owner) return `Routing to ${slot.route_owner}…`;
  return `${slot.label}…`;
}

function buttonVariant(slot: DecisionButton): string {
  switch (slot.id) {
    case "yea":
      return "fm-btn--yea";
    case "nay":
      return "fm-btn--nay";
    case "needs_research":
      return "fm-btn--research";
    case "kill_test":
      return "fm-btn--kill";
    case "human_reality":
      return "fm-btn--ender";
    default:
      return "fm-btn--neutral";
  }
}

function FrontierButton({
  slot,
  busy,
  activeAction,
  onClick
}: {
  slot: DecisionButton;
  busy: boolean;
  activeAction: string | null;
  onClick: () => void;
}) {
  const variant = buttonVariant(slot);
  const isActive = busy && activeAction === slot.id;
  const disabled = busy || !slot.enabled;

  return (
    <button
      type="button"
      className={`fm-btn ${variant} ${isActive ? "fm-btn--active" : ""} ${!slot.enabled ? "fm-btn--protocol-off" : ""}`}
      disabled={disabled}
      title={slot.reason_disabled ?? (slot.route_owner ? `Routes to ${slot.route_owner}` : undefined)}
      onClick={onClick}
    >
      {isActive ? busyLabelFor(slot) : slot.label}
    </button>
  );
}

function TierPanel({
  summary,
  children,
  defaultOpen = false,
  open
}: {
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
}) {
  return (
    <details className="fm-tier" open={open ?? defaultOpen}>
      <summary>{summary}</summary>
      <div className="fm-tier__body">{children}</div>
    </details>
  );
}

export function DecisionSurface({ initialView, homeView = null }: DecisionSurfaceProps) {
  const isHome = Boolean(homeView);
  const [view, setView] = useState(initialView);
  const [busy, setBusy] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [receiptSearch, setReceiptSearch] = useState("");
  const [fleet, setFleet] = useState(homeView?.fleet ?? []);
  const [fleetStateLoaded, setFleetStateLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(
    initialView.payload.updated_at ?? initialView.payload.generated_at
  );
  const [chatSubmitting, setChatSubmitting] = useState(false);
  const payload = view.payload;
  const [receipt, setReceipt] = useState<DecisionReceipt>(payload.decision_receipt);
  const [chatInput, setChatInput] = useState("");
  const [chatEntries, setChatEntries] = useState<OperatorChatEntry[]>(payload.operator_chat.entries);
  const [petraReceipt, setPetraReceipt] = useState<PetraTransportEnvelope | null>(null);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [overrideReceipt, setOverrideReceipt] = useState<string | null>(null);
  const [queueBusy, setQueueBusy] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [leavePointOpen, setLeavePointOpen] = useState(false);
  const [leavePoints, setLeavePoints] = useState<LeavePointEntry[]>([]);
  const [mockFailureMode, setMockFailureMode] = useState<MockTestFailureMode>("success");
  const [lastMockTest, setLastMockTest] = useState<MockTestResult | null>(() => loadLastMockTest());
  const [sessionReceipts, setSessionReceipts] = useState<ReceiptCenterEntry[]>([]);
  const [clientMockReceipts, setClientMockReceipts] = useState<ReceiptCenterEntry[]>([]);
  const [overlayLifecycle, setOverlayLifecycle] = useState<ActionLifecycle | null>(null);
  const [dispatchStatus, setDispatchStatus] = useState<DispatchStatus>({
    label: "Idle",
    detail: null,
    tone: "idle"
  });
  const [salvoSlots, setSalvoSlots] = useState<SalvoSlot[]>([]);
  const [reactions, setReactions] = useState<ReactionEntry[]>([]);
  const [optionBoardStates, setOptionBoardStates] = useState<Record<string, OptionBoardState>>({});
  const [intentMemoryPanel, setIntentMemoryPanel] = useState<IntentMemoryPanel | null>(null);
  const knownReceiptKeysRef = useRef<Set<string>>(new Set());
  const mobileHandReasonRef = useRef("");
  const operatorBarInputRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const queueSectionRef = useRef<HTMLElement>(null);
  const gateSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isHome) setLeavePoints(loadLeavePoints());
    setClientMockReceipts(loadClientMockReceipts());
    if (homeView?.fleet?.some((m) => m.fleet_source === "fleet_state")) {
      setFleetStateLoaded(true);
    }
  }, [isHome, homeView?.fleet]);

  useEffect(() => {
    if (!isHome) return;
    if (window.matchMedia("(max-width: 640px)").matches) setCommandOpen(true);
  }, [isHome]);

  const dataLive = view.data_source === "dink";
  const unavailable = view.data_source === "unavailable";
  const mockMode = view.data_source === "mock";

  const queue = payload.queue_items ?? payload.frontier_queue ?? [];
  const frontierOverride = payload.frontier_override ?? null;
  const proposal = payload.proposal;
  const frontier = payload.frontier ?? null;
  const machineFrontier = payload.machine_frontier ?? null;
  const top3Alternatives = payload.top_3_alternatives ?? [];
  const machineWhy = payload.machine_why_number_one ?? frontierOverride?.machine_why_number_one ?? null;

  const applyView = useCallback((next: DecisionSurfaceView) => {
    setView(next);
    setReceipt(next.payload.decision_receipt);
    setChatEntries(next.payload.operator_chat.entries);
    setLastRefresh(next.payload.updated_at ?? next.payload.generated_at);
    if (isHome) {
      setFleet((prev) => patchFleetWithDecisionView(prev, next));
    }
  }, [isHome]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/soledash/v1/state?mode=decision", { cache: "no-store" });
      const data = await res.json();
      if (data.ok && data.decisionView) {
        applyView(data.decisionView);
      }
      if (data.ok && Array.isArray(data.homeFleet)) {
        setFleet(data.homeFleet);
        setFleetStateLoaded(Boolean(data.fleetStateLoaded));
      }
    } finally {
      setRefreshing(false);
    }
  }, [applyView]);

  useEffect(() => {
    const timer = setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  function runQueueAction(proposalId: string) {
    if (unavailable || !frontierOverride) return;

    setQueueBusy(true);
    setOverrideReceipt(null);

    void (async () => {
      try {
        const res = await fetch("/api/soledash/v1/decision-surface/queue-override", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "make_frontier" as QueueOverrideAction,
            proposal_id: proposalId,
            queue,
            frontier_override: frontierOverride
          })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? `Queue override failed (${res.status})`);
        }
        setOverrideReceipt(data.message ?? "Override submitted — refresh for Dink file state.");
        setInspectedId(null);
        await refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Queue override failed.";
        setOverrideReceipt(msg);
      } finally {
        setQueueBusy(false);
      }
    })();
  }

  function handleInspect(proposalId: string) {
    setInspectedId((prev) => (prev === proposalId ? null : proposalId));
  }

  const receiptEntries = payload.receipt_center ?? [];
  const mergedReceipts = mergeMockReceipts(receiptEntries, clientMockReceipts, sessionReceipts);

  const actionLifecycle = overlayLifecycle ?? payload.action_lifecycle ?? idleLifecycle();
  const realityMode = view.reality_mode ?? (mockMode ? "MOCK" : dataLive ? "LIVE" : "PARTIAL LIVE");
  const showMockTestMode = mockMode || realityMode !== "LIVE" || unavailable;

  function runMockTestRoute(
    route: MockTestRoute,
    actionOverride?: string | null,
    pivotId?: string | null
  ) {
    const proposalId = proposal?.id ?? payload.proposal?.id ?? "mock_proposal";
    const actionCode = proposal?.action_code ?? frontier?.action_code ?? null;
    const frontierTitle = proposal?.title ?? frontier?.title ?? null;

    flushSync(() => {
      setBusy(true);
      if (actionOverride) setActiveAction(actionOverride);
      else setActiveAction(route);
    });

    void (async () => {
      try {
        await executeMockTest({
          route,
          proposalId,
          failureMode: mockFailureMode,
          actionCode,
          frontierTitle,
          actionOverride: actionOverride ?? null,
          onLifecycle: setOverlayLifecycle,
          onReceipt: (entry) => setSessionReceipts((prev) => upsertSessionReceipt(prev, entry)),
          onResult: (result) => {
            setLastMockTest(result);
            saveLastMockTest(result);
          },
          onDecisionReceipt: setReceipt
        });
        if (route === "hands_gate") {
          gateSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setTimeout(() => void refresh(), 600);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Mock test failed.";
        setOverrideReceipt(msg);
      } finally {
        setBusy(false);
        setActiveAction(null);
      }
    })();
  }

  function logOperatorHandNote(action: string, note: string) {
    const text = note.trim();
    if (!text) return;
    const at = new Date().toISOString();
    setChatEntries((prev) => [
      ...prev,
      {
        entry_type: "message",
        message: { role: "operator", text: `${action.replace(/_/g, " ").toUpperCase()}: ${text}`, at }
      }
    ]);
    setDispatchStatus({
      label: `${action.replace(/_/g, " ").toUpperCase()} noted`,
      detail: text,
      tone: "warn"
    });
  }

  function runAction(action: string, _routeOwner: string | null = null, operatorNote?: string) {
    if (operatorNote?.trim()) logOperatorHandNote(action, operatorNote);

    if (action === "more_info") {
      setWhyOpen(true);
      return;
    }

    const mapped = routeForAction(action);
    if (mapped) {
      runMockTestRoute(
        mapped,
        action === "yea" || action === "nay" ? action : null,
        action
      );
      return;
    }

    runMockTestRoute("continue", action, action);
  }

  function openCommand() {
    setCommandOpen(true);
    setLeavePointOpen(false);
  }

  function requestReturnToPorch() {
    setLeavePointOpen(true);
  }

  function finishLeavePoint(reason: LeavePointReason, note: string) {
    const next = saveLeavePoint(reason, note);
    setLeavePoints(next);
    setLeavePointOpen(false);
    setCommandOpen(false);
  }

  function skipLeavePoint() {
    setLeavePointOpen(false);
    setCommandOpen(false);
  }

  function focusOperatorBar() {
    if (!commandOpen) openCommand();
    setTimeout(() => operatorBarInputRef.current?.focus(), 80);
  }

  async function dispatchPacketToCousin(
    cousin: OperatorCousinTarget,
    text: string
  ): Promise<{ ok: boolean; detail: string; tone: "ok" | "warn" | "bad" }> {
    if (!text.trim()) {
      return { ok: false, detail: "Empty packet text", tone: "bad" };
    }

    if (showMockTestMode) {
      runMockTestRoute("send_to_petra", null, cousin.toLowerCase());
      return { ok: true, detail: `${cousin} · simulated transport`, tone: "warn" };
    }

    const res = await fetch("/api/soledash/v1/cousin-dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, cousin })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        detail: data.message ?? data.error ?? "Dispatch blocked",
        tone: "bad"
      };
    }
    return {
      ok: true,
      detail: data.build?.outboxFilename ?? data.message ?? "Dispatched",
      tone: "ok"
    };
  }

  function upsertSalvoSlot(slot: SalvoSlot) {
    setSalvoSlots((prev) => {
      const rest = prev.filter((s) => s.id !== slot.id);
      return [slot, ...rest].slice(0, 12);
    });
  }

  function pushReaction(headline: string, detail: string, tone: ReactionEntry["tone"], source: ReactionEntry["source"]) {
    setReactions((prev) => [
      {
        id: `rx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        at: new Date().toISOString(),
        headline,
        detail,
        tone,
        source
      },
      ...prev
    ].slice(0, 12));
  }

  async function executeOptionVerb(
    option: CompanyOption,
    verb: OptionVerb,
    target: OperatorCousinTarget
  ): Promise<{ ok: boolean; detail: string; tone: "ok" | "warn" | "bad" }> {
    if (verb === "hold") {
      return { ok: true, detail: "Held — no dispatch", tone: "ok" };
    }

    if (verb === "make_frontier") {
      const proposalId = option.id.replace(/^proposal:/, "");
      if (!proposalId.startsWith("prop_")) {
        return { ok: false, detail: "Invalid queue option", tone: "bad" };
      }
      runQueueAction(proposalId);
      return { ok: true, detail: "Queue override submitted", tone: "ok" };
    }

    if (verb === "dispatch") {
      const text = optionMissionText(option, chatInput);
      const result = await dispatchPacketToCousin(target, text);
      if (result.ok) setChatInput("");
      return result;
    }

    if (verb === "yea") {
      if (gateResolution.tier === "red") {
        return { ok: false, detail: "Use RED Human Gate card to approve", tone: "warn" };
      }
      runAction("yea");
      return { ok: true, detail: "YEA dispatched", tone: "ok" };
    }

    const actionId =
      verb === "nay" ||
      verb === "needs_research" ||
      verb === "kill_test" ||
      verb === "human_reality"
        ? verb
        : null;
    if (actionId) {
      runAction(actionId);
      return { ok: true, detail: `${actionId} lifecycle started`, tone: "warn" };
    }

    return { ok: false, detail: `Unknown verb ${verb}`, tone: "bad" };
  }

  function markOptionBoard(
    option: CompanyOption,
    verb: OptionVerb,
    result: { ok: boolean; detail: string; tone: "ok" | "warn" | "bad" }
  ) {
    const lifecycle = lifecycleFromVerbResult(verb, result.ok, result.tone);
    setOptionBoardStates((prev) => {
      const next = { ...prev };
      next[option.id] = {
        lifecycle,
        expectedResult: option.expectedResult,
        actualResult: result.detail,
        firedVerb: verb,
        firedAt: new Date().toISOString(),
        dimmedReason: null
      };

      if (verb === "hold") {
        next[option.id].actualResult = "Held — option stays on board";
        next[option.id].lifecycle = "proposed";
      }

      if ((verb === "yea" || verb === "make_frontier") && result.ok) {
        for (const compId of option.conflictsWith) {
          const existing = next[compId];
          if (existing && existing.lifecycle !== "proposed") continue;
          next[compId] = {
            lifecycle: "parked",
            expectedResult: existing?.expectedResult ?? "Competing proposal",
            actualResult: `Parked — ${option.code} advanced first`,
            firedVerb: null,
            firedAt: null,
            dimmedReason: option.conflictHints[0] ?? `Choosing ${option.code} changed this option's odds`
          };
        }
      }

      if (verb === "kill_test" && result.ok) {
        next[option.id].lifecycle = "exploded";
        next[option.id].actualResult = result.detail;
      }

      return next;
    });
  }

  async function fireOption(option: CompanyOption, verb: OptionVerb, target: OperatorCousinTarget) {
    const slotId = `salvo_${Date.now()}_${option.id}`;
    upsertSalvoSlot({
      id: slotId,
      optionId: option.id,
      optionTitle: option.title,
      verb,
      target,
      phase: "firing",
      detail: null,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      receiptHint: null
    });
    setBusy(true);
    setDispatchStatus({ label: `Firing ${verb}…`, detail: option.title, tone: "busy" });

    try {
      const result = await executeOptionVerb(option, verb, target);
      markOptionBoard(option, verb, result);
      upsertSalvoSlot({
        id: slotId,
        optionId: option.id,
        optionTitle: option.title,
        verb,
        target,
        phase: result.ok ? (result.tone === "warn" ? "warn" : "ok") : "failed",
        detail: result.detail,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        receiptHint: null
      });
      pushReaction(
        verb === "nay" && result.ok
          ? `Rejected · ${option.code}`
          : result.ok
            ? `${verbLabelFromVerb(verb)} · ${option.code}`
            : `Failed · ${option.code}`,
        result.detail,
        verb === "nay" && result.ok ? "info" : result.tone === "bad" ? "bad" : result.tone === "warn" ? "warn" : "ok",
        "salvo"
      );
      setDispatchStatus({
        label: result.ok ? "Option fired" : "Option blocked",
        detail: result.detail,
        tone: result.tone === "bad" ? "bad" : result.tone === "warn" ? "warn" : "ok"
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function fireSalvo(options: CompanyOption[], verb: OptionVerb, target: OperatorCousinTarget) {
    if (!options.length) return;
    const gate = salvoAllowed(
      options,
      buildCompanyOptions({
        queue,
        proposal,
        routeButtons: mergeRouteButtons(
          payload.decision.buttons.filter((b) => b.id !== "defer"),
          unavailable
        ),
        unavailable,
        rationale: payload.rationale ?? null,
        machineFrontierTitle: machineFrontier?.title ?? null
      }),
      verb
    );
    if (!gate.allowed) {
      pushReaction("Salvo blocked", gate.reason ?? "Conflicting selection", "bad", "salvo");
      setDispatchStatus({ label: "Salvo blocked", detail: gate.reason, tone: "bad" });
      return;
    }
    setBusy(true);
    setDispatchStatus({
      label: `Salvo ×${options.length}`,
      detail: `${verb} → ${target}`,
      tone: "busy"
    });

    for (const option of options) {
      const slotId = `salvo_${Date.now()}_${option.id}`;
      upsertSalvoSlot({
        id: slotId,
        optionId: option.id,
        optionTitle: option.title,
        verb,
        target,
        phase: "queued",
        detail: null,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        receiptHint: null
      });

      upsertSalvoSlot({
        id: slotId,
        optionId: option.id,
        optionTitle: option.title,
        verb,
        target,
        phase: "firing",
        detail: null,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        receiptHint: null
      });

      const result = await executeOptionVerb(option, verb, target);
      markOptionBoard(option, verb, result);
      upsertSalvoSlot({
        id: slotId,
        optionId: option.id,
        optionTitle: option.title,
        verb,
        target,
        phase: result.ok ? (result.tone === "warn" ? "warn" : "ok") : "failed",
        detail: result.detail,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        receiptHint: null
      });
      pushReaction(
        `${verbLabelFromVerb(verb)} · ${option.code}`,
        result.detail,
        result.tone === "bad" ? "bad" : result.tone === "warn" ? "warn" : "ok",
        "salvo"
      );
    }

    setDispatchStatus({
      label: "Salvo complete",
      detail: `${options.length} plays to ${target}`,
      tone: "ok"
    });
    await refresh();
    setBusy(false);
  }

  function verbLabelFromVerb(verb: OptionVerb): string {
    switch (verb) {
      case "dispatch":
        return "Dispatch";
      case "make_frontier":
        return "Make frontier";
      case "yea":
        return "YEA";
      case "nay":
        return "NAY";
      case "needs_research":
        return "Research";
      case "kill_test":
        return "Kill test";
      case "human_reality":
        return "Human reality";
      default:
        return verb;
    }
  }

  async function sendToCousin(cousin: OperatorCousinTarget) {
    const text = chatInput.trim();
    if (!text) return;

    setBusy(true);
    setDispatchStatus({ label: `Sending to ${cousin}…`, detail: null, tone: "busy" });

    try {
      const result = await dispatchPacketToCousin(cousin, text);
      if (result.ok) setChatInput("");
      setDispatchStatus({
        label: result.ok ? `Sent to ${cousin}` : "Dispatch blocked",
        detail: result.detail,
        tone: result.tone
      });
      if (result.ok) await refresh();
    } catch (err) {
      setDispatchStatus({
        label: "Dispatch failed",
        detail: err instanceof Error ? err.message : "Network error",
        tone: "bad"
      });
    } finally {
      setBusy(false);
    }
  }

  function handleFrontierYea(reason?: string) {
    if (reason !== undefined) mobileHandReasonRef.current = reason;
    const note = mobileHandReasonRef.current;
    mobileHandReasonRef.current = "";
    runAction("yea", null, note || reason);
  }

  async function sendToPetra() {
    const text = chatInput.trim();
    if (!text) return;

    if (realityMode === "LIVE" && !mockMode && !showMockTestMode) {
      setBusy(true);
      setChatSubmitting(true);
      try {
        const res = await fetch("/api/soledash/v1/petra-transport", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw_text: text })
        });
        const data = await res.json();
        if (data.envelope) setPetraReceipt(data.envelope);
        setChatInput("");
        await refresh();
      } finally {
        setBusy(false);
        setChatSubmitting(false);
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    setChatInput(`Petra: ${text.slice(0, 80)}`);
    runMockTestRoute("send_to_petra", null, "send_to_petra");
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || unavailable) return;

    const at = new Date().toISOString();
    setChatEntries((prev) => [
      ...prev,
      { entry_type: "message", message: { role: "operator", text, at } }
    ]);
    setBusy(true);
    setChatSubmitting(true);
    setDispatchStatus({ label: "Reading intent memory…", detail: null, tone: "busy" });

    try {
      openCommand();
      const res = await fetch("/api/soledash/v1/intent-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, proposal_id: proposal?.id ?? null })
      });
      const data = await res.json();
      if (data.panel) {
        setIntentMemoryPanel(data.panel as IntentMemoryPanel);
        setChatInput("");
        setDispatchStatus({
          label: "Intent Memory ready",
          detail: "Review context, then CONTINUE to dispatch",
          tone: "ok"
        });
      } else {
        setDispatchStatus({
          label: "Intent memory failed",
          detail: data.error ?? "Could not interpret intent",
          tone: "bad"
        });
      }
    } catch (err) {
      setDispatchStatus({
        label: "Intent memory failed",
        detail: err instanceof Error ? err.message : "Network error",
        tone: "bad"
      });
    } finally {
      setBusy(false);
      setChatSubmitting(false);
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  function handleIntentMemoryDone(detail: string, ok: boolean) {
    setIntentMemoryPanel(null);
    setDispatchStatus({
      label: ok ? "Intent dispatched" : "Intent blocked",
      detail,
      tone: ok ? "ok" : "bad"
    });
    if (ok) void refresh();
  }

  const decideButtons = payload.decision.buttons
    .filter((b) => b.id !== "defer")
    .filter((b) => b.id === "yea" || b.id === "nay");
  const routeButtons = mergeRouteButtons(
    payload.decision.buttons.filter((b) => b.id !== "defer"),
    unavailable
  );

  useEffect(() => {
    const keys = new Set(
      mergedReceipts.map((r) => r.receipt_link ?? `${r.action_id}:${r.last_update}:${r.target}`)
    );
    const prev = knownReceiptKeysRef.current;
    if (prev.size === 0) {
      knownReceiptKeysRef.current = keys;
      return;
    }
    const deckOptions = buildCompanyOptions({
      queue,
      proposal,
      routeButtons,
      unavailable,
      rationale: payload.rationale ?? null,
      machineFrontierTitle: machineFrontier?.title ?? null
    });
    for (const entry of mergedReceipts) {
      const key = entry.receipt_link ?? `${entry.action_id}:${entry.last_update}:${entry.target}`;
      if (!prev.has(key)) {
        const reaction: ReactionEntry = {
          id: `rx_${key}`,
          at: entry.last_update,
          headline: entry.status,
          detail: entry.target,
          tone: entry.simulated || entry.mock ? "warn" : "ok",
          source: "receipt"
        };
        setReactions((r) => [reaction, ...r].slice(0, 12));

        setOptionBoardStates((states) => {
          const next = { ...states };
          for (const opt of deckOptions) {
            if (!receiptMatchesOption(entry, opt.code, opt.title)) continue;
            const prevBoard = next[opt.id];
            const verb = prevBoard?.firedVerb ?? null;
            next[opt.id] = {
              lifecycle: lifecycleFromReceipt(entry, verb),
              expectedResult: prevBoard?.expectedResult ?? opt.expectedResult,
              actualResult: `${entry.status} · ${entry.target}${entry.simulated ? " (sim)" : ""}`,
              firedVerb: verb,
              firedAt: prevBoard?.firedAt ?? entry.last_update,
              dimmedReason: prevBoard?.dimmedReason ?? null
            };
          }
          return next;
        });
      }
    }
    knownReceiptKeysRef.current = keys;
  }, [mergedReceipts, queue, proposal, routeButtons, unavailable, payload.rationale, machineFrontier?.title]);

  const frontierSource: QueueRankSource =
    frontierOverride?.queue_badge ??
    (frontier?.rank_source as QueueRankSource | undefined) ??
    (machineFrontier && frontier && machineFrontier.proposal_id !== frontier.proposal_id
      ? "MIXED"
      : "MACHINE");
  const filteredReceipts = filterReceiptEntries(mergedReceipts, receiptSearch);
  const inspectedItem = queue.find((q) => q.proposal_id === inspectedId) ?? null;
  const churnPreview = payload.current_churn.summary.slice(0, 72);
  const blocker = payload.current_blocker ?? {
    headline: unavailable ? "LIVE PAYLOAD UNAVAILABLE" : "No current_blocker slot in payload",
    detail: view.load_error ?? null,
    mock: mockMode
  };

  const posture = postureLine(payload.thread_health);
  const hasBlocker =
    Boolean(blocker.headline && !blocker.headline.includes("No current_blocker")) ||
    payload.thread_health.status.toLowerCase().includes("block");

  const gateResolution = resolveHumanGate(payload.human_gate, {
    mockMode,
    showMockTest: showMockTestMode
  });

  function countWaitingHumanGates(): { count: number; hint: string | null } {
    if (gateResolution.tier !== "red" || !gateResolution.redCard) {
      return { count: 0, hint: null };
    }
    return {
      count: 1,
      hint: gateResolution.redCard.consequence ?? gateResolution.gate.operator_line
    };
  }

  const waitingGates = countWaitingHumanGates();
  const operatorFrontierCode = frontier?.action_code ?? proposal?.action_code ?? "—";
  const operatorFrontierTitle = frontier?.title ?? proposal?.title ?? "No frontier";
  const chatDisabled = unavailable;
  const chatDisabledReason = unavailable ? "Live payload unavailable" : null;

  return (
    <div className={`fm-root ${isHome ? "mw-home sd-guillotine-root-wrap" : ""}`}>
      {isHome && homeView ? (
        <SoleDashHome
          view={view}
          gate={gateResolution}
          routeButtons={routeButtons}
          unavailable={unavailable}
          hasBlocker={hasBlocker}
          busy={busy}
          activeAction={activeAction}
          refreshing={refreshing}
          lastRefresh={lastRefresh}
          mergedReceipts={mergedReceipts}
          actionLifecycle={actionLifecycle}
          decisionReceipt={receipt}
          proposal={proposal}
          frontier={frontier}
          blocker={blocker}
          frontierCode={operatorFrontierCode}
          frontierTitle={operatorFrontierTitle}
          onRefresh={() => void refresh()}
          onYea={() => handleFrontierYea()}
          onNay={() => runAction("nay")}
          onRouteAction={(actionId) => runAction(actionId)}
          onGateApprove={() => runAction("yea")}
          onGateReject={() => runAction("nay")}
          onGateDefer={() => runAction("defer")}
        />
      ) : (
        <p className="sd-guill-section__empty" role="status">
          SoleDash home view unavailable — open /soledash.
        </p>
      )}

    </div>
  );
}
