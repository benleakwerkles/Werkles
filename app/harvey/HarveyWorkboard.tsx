type Workstream = {
  id: string;
  name: string;
  machine: string;
  status: string;
  phase: string;
  owner: string;
  reviewers: string[];
  proof: string;
  next_action: string;
};

type RoleUpdate = {
  name: string;
  seat: string;
  role: string;
  route_status: string;
};

export type HarveyWorkstreamModel = {
  source?: string;
  plan_intake?: {
    title: string;
    machine: string;
    authors: string[];
    contract: string;
    accepted_file_patterns: string[];
  };
  role_updates?: RoleUpdate[];
  unregistered_names?: Array<{ name: string; reason: string }>;
  workstreams?: Workstream[];
};

const statusColor = (status: string) => {
  if (status.includes("LOCAL_PROOF")) return "#75e6a4";
  if (status.includes("PROTECTED")) return "#b8a1ff";
  if (status.includes("READY")) return "#7ac7ff";
  return "#ffcc73";
};

export default function HarveyWorkboard({
  model,
  planFiles
}: {
  model: HarveyWorkstreamModel;
  planFiles: string[];
}) {
  const workstreams = model.workstreams ?? [];
  const roles = model.role_updates ?? [];
  const plan = model.plan_intake;

  return (
    <section style={{ maxWidth: 1200, margin: "32px auto 0" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div>
          <p style={{ color: "#d8a84e", letterSpacing: 2, fontWeight: 800, marginBottom: 6 }}>PUBLISHED WORKSTREAM BRIEF · HISTORICAL REPORT</p>
          <h2 style={{ margin: 0, fontSize: "clamp(25px, 4vw, 42px)", color: "#fff4d6" }}>Operator reports are context, not current execution proof.</h2>
        </div>
        <small style={{ color: "#89928c" }}>Source: {model.source ?? "NO SOURCE"}</small>
      </div>

      {plan && (
        <article style={{ border: `1px solid ${planFiles.length ? "#3e7658" : "#765f32"}`, borderRadius: 12, padding: 20, background: planFiles.length ? "#101a14" : "#1a1710", marginBottom: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <strong style={{ color: "#fff4d6", fontSize: 20 }}>{plan.title}</strong>
              <div style={{ color: "#aeb6b0", marginTop: 4 }}>{plan.authors.join(" + ")}</div>
            </div>
            <strong style={{ color: planFiles.length ? "#75e6a4" : "#ffcc73" }}>{planFiles.length ? `${planFiles.length} PLAN FILE${planFiles.length === 1 ? "" : "S"} READABLE` : "WAITING — NO PLAN FILE READABLE"}</strong>
          </div>
          <p style={{ color: "#89928c", marginBottom: planFiles.length ? 8 : 0 }}>Harvey watches the repo inbox patterns in the intake contract. Naming Demo and Locke does not claim their routes are live.</p>
          {planFiles.length > 0 && <ul style={{ marginBottom: 0 }}>{planFiles.map((file) => <li key={file}>{file}</li>)}</ul>}
        </article>
      )}

      {roles.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10, marginBottom: 16 }}>
          {roles.map((role) => (
            <article key={role.name} style={{ border: "1px solid #49433a", borderRadius: 10, padding: 16, background: "#161513" }}>
              <strong style={{ color: "#fff4d6", fontSize: 21 }}>{role.name}</strong>
              <div style={{ color: "#d8a84e", margin: "4px 0 8px" }}>{role.seat}</div>
              <div style={{ color: "#aeb6b0" }}>{role.role}</div>
              <small style={{ display: "block", color: "#ffcc73", marginTop: 8 }}>{role.route_status.replaceAll("_", " ")}</small>
            </article>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 12 }}>
        {workstreams.map((stream) => (
          <article key={stream.id} style={{ border: "1px solid #343a36", borderRadius: 12, padding: 20, background: "#121619" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
              <div>
                <strong style={{ color: "#fff4d6", fontSize: 20 }}>{stream.name}</strong>
                <div style={{ color: "#d8a84e", marginTop: 5 }}>{stream.machine}</div>
              </div>
              <span style={{ border: `1px solid ${statusColor(stream.status)}`, borderRadius: 999, padding: "4px 8px", color: statusColor(stream.status), fontSize: 11, fontWeight: 800, textAlign: "right" }}>REPORTED · {stream.status.replaceAll("_", " ")}</span>
            </div>
            <dl style={{ display: "grid", gridTemplateColumns: "74px 1fr", columnGap: 10, rowGap: 8, margin: "18px 0" }}>
              <dt style={{ color: "#89928c" }}>Phase</dt><dd style={{ margin: 0 }}>{stream.phase}</dd>
              <dt style={{ color: "#89928c" }}>Owner</dt><dd style={{ margin: 0 }}>{stream.owner}</dd>
              <dt style={{ color: "#89928c" }}>Review</dt><dd style={{ margin: 0 }}>{stream.reviewers.length ? stream.reviewers.join(" · ") : "Protected lane — no Harvey reviewers"}</dd>
            </dl>
            <div style={{ borderTop: "1px solid #2a302c", paddingTop: 12 }}>
              <small style={{ color: "#89928c" }}>PROOF BOUNDARY</small>
              <p style={{ color: "#aeb6b0", lineHeight: 1.45, margin: "5px 0 12px" }}>{stream.proof}</p>
              <small style={{ color: "#89928c" }}>NEXT ACTION</small>
              <p style={{ color: "#edf0e8", lineHeight: 1.45, margin: "5px 0 0" }}>{stream.next_action}</p>
            </div>
          </article>
        ))}
      </div>

      {(model.unregistered_names?.length ?? 0) > 0 && (
        <p style={{ color: "#89928c", fontSize: 13, marginTop: 14 }}>
          Not registered: {model.unregistered_names?.map((item) => `${item.name} — ${item.reason}`).join("; ")}
        </p>
      )}
    </section>
  );
}
