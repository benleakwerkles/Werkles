import type { DecisionSurfaceView, ReceiptCenterEntry } from "@/protocol/index";
import type { RelayCardView } from "@/lib/soledash/automatica-relay/types";

import { verifyLiveTransport } from "./live-verify";
import type { Provenance, ProvenanceDisplay, ProvenanceSource } from "./types";

export { LIVE_MAX_AGE_MS } from "./live-verify";

const STALE_MS = 20 * 60 * 1000;

function parseTime(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : NaN;
}

export function formatAge(iso: string, nowMs = Date.now()): string {
  const t = parseTime(iso);
  if (!Number.isFinite(t)) return "unknown age";

  const deltaSec = Math.max(0, Math.floor((nowMs - t) / 1000));
  if (deltaSec < 60) return `${deltaSec}s`;
  const deltaMin = Math.floor(deltaSec / 60);
  if (deltaMin < 60) return `${deltaMin}m`;
  const deltaHr = Math.floor(deltaMin / 60);
  return `${deltaHr}h`;
}

export function formatTimestamp(iso: string): string {
  const t = parseTime(iso);
  if (!Number.isFinite(t)) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short"
  }).format(new Date(t));
}

export function enrichProvenance(provenance: Provenance, nowMs = Date.now()): ProvenanceDisplay {
  const normalized =
    provenance.source === "LIVE" && !provenance.liveProof
      ? { ...provenance, source: "FILE" as ProvenanceSource, detail: provenance.detail ?? "LIVE denied — no proof" }
      : provenance;

  const t = parseTime(normalized.updatedAt);
  const stale = Number.isFinite(t) ? nowMs - t > STALE_MS : true;
  return {
    ...normalized,
    ageLabel: formatAge(normalized.updatedAt, nowMs),
    timestampLabel: formatTimestamp(normalized.updatedAt),
    stale
  };
}

function coalesceTime(...values: Array<string | null | undefined>): string {
  for (const v of values) {
    if (v && parseTime(v)) return v;
  }
  return new Date(0).toISOString();
}

export function provenanceFromDecisionView(
  view: DecisionSurfaceView,
  lastRefresh: string,
  nowMs = Date.now()
): Provenance {
  const payload = view.payload;
  const updatedAt = coalesceTime(
    payload.updated_at,
    payload.generated_at,
    lastRefresh
  );

  if (view.data_source === "unavailable") {
    return {
      source: "UNKNOWN",
      updatedAt,
      detail: view.load_error ?? "payload unavailable",
      liveProof: null
    };
  }

  if (view.data_source === "mock" || payload.mock) {
    return {
      source: "LOCAL",
      updatedAt,
      detail: "mock decision payload",
      liveProof: null
    };
  }

  const liveCheck = verifyLiveTransport(view, updatedAt, nowMs);
  if (liveCheck.allowed) {
    return {
      source: "LIVE",
      updatedAt,
      detail: "foreman/soledash/DECISION_SURFACE.json",
      liveProof: liveCheck.proof
    };
  }

  return {
    source: "FILE",
    updatedAt,
    detail: liveCheck.proof,
    liveProof: null
  };
}

export function provenanceFromStatePoll(lastRefresh: string): Provenance {
  return {
    source: "API",
    updatedAt: lastRefresh,
    detail: "/api/soledash/v1/state"
  };
}

export function provenanceFromReceiptEntry(entry: ReceiptCenterEntry): Provenance {
  const updatedAt = coalesceTime(entry.last_update, entry.created_at);

  if (entry.mock || entry.mock_test) {
    return {
      source: "LOCAL",
      updatedAt,
      detail: entry.receipt_link ?? "client mock receipt"
    };
  }

  if (entry.simulated) {
    return {
      source: "FILE",
      updatedAt,
      detail: entry.receipt_link ?? "foreman/soledash/receipts/ (simulated file)"
    };
  }

  if (entry.receipt_link?.startsWith("foreman/")) {
    return {
      source: "FILE",
      updatedAt,
      detail: entry.receipt_link
    };
  }

  return {
    source: "FILE",
    updatedAt,
    detail: entry.receipt_link ?? "foreman/soledash/receipts/"
  };
}

export function provenanceFromRelayCard(card: RelayCardView): Provenance {
  const updatedAt = coalesceTime(card.lastUpdate, card.receipt.updatedAt);

  if (!card.live) {
    return {
      source: "LOCAL",
      updatedAt,
      detail: card.receiptPath ?? "relay fixture"
    };
  }

  const path = card.receiptPath ?? card.receipt.receiptPath ?? card.receipt.packetPath;
  if (path?.startsWith("foreman/") || path?.includes("/receipts/")) {
    return {
      source: "FILE",
      updatedAt,
      detail: path
    };
  }

  return {
    source: "API",
    updatedAt,
    detail: "/api/soledash/v1/automatica-relay"
  };
}

export function provenanceFromDrawerAction(actedAt: string): Provenance {
  return {
    source: "FILE",
    updatedAt: actedAt,
    detail: "foreman/soledash/RECEIPT_DRAWER.json"
  };
}

export function provenanceFromNextStep(updatedAt: string | null): Provenance {
  if (!updatedAt) {
    return {
      source: "UNKNOWN",
      updatedAt: new Date(0).toISOString(),
      detail: "no next-step override saved"
    };
  }
  return {
    source: "FILE",
    updatedAt,
    detail: "foreman/soledash/NEXT_STEP_OVERRIDE.json"
  };
}

export function provenanceFromDecisionReceipt(
  writtenTo: string | null,
  outcome: string | null,
  payloadUpdatedAt: string
): Provenance {
  if (!outcome && !writtenTo) {
    return {
      source: "UNKNOWN",
      updatedAt: payloadUpdatedAt,
      detail: "no decision receipt yet"
    };
  }
  return {
    source: writtenTo?.startsWith("foreman/") ? "FILE" : "LOCAL",
    updatedAt: payloadUpdatedAt,
    detail: writtenTo ?? "decision_receipt slot"
  };
}

export function mergeProvenance(primary: Provenance, fallback: Provenance): Provenance {
  if (primary.source === "UNKNOWN" && primary.updatedAt === new Date(0).toISOString()) {
    return fallback;
  }
  return primary;
}

export function sourceClass(source: ProvenanceSource): string {
  return source.toLowerCase();
}
