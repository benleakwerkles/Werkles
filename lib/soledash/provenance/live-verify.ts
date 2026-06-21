import type { DecisionSurfaceView } from "@/protocol/index";

import { formatAge } from "./compute";
import type { Provenance, ProvenanceSource } from "./types";

/** LIVE requires fresh Dink file read — not a JSON flag alone */
export const LIVE_MAX_AGE_MS = 20 * 60 * 1000;

function parseTime(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : NaN;
}

export type LiveVerification = {
  /** May display SOURCE LIVE */
  allowed: boolean;
  /** Human-readable proof or denial reason */
  proof: string;
};

export function verifyLiveTransport(
  view: DecisionSurfaceView,
  updatedAt: string,
  nowMs = Date.now()
): LiveVerification {
  const path = "foreman/soledash/DECISION_SURFACE.json";
  const ageLabel = formatAge(updatedAt, nowMs);
  const t = parseTime(updatedAt);
  const ageMs = Number.isFinite(t) ? Math.max(0, nowMs - t) : Number.POSITIVE_INFINITY;

  if (view.data_source !== "dink") {
    return {
      allowed: false,
      proof: `LIVE denied — data_source=${view.data_source}, not dink file read`
    };
  }

  if (view.payload.mock) {
    return {
      allowed: false,
      proof: "LIVE denied — payload.mock=true"
    };
  }

  if (!view.payload.live_transport) {
    return {
      allowed: false,
      proof: `FILE only — live_transport=false on ${path}`
    };
  }

  if (ageMs > LIVE_MAX_AGE_MS) {
    return {
      allowed: false,
      proof: `LIVE denied — ${path} stale (${ageLabel}); live_transport flag is not proof`
    };
  }

  return {
    allowed: true,
    proof: `${path} · dink read · age ${ageLabel} · live_transport=true`
  };
}

/** Downgrade cosmetic LIVE; attach proof when LIVE is earned */
export function finalizeProvenanceSource(
  source: ProvenanceSource,
  view: DecisionSurfaceView | null,
  updatedAt: string,
  detail: string | null | undefined,
  nowMs = Date.now()
): Provenance {
  if (source !== "LIVE" || !view) {
    return { source, updatedAt, detail: detail ?? null, liveProof: null };
  }

  const check = verifyLiveTransport(view, updatedAt, nowMs);
  if (!check.allowed) {
    return {
      source: "FILE",
      updatedAt,
      detail: check.proof,
      liveProof: null
    };
  }

  return {
    source: "LIVE",
    updatedAt,
    detail: detail ?? pathDetail(view),
    liveProof: check.proof
  };
}

function pathDetail(view: DecisionSurfaceView): string {
  return view.payload.live_transport
    ? "foreman/soledash/DECISION_SURFACE.json · live_transport"
    : "foreman/soledash/DECISION_SURFACE.json";
}
