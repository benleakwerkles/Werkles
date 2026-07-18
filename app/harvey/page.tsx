import { promises as fs } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";

import { requireHarveyPrivatePageSession } from "@/lib/harvey/private-access";
import { readHarveySnapshot } from "@/lib/harvey/snapshot";
import type { HarveyWatchtowerContract } from "@/lib/harvey/watchtower";
import HarveyAeyeMonitorWall, { type HarveyAeyeMonitorModel } from "./HarveyAeyeMonitorWall";
import HarveyCommandDeck from "./HarveyCommandDeck";
import HarveyHandeyePairing from "./HarveyHandeyePairing";
import HarveyLiveCockpit, { HarveySnapshotProvider } from "./HarveyLiveCockpit";
import HarveyLiveControlSurface from "./HarveyLiveControlSurface";
import HarveyPasswordIncident from "./HarveyPasswordIncident";
import HarveyRelayWall from "./HarveyRelayWall";
import HarveySallyWitness from "./HarveySallyWitness";
import HarveySshOnboarding from "./HarveySshOnboarding";
import HarveyStationIdentity, { type HarveyStationIdentityModel } from "./HarveyStationIdentity";
import HarveySynapse from "./HarveySynapse";
import HarveyWatchtowerBrief from "./HarveyWatchtowerBrief";

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

type PageProps = { searchParams?: Promise<{ sally_acceptance?: string; handeye_pairing?: string }> };

export default async function HarveyCommandPage({ searchParams }: PageProps) {
  await requireHarveyPrivatePageSession();
  const parameters = searchParams ? await searchParams : undefined;
  const witnessOnly = Boolean(parameters?.sally_acceptance);
  const handeyePairingId = String(parameters?.handeye_pairing ?? "").trim();
  const handeyeReceiverOnly = Boolean(handeyePairingId);
  const topology = await readJson<Topology>("foreman/relay/BIRDEYE_FLEET_TOPOLOGY_20260712.json", {});
  const aeyeMonitor = await readJson<HarveyAeyeMonitorModel>("foreman/harvey/HARVEY_AEYE_MONITOR_WALL_20260713.json", {});
  const stationIdentity = await readJson<HarveyStationIdentityModel>("foreman/harvey/HARVEY_STATION_IDENTITY_BOUNDARY_20260713.json", {});
  const watchtowerContract = await readJson<HarveyWatchtowerContract>("foreman/harvey/HARVEY_WATCHTOWER_20260716.json", {});
  const projectFlockIndex = await readJson<unknown>("foreman/harvey/HARVEY_PROJECT_FLOCK_INDEX_20260716.json", {});
  const initialSnapshot = await readHarveySnapshot();
  const machines = (topology.machines ?? [])
    .map(({ id, name, role }) => ({ id, name, role }));
  const commandTargets = [...new Set(["All Aeyes", "Harvey crew", ...machines.map((machine) => machine.name), ...initialSnapshot.workstreams.map((workstream) => workstream.name)])];
  const aeyeCount = topology.aeyes?.length ?? 0;

  return (
    <main data-testid={witnessOnly ? "sally-witness-only" : handeyeReceiverOnly ? "betsy-handeye-only" : "harvey-command"} style={{ minHeight: "100vh", background: "#0b0d10", color: "#edf0e8", padding: witnessOnly || handeyeReceiverOnly ? "12px" : "clamp(10px,3vw,32px)", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif" }}>
      {witnessOnly && <header style={{ maxWidth: 1200, margin: "0 auto 10px" }}><h1 style={{ fontSize: "clamp(20px, 6vw, 30px)", margin: 0, color: "#fff4d6" }}>Harvey / Sally browser acceptance</h1></header>}
      {handeyeReceiverOnly && <header style={{ maxWidth: 1200, margin: "0 auto 10px" }}><h1 style={{ fontSize: "clamp(20px, 6vw, 30px)", margin: 0, color: "#fff4d6" }}>Harvey / Betsy Handeye</h1></header>}

      <HarveySnapshotProvider initialSnapshot={initialSnapshot}>
        {!witnessOnly && !handeyeReceiverOnly && <HarveyCommandDeck targets={commandTargets} />}
        {!witnessOnly && !handeyeReceiverOnly && <HarveySynapse />}
        {!witnessOnly && !handeyeReceiverOnly && <HarveyWatchtowerBrief contract={watchtowerContract} projectIndex={projectFlockIndex} />}
        {!witnessOnly && !handeyeReceiverOnly && <HarveyPasswordIncident />}
        {!witnessOnly && !handeyeReceiverOnly && <HarveySshOnboarding />}
        {!witnessOnly && !handeyeReceiverOnly && <details style={{ maxWidth: 1200, margin: "0 auto 18px", border: "1px solid #46504b", borderRadius: 12, padding: 14, background: "#101416" }}>
          <summary style={{ cursor: "pointer", color: "#fff4d6", fontSize: 18, fontWeight: 900 }}>Live machine status</summary>
          <div style={{ marginTop: 16 }}><HarveyLiveCockpit /></div>
        </details>}
        {!witnessOnly && !handeyeReceiverOnly && <details style={{ maxWidth: 1200, margin: "0 auto 18px", border: "1px solid #46504b", borderRadius: 12, padding: 14, background: "#101416" }}>
          <summary style={{ cursor: "pointer", color: "#fff4d6", fontSize: 18, fontWeight: 900 }}>Machine controls and pairing</summary>
          <div style={{ marginTop: 16 }}><HarveyLiveControlSurface machines={machines} /><HarveySallyWitness /><HarveyHandeyePairing /></div>
        </details>}
        {witnessOnly && <HarveySallyWitness />}
        {handeyeReceiverOnly && <HarveyHandeyePairing pairingId={handeyePairingId} />}
      </HarveySnapshotProvider>

      {!witnessOnly && !handeyeReceiverOnly && <details style={{ maxWidth: 1200, margin: "0 auto 18px", border: "1px solid #46504b", borderRadius: 12, padding: 14, background: "#101416" }}>
        <summary style={{ cursor: "pointer", color: "#fff4d6", fontSize: 18, fontWeight: 900 }}>Relay map, Aeye wall, and technical proof</summary>
        <div style={{ marginTop: 16 }}><HarveyStationIdentity model={stationIdentity} /><HarveyRelayWall /><HarveyAeyeMonitorWall model={aeyeMonitor} /></div>
      </details>}

      {!witnessOnly && !handeyeReceiverOnly && <footer style={{ maxWidth: 1200, margin: "28px auto", color: "#89928c", fontSize: 13 }}>
        {aeyeCount} Aeye roles modeled. Addressability does not prove an installed runtime, live thread, courier route, or return path.
      </footer>}
    </main>
  );
}
