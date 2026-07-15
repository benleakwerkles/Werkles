export type HarveyStationIdentityModel = {
  status?: string;
  station_packet_publication?: {
    status?: string;
    branch?: string;
    immutable_commit?: string;
    immutable_packet_url?: string;
    packet_sha256?: string;
  };
  active_project?: {
    project_namespace?: string;
    repository?: {
      full_name?: string;
      repo_id?: number;
      expected_provider_owner?: string;
    };
  };
  provider_binding?: {
    current_authenticated_provider_account?: string;
    connector_installation?: string;
    historical_observation_only?: string;
  };
  machine_identity_examples?: {
    Medullina?: {
      canonical_machine_name?: string;
      operating_system_hostname?: string;
      machine_owner?: string;
      project_authority?: string;
    };
  };
  forbidden_adjacent_projects?: Array<{
    project_namespace?: string;
    owner?: string;
    repository?: string;
    binding_status?: string;
  }>;
  command_bootstrap?: {
    packet_id?: string;
    source_commit?: string;
    immutable_public_raw_url?: string;
    default_branch_status?: string;
    retrieval_status?: string;
  };
  delivery_adapters?: Array<{
    adapter?: string;
    payload?: string;
    status?: string;
  }>;
};

const statusColor = (status = "UNKNOWN") => {
  if (status.includes("PROVEN") || status.includes("WIRED") || status.includes("ARMED")) return "#75e6a4";
  if (status.includes("UNPROVEN") || status.includes("ABSENT") || status.includes("SEPARATE")) return "#ffcc73";
  return "#7ac7ff";
};

const format = (value = "UNKNOWN") => value.replaceAll("_", " ");

export default function HarveyStationIdentity({ model }: { model: HarveyStationIdentityModel }) {
  const project = model.active_project;
  const publication = model.station_packet_publication;
  const repo = project?.repository;
  const provider = model.provider_binding;
  const medullina = model.machine_identity_examples?.Medullina;
  const adjacent = model.forbidden_adjacent_projects?.[0];
  const bootstrap = model.command_bootstrap;

  return (
    <section aria-labelledby="station-identity" style={{ maxWidth: 1200, margin: "0 auto 28px", border: "2px solid #ff8c75", borderRadius: 14, padding: 22, background: "#1b1112", overflowWrap: "anywhere" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0, maxWidth: "100%" }}>
          <p id="station-identity" style={{ color: "#ffb36b", letterSpacing: 2, fontWeight: 900, margin: 0 }}>STATION IDENTITY FIREWALL</p>
          <h2 style={{ color: "#fff4d6", margin: "8px 0 4px" }}>{project?.project_namespace ?? "NO ACTIVE PROJECT BINDING"}</h2>
          <p style={{ color: "#aeb6b0", margin: 0 }}>{repo?.full_name ?? "UNKNOWN REPOSITORY"} · repo ID {repo?.repo_id ?? "UNPROVEN"}</p>
        </div>
        <strong style={{ color: statusColor(model.status), alignSelf: "start" }}>{format(model.status)}</strong>
      </div>

      <p style={{ color: "#edf0e8", lineHeight: 1.55, margin: "18px 0" }}>
        A shared ChatGPT account is not GitHub or project authority. Unknown or mismatched repository identity stops edits, staging, commits, pushes, pull requests, uploads, and project creation.
      </p>

      <div style={{ border: "1px solid #2f7050", borderRadius: 10, padding: 14, background: "#102019", marginBottom: 12 }}>
        <strong style={{ color: "#75e6a4" }}>PUBLIC STATION PACKET</strong>
        <p style={{ color: "#aeb6b0", lineHeight: 1.5, margin: "7px 0" }}>
          {format(publication?.status)} · {publication?.branch ?? "UNKNOWN BRANCH"}<br />
          Commit: <b style={{ color: "#edf0e8" }}>{publication?.immutable_commit ?? "UNPROVEN"}</b>
        </p>
        {publication?.immutable_packet_url && (
          <a href={publication.immutable_packet_url} target="_blank" rel="noreferrer" style={{ color: "#7ac7ff", overflowWrap: "anywhere" }}>
            Open immutable station packet
          </a>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(245px,100%),1fr))", gap: 10 }}>
        <article style={{ border: "1px solid #5d4540", borderRadius: 10, padding: 14, background: "#121619" }}>
          <strong style={{ color: "#fff4d6" }}>Provider binding</strong>
          <p style={{ color: "#aeb6b0", lineHeight: 1.5 }}>
            Expected owner: <b style={{ color: "#edf0e8" }}>{repo?.expected_provider_owner ?? "UNPROVEN"}</b><br />
            Current account: <b style={{ color: statusColor(provider?.current_authenticated_provider_account) }}>{format(provider?.current_authenticated_provider_account)}</b><br />
            Connector: <b style={{ color: statusColor(provider?.connector_installation) }}>{format(provider?.connector_installation)}</b>
          </p>
          <small style={{ color: "#89928c" }}>Historical evidence only: {provider?.historical_observation_only ?? "none"}. It grants no current authority.</small>
        </article>

        <article style={{ border: "1px solid #5d4540", borderRadius: 10, padding: 14, background: "#121619" }}>
          <strong style={{ color: "#fff4d6" }}>Medullina identity, separated</strong>
          <p style={{ color: "#aeb6b0", lineHeight: 1.5 }}>
            Machine: <b style={{ color: "#edf0e8" }}>{medullina?.canonical_machine_name ?? "Medullina"}</b><br />
            Hostname: <b style={{ color: "#edf0e8" }}>{medullina?.operating_system_hostname ?? "UNPROVEN"}</b><br />
            Owner: <b style={{ color: "#edf0e8" }}>{medullina?.machine_owner ?? "UNPROVEN"}</b><br />
            Werkles authority: <b style={{ color: "#ffcc73" }}>{format(medullina?.project_authority)}</b>
          </p>
        </article>

        <article style={{ border: "1px solid #8c3e42", borderRadius: 10, padding: 14, background: "#211114" }}>
          <strong style={{ color: "#ff8c75" }}>Adjacent project: do not infer</strong>
          <p style={{ color: "#d4bbb5", lineHeight: 1.5 }}>
            Namespace: <b>{adjacent?.project_namespace ?? "COURTNEY_GAME"}</b><br />
            Owner: <b>{adjacent?.owner ?? "Courtney"}</b><br />
            Repository: <b>{format(adjacent?.repository)}</b><br />
            Binding: <b>{format(adjacent?.binding_status)}</b>
          </p>
        </article>
      </div>

      <div style={{ marginTop: 12, border: "1px solid #4b493f", borderRadius: 10, padding: 14, background: "#17160f" }}>
        <strong style={{ color: "#fff4d6" }}>Command bootstrap delivery</strong>
        <p style={{ color: "#aeb6b0", lineHeight: 1.5, marginBottom: 8 }}>
          {bootstrap?.packet_id ?? "UNPROVEN"} · {format(bootstrap?.retrieval_status)} · main: {format(bootstrap?.default_branch_status)}
        </p>
        {bootstrap?.immutable_public_raw_url && (
          <a href={bootstrap.immutable_public_raw_url} target="_blank" rel="noreferrer" style={{ color: "#7ac7ff", overflowWrap: "anywhere" }}>
            Immutable public bootstrap @ {bootstrap.source_commit?.slice(0, 12)}
          </a>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(210px,100%),1fr))", gap: 7, marginTop: 12 }}>
          {(model.delivery_adapters ?? []).map((adapter) => (
            <div key={adapter.adapter} style={{ borderTop: `2px solid ${statusColor(adapter.status)}`, paddingTop: 8 }}>
              <strong style={{ color: "#edf0e8", fontSize: 13 }}>{adapter.adapter}</strong>
              <small style={{ display: "block", color: statusColor(adapter.status), margin: "3px 0" }}>{format(adapter.status)}</small>
              <span style={{ color: "#89928c", fontSize: 11 }}>{adapter.payload}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
