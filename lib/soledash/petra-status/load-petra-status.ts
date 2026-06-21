import fs from "node:fs";
import path from "node:path";

import { loadFleetState } from "@/lib/soledash/megawork-home/load-fleet-state";
import type { PetraTransportEnvelope } from "@/lib/soledash/petra-transport/types";

import type { PetraStatusSnapshot } from "./types";

const ROOT = process.cwd();
const INBOX_DIR = path.join(ROOT, "foreman", "handoffs", "inbox");
const TRANSPORT_LOG = path.join(ROOT, "foreman", "soledash", "PETRA_TRANSPORT_RECEIPTS.jsonl");
const CONTEXT_HEALTH = path.join(ROOT, "foreman", "crew-dispatch", "context-health.json");
const PENDING_TRANSPORT = path.join(ROOT, "foreman", "soledash", ".petra-transport-pending.txt");

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")) as T;
  } catch {
    return null;
  }
}

function formatHeartbeat(iso: string | null): string {
  if (!iso) return "No pulse recorded";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "No pulse recorded";
  const hours = Math.floor((Date.now() - at.getTime()) / 3_600_000);
  const stamp = at.toLocaleString();
  if (hours < 1) return `Live · ${stamp}`;
  if (hours < 48) return `${hours}h ago · ${stamp}`;
  const days = Math.floor(hours / 24);
  return `${days}d ago · ${stamp}`;
}

function shorten(text: string, max = 96): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1)}…`;
}

function latestTransportReceipt(): PetraTransportEnvelope | null {
  if (!fs.existsSync(TRANSPORT_LOG)) return null;
  const lines = fs
    .readFileSync(TRANSPORT_LOG, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      return JSON.parse(lines[i]!) as PetraTransportEnvelope;
    } catch {
      continue;
    }
  }
  return null;
}

function latestFromPetraVerdict(): { verdict: string; at: string | null } {
  if (!fs.existsSync(INBOX_DIR)) {
    return { verdict: "No FROM_PETRA receipt on file", at: null };
  }

  const files = fs
    .readdirSync(INBOX_DIR)
    .filter((name) => /^FROM_PETRA_/i.test(name))
    .map((name) => {
      const file = path.join(INBOX_DIR, name);
      return { name, file, mtime: fs.statSync(file).mtime.toISOString() };
    })
    .sort((a, b) => b.mtime.localeCompare(a.mtime));

  if (files.length === 0) {
    return { verdict: "Awaiting Petra response", at: null };
  }

  const latest = files[0]!;
  const text = fs.readFileSync(latest.file, "utf8");
  const titleMatch = text.match(/^#\s*From PETRA[^—]*—\s*(.+)$/im);
  const title = titleMatch?.[1]?.trim();

  const verdictPatterns = [
    /\b(GO|NO-GO|NO GO|CONDITIONAL GO|CONDITIONAL-GO|RECEIVED|PARKED|STOP)\b/i,
    /\bverdict\s*:\s*(.+)$/im
  ];

  for (const pattern of verdictPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const word = match[1].toUpperCase().replace(/\s+/g, "-");
      return {
        verdict: title ? `${word} · ${title}` : word,
        at: latest.mtime
      };
    }
  }

  return {
    verdict: title ? `Receipt on file · ${title}` : "Receipt on file",
    at: latest.mtime
  };
}

function resolveMachine(transport: PetraTransportEnvelope | null): string {
  if (transport?.target_machine) return transport.target_machine;

  const fleet = loadFleetState();
  if (fleet.ok) {
    const betsy = fleet.file.machines.find((m) => m.id === "betsy");
    if (betsy?.display_name && betsy.display_name !== "UNKNOWN") {
      return betsy.display_name;
    }
  }

  return "Betsy";
}

function resolveSpof(transport: PetraTransportEnvelope | null): string {
  if (!transport) {
    return fs.existsSync(PENDING_TRANSPORT)
      ? "Pending transport packet on disk — composer path not confirmed"
      : "Petra transport not instrumented yet";
  }

  if (transport.delivery_status === "confirmed" || transport.delivery_confirmed) {
    return "Clear — composer path reachable on last attempt";
  }

  if (transport.failure_reason) {
    return shorten(transport.failure_reason.split(/\r?\n/)[0] ?? transport.failure_reason);
  }

  return shorten(`Transport ${transport.delivery_status.replace(/_/g, " ")}`);
}

function resolveHeartbeat(
  transport: PetraTransportEnvelope | null,
  verdictAt: string | null
): { label: string; at: string | null } {
  const candidates: string[] = [];

  if (transport?.created_at) candidates.push(transport.created_at);
  if (verdictAt) candidates.push(verdictAt);

  if (fs.existsSync(PENDING_TRANSPORT)) {
    candidates.push(fs.statSync(PENDING_TRANSPORT).mtime.toISOString());
  }

  const health = readJson<{ updatedAt?: string; cousins?: { PETRA?: { status?: string } } }>(CONTEXT_HEALTH);
  if (health?.updatedAt) candidates.push(health.updatedAt);

  if (candidates.length === 0) {
    return { label: formatHeartbeat(null), at: null };
  }

  const at = candidates.sort((a, b) => b.localeCompare(a))[0] ?? null;
  return { label: formatHeartbeat(at), at };
}

/** Read-only Petra comptroller lane snapshot from existing foreman artifacts. */
export function loadPetraStatus(): PetraStatusSnapshot {
  const transport = latestTransportReceipt();
  const { verdict, at: verdictAt } = latestFromPetraVerdict();
  const heartbeat = resolveHeartbeat(transport, verdictAt);

  return {
    primary: "Petra (Comptroller)",
    machine: resolveMachine(transport),
    last_verdict: verdict,
    last_spof: resolveSpof(transport),
    heartbeat: heartbeat.label,
    heartbeat_at: heartbeat.at,
    loaded_at: new Date().toISOString()
  };
}
