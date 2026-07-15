"use client";

import { useEffect, useMemo, useState } from "react";

type NextShot = {
  title: string;
  purpose: string;
  status: string;
};

type AeyeStatus = {
  id: string;
  name: string;
  seat: string;
  role: string;
  intended_machine: string;
  actual_execution_machine: string | null;
  route_status: string;
  readback_status: string;
  current_work: string;
  work_truth: string;
  latest_packet: string;
  latest_packet_status: string;
  previous_packet: string;
  previous_packet_status: string;
  next_shots: NextShot[];
};

type WallIdea = {
  priority: string;
  title: string;
  value: string;
};

export type HarveyAeyeMonitorModel = {
  updated_at?: string;
  summary?: {
    individual_aeyes?: number;
    standing_receiver_routes?: number;
    terminal_readbacks?: number;
    receiver_readbacks_in_progress?: number;
    unbound_named_routes?: number;
  };
  action_rail?: {
    automation_can_now?: string[];
    ben_owes_now?: string[];
  };
  aeyes?: AeyeStatus[];
  monitor_wall_backlog?: WallIdea[];
};

const statusColor = (status: string) => {
  if (status.includes("COMPLETED") || status.includes("ACTIVE_LOCAL")) return "#75e6a4";
  if (status.includes("IN_PROGRESS") || status.includes("READINESS")) return "#ffcc73";
  if (status.includes("UNBOUND") || status.includes("NOT_DISPATCHED")) return "#ff8c75";
  return "#7ac7ff";
};

const format = (value: string) => value.replaceAll("_", " ");

export default function HarveyAeyeMonitorWall({ model }: { model: HarveyAeyeMonitorModel }) {
  const aeyes = model.aeyes ?? [];
  const [machine, setMachine] = useState("ALL");
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const machines = useMemo(() => ["ALL", ...new Set(aeyes.map((item) => item.intended_machine))], [aeyes]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return aeyes.filter((item) => {
      const machineMatch = machine === "ALL" || item.intended_machine === machine;
      const queryMatch = !needle || [item.name, item.seat, item.role, item.current_work, item.readback_status]
        .some((value) => value.toLowerCase().includes(needle));
      return machineMatch && queryMatch;
    });
  }, [aeyes, machine, query]);

  const summary = model.summary ?? {};
  const snapshotTime = model.updated_at ? Date.parse(model.updated_at) : 0;
  const snapshotAgeMinutes = now && snapshotTime ? Math.max(0, Math.floor((now - snapshotTime) / 60_000)) : 0;
  const freshness = !snapshotTime ? "UNKNOWN" : snapshotAgeMinutes < 30 ? "FRESH" : snapshotAgeMinutes < 120 ? "AGING" : "STALE";
  const freshnessColor = freshness === "FRESH" ? "#75e6a4" : freshness === "AGING" ? "#ffcc73" : "#ff8c75";

  return (
    <section aria-labelledby="aeye-monitor-wall" style={{ maxWidth: 1200, margin: "28px auto" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16, alignItems: "end" }}>
        <div>
          <p style={{ color: "#d8a84e", letterSpacing: 2, fontWeight: 800, margin: 0 }}>AEYE MONITOR WALL</p>
          <h2 id="aeye-monitor-wall" style={{ color: "#fff4d6", fontSize: 32, margin: "7px 0" }}>Who is working, what they saw, and what comes next.</h2>
          <p style={{ color: "#aeb6b0", maxWidth: 860, margin: 0, lineHeight: 1.55 }}>
            Seat names show intended assignments. Actual execution machines come from receiver evidence. The two next shots on every card are recommendations only; none has been dispatched by this wall.
          </p>
        </div>
        <small style={{ color: "#89928c" }}>Snapshot {model.updated_at ? new Date(model.updated_at).toLocaleString() : "unknown"}</small>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, margin: "18px 0" }}>
        {[
          ["INDIVIDUAL AEYES", summary.individual_aeyes ?? aeyes.length],
          ["BOUND RECEIVERS", summary.standing_receiver_routes ?? 0],
          ["TERMINAL READBACKS", summary.terminal_readbacks ?? 0],
          ["IN PROGRESS", summary.receiver_readbacks_in_progress ?? 0],
          ["UNBOUND NAMES", summary.unbound_named_routes ?? 0],
          ["PROOF FRESHNESS", freshness]
        ].map(([label, value]) => (
          <div key={String(label)} style={{ background: "#121619", border: "1px solid #343a36", borderRadius: 10, padding: 13 }}>
            <small style={{ color: "#89928c" }}>{label}</small>
            <div style={{ color: label === "PROOF FRESHNESS" ? freshnessColor : "#fff4d6", fontSize: label === "PROOF FRESHNESS" ? 20 : 30, fontWeight: 900, marginTop: label === "PROOF FRESHNESS" ? 7 : 0 }}>{value}</div>
            {label === "PROOF FRESHNESS" && <small style={{ color: "#89928c" }}>{snapshotAgeMinutes} minute{snapshotAgeMinutes === 1 ? "" : "s"} old</small>}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(320px, 100%),1fr))", gap: 10, marginBottom: 16 }}>
        <article style={{ border: "1px solid #326749", borderRadius: 10, background: "#0f1b15", padding: 14 }}>
          <strong style={{ color: "#75e6a4" }}>AUTOMATION CAN NOW</strong>
          <ul style={{ color: "#c6d7cc", fontSize: 12, lineHeight: 1.5, margin: "9px 0 0", paddingLeft: 19 }}>
            {(model.action_rail?.automation_can_now ?? []).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
        <article style={{ border: "1px solid #664d31", borderRadius: 10, background: "#1a150f", padding: 14 }}>
          <strong style={{ color: "#ffcc73" }}>BEN OWES NOW</strong>
          <ul style={{ color: "#d8ccb8", fontSize: 12, lineHeight: 1.5, margin: "9px 0 0", paddingLeft: 19 }}>
            {(model.action_rail?.ben_owes_now ?? []).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {machines.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMachine(item)}
            style={{
              border: `1px solid ${machine === item ? "#d8a84e" : "#4b514d"}`,
              background: machine === item ? "#302815" : "#121619",
              color: machine === item ? "#fff4d6" : "#aeb6b0",
              borderRadius: 999,
              padding: "8px 13px",
              cursor: "pointer",
              font: "inherit"
            }}
          >
            {item}
          </button>
        ))}
        <input
          aria-label="Search Aeye monitor wall"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Aeye or work"
          style={{ flex: "1 1 230px", minWidth: 180, border: "1px solid #4b514d", background: "#0f1315", color: "#edf0e8", borderRadius: 999, padding: "8px 14px", font: "inherit" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(330px, 100%),1fr))", gap: 12 }}>
        {visible.map((aeye) => {
          const mismatched = Boolean(aeye.actual_execution_machine && aeye.actual_execution_machine !== aeye.intended_machine);
          return (
            <article key={aeye.id} style={{ border: "1px solid #343a36", borderTop: `3px solid ${statusColor(aeye.readback_status)}`, borderRadius: 12, background: "#121619", padding: 17 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                <div>
                  <h3 style={{ color: "#fff4d6", fontSize: 23, margin: 0 }}>{aeye.name}</h3>
                  <div style={{ color: "#d8a84e", marginTop: 3 }}>{aeye.seat}</div>
                </div>
                <small style={{ color: statusColor(aeye.readback_status), textAlign: "right", maxWidth: 155 }}>{format(aeye.readback_status)}</small>
              </div>

              <p style={{ color: "#aeb6b0", fontSize: 13, margin: "10px 0 14px" }}>{aeye.role}</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ border: "1px solid #2b312e", borderRadius: 8, padding: 9 }}>
                  <small style={{ color: "#89928c" }}>INTENDED SEAT</small>
                  <strong style={{ color: "#fff4d6", display: "block", marginTop: 3 }}>{aeye.intended_machine}</strong>
                </div>
                <div style={{ border: `1px solid ${mismatched ? "#78493d" : "#2b312e"}`, borderRadius: 8, padding: 9, background: mismatched ? "#1b1212" : "transparent" }}>
                  <small style={{ color: "#89928c" }}>ACTUAL EXECUTION</small>
                  <strong style={{ color: mismatched ? "#ff9e88" : "#fff4d6", display: "block", marginTop: 3 }}>{aeye.actual_execution_machine ?? "UNPROVEN"}</strong>
                </div>
              </div>

              <div style={{ margin: "14px 0" }}>
                <small style={{ color: "#89928c" }}>CURRENT WORK</small>
                <p style={{ color: "#edf0e8", margin: "4px 0", lineHeight: 1.45 }}>{aeye.current_work}</p>
                <small style={{ color: "#89928c", lineHeight: 1.4 }}>{aeye.work_truth}</small>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ borderLeft: "3px solid #7ac7ff", paddingLeft: 10 }}>
                  <small style={{ color: "#89928c" }}>LATEST PACKET</small>
                  <div style={{ color: "#c9e9ff", fontSize: 12, wordBreak: "break-word", marginTop: 3 }}>{aeye.latest_packet}</div>
                  <small style={{ color: statusColor(aeye.latest_packet_status) }}>{format(aeye.latest_packet_status)}</small>
                </div>
                <div style={{ borderLeft: "3px solid #59605c", paddingLeft: 10 }}>
                  <small style={{ color: "#89928c" }}>PREVIOUS PACKET</small>
                  <div style={{ color: "#c8cec9", fontSize: 12, wordBreak: "break-word", marginTop: 3 }}>{aeye.previous_packet}</div>
                  <small style={{ color: "#89928c" }}>{format(aeye.previous_packet_status)}</small>
                </div>
              </div>

              <div style={{ marginTop: 15, paddingTop: 13, borderTop: "1px solid #2b312e" }}>
                <small style={{ color: "#d8a84e", letterSpacing: 1 }}>NEXT TWO SHOTS · PROPOSED, NOT DISPATCHED</small>
                <ol style={{ color: "#edf0e8", margin: "9px 0 0", paddingLeft: 22 }}>
                  {aeye.next_shots.slice(0, 2).map((shot) => (
                    <li key={shot.title} style={{ marginBottom: 9, paddingLeft: 3 }}>
                      <strong>{shot.title}</strong>
                      <span style={{ color: "#aeb6b0", display: "block", fontSize: 12, lineHeight: 1.4 }}>{shot.purpose}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </article>
          );
        })}
      </div>

      <div style={{ marginTop: 28, border: "1px solid #4b493f", background: "#17150f", borderRadius: 12, padding: 18 }}>
        <p style={{ color: "#d8a84e", letterSpacing: 2, fontWeight: 800, margin: 0 }}>MONITOR-WALL BRAINSTORM BACKLOG</p>
        <p style={{ color: "#aeb6b0", margin: "7px 0 15px" }}>Signals worth adding after this first truthful roster. These are design candidates, not implemented telemetry.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 9 }}>
          {(model.monitor_wall_backlog ?? []).map((idea) => (
            <article key={idea.title} style={{ border: "1px solid #343a36", background: "#111518", borderRadius: 9, padding: 12 }}>
              <small style={{ color: idea.priority === "NOW" ? "#75e6a4" : idea.priority === "NEXT" ? "#ffcc73" : "#7ac7ff" }}>{idea.priority}</small>
              <strong style={{ color: "#fff4d6", display: "block", margin: "4px 0" }}>{idea.title}</strong>
              <span style={{ color: "#aeb6b0", fontSize: 12, lineHeight: 1.45 }}>{idea.value}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
