export type ProvenanceSource = "FILE" | "LIVE" | "API" | "LOCAL" | "UNKNOWN";

export type Provenance = {
  source: ProvenanceSource;
  /** ISO-8601 — data-bound last update for this signal */
  updatedAt: string;
  /** Optional path or endpoint for audit */
  detail?: string | null;
  /** Required when source is LIVE — verification proof string */
  liveProof?: string | null;
};

export type ProvenanceDisplay = Provenance & {
  ageLabel: string;
  timestampLabel: string;
  stale: boolean;
};
