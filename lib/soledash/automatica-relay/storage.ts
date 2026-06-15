import fs from "node:fs";
import path from "node:path";

import { dispatchBuild } from "@/lib/soledash/command-surface/dispatch";
import type { RelayCardDef, RelayCardState, RelayPacket, RelayReceipt } from "./types";

const ROOT = process.cwd();
export const AUTOMATICA_DIR = path.join(ROOT, "foreman", "soledash", "automatica");
export const PACKETS_DIR = path.join(AUTOMATICA_DIR, "packets");
export const RECEIPTS_DIR = path.join(AUTOMATICA_DIR, "receipts");

export function ensureAutomaticaDirs(): void {
  fs.mkdirSync(PACKETS_DIR, { recursive: true });
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

export function rel(p: string): string {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

export function writePacket(packet: RelayPacket): string {
  ensureAutomaticaDirs();
  const file = path.join(PACKETS_DIR, `${packet.packet_id}.json`);
  fs.writeFileSync(file, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  return rel(file);
}

export function updatePacket(packetId: string, patch: Partial<RelayPacket>): RelayPacket | null {
  const file = path.join(PACKETS_DIR, `${packetId}.json`);
  const cur = readJson<RelayPacket>(file);
  if (!cur) return null;
  const next = { ...cur, ...patch };
  fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

export function writeRelayReceipt(receipt: RelayReceipt): string {
  ensureAutomaticaDirs();
  const file = path.join(RECEIPTS_DIR, `${receipt.packet_id}.json`);
  fs.writeFileSync(file, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return rel(file);
}

export function readRelayReceipt(packetId: string): RelayReceipt | null {
  return readJson<RelayReceipt>(path.join(RECEIPTS_DIR, `${packetId}.json`));
}

export function latestRunForCard(cardId: string): {
  packet: RelayPacket | null;
  receipt: RelayReceipt | null;
  packetPath: string | null;
  receiptPath: string | null;
} {
  ensureAutomaticaDirs();
  let latestPacket: RelayPacket | null = null;
  let latestPacketPath: string | null = null;
  let latestTs = 0;

  for (const name of fs.readdirSync(PACKETS_DIR)) {
    if (!name.endsWith(".json")) continue;
    const file = path.join(PACKETS_DIR, name);
    const pkt = readJson<RelayPacket>(file);
    if (!pkt || pkt.card_id !== cardId) continue;
    const ts = new Date(pkt.timestamp).getTime();
    if (ts >= latestTs) {
      latestTs = ts;
      latestPacket = pkt;
      latestPacketPath = rel(file);
    }
  }

  if (!latestPacket) {
    return { packet: null, receipt: null, packetPath: null, receiptPath: null };
  }

  const receiptPath = path.join(RECEIPTS_DIR, `${latestPacket.packet_id}.json`);
  const receipt = fs.existsSync(receiptPath) ? readJson<RelayReceipt>(receiptPath) : null;

  return {
    packet: latestPacket,
    receipt,
    packetPath: latestPacketPath,
    receiptPath: receipt ? rel(receiptPath) : null
  };
}

export function isSpanzeeRouteConnected(): boolean {
  try {
    const fleetPath = path.join(ROOT, "foreman", "soledash", "FLEET_STATE.json");
    const fleet = JSON.parse(fs.readFileSync(fleetPath, "utf8")) as {
      machines?: Array<{ id?: string; blocker?: string | null; evidence_status?: string }>;
    };
    const spanzee = fleet.machines?.find((m) => m.id === "spanzee");
    if (!spanzee) return false;
    if (spanzee.blocker?.toLowerCase().includes("not instrumented")) return false;
    if (spanzee.evidence_status === "UNKNOWN") return false;
    return true;
  } catch {
    return false;
  }
}

export function isRouteConnected(card: RelayCardDef): boolean {
  switch (card.routeKind) {
    case "none":
      return false;
    case "spanzee_remote":
      return isSpanzeeRouteConnected();
    case "cousin_outbox":
      return Boolean(card.cousin);
    case "petra_composer":
      return process.platform === "win32";
    default:
      return false;
  }
}

export function resolveCardState(
  card: RelayCardDef,
  run: ReturnType<typeof latestRunForCard>
): {
  state: RelayCardState;
  lastUpdate: string | null;
  nextAction: string;
  blocker: string | null;
  routeConnected: boolean;
  packetId: string | null;
  packetPath: string | null;
  receiptPath: string | null;
  live: boolean;
} {
  const routeConnected = isRouteConnected(card);

  if (!run.receipt && !run.packet) {
    return {
      state: "READY",
      lastUpdate: null,
      nextAction: card.nextActionReady,
      blocker: routeConnected ? null : "ROUTE NOT CONNECTED",
      routeConnected,
      packetId: null,
      packetPath: null,
      receiptPath: null,
      live: routeConnected
    };
  }

  const receipt = run.receipt;
  const packet = run.packet;

  if (receipt) {
    return {
      state: receipt.status,
      lastUpdate: receipt.updated_at,
      nextAction: receipt.next_action,
      blocker: receipt.blocker,
      routeConnected: receipt.route_connected,
      packetId: receipt.packet_id,
      packetPath: receipt.packet_path,
      receiptPath: receipt.receipt_path,
      live: receipt.route_connected && receipt.success
    };
  }

  return {
    state: packet?.status ?? "FIRED",
    lastUpdate: packet?.timestamp ?? null,
    nextAction: "Awaiting receipt write",
    blocker: routeConnected ? null : "ROUTE NOT CONNECTED",
    routeConnected,
    packetId: packet?.packet_id ?? null,
    packetPath: run.packetPath,
    receiptPath: null,
    live: false
  };
}

export async function executeCardRoute(
  card: RelayCardDef,
  packet: RelayPacket
): Promise<{
  state: RelayCardState;
  success: boolean;
  outboundPath: string | null;
  error: string | null;
  blocker: string | null;
  nextAction: string;
  nextMissing: string;
}> {
  if (!isRouteConnected(card)) {
    return {
      state: "BLOCKED",
      success: false,
      outboundPath: null,
      error: null,
      blocker: "ROUTE NOT CONNECTED",
      nextAction: "Wire route before re-fire",
      nextMissing:
        card.routeKind === "spanzee_remote"
          ? "Spanzee node instrumentation + remote probe endpoint"
          : "Configure cousin transport for this card"
    };
  }

  if (card.routeKind === "cousin_outbox" && card.cousin) {
    updatePacket(packet.packet_id, { status: "WORKING" });
    try {
      const result = await dispatchBuild({
        missionText: packet.mission_text,
        title: `[Automatica] ${card.name}`,
        cousin: card.cousin,
        decisionNote: `Automatica relay packet ${packet.packet_id}`
      });

      if (!result.ok || !result.build?.outboxPath) {
        return {
          state: "EXPLODED",
          success: false,
          outboundPath: result.build?.outboxPath ?? null,
          error: result.message ?? "Dispatch failed",
          blocker: result.blocker ?? null,
          nextAction: "Inspect failure receipt",
          nextMissing: "Cousin auto-send from outbox (Edge paste still manual)"
        };
      }

      return {
        state: "RECEIPT RETURNED",
        success: true,
        outboundPath: result.build.outboxPath,
        error: null,
        blocker: null,
        nextAction: `Open outbox ${result.build.outboxFilename ?? ""} — Ben Send gate on cousin tab`,
        nextMissing: "Cousin auto-send + response capture back into Automatica receipts"
      };
    } catch (err) {
      return {
        state: "EXPLODED",
        success: false,
        outboundPath: null,
        error: err instanceof Error ? err.message : "Dispatch threw",
        blocker: null,
        nextAction: "Re-fire after fixing dispatch error",
        nextMissing: "Stable dispatchBuild path for Automatica cards"
      };
    }
  }

  return {
    state: "BLOCKED",
    success: false,
    outboundPath: null,
    error: null,
    blocker: "ROUTE NOT CONNECTED",
    nextAction: "Wire route handler",
    nextMissing: `Implement route kind ${card.routeKind}`
  };
}
