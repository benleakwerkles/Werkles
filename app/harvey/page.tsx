import { promises as fs } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";

import { readHarveySnapshot } from "@/lib/harvey/snapshot";
import HarveyAeyeMonitorWall, { type HarveyAeyeMonitorModel } from "./HarveyAeyeMonitorWall";
import HarveyLiveCockpit, { HarveySnapshotProvider } from "./HarveyLiveCockpit";
import HarveyLiveControlSurface from "./HarveyLiveControlSurface";
import HarveyRelayWall from "./HarveyRelayWall";
import HarveySallyWitness from "./HarveySallyWitness";
import HarveyStationIdentity, { type HarveyStationIdentityModel } from "./HarveyStationIdentity";

export const metadata: Metadata = {
  title: "Harvey Command | Werkles",
  description: "Truthful fleet dispatch and receiver-proof cockpit.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

type Topology = {
  machines?: Array<{ id?: string; name: string; hostname?: string; status?: string; role?: string; evidence?: string }>;
  aeyes?: Array<{ aeye: string }>;
};

async function readJson<T>(relative: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(path.join(process.cwd(), relative), "utf8")) as T;
  } catch {
    return fallback;
  }
}

type PageProps = { searchParams?: Promise<{ sally_acceptance?: string }> };

export default async function HarveyCommandPage({ searchParams }: PageProps) {
  const parameters = searchParams ? await searchParams : undefined;
  const witnessOnly = Boolean(parameters?.sally_acceptance);
  const topology = await readJson<Topology>("foreman/relay/BIRDEYE_FLEET_TOPOLOGY_20260712.json", {});
  const aeyeMonitor = await readJson<HarveyAeyeMonitorModel>("foreman/harvey/HARVEY_AEYE_MONITOR_WALL_20260713.json", {});
  const stationIdentity = await readJson<HarveyStationIdentityModel>("foreman/harvey/HARVEY_STATION_IDENTITY_BOUNDARY_20260713.json", {});
  const initialSnapshot = await readHarveySnapshot();
  const machines = (topology.machines ?? [])
    .map(({ id, name, role }) => ({ id, name, role }));
  const aeyeCount = topology.aeyes?.length ?? 0;

  return (
    <main data-testid={witnessOnly ? "sally-witness-only" : "harvey-command"} style={{ minHeight: "100vh", background: "#0b0d10", color: "#edf0e8", padding: witnessOnly ? "12px" : "32px", fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace" }}>
      {!witnessOnly && <header style={{ maxWidth: 1200, margin: "0 auto 28px" }}>
        <p style={{ color: "#d8a84e", letterSpacing: 2, margin: 0 }}>HARVEY / BIRDEYE COMMAND</p>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 72px)", margin: "8px 0", color: "#fff4d6" }}>Fleet truth, not dispatch theater.</h1>
        <p style={{ maxWidth: 850, color: "#aeb6b0", lineHeight: 1.6 }}>Current machine state comes only from fresh authenticated heartbeats and structured command receipts. Published operator reports remain historical context.</p>
      </header>}
      {witnessOnly && <header style={{ maxWidth: 1200, margin: "0 auto 10px" }}><h1 style={{ fontSize: "clamp(20px, 6vw, 30px)", margin: 0, color: "#fff4d6" }}>Harvey / Sally browser acceptance</h1></header>}

      <HarveySnapshotProvider initialSnapshot={initialSnapshot}>
        {!witnessOnly && <HarveyLiveCockpit />}
        {!witnessOnly && <HarveyLiveControlSurface machines={machines} />}
        <HarveySallyWitness />
      </HarveySnapshotProvider>

      {!witnessOnly && <HarveyStationIdentity model={stationIdentity} />}

      {!witnessOnly && <HarveyRelayWall />}

      {!witnessOnly && <HarveyAeyeMonitorWall model={aeyeMonitor} />}

      {!witnessOnly && <footer style={{ maxWidth: 1200, margin: "28px auto", color: "#89928c", fontSize: 13 }}>
        {aeyeCount} Aeye roles modeled. Addressability does not prove an installed runtime, live thread, courier route, or return path.
      </footer>}
    </main>
  );
}
