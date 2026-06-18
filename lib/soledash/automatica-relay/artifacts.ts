import "server-only";

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

import { buildFailureContext } from "./failure-context";
import { buildResultTranslation } from "./output-translation";
import type {
  RelayArtifact,
  RelayArtifactGate,
  RelayCardNotes,
  RelayReceiptStrip
} from "./artifact-types";
import type { RelayCardDef, RelayCardView, RelayReceipt } from "./types";

export type {
  RelayArtifact,
  RelayArtifactGate,
  RelayArtifactKind,
  RelayCardNotes,
  RelayReceiptStrip
} from "./artifact-types";

const ROOT = process.cwd();

export const ALLOWED_COMPLETION_ARTIFACTS = [
  "screenshot",
  "screen recording",
  "URL",
  "commit hash",
  "receipt file",
  "diff",
  "generated report"
];

function readGitShortHead(): string | null {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function readGitDiffStat(maxLines = 6): string | null {
  try {
    const out = execSync("git diff --stat HEAD", { cwd: ROOT, encoding: "utf8", maxBuffer: 8192 }).trim();
    if (!out) return null;
    return out.split("\n").slice(-maxLines).join("\n");
  } catch {
    return null;
  }
}

function fleetStateExists(): boolean {
  return fs.existsSync(path.join(ROOT, "foreman", "soledash", "FLEET_STATE.json"));
}

export function staticArtifactsForCard(card: RelayCardDef): RelayArtifact[] {
  const items: RelayArtifact[] = [];

  switch (card.id) {
    case "ui_cleanup_across_screens":
      items.push({
        kind: "localhost_url",
        label: "Localhost",
        value: "http://localhost:3002/soledash",
        href: "http://localhost:3002/soledash",
        thumbnail: null
      });
      items.push({
        kind: "screenshot",
        label: "SoleDash preview",
        value: "Open Command → Relay cards",
        href: "http://localhost:3002/soledash",
        thumbnail: "/assets/soledash/branding/soledash-icon-192.png"
      });
      break;
    case "kindsir_com_cleanup":
      items.push({
        kind: "preview_url",
        label: "Site preview",
        value: "https://kindsir.com",
        href: "https://kindsir.com",
        thumbnail: null
      });
      break;
    case "spanzee_remote_check":
      if (fleetStateExists()) {
        items.push({
          kind: "file_path",
          label: "Fleet state",
          value: "foreman/soledash/FLEET_STATE.json",
          href: null,
          thumbnail: null
        });
      }
      break;
    default:
      break;
  }

  return items;
}

function dynamicArtifacts(
  card: RelayCardDef,
  receipt: RelayReceipt | null,
  outboundPath: string | null
): RelayArtifact[] {
  const items: RelayArtifact[] = [];

  const commit = readGitShortHead();
  if (commit && (card.id === "ui_cleanup_across_screens" || card.taskType === "ui_cleanup")) {
    items.push({
      kind: "commit_hash",
      label: "Commit",
      value: commit,
      href: null,
      thumbnail: null
    });
    const diff = readGitDiffStat();
    if (diff) {
      items.push({
        kind: "diff_summary",
        label: "Diff summary",
        value: diff,
        href: null,
        thumbnail: null
      });
    }
  }

  if (receipt?.blocker) {
    items.push({
      kind: "diff_summary",
      label: "Blocker proof",
      value: receipt.blocker,
      href: null,
      thumbnail: null
    });
  }

  if (outboundPath) {
    items.push({
      kind: "file_path",
      label: "Outbox packet",
      value: outboundPath,
      href: null,
      thumbnail: null
    });
  }

  if (receipt?.packet_path) {
    items.push({
      kind: "file_path",
      label: "Packet",
      value: receipt.packet_path,
      href: null,
      thumbnail: null
    });
  }

  return items;
}

function dedupeArtifacts(items: RelayArtifact[]): RelayArtifact[] {
  const seen = new Set<string>();
  return items.filter((a) => {
    const key = `${a.kind}:${a.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isCompletionArtifact(artifact: RelayArtifact): boolean {
  const value = artifact.value.trim();
  if (!value) return false;

  switch (artifact.kind) {
    case "screenshot":
    case "screen_recording":
    case "url":
    case "localhost_url":
    case "preview_url":
    case "commit_hash":
    case "receipt_file":
    case "generated_report":
      return true;
    case "diff_summary":
      return /diff/i.test(artifact.label);
    case "file_path":
      return false;
    default:
      return false;
  }
}

export function completionArtifactsForCard(card: RelayCardDef, receipt: RelayReceipt | null): RelayArtifact[] {
  return dedupeArtifacts([
    ...(receipt?.artifacts ?? []),
    ...staticArtifactsForCard(card),
    ...dynamicArtifacts(card, receipt, receipt?.outbound_path ?? null)
  ]).filter(isCompletionArtifact);
}

export function evaluateArtifactGate(card: RelayCardDef, receipt: RelayReceipt | null): RelayArtifactGate {
  const required = card.ARTIFACT_REQUIRED;
  const artifacts = completionArtifactsForCard(card, receipt);

  if (!required) {
    return {
      required,
      passed: true,
      allowed_artifacts: ALLOWED_COMPLETION_ARTIFACTS,
      artifact_count: artifacts.length,
      blocker: null
    };
  }

  const passed = artifacts.length > 0;
  return {
    required,
    passed,
    allowed_artifacts: ALLOWED_COMPLETION_ARTIFACTS,
    artifact_count: artifacts.length,
    blocker: passed
      ? null
      : "ARTIFACT_REQUIRED: task cannot move to RECEIPT RETURNED without screenshot, screen recording, URL, commit hash, receipt file, diff, or generated report."
  };
}

export function buildReceiptStrip(input: {
  packetId: string | null;
  receiptPath: string | null;
  packetPath: string | null;
  receipt: RelayReceipt | null;
}): RelayReceiptStrip {
  return {
    packetId: input.packetId,
    receiptPath: input.receiptPath,
    outboundPath: input.receipt?.outbound_path ?? null,
    packetPath: input.packetPath,
    success: input.receipt?.success ?? null,
    updatedAt: input.receipt?.updated_at ?? null,
    status: input.receipt?.status ?? null
  };
}

export function buildCardNotes(card: RelayCardView): RelayCardNotes {
  return {
    owner: card.owner,
    machine: card.targetComputer,
    confidence: card.confidence,
    expectedReceipt: card.expectedReceipt,
    blocker: card.blocker,
    lastUpdate: card.lastUpdate,
    nextAction: card.nextAction,
    missionText: card.missionText,
    artifactRequired: card.ARTIFACT_REQUIRED,
    artifactGate: card.artifactGate
  };
}

export function enrichRelayCardView(
  card: RelayCardView,
  receipt: RelayReceipt | null
): RelayCardView {
  const staticItems = staticArtifactsForCard(card);
  const receiptItems = receipt?.artifacts ?? [];
  const dynamicItems = dynamicArtifacts(card, receipt, receipt?.outbound_path ?? null);
  const artifacts = dedupeArtifacts([...receiptItems, ...staticItems, ...dynamicItems]);
  const artifactGate = evaluateArtifactGate(card, receipt);

  if (artifacts.length === 0 && card.blocker) {
    artifacts.push({
      kind: "diff_summary",
      label: "Blocker",
      value: card.blocker,
      href: null,
      thumbnail: null
    });
  }

  return {
    ...card,
    artifacts,
    artifactGate,
    receipt: buildReceiptStrip({
      packetId: card.packetId,
      receiptPath: card.receiptPath,
      packetPath: card.packetPath,
      receipt
    }),
    notes: buildCardNotes(card),
    failureContext: buildFailureContext(card, receipt),
    resultTranslation: buildResultTranslation(card, receipt)
  };
}
