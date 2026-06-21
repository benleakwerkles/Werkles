"use client";



import { ArtifactShelfStrip } from "@/components/soledash/artifact-shelf";

import { useAgentInventory } from "@/lib/soledash/agent-inventory/use-agent-inventory";

import { machineWallTeaser } from "@/lib/soledash/machine-wall/types";

import { PearlShelfProvider, usePearlShelfContext } from "@/lib/pearls/v0/pearl-shelf-context";

import { usePermissionSwatterScoreboard } from "@/lib/soledash/permission-swatter/use-scoreboard";

import { DenZoneOpenProvider } from "@/lib/soledash/wonka-den-room/den-zone-context";

import { DEN_ZONES, type DenZoneId, zoneFor } from "@/lib/soledash/wonka-den-room/zones";

import type { ReactNode } from "react";

import { useCallback, useEffect, useState } from "react";



export type DenRoomTeasers = {

  stepTitle: string;

  buildingCount: number;

  receiptAttention: number;

};



export function WonkaDenRoom({
  teasers,
  panels
}: {
  teasers: DenRoomTeasers;
  panels: Record<DenZoneId, ReactNode>;
}) {
  return (
    <PearlShelfProvider>
      <WonkaDenRoomBody teasers={teasers} panels={panels} />
    </PearlShelfProvider>
  );
}

function WonkaDenRoomBody({
  teasers,
  panels
}: {
  teasers: DenRoomTeasers;
  panels: Record<DenZoneId, ReactNode>;
}) {
  const [activeZone, setActiveZone] = useState<DenZoneId | null>(null);
  const { scoreboard, loading: swatterLoading } = usePermissionSwatterScoreboard();
  const { machineHealth } = useAgentInventory();
  const { newCount: pearlNewCount } = usePearlShelfContext();

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



  const swatterDigits = scoreboard?.display ?? (swatterLoading ? "·········" : "000000000");



  function zoneTeaser(id: DenZoneId): string {

    switch (id) {

      case "main-desk":

        return teasers.stepTitle;

      case "workbench":

        return teasers.buildingCount === 0

          ? "Bench is clear"

          : `${teasers.buildingCount} project${teasers.buildingCount === 1 ? "" : "s"} moving`;

      case "machine-wall": {

        if (!machineHealth) return "Loading fleet…";

        return machineWallTeaser(machineHealth);

      }

      case "receipt-wall":

        return teasers.receiptAttention === 0

          ? "Wall is quiet"

          : `${teasers.receiptAttention} need your eyes`;

      case "artifact-shelf":

        return "5 artifacts · Drawer · Registry · Roster · Swatter · Crawler";

      case "pearl-shelf":

        return pearlNewCount === 0

          ? "Shelf is clear"

          : `${pearlNewCount} new pearl${pearlNewCount === 1 ? "" : "s"}`;

      case "forge":

        return "Spanzee · MMORPG · Space Mining warming";

      case "permission-swatter":

        return `Permissions Swatted: ${swatterDigits}`;

      default:

        return "";

    }

  }



  const active = activeZone ? zoneFor(activeZone) : null;



  return (

    <DenZoneOpenProvider openZone={openZone}>

      <div className="sd-den-room-wrap">

        <div className="sd-den-room" aria-label="Wonka Den room">

          <div className="sd-den-room__sky" aria-hidden="true" />

          <div className="sd-den-room__floor" aria-hidden="true" />



          <header className="sd-den-room__masthead">

            <h1 className="sd-den-room__title">Wonka Den</h1>

            <p className="sd-den-room__subtitle">A cozy workshop — click a zone to work there.</p>

          </header>



          <ArtifactShelfStrip receiptAttention={teasers.receiptAttention} />



          <div className="sd-den-room__layout">

            {DEN_ZONES.map((zone) => {

              const isSwatter = zone.id === "permission-swatter";

              const isFocused = activeZone === zone.id;



              return (

                <button

                  key={zone.id}

                  type="button"

                  className={`sd-den-zone sd-den-zone--${zone.id.replace(/-/g, "_")} ${isFocused ? "sd-den-zone--focused" : ""} ${isSwatter ? "sd-den-zone--counter" : ""}`}

                  style={{ ["--den-depth" as string]: `${zone.depth}px` }}

                  aria-label={`${zone.title} — ${zone.tagline}`}

                  aria-pressed={isFocused}

                  onClick={() => setActiveZone(zone.id)}

                >

                  <span className="sd-den-zone__icon" aria-hidden="true">

                    {zone.icon}

                  </span>

                  <span className="sd-den-zone__title">{zone.title}</span>

                  <span className="sd-den-zone__tagline">{zone.tagline}</span>

                  {isSwatter ? (

                    <span className="sd-den-zone__counter" aria-live="polite">

                      {swatterDigits}

                    </span>

                  ) : (

                    <span className="sd-den-zone__teaser">{zoneTeaser(zone.id)}</span>

                  )}

                  <span className="sd-den-zone__shine" aria-hidden="true" />

                </button>

              );

            })}

          </div>

        </div>



        {activeZone && active ? (

          <div className="sd-den-focus" role="dialog" aria-modal="true" aria-labelledby="sd-den-focus-title">

            <button type="button" className="sd-den-focus__backdrop" aria-label="Back to room" onClick={closeFocus} />

            <div className="sd-den-focus__panel">

              <header className="sd-den-focus__head">

                <div>

                  <p className="sd-den-focus__eyebrow">{active.icon} Zone</p>

                  <h2 id="sd-den-focus-title" className="sd-den-focus__title">

                    {active.title}

                  </h2>

                  <p className="sd-den-focus__tagline">{active.tagline}</p>

                </div>

                <button type="button" className="sd-den-focus__close" onClick={closeFocus}>

                  Back to Den

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
