export type HarveyOperation = {
  operation_id?: string;
  requested_command?: string;
  overall_status?: string;
  phases?: Array<{ phase: string; status: string; evidence: string }>;
  handeye_receipt?: { machine: string; agent_version: string; status: string; evidence: string };
  thread_routes?: { total: number; dispatched: number; received: number; terminal: number; in_progress: number };
  unbound_routes?: Array<{ seat?: string; machine?: string; status: string }>;
};

const colorFor = (status: string) => {
  if (status === "COMPLETED" || status === "COMPLETED_LOCAL") return "#75e6a4";
  if (status.includes("PARTIAL")) return "#ffcc73";
  if (status.includes("UNBOUND") || status.includes("OFFLINE")) return "#ff8c75";
  return "#7ac7ff";
};

export default function HarveyOperationStatus({ operation }: { operation: HarveyOperation }) {
  const routes = operation.thread_routes;
  return (
    <section style={{ maxWidth: 1200, margin: "0 auto 28px", border: "1px solid #765f32", borderRadius: 12, padding: 20, background: "#19160f" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}>
        <div>
          <p style={{ color: "#d8a84e", letterSpacing: 2, fontWeight: 800, margin: 0 }}>CURRENT FKVPG OPERATION</p>
          <strong style={{ display: "block", color: "#fff4d6", fontSize: 22, marginTop: 7 }}>{operation.operation_id ?? "NO OPERATION LEDGER"}</strong>
        </div>
        <strong style={{ color: colorFor(operation.overall_status ?? "UNKNOWN") }}>{(operation.overall_status ?? "UNKNOWN").replaceAll("_", " ")}</strong>
      </div>

      {routes && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8, margin: "18px 0" }}>
          {[
            ["DISPATCHED", routes.dispatched, routes.total],
            ["RECEIVED", routes.received, routes.total],
            ["TERMINAL", routes.terminal, routes.total],
            ["IN PROGRESS", routes.in_progress, routes.total]
          ].map(([label, value, total]) => (
            <div key={String(label)} style={{ border: "1px solid #4b493f", borderRadius: 9, padding: 12, background: "#111518" }}>
              <small style={{ color: "#89928c" }}>{label}</small>
              <div style={{ color: "#fff4d6", fontSize: 28, fontWeight: 900 }}>{value}<span style={{ color: "#89928c", fontSize: 14 }}> / {total}</span></div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 8 }}>
        {(operation.phases ?? []).map((phase) => (
          <article key={phase.phase} style={{ borderTop: `2px solid ${colorFor(phase.status)}`, padding: "10px 8px 0" }}>
            <strong style={{ color: "#fff4d6" }}>{phase.phase}</strong>
            <small style={{ display: "block", color: colorFor(phase.status), margin: "4px 0 7px" }}>{phase.status.replaceAll("_", " ")}</small>
            <span style={{ color: "#aeb6b0", fontSize: 12, lineHeight: 1.4 }}>{phase.evidence}</span>
          </article>
        ))}
      </div>

      {operation.handeye_receipt && (
        <p style={{ color: "#aeb6b0", marginBottom: 8 }}><strong style={{ color: "#75e6a4" }}>DOSS HANDEYE {operation.handeye_receipt.status}</strong> · v{operation.handeye_receipt.agent_version} · {operation.handeye_receipt.evidence}</p>
      )}
      <small style={{ color: "#ff8c75" }}>{(operation.unbound_routes ?? []).map((route) => `${route.seat ?? route.machine}: ${route.status.replaceAll("_", " ")}`).join(" · ")}</small>
    </section>
  );
}
