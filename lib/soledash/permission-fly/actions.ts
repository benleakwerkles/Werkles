import fs from "node:fs";
import path from "node:path";

import { presetById } from "./presets";
import {
  activeFly,
  ensurePermissionFlyDirs,
  latestPermissionFlyReceipt,
  loadRegistry,
  rel,
  saveRegistry,
  writePermissionFlyReceipt
} from "./storage";
import type {
  PermissionFlyActionKind,
  PermissionFlyClassification,
  PermissionFlyEntry,
  PermissionFlyPanel,
  PermissionFlyReceipt,
  PermissionFlySeverity
} from "./types";

const ROOT = process.cwd();
const DINK_OUTBOX = path.join(ROOT, "foreman", "handoffs", "outbox");

function stampForFilename(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/\..+$/, "").slice(0, 15);
}

function newReceiptId(): string {
  return `pfly_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function upsertFly(
  id: string,
  patch: Omit<PermissionFlyEntry, "count"> & { countDelta?: number }
): PermissionFlyEntry {
  const registry = loadRegistry();
  const idx = registry.flies.findIndex((f) => f.id === id);
  const now = patch.last_occurrence;

  if (idx >= 0) {
    const prev = registry.flies[idx];
    const entry: PermissionFlyEntry = {
      ...prev,
      source: patch.source,
      count: prev.count + (patch.countDelta ?? 1),
      last_occurrence: now,
      severity: patch.severity,
      classification: patch.classification,
      detail: patch.detail
    };
    registry.flies[idx] = entry;
    saveRegistry(registry.flies);
    return entry;
  }

  const entry: PermissionFlyEntry = {
    id,
    source: patch.source,
    count: patch.countDelta ?? 1,
    last_occurrence: now,
    severity: patch.severity,
    classification: patch.classification,
    detail: patch.detail
  };
  registry.flies.push(entry);
  saveRegistry(registry.flies);
  return entry;
}

function writeReceipt(entry: PermissionFlyEntry, action: PermissionFlyActionKind): PermissionFlyReceipt {
  const now = new Date().toISOString();
  const receipt: PermissionFlyReceipt = {
    fly_id: entry.id,
    receipt_id: newReceiptId(),
    timestamp: now,
    action,
    source: entry.source,
    count: entry.count,
    last_occurrence: entry.last_occurrence,
    severity: entry.severity,
    classification: entry.classification,
    detail: entry.detail,
    receipt_path: "",
    dink_outbox_path: null,
    success: false
  };
  receipt.receipt_path = writePermissionFlyReceipt(receipt);
  receipt.success = true;
  return receipt;
}

function writeDinkHandoff(entry: PermissionFlyEntry, receipt: PermissionFlyReceipt): string | null {
  try {
    fs.mkdirSync(DINK_OUTBOX, { recursive: true });
    const slug = entry.source.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 32);
    const file = path.join(
      DINK_OUTBOX,
      `TO_DINK_PERMISSION_FLY_${slug}_${stampForFilename(receipt.timestamp)}.md`
    );
    const body = `# To Dink: Permission fly

| Field | Value |
|-------|-------|
| Fly ID | \`${entry.id}\` |
| Source | ${entry.source} |
| Count | ${entry.count} |
| Last occurrence | ${entry.last_occurrence} |
| Severity | ${entry.severity.toUpperCase()} |
| Classification | ${entry.classification} |
| Receipt | \`${receipt.receipt_path}\` |

## Detail

${entry.detail ?? "—"}

## Operator ask

Track permission-fly pattern from ${entry.source}. Recommend policy: mute, pre-approve scope, or keep asking per classification.

## Hard stops

- No auto-approval of production gates — Operator decides
- Authority: \`foreman/HUMAN_GATES.md\`
`;
    fs.writeFileSync(file, body, "utf8");
    return rel(file);
  } catch {
    return null;
  }
}

export function loadPermissionFlyPanel(): PermissionFlyPanel {
  ensurePermissionFlyDirs();
  const registry = loadRegistry();
  return {
    active: activeFly(registry.flies),
    flies: registry.flies,
    last_receipt: latestPermissionFlyReceipt()
  };
}

export function reportPermissionFlyPreset(presetId: string): { entry: PermissionFlyEntry; receipt: PermissionFlyReceipt } {
  const preset = presetById(presetId);
  if (!preset) throw new Error(`Unknown permission fly preset: ${presetId}`);

  const now = new Date().toISOString();
  const entry = upsertFly(preset.id, {
    id: preset.id,
    source: preset.source,
    last_occurrence: now,
    severity: preset.severity,
    classification: preset.classification,
    detail: preset.detail,
    countDelta: 1
  });
  const receipt = writeReceipt(entry, "reported");
  return { entry, receipt };
}

export function reportPermissionFlyManual(input: {
  source: string;
  severity: PermissionFlySeverity;
  classification: PermissionFlyClassification;
  detail?: string;
}): { entry: PermissionFlyEntry; receipt: PermissionFlyReceipt } {
  const source = input.source.trim();
  if (!source) throw new Error("source required");

  const id = source.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 48) || `fly_${Date.now()}`;
  const now = new Date().toISOString();
  const entry = upsertFly(id, {
    id,
    source,
    last_occurrence: now,
    severity: input.severity,
    classification: input.classification,
    detail: input.detail?.trim() ?? null,
    countDelta: 1
  });
  const receipt = writeReceipt(entry, "reported");
  return { entry, receipt };
}

function updateClassification(
  flyId: string,
  classification: PermissionFlyClassification,
  action: PermissionFlyActionKind
): { entry: PermissionFlyEntry; receipt: PermissionFlyReceipt } {
  const registry = loadRegistry();
  const idx = registry.flies.findIndex((f) => f.id === flyId);
  if (idx < 0) throw new Error("Permission fly not found");

  const entry: PermissionFlyEntry = {
    ...registry.flies[idx],
    classification,
    last_occurrence: new Date().toISOString()
  };
  registry.flies[idx] = entry;
  saveRegistry(registry.flies);

  const receipt = writeReceipt(entry, action);
  return { entry, receipt };
}

export function sendPermissionFlyToDink(flyId?: string): { entry: PermissionFlyEntry; receipt: PermissionFlyReceipt } {
  const registry = loadRegistry();
  const entry = flyId
    ? registry.flies.find((f) => f.id === flyId)
    : activeFly(registry.flies);
  if (!entry) throw new Error("No permission fly to send");

  const receipt = writeReceipt(entry, "send_to_dink");
  receipt.dink_outbox_path = writeDinkHandoff(entry, receipt);
  writePermissionFlyReceipt(receipt);
  return { entry, receipt };
}

export function preApprovePermissionFly(flyId?: string): { entry: PermissionFlyEntry; receipt: PermissionFlyReceipt } {
  const registry = loadRegistry();
  const id = flyId ?? activeFly(registry.flies)?.id;
  if (!id) throw new Error("No permission fly to pre-approve");
  return updateClassification(id, "pre_approved", "pre_approve");
}

export function keepAskingPermissionFly(flyId?: string): { entry: PermissionFlyEntry; receipt: PermissionFlyReceipt } {
  const registry = loadRegistry();
  const id = flyId ?? activeFly(registry.flies)?.id;
  if (!id) throw new Error("No permission fly for keep asking");
  return updateClassification(id, "keep_asking", "keep_asking");
}
