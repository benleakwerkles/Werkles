"use client";

import { useEffect, useState } from "react";

import { enrichProvenance, sourceClass } from "@/lib/soledash/provenance/compute";
import type { Provenance } from "@/lib/soledash/provenance/types";

export function ProvenanceLabel({
  provenance,
  compact,
  className = ""
}: {
  provenance: Provenance;
  compact?: boolean;
  className?: string;
}) {
  const [nowMs, setNowMs] = useState(() => {
    const updatedAtMs = Date.parse(provenance.updatedAt);
    return Number.isFinite(updatedAtMs) ? updatedAtMs : 0;
  });

  useEffect(() => {
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const display = enrichProvenance(provenance, nowMs);

  return (
    <div
      className={`sd-prov ${compact ? "sd-prov--compact" : ""} sd-prov--${sourceClass(display.source)} ${display.stale ? "sd-prov--stale" : ""} ${className}`.trim()}
      aria-label={`Source ${display.source}, age ${display.ageLabel}, last updated ${display.timestampLabel}`}
    >
      <span className="sd-prov__row">
        <span className="sd-prov__key">SOURCE</span>
        <span className="sd-prov__val sd-prov__val--source">{display.source}</span>
      </span>
      <span className="sd-prov__sep" aria-hidden="true">
        ·
      </span>
      <span className="sd-prov__row">
        <span className="sd-prov__key">AGE</span>
        <span className="sd-prov__val">{display.ageLabel}</span>
      </span>
      <span className="sd-prov__sep" aria-hidden="true">
        ·
      </span>
      <span className="sd-prov__row sd-prov__row--time">
        <span className="sd-prov__key">LAST UPDATED</span>
        <time className="sd-prov__val" dateTime={display.updatedAt}>
          {display.timestampLabel}
        </time>
      </span>
      {display.liveProof ? (
        <span className="sd-prov__proof" title={display.liveProof}>
          PROOF: {display.liveProof}
        </span>
      ) : null}
      {display.detail && (!compact || display.detail.includes("LIVE denied")) ? (
        <span className="sd-prov__detail" title={display.detail}>
          {display.detail}
        </span>
      ) : null}
    </div>
  );
}
