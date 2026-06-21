import "server-only";

import { buildAgentInventoryRoster } from "@/lib/soledash/agent-inventory/build-roster";
import { projectById } from "@/lib/soledash/dispatch-matrix/projects";
import { loadPermissionSwatterReceiptLog } from "@/lib/soledash/permission-swatter/load-receipt-log";
import { loadPermissionSwatterScoreboard } from "@/lib/soledash/permission-swatter/load-scoreboard";
import {
  countUniqueApprovedCards,
  defaultDrawerApprover,
  readDrawerStore
} from "@/lib/soledash/receipt-drawer/storage";
import { DRAWER_STORE_REL_PATH } from "@/lib/soledash/receipt-drawer/approval-store";
import type { DrawerDispositionRecord } from "@/lib/soledash/receipt-drawer/types";

import { ARTIFACT_ORDER, type ArtifactShelfItem, type ArtifactShelfSnapshot } from "./types";

function formatReceiptStamp(iso: string | null | undefined): string {
  if (!iso || !iso.trim()) return "No receipt on file";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso.trim();
  return at.toLocaleString();
}

function latestDrawerDisposition(): DrawerDispositionRecord | null {
  const store = readDrawerStore();
  const records = Object.values(store.approvals);
  if (records.length === 0) return null;
  return records.sort((a, b) => b.acted_at.localeCompare(a.acted_at))[0] ?? null;
}

function rosterStatusSummary(): { status: string; owner: string; lastReceipt: string } {
  const roster = buildAgentInventoryRoster();
  const entries = roster.groups.flatMap((group) => group.entries);
  const live = entries.filter((entry) => entry.status !== "UNKNOWN").length;
  const blocked = entries.filter((entry) => entry.status === "BLOCKED").length;

  let status = roster.fleet_state_loaded
    ? `${live} agent${live === 1 ? "" : "s"} on roster`
    : "Fleet feed missing";
  if (blocked > 0) {
    status = `${blocked} blocked · ${status}`;
  }

  const active = entries.find((entry) => entry.status !== "UNKNOWN" && entry.status !== "BLOCKED");
  const owner = active?.aeye ?? "Fleet";

  return {
    status,
    owner,
    lastReceipt: formatReceiptStamp(roster.generated_at)
  };
}

export function buildArtifactShelf(): ArtifactShelfSnapshot {
  const store = readDrawerStore();
  const counter = countUniqueApprovedCards(store);
  const dispositionRecords = Object.values(store.approvals);
  const latestDisposition = latestDrawerDisposition();
  const roster = rosterStatusSummary();
  const scoreboard = loadPermissionSwatterScoreboard();
  const swatterLog = loadPermissionSwatterReceiptLog();
  const latestSwatter = swatterLog[0] ?? null;
  const crawler = projectById("nugget_of_wisdom_crawler");

  const byId: Record<ArtifactShelfItem["id"], ArtifactShelfItem> = {
    "receipt-drawer": {
      id: "receipt-drawer",
      label: "Receipt Drawer",
      status: dispositionRecords.length === 0 ? "Wall is quiet" : `${dispositionRecords.length} on record`,
      owner: defaultDrawerApprover(),
      lastReceipt: latestDisposition
        ? `${latestDisposition.receipt_id} · ${formatReceiptStamp(latestDisposition.acted_at)}`
        : "No drawer dispositions yet",
      openZone: "receipt-wall",
      sourcePath: DRAWER_STORE_REL_PATH
    },
    "approval-registry": {
      id: "approval-registry",
      label: "Approval Registry",
      status: `${counter.uniqueApproved} unique approved`,
      owner: defaultDrawerApprover(),
      lastReceipt: latestDisposition
        ? `${latestDisposition.disposition} · ${formatReceiptStamp(latestDisposition.acted_at)}`
        : "Registry empty",
      openZone: "receipt-wall",
      sourcePath: DRAWER_STORE_REL_PATH
    },
    "agent-roster": {
      id: "agent-roster",
      label: "Agent Roster",
      status: roster.status,
      owner: roster.owner,
      lastReceipt: roster.lastReceipt,
      openZone: "machine-wall",
      sourcePath: "foreman/FLEET_STATE.json"
    },
    "permission-swatter": {
      id: "permission-swatter",
      label: "Permission Swatter",
      status: `${scoreboard.total} swatted`,
      owner: "Dink",
      lastReceipt: latestSwatter
        ? `${latestSwatter.label} · ${formatReceiptStamp(latestSwatter.timestamp)}`
        : "No swatter receipts yet",
      openZone: "permission-swatter",
      sourcePath: scoreboard.source_path
    },
    crawler: {
      id: "crawler",
      label: "Crawler",
      status: crawler?.branch_status ?? "Unknown",
      owner: crawler?.required_aeyes?.join(" · ") ?? "Skybro · Bean · Dink",
      lastReceipt: crawler?.branch_label ?? "Nugget of Wisdom Crawler",
      openZone: "pearl-shelf",
      sourcePath: "lib/soledash/dispatch-matrix/projects.ts"
    }
  };

  return {
    artifacts: ARTIFACT_ORDER.map((id) => byId[id]),
    loaded_at: new Date().toISOString()
  };
}
