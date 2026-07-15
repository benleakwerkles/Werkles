"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import type { HarveySnapshot } from "@/lib/harvey/snapshot";

export type SnapshotTransport = "CURRENT" | "WAITING" | "DISCONNECTED";

type HarveySnapshotState = {
  snapshot: HarveySnapshot;
  transport: SnapshotTransport;
  nextPollMs: number;
};

const retryDelays = [2500, 5000, 10_000, 15_000] as const;
const HarveySnapshotContext = createContext<HarveySnapshotState | null>(null);

function ageLabel(ageMs: number | null) {
  if (ageMs === null) return "No valid heartbeat";
  if (ageMs < 60_000) return `${Math.floor(ageMs / 1000)}s old at snapshot`;
  return `${Math.floor(ageMs / 60_000)}m old at snapshot`;
}

export function useHarveySnapshotState() {
  const state = useContext(HarveySnapshotContext);
  if (!state) throw new Error("HARVEY_SNAPSHOT_PROVIDER_REQUIRED");
  return state;
}

export function HarveySnapshotProvider({ initialSnapshot, children }: { initialSnapshot: HarveySnapshot; children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [transport, setTransport] = useState<SnapshotTransport>("CURRENT");
  const [nextPollMs, setNextPollMs] = useState<number>(initialSnapshot.poll_after_ms);
  const revisionRef = useRef(initialSnapshot.revision);
  const lastSuccessRef = useRef(Date.now());
  const activeControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = false;
    let failures = 0;
    let requestSequence = 0;
    let appliedSequence = 0;

    const schedule = (requestedDelay: number) => {
      if (stopped) return;
      const actualDelay = document.hidden ? Math.max(requestedDelay, 15_000) : requestedDelay;
      setNextPollMs(actualDelay);
      timer = setTimeout(() => void poll(), actualDelay);
    };

    const poll = async () => {
      if (stopped || active) return;
      active = true;
      const sequence = ++requestSequence;
      const controller = new AbortController();
      activeControllerRef.current = controller;
      const timeout = setTimeout(() => controller.abort(), 5000);
      let delay: number = retryDelays[0];
      try {
        const response = await fetch("/api/harvey/snapshot", {
          cache: "no-store",
          credentials: "omit",
          headers: { "if-none-match": `"${revisionRef.current}"` },
          signal: controller.signal
        });
        if (response.status !== 304 && !response.ok) throw new Error("SNAPSHOT_REQUEST_FAILED");
        if (sequence >= appliedSequence && response.status !== 304) {
          const next = await response.json() as HarveySnapshot;
          if (next.schema !== "werkles.harvey-snapshot/v1" || !/^[a-f0-9]{64}$/.test(next.revision)) throw new Error("SNAPSHOT_SCHEMA_INVALID");
          appliedSequence = sequence;
          revisionRef.current = next.revision;
          setSnapshot(next);
        }
        failures = 0;
        lastSuccessRef.current = Date.now();
        setTransport("CURRENT");
      } catch {
        if (stopped) return;
        failures += 1;
        setTransport(Date.now() - lastSuccessRef.current > 15_000 ? "DISCONNECTED" : "WAITING");
        delay = retryDelays[Math.min(failures, retryDelays.length - 1)];
      } finally {
        clearTimeout(timeout);
        if (activeControllerRef.current === controller) activeControllerRef.current = null;
        active = false;
        if (!stopped) schedule(delay);
      }
    };

    const onVisibility = () => {
      if (document.hidden || stopped || active) return;
      if (timer) clearTimeout(timer);
      void poll();
    };
    document.addEventListener("visibilitychange", onVisibility);
    schedule(initialSnapshot.poll_after_ms);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      activeControllerRef.current?.abort();
      activeControllerRef.current = null;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [initialSnapshot.poll_after_ms]);

  return <HarveySnapshotContext.Provider value={{ snapshot, transport, nextPollMs }}>{children}</HarveySnapshotContext.Provider>;
}

export default function HarveyLiveCockpit() {
  const { snapshot, transport, nextPollMs } = useHarveySnapshotState();
  const transportColor = transport === "CURRENT" ? "#75e6a4" : transport === "WAITING" ? "#ffcc73" : "#ff8c75";
  return (
    <section style={{ maxWidth: 1200, margin: "0 auto 28px", border: "2px solid #3e7658", borderRadius: 14, padding: 22, background: "#0f1713" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
        <div>
          <p style={{ color: "#d8a84e", letterSpacing: 2, fontWeight: 800, margin: 0 }}>AUTHORITATIVE LIVE SNAPSHOT</p>
          <h2 style={{ color: "#fff4d6", fontSize: "clamp(25px,4vw,42px)", margin: "7px 0 0" }}>Machines decay. Receipts persist. Reports stay reports.</h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <strong data-testid="snapshot-transport" style={{ color: transportColor }}>{transport}</strong>
          <span
            data-testid="snapshot-live-announcement"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}
          >Snapshot transport {transport}</span>
          <br/><small data-testid="snapshot-revision" style={{ color: "#89928c" }}>revision {snapshot.revision.slice(0, 12)}</small>
          <br/><small data-testid="snapshot-next-retry" style={{ color: "#89928c" }}>proof checks every {Math.round(nextPollMs / 1000)}s</small>
        </div>
      </div>

      <p style={{ color: "#89928c", fontSize: 12, lineHeight: 1.5 }}>
        CURRENT = fresh snapshot transport · WAITING = retrying with last-known truth qualified · DISCONNECTED = snapshot transport lost.
      </p>

      {snapshot.degraded && (
        <details style={{ color: "#ffcc73", marginBottom: 0 }}>
          <summary>DEGRADED EVIDENCE · {snapshot.errors.length} validation issue{snapshot.errors.length === 1 ? "" : "s"}</summary>
          <ul style={{ marginBottom: 0 }}>{snapshot.errors.map((error) => <li key={error}>{error}</li>)}</ul>
        </details>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(190px,100%),1fr))", gap: 10, marginTop: 18 }}>
        {snapshot.machines.map((machine) => {
          const qualified = transport !== "CURRENT" && machine.connectivity === "LIVE" ? `LAST KNOWN LIVE — SNAPSHOT ${transport}` : machine.connectivity;
          const color = qualified === "LIVE" ? "#75e6a4" : machine.connectivity === "STALE" || transport === "WAITING" ? "#ffcc73" : "#ff8c75";
          const commandLabel = !machine.latest_command
            ? "No command receipt"
            : machine.latest_command.evidence_state === "INVALID"
              ? "EVIDENCE INVALID"
              : `${machine.latest_command.action} · ${machine.latest_command.status}`;
          return (
            <article key={machine.machine} style={{ border: "1px solid #35483d", borderRadius: 10, padding: 16, background: "#111815" }}>
              <strong style={{ display: "block", color: "#fff4d6", fontSize: 24 }}>{machine.machine}</strong>
              <strong data-testid={`machine-${machine.machine}-connectivity`} style={{ display: "block", color, marginTop: 8 }}>{qualified}</strong>
              <small style={{ display: "block", color: "#89928c", marginTop: 4 }}>{ageLabel(machine.heartbeat_age_ms)}</small>
              <small data-testid={`machine-${machine.machine}-command`} style={{ display: "block", color: machine.latest_command?.evidence_state === "INVALID" ? "#ff8c75" : "#aeb6b0", marginTop: 10 }}>
                {commandLabel}
              </small>
            </article>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(270px,100%),1fr))", gap: 10, marginTop: 18 }}>
        {snapshot.workstreams.map((workstream) => (
          <article key={workstream.workstream_id} style={{ border: "1px solid #343a36", borderRadius: 10, padding: 16, background: "#121619" }}>
            <strong style={{ color: "#fff4d6" }}>{workstream.name}</strong>
            <dl style={{ display: "grid", gridTemplateColumns: "82px minmax(0,1fr)", gap: "7px 10px", margin: "14px 0 0" }}>
              <dt style={{ color: "#89928c" }}>Reported</dt><dd style={{ margin: 0, color: "#ffcc73" }}>{workstream.reported_status.replaceAll("_", " ")}</dd>
              <dt style={{ color: "#89928c" }}>Execution</dt><dd data-testid={`workstream-${workstream.workstream_id}-execution`} style={{ margin: 0, color: workstream.execution_status === "COMMAND_COMPLETED" ? "#75e6a4" : workstream.execution_status === "COMMAND_BLOCKER" || workstream.execution_status === "EVIDENCE_INVALID" ? "#ff8c75" : "#aeb6b0" }}>{workstream.execution_status.replaceAll("_", " ")}</dd>
              <dt style={{ color: "#89928c" }}>Receipt</dt><dd style={{ margin: 0 }}>{workstream.receipt_freshness}{workstream.latest_receipt_at ? ` · ${workstream.latest_receipt_at}` : ""}</dd>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
