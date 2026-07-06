import { promises as fs } from "node:fs";
import path from "node:path";

import {
  EVENTS_PATH,
  EXECUTION_PACKETS_PATH,
  HANDOFF_OUTBOX_DIR,
  OBJECTS_DIR,
  PLANS_DIR,
  RECEIPTS_DIR,
  stageForObject,
  type NerdkleObject
} from "@/app/api/nerdkle/_lib";
import { readHumanGateDashboard } from "@/lib/tinkerden/human-gates";
import { readTinkerPitPacketInbox } from "@/lib/tinkerden/packet-inbox";
import { listQueuedSkyPookaActions, readSkyPookaRelayStatus, type SkyPookaQueuedAction } from "@/lib/skypooka/relay-status";

const INBOX_DIR = path.join(process.cwd(), "foreman", "handoffs", "inbox");
const NEXT_ACTION_PATH = path.join(process.cwd(), "foreman", "NEXT_ACTION.md");

export type SkyPookaRelayCard = {
  id: string;
  subject: string;
  target: string;
  status: string;
  updated_at: string;
  path: string;
};

export type SkyPookaReceiptCard = {
  id: string;
  subject: string;
  source: string;
  status: string;
  updated_at: string;
  path: string;
};

export type SkyPookaGateCard = {
  id: string;
  title: string;
  tier: string;
  status: string;
  detail: string;
  ben_only: true;
};

export type SkyPookaBlockerCard = {
  id: string;
  blocker: string;
  owner: string;
  next: string;
  source: string;
};

export type SkyPookaActionCard = {
  priority: string;
  label: string;
  detail: string;
  object_id: string;
  execution_owner: string;
  stage: string;
};

export type SkyPookaPacketCard = {
  packet_id: string;
  action: string;
  status: string;
  created_at: string;
};

export type SkyPookaFieldFeed = {
  ok: true;
  generated_at: string;
  product: "SkyPooka";
  tagline: "Mobile Nerdkle · Mobile Werkles";
  relay_backend_connected: boolean;
  relay_status: {
    mobile_fire_mode: "queue" | "simulated";
    courier_ready: boolean;
    relay_lock_status: string | null;
    note: string;
  };
  effective_gate: string | null;
  operator_focus: {
    object_id: string;
    stage: string;
    execution_owner: string;
    next_action: string;
  } | null;
  relay_cards: SkyPookaRelayCard[];
  receipts: SkyPookaReceiptCard[];
  human_gates: SkyPookaGateCard[];
  blockers: SkyPookaBlockerCard[];
  top_actions: SkyPookaActionCard[];
  packet_inbox: SkyPookaPacketCard[];
  queued_actions: SkyPookaQueuedAction[];
  packet_inbox_count: number;
  counts: {
    relay_cards: number;
    receipts: number;
    human_gates: number;
    blockers: number;
    top_actions: number;
    packet_inbox: number;
    queued_actions: number;
  };
};

async function readJsonFiles(directory: string) {
  try {
    const names = await fs.readdir(directory);
    return Promise.all(
      names
        .filter((name) => name.endsWith(".json"))
        .map(async (name) => {
          const filePath = path.join(directory, name);
          return JSON.parse(await fs.readFile(filePath, "utf8")) as NerdkleObject;
        })
    );
  } catch {
    return [] as NerdkleObject[];
  }
}

async function readJsonl(filePath: string) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
        try {
          return [JSON.parse(line) as { object_id?: string }];
        } catch {
          return [];
        }
      });
  } catch {
    return [] as Array<{ object_id?: string }>;
  }
}

function parseEffectiveGate(nextAction: string) {
  const match = nextAction.match(/\*\*Effective gate:\*\*\s*`?\[([^\]`]+)\]`?/i);
  return match?.[1]?.trim() ?? null;
}

function parseHandoffSubject(filename: string) {
  return filename
    .replace(/\.md$/i, "")
    .replace(/^TO_/i, "")
    .replace(/^FROM_/i, "")
    .replace(/_/g, " ")
    .trim();
}

function parseHandoffTarget(filename: string) {
  const toMatch = filename.match(/^TO_([A-Z0-9_]+)/i);
  if (toMatch) return toMatch[1].replace(/_/g, " ");
  const fromMatch = filename.match(/^FROM_([A-Z0-9_]+)/i);
  if (fromMatch) return fromMatch[1].replace(/_/g, " ");
  return "Unknown";
}

async function readHandoffCards(directory: string, prefix: "TO" | "FROM", limit: number) {
  try {
    const names = await fs.readdir(directory);
    const files = await Promise.all(
      names
        .filter((name) => name.endsWith(".md") && name.toUpperCase().startsWith(`${prefix}_`))
        .map(async (name) => {
          const filePath = path.join(directory, name);
          const stat = await fs.stat(filePath);
          return { name, filePath, mtime: stat.mtimeMs };
        })
    );

    return files
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, limit)
      .map((file) => ({
        id: file.name.replace(/\.md$/i, ""),
        subject: parseHandoffSubject(file.name),
        target: parseHandoffTarget(file.name),
        status: prefix === "TO" ? "OUTBOX" : "INBOX",
        updated_at: new Date(file.mtime).toISOString(),
        path: path.relative(process.cwd(), file.filePath).replace(/\\/g, "/")
      }));
  } catch {
    return [];
  }
}

async function buildTopActions(objects: Array<{ object: NerdkleObject; stage: string }>) {
  const packetEvents = await readJsonl(EXECUTION_PACKETS_PATH);
  const packeted = new Set(packetEvents.map((event) => event.object_id));
  const plans = new Set(
    (await fs.readdir(PLANS_DIR).catch(() => []))
      .filter((name) => name.endsWith(".md"))
      .map((name) => name.replace(/\.md$/, ""))
  );

  const actionCards = objects.flatMap(({ object, stage }) => {
    if (stage === "completed") return [];
    if (stage === "blocked") {
      return [{
        priority: "high",
        label: "Clear blocker",
        detail: object.next_action,
        object_id: object.id,
        execution_owner: object.execution_owner,
        stage
      }];
    }
    if (stage === "needs_clarification") {
      return [{
        priority: "high",
        label: "Answer unresolved fields",
        detail: (object.unresolved_fields ?? []).join(", ") || object.next_action,
        object_id: object.id,
        execution_owner: object.execution_owner,
        stage
      }];
    }
    if (stage === "waiting_on_human_gate") {
      return [{
        priority: "high",
        label: "Review human gate",
        detail: (object.human_gates ?? []).filter((gate) => gate !== "none").join(", "),
        object_id: object.id,
        execution_owner: object.execution_owner,
        stage
      }];
    }

    const cards: SkyPookaActionCard[] = [];
    if (!plans.has(object.id)) {
      cards.push({
        priority: "medium",
        label: "Create execution plan",
        detail: "Generate the one-screen plan before handing off execution.",
        object_id: object.id,
        execution_owner: object.execution_owner,
        stage
      });
    }
    if (!packeted.has(object.id)) {
      cards.push({
        priority: "medium",
        label: "Create handoff packet",
        detail: "Prepare the owner packet without sending it externally.",
        object_id: object.id,
        execution_owner: object.execution_owner,
        stage
      });
    }
    if (cards.length === 0) {
      cards.push({
        priority: "low",
        label: "Wait for receipt",
        detail: "Plan and packet exist. The next loop closure is a receipt.",
        object_id: object.id,
        execution_owner: object.execution_owner,
        stage
      });
    }
    return cards;
  });

  const priorityOrder = { high: 0, medium: 1, low: 2 } as Record<string, number>;
  actionCards.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));
  return actionCards.slice(0, 6);
}

export async function buildSkyPookaFieldFeed(): Promise<SkyPookaFieldFeed> {
  const [objectsRaw, nextAction, humanGateDashboard, packetInbox, relayCards, receiptCards, relayStatus, queuedActions] =
    await Promise.all([
    readJsonFiles(OBJECTS_DIR),
    fs.readFile(NEXT_ACTION_PATH, "utf8").catch(() => ""),
    readHumanGateDashboard(),
    readTinkerPitPacketInbox(12),
    readHandoffCards(HANDOFF_OUTBOX_DIR, "TO", 8),
    readHandoffCards(INBOX_DIR, "FROM", 8),
    readSkyPookaRelayStatus(),
    listQueuedSkyPookaActions(12)
  ]);

  const objects = objectsRaw.map((object) => ({
    object,
    stage: stageForObject(object)
  }));

  const focus =
    objects.find((item) => item.stage === "needs_clarification")
    ?? objects.find((item) => item.stage === "waiting_on_human_gate")
    ?? objects.find((item) => item.stage === "ready_for_execution")
    ?? objects[0];

  const topActions = await buildTopActions(objects);

  const humanGates: SkyPookaGateCard[] = humanGateDashboard.gates.map((gate) => ({
    id: gate.gate_id,
    title: gate.title,
    tier: gate.tier,
    status: gate.status,
    detail: gate.what_remains_blocked.join(" · ") || gate.approval_phrase,
    ben_only: true as const
  }));

  const blockers: SkyPookaBlockerCard[] = [
    ...objects
      .filter((item) => item.stage === "blocked")
      .map((item) => ({
        id: item.object.id,
        blocker: item.object.failure_condition || item.object.next_action,
        owner: item.object.execution_owner || "Unassigned",
        next: item.object.next_action,
        source: "nerdkle"
      })),
    ...(nextAction.includes("Blocked") || nextAction.includes("BLOCKED")
      ? [{
          id: "next-action-blocked",
          blocker: parseEffectiveGate(nextAction) ?? "NEXT_ACTION blocked lane",
          owner: "Ben",
          next: "See foreman/NEXT_ACTION.md",
          source: "cockpit"
        }]
      : [])
  ];

  const packetCards: SkyPookaPacketCard[] = packetInbox.packets.map((packet) => ({
    packet_id: packet.packet_id,
    action: packet.action,
    status: packet.status,
    created_at: packet.created_at
  }));

  const queuedCardIds = new Set(queuedActions.map((item) => item.card_id));

  return {
    ok: true,
    generated_at: new Date().toISOString(),
    product: "SkyPooka",
    tagline: "Mobile Nerdkle · Mobile Werkles",
    relay_backend_connected: relayStatus.mobile_fire_mode === "queue",
    relay_status: {
      mobile_fire_mode: relayStatus.mobile_fire_mode,
      courier_ready: relayStatus.courier_ready,
      relay_lock_status: relayStatus.relay_lock_status,
      note: relayStatus.note
    },
    effective_gate: parseEffectiveGate(nextAction),
    operator_focus: focus
      ? {
          object_id: focus.object.id,
          stage: focus.stage,
          execution_owner: focus.object.execution_owner,
          next_action: focus.object.next_action
        }
      : null,
    relay_cards: relayCards.map((card) => ({
      ...card,
      status: queuedCardIds.has(card.id) ? "QUEUED" : card.status
    })),
    receipts: receiptCards.map((card) => ({
      id: card.id,
      subject: card.subject,
      source: card.target,
      status: card.status,
      updated_at: card.updated_at,
      path: card.path
    })),
    human_gates: humanGates,
    blockers,
    top_actions: topActions,
    packet_inbox: packetCards,
    queued_actions: queuedActions,
    packet_inbox_count: packetInbox.count,
    counts: {
      relay_cards: relayCards.length,
      receipts: receiptCards.length,
      human_gates: humanGates.length,
      blockers: blockers.length,
      top_actions: topActions.length,
      packet_inbox: packetCards.length,
      queued_actions: queuedActions.length
    }
  };
}

export async function readSkyPookaNerdkleSummary() {
  const [objectsRaw, receipts] = await Promise.all([
    readJsonFiles(OBJECTS_DIR),
    fs.readdir(RECEIPTS_DIR).catch(() => [] as string[])
  ]);

  const objects = objectsRaw.map((object) => ({
    object,
    stage: stageForObject(object)
  }));

  const stages = objects.reduce<Record<string, number>>((counts, item) => {
    counts[item.stage] = (counts[item.stage] ?? 0) + 1;
    return counts;
  }, {});

  return {
    object_count: objects.length,
    receipt_count: receipts.filter((name) => name.endsWith(".json")).length,
    stages,
    events_path: path.relative(process.cwd(), EVENTS_PATH).replace(/\\/g, "/")
  };
}
