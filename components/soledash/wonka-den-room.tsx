"use client";

import { AskTheDenPanel } from "@/components/soledash/ask-the-den-panel";
import { useAgentInventory } from "@/lib/soledash/agent-inventory/use-agent-inventory";
import { machineWallTeaser, type MachineHealthCard } from "@/lib/soledash/machine-wall/types";
import { PearlShelfProvider, usePearlShelfContext } from "@/lib/pearls/v0/pearl-shelf-context";
import { usePermissionSwatterScoreboard } from "@/lib/soledash/permission-swatter/use-scoreboard";
import { DenZoneOpenProvider } from "@/lib/soledash/wonka-den-room/den-zone-context";
import {
  AUX_DEN_ZONE_IDS,
  DEN_ZONES,
  SECONDARY_DEN_ZONE_IDS,
  type DenZoneId,
  zoneFor
} from "@/lib/soledash/wonka-den-room/zones";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

export type DenRoomTeasers = {
  stepTitle: string;
  buildingCount: number;
  receiptAttention: number;
};

export function WonkaDenRoom({
  teasers,
  panels,
  workbenchCenter
}: {
  teasers: DenRoomTeasers;
  panels: Record<DenZoneId, ReactNode>;
  workbenchCenter: ReactNode;
}) {
  return (
    <PearlShelfProvider>
      <WonkaDenRoomBody teasers={teasers} panels={panels} workbenchCenter={workbenchCenter} />
    </PearlShelfProvider>
  );
}

function machineWallVisibleState(machines: MachineHealthCard[] | null, error: string | null): string {
  if (error) return "Unknown";
  if (!machines) return "Unknown";
  return machineWallTeaser(machines);
}

function WonkaDenRoomBody({
  teasers,
  panels,
  workbenchCenter
}: {
  teasers: DenRoomTeasers;
  panels: Record<DenZoneId, ReactNode>;
  workbenchCenter: ReactNode;
}) {
  const [activeZone, setActiveZone] = useState<DenZoneId | null>(null);
  const { scoreboard, loading: swatterLoading } = usePermissionSwatterScoreboard();
  const { machineHealth, fleetError } = useAgentInventory();
  const { statusCounts: pearlStatusCounts, totalCount: pearlTotalCount, loadError: pearlLoadError } = usePearlShelfContext();

  const openZone = useCallback((id: DenZoneId) => setActiveZone(id), []);
  const closeFocus = useCallback(() => setActiveZone(null), []);

  useEffect(() => {
    if (!activeZone) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeFocus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeZone, closeFocus]);

  useEffect(() => {
    function openHashedZone() {
      const hash = window.location.hash.replace(/^#/, "");
      const zone = DEN_ZONES.find((candidate) => candidate.id === hash);
      if (zone) setActiveZone(zone.id);
    }
    openHashedZone();
    window.addEventListener("hashchange", openHashedZone);
    return () => window.removeEventListener("hashchange", openHashedZone);
  }, []);

  const swatterDigits = scoreboard?.display ?? (swatterLoading ? "·········" : "000000000");

  const swatterTeaser = scoreboard
    ? swatterDigits
    : swatterLoading
      ? "000000000"
      : "000000000 - source missing";

  function zoneTeaser(id: DenZoneId): string {
    switch (id) {
      case "workbench":
        return teasers.buildingCount === 0
          ? "No active builds"
          : `${teasers.buildingCount} project${teasers.buildingCount === 1 ? "" : "s"} moving`;
      case "machine-wall": {
        return machineWallVisibleState(machineHealth, fleetError);
      }
      case "receipt-wall":
        return teasers.receiptAttention === 0
          ? "Wall is quiet"
          : `${teasers.receiptAttention} items need review`;
      case "pearl-shelf":
        return pearlLoadError
          ? "Source error"
          : `${pearlTotalCount} real · NEW ${pearlStatusCounts.NEW} · REVIEWED ${pearlStatusCounts.REVIEWED} · PROMOTED ${pearlStatusCounts.PROMOTED}`;
      case "artifact-shelf":
        return "Links to operator artifacts";
      case "forge":
        return "Spanzee · MMORPG · Space Mining";
      case "permission-swatter":
        return `Swatted: ${swatterTeaser}`;
      default:
        return "";
    }
  }

  function renderZoneChip(id: DenZoneId, secondary = false) {
    const zone = zoneFor(id);
    const isSwatter = id === "permission-swatter";
    return (
      <button
        key={id}
        type="button"
        className={`sd-den-secondary-zone ${secondary ? "sd-den-secondary-zone--primary-secondary" : ""} sd-den-secondary-zone--${id.replace(/-/g, "_")}`}
        aria-label={`${zone.title} — ${zone.tagline}`}
        onClick={() => openZone(id)}
      >
        <span className="sd-den-secondary-zone__icon" aria-hidden="true">
          {zone.icon}
        </span>
        <span className="sd-den-secondary-zone__title">{zone.title}</span>
        {isSwatter ? (
          <span className="sd-den-secondary-zone__counter">{swatterTeaser}</span>
        ) : (
          <span className="sd-den-secondary-zone__teaser">{zoneTeaser(id)}</span>
        )}
      </button>
    );
  }

  const active = activeZone ? zoneFor(activeZone) : null;

  return (
    <DenZoneOpenProvider openZone={openZone}>
      <div className="sd-den-room-wrap sd-den-room-wrap--workbench-first">
        <div className="sd-den-room sd-den-room--workbench-first" aria-label="Wonka Den room">
          <div className="sd-den-room__sky" aria-hidden="true" />
          <div className="sd-den-room__floor" aria-hidden="true" />

          <header className="sd-den-room__masthead">
            <h1 className="sd-den-room__title">Wonka Den</h1>
            <p className="sd-den-room__subtitle">Den-first: build input, Send to Aeye, and receipt are first.</p>
          </header>

          <div className="sd-den-workbench-center">{workbenchCenter}</div>

          <details className="sd-den-status-zones">
            <summary className="sd-den-status-zones__summary">
              ADVANCED: secondary panels collapsed under Main Desk
            </summary>
            <section className="sd-den-secondary-rail" aria-label="Secondary zones">
              <p className="sd-den-secondary-rail__label">Machine, receipt, and shelf status</p>
              <div className="sd-den-secondary-rail__chips">
                {SECONDARY_DEN_ZONE_IDS.map((id) => renderZoneChip(id, true))}
              </div>
            </section>
          </details>

          <details className="sd-den-more-zones">
            <summary className="sd-den-more-zones__summary">NOT WIRED: unused routes and duplicate surfaces collapsed</summary>
            <div className="sd-den-more-zones__body">
              <AskTheDenPanel />
              <div className="sd-den-secondary-rail__chips sd-den-secondary-rail__chips--aux">
                {AUX_DEN_ZONE_IDS.map((id) => renderZoneChip(id))}
              </div>
            </div>
          </details>
        </div>

        {activeZone && active ? (
          <div className="sd-den-focus" role="dialog" aria-modal="true" aria-labelledby="sd-den-focus-title">
            <button type="button" className="sd-den-focus__backdrop" aria-label="Back to Workbench" onClick={closeFocus} />
            <div className="sd-den-focus__panel">
              <header className="sd-den-focus__head">
                <div>
                  <p className="sd-den-focus__eyebrow">{active.icon} Secondary zone</p>
                  <h2 id="sd-den-focus-title" className="sd-den-focus__title">
                    {active.title}
                  </h2>
                  <p className="sd-den-focus__tagline">{active.tagline}</p>
                </div>
                <button type="button" className="sd-den-focus__close" onClick={closeFocus}>
                  Back to Workbench
                </button>
              </header>
              <div className="sd-den-focus__body">{panels[activeZone]}</div>
            </div>
          </div>
        ) : null}
      </div>
    </DenZoneOpenProvider>
  );
}
