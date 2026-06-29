"use client";

import { useEffect, useMemo, useState } from "react";

type InFlightPacket = {
  shadow_id: string;
  created_at: string;
  status: string;
  target_aeye: string;
  action: string;
  mock_diff_summary?: string;
  stalled: boolean;
  stall_tone: "TEAL" | "AMBER" | "RED" | "NONE";
  stall_reason?: string | null;
};

type EngineRoomResponse = {
  ok: boolean;
  generated_at: string;
  frictional_heat?: {
    ok: boolean;
    path: string;
    stalled_count: number;
  };
  in_flight: InFlightPacket[];
};

function formatElapsed(createdAt: string, now: number) {
  const started = Date.parse(createdAt);
  if (!Number.isFinite(started)) return "unknown";

  const totalSeconds = Math.max(0, Math.floor((now - started) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function toneClass(packet: InFlightPacket) {
  if (!packet.stalled) return "border-zinc-800 bg-neutral-950";
  if (packet.stall_tone === "RED") return "border-red-400/70 bg-red-500/10 shadow-[0_0_18px_rgba(248,113,113,0.15)]";
  if (packet.stall_tone === "TEAL") return "border-teal-300/70 bg-teal-400/10 shadow-[0_0_18px_rgba(45,212,191,0.12)]";
  return "border-amber-300/70 bg-amber-400/10 shadow-[0_0_18px_rgba(251,191,36,0.14)]";
}

export default function EngineRoom({ initialPackets = [] }: { initialPackets?: InFlightPacket[] }) {
  const [data, setData] = useState<EngineRoomResponse | null>({
    ok: true,
    generated_at: new Date().toISOString(),
    in_flight: initialPackets
  });
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  async function loadEngineRoom() {
    try {
      const response = await fetch("/api/feral/v1/engine-room", { cache: "no-store" });
      const result = (await response.json()) as EngineRoomResponse;
      if (!response.ok || !result.ok) throw new Error("Engine Room backend fetch failed");
      setData(result);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Engine Room backend fetch failed");
    }
  }

  useEffect(() => {
    loadEngineRoom();
    const poll = window.setInterval(loadEngineRoom, 2500);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, []);

  const packets = useMemo(() => data?.in_flight ?? [], [data]);

  return (
    <article className="border border-zinc-800 bg-neutral-900 p-4" aria-label="Engine Room EXECUTION">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-teal-300">ENGINE ROOM / EXECUTION</p>
          <h2 className="mt-1 text-xl font-black">Packets In Flight</h2>
        </div>
        <div className="text-right">
          <span className="block font-mono text-lg font-black text-teal-200">{packets.length}</span>
          <span className="text-[0.65rem] font-black uppercase text-zinc-500">polling live</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.68rem] font-black uppercase">
        <span className="border border-zinc-800 bg-neutral-950 px-2 py-1 text-zinc-400">
          shadow_cache / active execution
        </span>
        <span className={`border px-2 py-1 ${data?.frictional_heat?.ok ? "border-teal-400/40 text-teal-200" : "border-zinc-800 text-zinc-500"}`}>
          frictional heat: {data?.frictional_heat?.ok ? `${data.frictional_heat.stalled_count} stalled` : "source missing"}
        </span>
      </div>

      {error ? <p className="mt-4 border border-red-400/50 bg-red-500/10 p-3 text-sm font-bold text-red-200">{error}</p> : null}

      <div className="mt-4 grid gap-3">
        {packets.length === 0 ? (
          <p className="border border-zinc-800 bg-neutral-950 p-3 text-sm text-zinc-400">No packets currently in flight.</p>
        ) : (
          packets.map((packet) => (
            <section key={packet.shadow_id} className={`border p-3 ${toneClass(packet)}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-wide text-zinc-500">Target Aeye</p>
                  <h3 className="mt-1 text-sm font-black text-zinc-100">{packet.target_aeye}</h3>
                </div>
                <span className="border border-teal-400/30 bg-teal-400/10 px-2 py-1 text-[0.65rem] font-black uppercase text-teal-100">
                  {formatElapsed(packet.created_at, now)}
                </span>
              </div>

              <dl className="mt-3 grid gap-2 text-xs">
                <div>
                  <dt className="font-black uppercase text-zinc-500">Action</dt>
                  <dd className="mt-1 text-zinc-200">{packet.action}</dd>
                </div>
                <div>
                  <dt className="font-black uppercase text-zinc-500">Status</dt>
                  <dd className="mt-1 text-zinc-300">{packet.stalled ? `STALLED / ${packet.stall_tone}` : packet.status}</dd>
                </div>
              </dl>

              <p className="mt-3 break-all font-mono text-[0.68rem] text-zinc-500">{packet.shadow_id}</p>
              {packet.stalled ? <p className="mt-2 text-xs font-bold text-amber-100">{packet.stall_reason}</p> : null}
              {packet.mock_diff_summary ? <p className="mt-2 text-xs leading-5 text-zinc-400">{packet.mock_diff_summary}</p> : null}
            </section>
          ))
        )}
      </div>
    </article>
  );
}
