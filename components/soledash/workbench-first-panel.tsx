"use client";

import { useMemo, useState } from "react";

import type {
  ActionLifecycle,
  DecisionButton,
  DecisionReceipt,
  FrontierQueueItem,
  Proposal,
  ReceiptCenterEntry,
  WorkbenchPacket
} from "@/protocol/index";

import type { RelayCardView } from "@/lib/soledash/automatica-relay/types";
import type { GuillotineCard } from "@/lib/soledash/guillotine/types";
import type { GateResolution } from "@/lib/soledash/human-gate/types";
import type { Provenance } from "@/lib/soledash/provenance/types";

type AeyeLoopPacket = {
  packet_id: string;
  origin_card_id: string;
  target_aeye: "Dink";
  target_machine: "Betsy";
  task_text: string;
  created_at: string;
  status: "SENT";
};

type AeyeLoopResponse = {
  packet_id: string;
  response_id: string;
  status: "ACKNOWLEDGED";
  message: string;
  timestamp: string;
};

type AeyeLoopPaths = {
  packet?: string;
  response?: string;
  message_outbox?: string;
  message_inbox?: string;
  message_receipt?: string;
};

type LocalWorkbenchCard = {
  originCardId: string;
  task: string;
  mission: string;
  artifact: string;
  sender: string;
  destinationId: string;
  destinationSource: string;
  destinationType: string;
  directoryVerified: boolean;
  targetAeye: "Dink";
  targetMachine: "Betsy";
  status: "REQUESTED" | "ACKNOWLEDGED" | "FAILED";
  createdAt: string;
  packet: AeyeLoopPacket | null;
  response: AeyeLoopResponse | null;
  error: string | null;
  paths: AeyeLoopPaths | null;
};

type ActiveBuildRow = {
  id: string;
  task: string;
  owner: string;
  status: string;
  receipt: string;
};

type AeyeWorkstation = {
  aeye: string;
  currentMission: string;
  currentBlocker: string;
  lastWin: string;
  lastReceipt: string;
};

type ChangeCapsule = {
  id: string;
  whatChanged: string;
  whyItMatters: string;
  whoNeedsToKnow: string;
  nextAction: string;
};

const AEYE_WORKSTATION_SEEDS: AeyeWorkstation[] = [
  {
    aeye: "Swanson",
    currentMission: "Waiting for live assignment",
    currentBlocker: "No blocker surfaced",
    lastWin: "No win surfaced",
    lastReceipt: "No receipt surfaced"
  },
  {
    aeye: "Maker",
    currentMission: "Putting WonkAyees first in Wonka Den",
    currentBlocker: "No blocker surfaced",
    lastWin: "Wonka Den Home answers surfaced",
    lastReceipt: "Typecheck and screenshot return"
  },
  {
    aeye: "Bean",
    currentMission: "Waiting for live assignment",
    currentBlocker: "No blocker surfaced",
    lastWin: "No win surfaced",
    lastReceipt: "No receipt surfaced"
  },
  {
    aeye: "Ender",
    currentMission: "Waiting for live assignment",
    currentBlocker: "No blocker surfaced",
    lastWin: "No win surfaced",
    lastReceipt: "No receipt surfaced"
  },
  {
    aeye: "Thufir",
    currentMission: "Watching stack audit signals",
    currentBlocker: "No blocker surfaced",
    lastWin: "Stack audit surfaced",
    lastReceipt: "No receipt surfaced"
  },
  {
    aeye: "Skybro",
    currentMission: "Waiting for live assignment",
    currentBlocker: "No blocker surfaced",
    lastWin: "No win surfaced",
    lastReceipt: "No receipt surfaced"
  }
];

const RECENT_CHANGE_CAPSULES: ChangeCapsule[] = [
  {
    id: "member-first-win",
    whatChanged: "Member dashboard now opens on YOUR NEXT MOVE with Start intake as the only primary action.",
    whyItMatters: "A member gets one useful first step instead of a dashboard full of internal surfaces.",
    whoNeedsToKnow: "Ben, Ender, and anyone reviewing the member landing flow.",
    nextAction: "Open the member dashboard and confirm Start intake is the first useful click."
  },
  {
    id: "wonkaeye-workstations",
    whatChanged: "Wonka Den now leads with WonkAyees: Swanson, Maker, Bean, Ender, Skybro, and Thufir.",
    whyItMatters: "The Den answers what the people are doing before it shows machine or status clutter.",
    whoNeedsToKnow: "Ben and every Aeye being tracked in the Den.",
    nextAction: "Use the WonkAyees cards to spot current mission, blocker, last receipt, and last win."
  },
  {
    id: "pearl-shelf-real",
    whatChanged: "Pearl Shelf became a real source-of-truth panel with status counts and promotion state.",
    whyItMatters: "Pearls stopped being decoration and now show what is new, reviewed, promoted, archived, or killed.",
    whoNeedsToKnow: "Ben, Maker, and anyone deciding whether a pearl should become work.",
    nextAction: "Open Pearl Shelf when a promoted or reviewed pearl needs action."
  }
];

const RECENT_WHISPERS = [
  {
    text: "Spanzee now hosts RustDesk server.",
    source: "Spanzee access",
    time: "now",
    importance: "high"
  },
  {
    text: "Relay crossed.",
    source: "Courier",
    time: "recent",
    importance: "medium"
  },
  {
    text: "PEARL-03 promoted.",
    source: "Pearl Shelf",
    time: "recent",
    importance: "medium"
  },
  {
    text: "Preview alias violation detected.",
    source: "Preview Watch",
    time: "recent",
    importance: "high"
  }
] as const;

const TINKERDEN_DESTINATION_DIRECTORY = {
  source: "foreman/messages/DESTINATION_DIRECTORY.json",
  destinations: [
    {
      id: "dink_betsy_aeye_inbox_v0",
      label: "Dink@Betsy",
      aeye: "Dink" as const,
      machine: "Betsy" as const,
      destinationType: "aeye_inbox_v0",
      verified: true
    }
  ]
};

const TINKERDEN_FIRST_DESTINATION = TINKERDEN_DESTINATION_DIRECTORY.destinations[0];

const TINKERDEN_FIRST_PACKET = {
  originCardId: "tinkerden_create_master_plan_md_v0",
  sender: "Dink@Betsy",
  destinationId: TINKERDEN_FIRST_DESTINATION.id,
  destinationSource: TINKERDEN_DESTINATION_DIRECTORY.source,
  targetAeye: TINKERDEN_FIRST_DESTINATION.aeye,
  targetMachine: TINKERDEN_FIRST_DESTINATION.machine,
  destinationType: TINKERDEN_FIRST_DESTINATION.destinationType,
  directoryVerified: TINKERDEN_FIRST_DESTINATION.verified,
  mission: "CREATE_MASTER_PLAN_MD",
  artifact: "WERKLES_MASTER_PLAN_V1.md",
  taskText: "MISSION: CREATE_MASTER_PLAN_MD\nArtifact: WERKLES_MASTER_PLAN_V1.md"
};

const TINKERDEN_ARTIFACT_CARD = {
  artifact: "THE_GREAT_WORK_V0_2.md",
  source: "foreman/source_material/THE_GREAT_WORK_V0_2.md",
  timestamp: "2026-06-19T16:42:15.5850182-04:00",
  status: "EXISTS"
};

function formatLocalTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString();
  } catch {
    return iso;
  }
}

function compactBuildFact(value: string): string {
  const compact = value
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .at(-1) ?? value;

  return compact.length > 64 ? `${compact.slice(0, 61)}...` : compact;
}

function compactAeyeLine(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "No signal";
  return trimmed.length > 78 ? `${trimmed.slice(0, 75)}...` : trimmed;
}

function ownerAeye(owner: string | null | undefined): string | null {
  if (!owner) return null;
  const normalized = owner.toLowerCase();
  for (const seed of AEYE_WORKSTATION_SEEDS) {
    if (normalized.includes(seed.aeye.toLowerCase())) return seed.aeye;
  }
  return null;
}

function upsertWorkstation(
  stations: Map<string, AeyeWorkstation>,
  aeye: string,
  patch: Partial<Omit<AeyeWorkstation, "aeye">>
) {
  const current = stations.get(aeye);
  if (!current) return;
  stations.set(aeye, { ...current, ...patch });
}

function packetStatusLine(
  lifecycle: ActionLifecycle,
  relayCards: RelayCardView[],
  workbenchPackets: WorkbenchPacket[],
  localCard: LocalWorkbenchCard | null
): string {
  if (localCard?.packet) {
    return `${localCard.packet.status} - ${localCard.packet.packet_id} - ${localCard.targetAeye}@${localCard.targetMachine}`;
  }

  if (localCard) {
    return `${localCard.status} - ${localCard.originCardId} - ${localCard.targetAeye}@${localCard.targetMachine}`;
  }

  const latestWorkbench = workbenchPackets[0];
  if (latestWorkbench?.outbox_filename) {
    return `${latestWorkbench.status.toUpperCase()} · ${latestWorkbench.outbox_filename}`;
  }

  if (lifecycle.phase !== "idle") {
    const parts = [lifecycle.phase, lifecycle.action, lifecycle.message].filter(Boolean);
    if (parts.length > 0) return parts.join(" · ");
  }

  const inFlight = relayCards.find(
    (card) =>
      card.packetId &&
      card.state !== "READY" &&
      card.state !== "RECEIPT RETURNED" &&
      card.state !== "EXPLODED"
  );
  if (inFlight) {
    return `${inFlight.state} · ${inFlight.name}`;
  }

  return lifecycle.phase === "idle" ? "Idle · no packet in flight" : lifecycle.phase;
}

function latestReceiptLine(
  decisionReceipt: DecisionReceipt,
  receipts: ReceiptCenterEntry[],
  workbenchPackets: WorkbenchPacket[],
  localCard: LocalWorkbenchCard | null
): string {
  if (localCard?.response) {
    return `${localCard.response.status} - ${localCard.response.response_id} - ${formatLocalTime(localCard.response.timestamp)}`;
  }

  if (localCard?.packet) {
    return `Waiting for response - ${localCard.packet.packet_id}`;
  }

  const latestWorkbench = workbenchPackets[0];
  if (latestWorkbench?.receipt) {
    return [
      latestWorkbench.receipt.id,
      latestWorkbench.receipt.state,
      latestWorkbench.receipt.written_to ?? latestWorkbench.receipt.next_state
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (latestWorkbench?.outbox_path) {
    return `Waiting for receipt · ${latestWorkbench.outbox_path}`;
  }

  if (decisionReceipt.receipt_id) {
    return [decisionReceipt.receipt_id, decisionReceipt.outcome].filter(Boolean).join(" · ");
  }

  const latest = receipts[0];
  if (latest) {
    return [latest.action_id, latest.status, latest.receipt_link].filter(Boolean).join(" · ");
  }

  return "None yet";
}

export function WorkbenchFirstPanel({
  cards,
  actionLifecycle,
  decisionReceipt,
  mergedReceipts,
  relayCards,
  workbenchPackets
}: {
  cards: GuillotineCard[];
  proposal: Proposal | null;
  stepCode: string;
  stepTitle: string;
  payloadOwner: string | null;
  activeOwner: string | null | undefined;
  frontier: FrontierQueueItem | null;
  unavailable: boolean;
  busy: boolean;
  activeAction: string | null;
  gate: GateResolution;
  routeButtons: DecisionButton[];
  surfaceProvenance: Provenance;
  actionLifecycle: ActionLifecycle;
  decisionReceipt: DecisionReceipt;
  mergedReceipts: ReceiptCenterEntry[];
  relayCards: RelayCardView[];
  workbenchPackets: WorkbenchPacket[];
  onRefresh: () => void;
  onYea: () => void;
  onNay: () => void;
  onRouteAction: (actionId: string) => void;
}) {
  const [draftText] = useState(TINKERDEN_FIRST_PACKET.taskText);
  const [loopCards, setLoopCards] = useState<LocalWorkbenchCard[]>([]);
  const [sending, setSending] = useState(false);
  const latestLoopCard = loopCards[0] ?? null;
  const draftTask = draftText.trim() || TINKERDEN_FIRST_PACKET.taskText;
  const hasDraft = draftTask.length > 0;
  const packetStatus = packetStatusLine(actionLifecycle, relayCards, workbenchPackets, latestLoopCard);
  const latestReceipt = latestReceiptLine(decisionReceipt, mergedReceipts, workbenchPackets, latestLoopCard);
  const localStatus = latestLoopCard?.response
    ? `ARRIVAL RECEIPT: ${latestLoopCard.response.response_id}`
    : latestLoopCard?.error
      ? `FAILED - ${latestLoopCard.error}`
      : latestLoopCard?.packet
        ? `SENT: packet ${latestLoopCard.packet.packet_id} is waiting for arrival receipt`
    : hasDraft
      ? "READY: approve and send the packet"
      : "SOURCE MISSING: no packet payload";

  const realSentPackets = useMemo(
    () =>
      workbenchPackets.slice(0, 3).map((packet) => ({
        id: packet.outbox_filename ?? packet.outbox_path ?? packet.status,
        line: `${packet.status.toUpperCase()} - ${packet.outbox_filename ?? packet.outbox_path ?? "packet"}`
      })),
    [workbenchPackets]
  );
  const activeBuilds = useMemo<ActiveBuildRow[]>(() => {
    const rows: ActiveBuildRow[] = [];

    if (hasDraft) {
      rows.push({
        id: "draft-build",
        task: draftTask,
        owner: "Ben",
        status: "DRAFT",
        receipt: "Not sent yet"
      });
    }

    loopCards.forEach((card) => {
      rows.push({
        id: card.packet?.packet_id ?? card.originCardId,
        task: card.task,
        owner: `${card.targetAeye}@${card.targetMachine}`,
        status: card.response?.status ?? card.status,
        receipt: card.response
          ? `${card.response.response_id} - ${formatLocalTime(card.response.timestamp)}`
          : card.error
            ? card.error
            : card.packet
              ? `Waiting - ${card.packet.packet_id}`
              : "Creating packet"
      });
    });

    workbenchPackets.slice(0, 3).forEach((packet) => {
      rows.push({
        id: `packet-${packet.id}`,
        task: packet.title || packet.mission_text || "Workbench packet",
        owner: [packet.cousin, packet.machine].filter(Boolean).join("@") || "Workbench",
        status: packet.status.toUpperCase(),
        receipt: packet.receipt
          ? compactBuildFact(
              [packet.receipt.state, packet.outbox_filename ?? packet.receipt.id].filter(Boolean).join(" - ")
            )
          : packet.outbox_path
            ? "Waiting for receipt"
            : "No receipt yet"
      });
    });

    cards
      .filter((card) => card.status === "Now Building" || card.status === "Blocked by Dependency")
      .slice(0, 3)
      .forEach((card) => {
        rows.push({
          id: card.cardId,
          task: card.title,
          owner: card.owner || card.machine || "Unassigned",
          status: card.status,
          receipt: compactBuildFact(card.receiptReturn || card.receiptLink || "No receipt yet")
        });
      });

    return rows.slice(0, 5);
  }, [cards, draftTask, hasDraft, loopCards, workbenchPackets]);
  const aeyeWorkstations = useMemo<AeyeWorkstation[]>(() => {
    const stations = new Map(AEYE_WORKSTATION_SEEDS.map((station) => [station.aeye, { ...station }]));

    loopCards.forEach((card) => {
      const aeye = card.targetAeye;
      upsertWorkstation(stations, aeye, {
        currentMission: compactAeyeLine(card.task),
        currentBlocker: card.error ? compactAeyeLine(card.error) : "No blocker surfaced",
        lastWin: card.response ? compactAeyeLine(card.response.response_id) : "No win surfaced until receipt",
        lastReceipt: compactAeyeLine(card.response?.message ?? "Waiting for local receipt")
      });
    });

    workbenchPackets.forEach((packet) => {
      const aeye = ownerAeye(packet.cousin);
      if (!aeye) return;
      upsertWorkstation(stations, aeye, {
        currentMission: compactAeyeLine(packet.title || packet.mission_text),
        currentBlocker: packet.blocker ? compactAeyeLine(packet.blocker) : "No blocker surfaced",
        lastWin: packet.receipt ? compactAeyeLine(packet.receipt.state) : "Packet staged",
        lastReceipt: packet.receipt
          ? compactAeyeLine([packet.receipt.state, packet.outbox_filename ?? packet.receipt.id].filter(Boolean).join(" - "))
          : packet.outbox_path
            ? "Waiting for receipt"
            : "No receipt surfaced"
      });
    });

    cards.forEach((card) => {
      const aeye = ownerAeye(card.owner);
      if (!aeye) return;
      const isActive = card.status === "Now Building" || card.status === "Blocked by Dependency";
      const current = stations.get(aeye);
      upsertWorkstation(stations, aeye, {
        currentMission: isActive ? compactAeyeLine(card.title) : (current?.currentMission ?? "Waiting for live assignment"),
        currentBlocker: card.status === "Blocked by Dependency"
          ? compactAeyeLine(card.nextAction || card.purpose)
          : (current?.currentBlocker ?? "No blocker surfaced"),
        lastWin: card.status === "Receipts" ? compactAeyeLine(card.title) : (current?.lastWin ?? "No win surfaced"),
        lastReceipt: compactAeyeLine(card.receiptReturn || card.receiptLink || current?.lastReceipt || "No receipt surfaced")
      });
    });

    mergedReceipts.slice(0, 12).forEach((receipt) => {
      const aeye = ownerAeye(receipt.owner);
      if (!aeye) return;
      const current = stations.get(aeye);
      upsertWorkstation(stations, aeye, {
        currentBlocker: receipt.status === "failed"
          ? compactAeyeLine(receipt.failure_reason || receipt.action_id)
          : (current?.currentBlocker ?? "No blocker surfaced"),
        lastWin: receipt.status === "resolved" || receipt.status === "received"
          ? compactAeyeLine(receipt.target)
          : current?.lastWin,
        lastReceipt: compactAeyeLine(receipt.receipt_link || receipt.action_id)
      });
    });

    return Array.from(stations.values());
  }, [cards, loopCards, mergedReceipts, workbenchPackets]);
  const primaryBuild = activeBuilds[0] ?? null;
  const firstBlocked = cards.find((card) => card.status === "Blocked by Dependency") ?? null;
  const whatIsBlocked = firstBlocked
    ? `${firstBlocked.title} - ${firstBlocked.nextAction || firstBlocked.purpose}`
    : "No active blocker surfaced.";
  const whatNeedsBen = hasDraft
    ? "Press Approve / Send on the TinkerDen packet card."
    : firstBlocked
      ? firstBlocked.nextAction || "Review the blocked build and clear the dependency."
      : primaryBuild
        ? "Watch the latest receipt and decide whether to continue, unblock, or start the next build."
        : "Type the next build into the Main Desk input when ready.";
  const wonkaHomeAnswers = [
    {
      label: "1. What is being built?",
      value: primaryBuild?.task ?? "No active build surfaced.",
      tone: "build"
    },
    {
      label: "2. Who is building it?",
      value: primaryBuild?.owner ?? "No builder assigned in the visible workbench.",
      tone: "owner"
    },
    {
      label: "3. What is blocked?",
      value: whatIsBlocked,
      tone: firstBlocked ? "blocked" : "clear"
    },
    {
      label: "4. What needs Ben?",
      value: whatNeedsBen,
      tone: "ben"
    }
  ];
  const createTruth = latestLoopCard?.packet
    ? `WRITTEN - ${latestLoopCard.packet.packet_id}`
    : hasDraft
      ? "READY - packet not written yet"
      : "NO - source packet missing";
  const sendTruth = sending
    ? "SENDING - writing packet"
    : latestLoopCard?.packet
      ? `RECEIVED - ${latestLoopCard.packet.target_aeye}@${latestLoopCard.packet.target_machine}`
      : hasDraft
        ? "READY - not sent yet"
        : "NO - no target packet";
  const receiveTruth = latestLoopCard?.response
    ? `ARRIVED - ${latestLoopCard.response.response_id}`
    : latestLoopCard?.packet
      ? "WAITING - packet written"
      : latestReceipt !== "None yet"
        ? `EXISTING PROOF - ${latestReceipt}`
        : "NO - no arrival receipt yet";

  async function sendLocalPacket() {
    const task = draftText.trim() || TINKERDEN_FIRST_PACKET.taskText;
    if (!task || sending) return;

    const now = new Date().toISOString();
    const originCardId = `origin_card_${Date.now().toString(36)}`;
    const pendingCard: LocalWorkbenchCard = {
      originCardId,
      task,
      mission: TINKERDEN_FIRST_PACKET.mission,
      artifact: TINKERDEN_FIRST_PACKET.artifact,
      sender: TINKERDEN_FIRST_PACKET.sender,
      destinationId: TINKERDEN_FIRST_PACKET.destinationId,
      destinationSource: TINKERDEN_FIRST_PACKET.destinationSource,
      destinationType: TINKERDEN_FIRST_PACKET.destinationType,
      directoryVerified: TINKERDEN_FIRST_PACKET.directoryVerified,
      targetAeye: TINKERDEN_FIRST_PACKET.targetAeye,
      targetMachine: TINKERDEN_FIRST_PACKET.targetMachine,
      status: "REQUESTED",
      createdAt: now,
      packet: null,
      response: null,
      error: null,
      paths: null
    };

    setSending(true);
    setLoopCards((prev) => [pendingCard, ...prev].slice(0, 5));
    try {
      const res = await fetch("/api/soledash/v1/wonka-den/aeye-loop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin_surface: "TinkerDen Packet Launcher",
          origin_card_id: originCardId,
          destination_id: TINKERDEN_FIRST_PACKET.destinationId,
          payload: {
            sender: TINKERDEN_FIRST_PACKET.sender,
            directory_source: TINKERDEN_FIRST_PACKET.destinationSource,
            destination_id: TINKERDEN_FIRST_PACKET.destinationId,
            target: `${TINKERDEN_FIRST_PACKET.targetAeye}@${TINKERDEN_FIRST_PACKET.targetMachine}`,
            destination_type: TINKERDEN_FIRST_PACKET.destinationType,
            mission: TINKERDEN_FIRST_PACKET.mission,
            artifact: TINKERDEN_FIRST_PACKET.artifact,
            task_text: task
          },
          receipt_message: `${TINKERDEN_FIRST_PACKET.targetAeye}@${TINKERDEN_FIRST_PACKET.targetMachine} received ${TINKERDEN_FIRST_PACKET.mission} for ${TINKERDEN_FIRST_PACKET.artifact}.`
        })
      });
      const data = (await res.json()) as {
        ok?: boolean;
        packet?: AeyeLoopPacket;
        response?: AeyeLoopResponse;
        paths?: AeyeLoopPaths;
        error?: string;
      };
      setLoopCards((prev) =>
        prev.map((card) => {
          if (card.originCardId !== originCardId) return card;
          if (!res.ok || !data.ok || !data.packet || !data.response) {
            return {
              ...card,
              status: "FAILED",
              error: data.error ?? "Aeye loop failed"
            };
          }
          return {
            ...card,
            status: "ACKNOWLEDGED",
            packet: data.packet,
            response: data.response,
            paths: data.paths ?? null,
            error: null
          };
        })
      );
    } catch (err) {
      setLoopCards((prev) =>
        prev.map((card) =>
          card.originCardId === originCardId
            ? {
                ...card,
                status: "FAILED",
                error: err instanceof Error ? err.message : "Aeye loop failed"
              }
            : card
        )
      );
    } finally {
      setSending(false);
    }
  }

  function renderBuildHereFirstCard() {
    return (
      <div className="sd-workbench-first__create sd-workbench-first__create--first" aria-label="TinkerDen Packet Launcher">
        <h3 className="sd-workbench-first__section-title">TinkerDen Packet Launcher</h3>
        <p className="sd-workbench-first__build-callout">PACKET WRITTEN - TARGET RECEIVES - ARRIVAL RECEIPT</p>
        <dl className="sd-tinkerden-packet-card" aria-label="TinkerDen artifact card">
          <div>
            <dt>artifact</dt>
            <dd>{TINKERDEN_ARTIFACT_CARD.artifact}</dd>
          </div>
          <div>
            <dt>source</dt>
            <dd>{TINKERDEN_ARTIFACT_CARD.source}</dd>
          </div>
          <div>
            <dt>timestamp</dt>
            <dd>{TINKERDEN_ARTIFACT_CARD.timestamp}</dd>
          </div>
          <div>
            <dt>status</dt>
            <dd>{TINKERDEN_ARTIFACT_CARD.status}</dd>
          </div>
        </dl>
        <dl className="sd-tinkerden-packet-card" aria-label="First packet card">
          <div>
            <dt>from</dt>
            <dd>{TINKERDEN_FIRST_PACKET.sender}</dd>
          </div>
          <div>
            <dt>mission</dt>
            <dd>{TINKERDEN_FIRST_PACKET.mission}</dd>
          </div>
          <div>
            <dt>target</dt>
            <dd>{TINKERDEN_FIRST_PACKET.targetAeye}@{TINKERDEN_FIRST_PACKET.targetMachine}</dd>
          </div>
          <div>
            <dt>destination</dt>
            <dd>{TINKERDEN_FIRST_PACKET.destinationType}</dd>
          </div>
          <div>
            <dt>directory</dt>
            <dd>{TINKERDEN_FIRST_PACKET.destinationSource}</dd>
          </div>
          <div>
            <dt>verified</dt>
            <dd>{TINKERDEN_FIRST_PACKET.directoryVerified ? "verified" : "blocked"}</dd>
          </div>
          <div>
            <dt>artifact</dt>
            <dd>{TINKERDEN_FIRST_PACKET.artifact}</dd>
          </div>
        </dl>
        <label className="sd-workbench-first__composer-label" htmlFor="sd-workbench-task-input">
          Packet payload
        </label>
        <div className="sd-workbench-first__composer">
          <textarea
            id="sd-workbench-task-input"
            className="sd-workbench-first__input"
            value={draftText}
            placeholder={TINKERDEN_FIRST_PACKET.taskText}
            rows={3}
            readOnly
          />
          <button
            type="button"
            className="sd-workbench-first__send"
            disabled={!hasDraft || sending}
            onClick={() => void sendLocalPacket()}
          >
            {sending ? "SENDING..." : "APPROVE / SEND"}
          </button>
        </div>
        <dl className="sd-workbench-first__live-strip" aria-label="TinkerDen packet proof">
          <div>
            <dt>Packet written</dt>
            <dd>{createTruth}</dd>
          </div>
          <div>
            <dt>Target receives</dt>
            <dd>{sendTruth}</dd>
          </div>
          <div>
            <dt>Arrival receipt</dt>
            <dd>{receiveTruth}</dd>
          </div>
        </dl>
        <p className="sd-workbench-first__local-status" role="status" aria-live="polite">
          {localStatus}
        </p>
        {latestLoopCard?.packet ? (
          <dl className="sd-build-proof" aria-label="Returned proof">
            <div>
              <dt>packet_id</dt>
              <dd>
                <code>{latestLoopCard.packet.packet_id}</code>
              </dd>
            </div>
            <div>
              <dt>assigned_to</dt>
              <dd>{latestLoopCard.packet.target_aeye}@{latestLoopCard.packet.target_machine}</dd>
            </div>
            <div>
              <dt>destination_type</dt>
              <dd>{latestLoopCard.destinationType}</dd>
            </div>
            <div>
              <dt>artifact</dt>
              <dd>{latestLoopCard.artifact}</dd>
            </div>
            <div>
              <dt>receipt_id</dt>
              <dd>
                <code>{latestLoopCard.response?.response_id ?? "no receipt returned yet"}</code>
              </dd>
            </div>
            <div>
              <dt>inbox_file</dt>
              <dd>{latestLoopCard.paths?.message_inbox ?? "no inbox file returned yet"}</dd>
            </div>
            <div>
              <dt>receipt_file</dt>
              <dd>{latestLoopCard.paths?.message_receipt ?? latestLoopCard.paths?.response ?? "no receipt file returned yet"}</dd>
            </div>
          </dl>
        ) : null}
      </div>
    );
  }

  return (
    <section className="sd-workbench-first" aria-label="TinkerDen Packet Launcher">
      <header className="sd-workbench-first__head">
        <p className="sd-workbench-first__eyebrow">Wonka Den - TinkerDen</p>
        <h2 className="sd-workbench-first__title">Packet Launcher</h2>
        <p className="sd-workbench-first__lead">
          One approval writes the packet, lands it in the target inbox, and returns an arrival receipt on screen.
        </p>
      </header>

      <section className="sd-aeye-workstations sd-aeye-workstations--first" aria-label="WonkAyees">
        <div className="sd-aeye-workstations__head">
          <div>
            <p className="sd-aeye-workstations__eyebrow">WonkAyees</p>
            <h3>What are my people doing?</h3>
          </div>
          <span className="sd-aeye-workstations__count">{aeyeWorkstations.length} people</span>
        </div>
        <div className="sd-aeye-workstations__grid" role="list">
          {aeyeWorkstations.map((station) => (
            <article key={station.aeye} className="sd-aeye-workstation" role="listitem">
              <header className="sd-aeye-workstation__head">
                <p className="sd-aeye-workstation__name">{station.aeye}</p>
                <p className="sd-aeye-workstation__mission">{station.currentMission}</p>
              </header>
              <dl className="sd-aeye-workstation__facts">
                <div>
                  <dt>Current Mission</dt>
                  <dd>{station.currentMission}</dd>
                </div>
                <div>
                  <dt>Current Blocker</dt>
                  <dd>{station.currentBlocker}</dd>
                </div>
                <div>
                  <dt>Last Receipt</dt>
                  <dd>{station.lastReceipt}</dd>
                </div>
                <div>
                  <dt>Last Win</dt>
                  <dd>{station.lastWin}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="sd-change-capsules" aria-label="What changed?">
        <div className="sd-change-capsules__head">
          <div>
            <p className="sd-change-capsules__eyebrow">Recent Change Capsules</p>
            <h3>What changed?</h3>
          </div>
          <span className="sd-change-capsules__count">{RECENT_CHANGE_CAPSULES.length} recent</span>
        </div>
        <div className="sd-change-capsules__grid" role="list">
          {RECENT_CHANGE_CAPSULES.map((capsule) => (
            <article key={capsule.id} className="sd-change-capsule" role="listitem">
              <h4>{capsule.whatChanged}</h4>
              <dl className="sd-change-capsule__facts">
                <div>
                  <dt>Why it matters</dt>
                  <dd>{capsule.whyItMatters}</dd>
                </div>
                <div>
                  <dt>Who needs to know</dt>
                  <dd>{capsule.whoNeedsToKnow}</dd>
                </div>
                <div>
                  <dt>Next action</dt>
                  <dd>{capsule.nextAction}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      {renderBuildHereFirstCard()}

      <section className="sd-wonka-home" aria-label="Wonka Den Home">
        <div className="sd-wonka-home__head">
          <p className="sd-wonka-home__eyebrow">Enter here</p>
          <h3>What matters right now?</h3>
        </div>
        <div className="sd-wonka-home__grid">
          {wonkaHomeAnswers.map((answer) => (
            <article key={answer.label} className={`sd-wonka-home__answer sd-wonka-home__answer--${answer.tone}`}>
              <p className="sd-wonka-home__label">{answer.label}</p>
              <p className="sd-wonka-home__value">{answer.value}</p>
            </article>
          ))}
        </div>
      </section>

      <details className="sd-wonka-home-secondary">
        <summary>SECONDARY: active builds, workbench, access, whispers, receipts</summary>
        <div className="sd-wonka-home-secondary__body">

      <section className="sd-active-builds" aria-label="My Active Builds">
        <div className="sd-active-builds__head">
          <div>
            <p className="sd-active-builds__eyebrow">My Active Builds</p>
            <h3>What am I building right now?</h3>
          </div>
          <span className="sd-active-builds__count">{activeBuilds.length} active</span>
        </div>
        {activeBuilds.length > 0 ? (
          <div className="sd-active-builds__grid" role="list">
            {activeBuilds.map((build) => (
              <article key={build.id} className="sd-active-build" role="listitem">
                <p className="sd-active-build__task">{build.task}</p>
                <dl className="sd-active-build__facts">
                  <div>
                    <dt>Owner</dt>
                    <dd>{build.owner}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{build.status}</dd>
                  </div>
                  <div>
                    <dt>Latest receipt</dt>
                    <dd>{build.receipt}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className="sd-active-builds__empty">
            Nothing active yet. Review the packet above and hit APPROVE / SEND.
          </p>
        )}
      </section>

      <section className="sd-spanzee-access" aria-label="Spanzee Access">
        <div className="sd-spanzee-access__head">
          <h3>Spanzee Access</h3>
          <p>Keep this here so Ben does not have to context switch.</p>
        </div>
        <ul className="sd-spanzee-access__checks" aria-label="Spanzee access checklist">
          <li className="sd-spanzee-access__check sd-spanzee-access__check--done">
            <span aria-hidden="true">[x]</span>
            <span>Reachable</span>
          </li>
          <li className="sd-spanzee-access__check">
            <span aria-hidden="true">[ ]</span>
            <span>Authenticated</span>
          </li>
          <li className="sd-spanzee-access__check">
            <span aria-hidden="true">[ ]</span>
            <span>Desktop Visible</span>
          </li>
          <li className="sd-spanzee-access__check">
            <span aria-hidden="true">[ ]</span>
            <span>Input Accepted</span>
          </li>
        </ul>
        <p className="sd-spanzee-access__blocker">
          <strong>Current blocker:</strong> Betsy can see Spanzee, but Spanzee has not trusted this access yet.
        </p>
      </section>

      <section className="sd-whispers-panel" aria-label="Recent Whispers">
        <div className="sd-whispers-panel__head">
          <h3>Recent Whispers</h3>
          <p>Birdies worth seeing before Ben moves.</p>
        </div>
        <div className="sd-whispers-panel__list">
          {RECENT_WHISPERS.map((whisper) => (
            <article key={whisper.text} className={`sd-whisper sd-whisper--${whisper.importance}`}>
              <p className="sd-whisper__text">"{whisper.text}"</p>
              <dl className="sd-whisper__meta">
                <div>
                  <dt>Source</dt>
                  <dd>{whisper.source}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{whisper.time}</dd>
                </div>
                <div>
                  <dt>Importance</dt>
                  <dd>{whisper.importance}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <dl className="sd-workbench-first__truth" aria-label="Workbench truth answers">
        <div className="sd-workbench-first__truth-card">
          <dt>Create task</dt>
          <dd>{createTruth}</dd>
        </div>
        <div className="sd-workbench-first__truth-card">
          <dt>Assign task</dt>
          <dd>{sendTruth}</dd>
        </div>
        <div className="sd-workbench-first__truth-card">
          <dt>See receipt</dt>
          <dd>{receiveTruth}</dd>
        </div>
      </dl>

      <div className="sd-workbench-first__bench">
        <h3 className="sd-workbench-first__section-title sd-workbench-first__section-title--workbench">
          Workbench Packet Trail
        </h3>
        <div className="sd-workbench-first__lanes" aria-label="Workbench lanes">
          <section className="sd-workbench-first__lane" aria-label="Draft tasks">
            <h4>Draft tasks</h4>
            {hasDraft ? (
              <p>{draftTask}</p>
            ) : (
              <p className="sd-workbench-first__muted">No draft task.</p>
            )}
          </section>
          <section className="sd-workbench-first__lane" aria-label="Sent packets">
            <h4>Sent packets</h4>
            {loopCards.length > 0 || realSentPackets.length > 0 ? (
              <ul>
                {loopCards.map((card) => (
                  <li key={card.originCardId}>
                    <code>{card.packet?.packet_id ?? card.originCardId}</code> to {card.targetAeye}@{card.targetMachine} - {card.status}
                  </li>
                ))}
                {realSentPackets.map((packet) => (
                  <li key={packet.id}>{packet.line}</li>
                ))}
              </ul>
            ) : (
              <p className="sd-workbench-first__muted">No sent packets.</p>
            )}
          </section>
          <section className="sd-workbench-first__lane" aria-label="Latest receipt">
            <h4>Latest receipt</h4>
            <p>{packetStatus}</p>
            <p>{latestReceipt}</p>
          </section>
        </div>
        {loopCards.length > 0 ? (
          <div className="sd-workbench-first__aeye-cards" aria-label="Aeye responses">
            {loopCards.map((card) => (
              <article key={card.originCardId} className={`sd-workbench-aeye-card sd-workbench-aeye-card--${card.status.toLowerCase()}`}>
                <header className="sd-workbench-aeye-card__head">
                  <div>
                    <p className="sd-workbench-aeye-card__eyebrow">Originating Workbench Card</p>
                    <h4>{card.task}</h4>
                  </div>
                  <code>{card.originCardId}</code>
                </header>
                <div className="sd-workbench-aeye-card__states" aria-label="Send receive states">
                  {card.packet ? (
                    <span className="sd-workbench-aeye-card__state sd-workbench-aeye-card__state--sent">SENT</span>
                  ) : (
                    <span className="sd-workbench-aeye-card__state">REQUESTED</span>
                  )}
                  {card.response ? (
                    <span className="sd-workbench-aeye-card__state sd-workbench-aeye-card__state--acknowledged">ACKNOWLEDGED</span>
                  ) : null}
                  {card.status === "FAILED" ? (
                    <span className="sd-workbench-aeye-card__state sd-workbench-aeye-card__state--failed">FAILED</span>
                  ) : null}
                </div>
                <dl className="sd-workbench-aeye-card__facts">
                  <div>
                    <dt>packet_id</dt>
                    <dd>
                      <code>{card.packet?.packet_id ?? "pending"}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>target</dt>
                    <dd>{card.targetAeye}@{card.targetMachine}</dd>
                  </div>
                  <div>
                    <dt>status</dt>
                    <dd>{card.response?.status ?? card.status}</dd>
                  </div>
                  <div>
                    <dt>created_at</dt>
                    <dd>{card.packet?.created_at ?? card.createdAt}</dd>
                  </div>
                </dl>
                {card.response ? (
                  <div className="sd-workbench-aeye-card__response" role="status">
                    <span>receipt</span>
                    <p>{card.response.message}</p>
                    <time>{card.response.timestamp}</time>
                  </div>
                ) : card.error ? (
                  <p className="sd-workbench-aeye-card__error" role="status">{card.error}</p>
                ) : (
                  <p className="sd-workbench-aeye-card__pending" role="status">Waiting for Dink@Betsy ACK.</p>
                )}
              </article>
            ))}
          </div>
        ) : null}
        {cards.length === 0 && loopCards.length === 0 && !hasDraft ? (
          <p className="sd-workbench-first__empty">
            TinkerDen has no local proof yet. Approve the packet above or fire a relay proof.
          </p>
        ) : (
          <>
            <p className="sd-workbench__lead">
              Requested, Sent, Received, or Failed — response stays on the card, not in a mystery folder.
            </p>
            <details className="sd-workbench-first__legacy-cards">
              <summary>NOT WIRED: duplicate SoleDash surfaces collapsed</summary>
              <p className="sd-workbench-first__not-wired">
                {cards.length} old working card{cards.length === 1 ? "" : "s"} suppressed so the Main Desk stays dominant.
              </p>
            </details>
          </>
        )}
      </div>
        </div>
      </details>
    </section>
  );
}
