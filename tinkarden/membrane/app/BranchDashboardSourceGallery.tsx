export type DashboardSource = {
  id: string;
  title: string;
  source_type: string;
  status: string;
  origin: string;
  path: string;
  route: string | null;
  files_count: number;
  positive_functionality: string;
  merge_question: string;
  preview_status: string;
  representative_files: string[];
};

export type DashboardSourceManifest = {
  generated_at: string;
  scan_scope: {
    repo_root: string;
    refs_scanned: number;
    worktrees_scanned: number;
    salvage_bundles_scanned: number;
    current_checkout_surfaces_scanned: number;
    commands_used: string[];
  };
  summary: {
    total_sources: number;
    current_checkout: number;
    git_refs: number;
    worktrees: number;
    salvage_bundles: number;
    visual_references: number;
  };
  sources: DashboardSource[];
};

type BranchDashboardSourceGalleryProps = {
  manifest: DashboardSourceManifest | null;
};

const SOURCE_LABELS: Record<string, string> = {
  current_checkout: "Current checkout",
  git_ref: "Git refs",
  worktree: "Detached worktrees",
  salvage_bundle: "Salvage bundles"
};

const SOURCE_ORDER = ["current_checkout", "git_ref", "worktree", "salvage_bundle"];

function statusClass(status: string) {
  if (status === "LIVE_SURFACE") return "border-teal-300 bg-teal-300 text-neutral-950";
  if (status === "ROUTE_SOURCE" || status === "STATIC_PREVIEW") return "border-cyan-200 bg-cyan-200 text-neutral-950";
  if (status === "BRANCH_VARIANT" || status === "WORKTREE_VARIANT") return "border-amber-200 bg-amber-200 text-neutral-950";
  if (status === "SALVAGE_BUNDLE") return "border-orange-200 bg-orange-200 text-neutral-950";
  if (status === "VISUAL_REFERENCE") return "border-fuchsia-200 bg-fuchsia-200 text-neutral-950";
  return "border-zinc-700 bg-zinc-900 text-zinc-300";
}

function previewClass(previewStatus: string) {
  if (previewStatus === "rendered_live") return "border-teal-400/50 bg-teal-400/10 text-teal-100";
  if (previewStatus.includes("worktree")) return "border-amber-300/40 bg-amber-300/10 text-amber-100";
  if (previewStatus.includes("salvage")) return "border-orange-300/40 bg-orange-300/10 text-orange-100";
  return "border-zinc-700 bg-neutral-950 text-zinc-300";
}

function sourceGroups(sources: DashboardSource[]) {
  const discovered = sources.map((source) => source.source_type);
  return SOURCE_ORDER.filter((sourceType) => discovered.includes(sourceType));
}

export default function BranchDashboardSourceGallery({ manifest }: BranchDashboardSourceGalleryProps) {
  if (!manifest) {
    return (
      <section className="border-b border-red-400/30 bg-red-950/20 px-4 py-4" aria-label="Branch dashboard source gathering">
        <p className="text-xs font-black uppercase text-red-200">Source gathering failed</p>
        <h2 className="mt-1 text-xl font-black text-zinc-50">No branch dashboard manifest found.</h2>
        <p className="mt-2 text-sm font-bold text-red-100">
          Expected tinkarden/membrane/branch_dashboard_sources.json. The page is showing the membrane without the branch/worktree inventory.
        </p>
      </section>
    );
  }

  const groups = sourceGroups(manifest.sources);

  return (
    <section className="border-b border-cyan-400/20 bg-neutral-950 px-4 py-4" aria-label="Branch dashboard source gathering">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-cyan-200">Gathered Sources / Merge Candidates</p>
          <h2 className="mt-1 text-xl font-black text-zinc-50">TinkerDen, ThinkIt, Feral Membrane, Wonka, and SoleDash haul</h2>
          <p className="mt-2 max-w-5xl text-xs font-bold leading-5 text-zinc-400">
            This is the actual source sweep before the final merge decision: current checkout surfaces, local and remote refs, detached worktrees, and salvage bundles. Cards marked indexed are captured for review; only rendered_live is the page currently running.
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center text-[0.68rem] font-black uppercase md:grid-cols-6">
          <div className="border border-cyan-300/40 bg-cyan-300/10 px-3 py-2">
            <dt className="text-zinc-500">Total</dt>
            <dd className="text-cyan-100">{manifest.summary.total_sources}</dd>
          </div>
          <div className="border border-teal-300/40 bg-teal-300/10 px-3 py-2">
            <dt className="text-zinc-500">Checkout</dt>
            <dd className="text-teal-100">{manifest.summary.current_checkout}</dd>
          </div>
          <div className="border border-amber-300/40 bg-amber-300/10 px-3 py-2">
            <dt className="text-zinc-500">Refs</dt>
            <dd className="text-amber-100">{manifest.summary.git_refs}</dd>
          </div>
          <div className="border border-violet-300/40 bg-violet-300/10 px-3 py-2">
            <dt className="text-zinc-500">Trees</dt>
            <dd className="text-violet-100">{manifest.summary.worktrees}</dd>
          </div>
          <div className="border border-orange-300/40 bg-orange-300/10 px-3 py-2">
            <dt className="text-zinc-500">Salvage</dt>
            <dd className="text-orange-100">{manifest.summary.salvage_bundles}</dd>
          </div>
          <div className="border border-zinc-700 bg-neutral-900 px-3 py-2">
            <dt className="text-zinc-500">Refs scan</dt>
            <dd className="text-zinc-200">{manifest.scan_scope.refs_scanned}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 grid gap-3 border border-zinc-800 bg-neutral-900 p-3 text-xs font-bold text-zinc-300 xl:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="font-black uppercase text-zinc-500">Scan root</p>
          <p className="mt-1 break-all font-mono text-zinc-200">{manifest.scan_scope.repo_root}</p>
        </div>
        <div>
          <p className="font-black uppercase text-zinc-500">Gather commands</p>
          <p className="mt-1 break-all font-mono text-zinc-400">{manifest.scan_scope.commands_used.join(" | ")}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {groups.map((sourceType) => {
          const sources = manifest.sources.filter((source) => source.source_type === sourceType);
          return (
            <section key={sourceType} className="border border-zinc-800 bg-neutral-900 p-3" aria-label={SOURCE_LABELS[sourceType] ?? sourceType}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-black uppercase text-zinc-100">{SOURCE_LABELS[sourceType] ?? sourceType}</h3>
                <span className="border border-zinc-700 bg-neutral-950 px-2 py-1 font-mono text-[0.68rem] font-black text-zinc-300">
                  {sources.length} sources
                </span>
              </div>

              <div className="mt-3 grid gap-3 xl:grid-cols-3">
                {sources.map((source) => (
                  <article key={source.id} className="border border-zinc-800 bg-neutral-950 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[0.66rem] font-black uppercase text-zinc-500">{source.origin}</p>
                        <h4 className="mt-1 text-sm font-black leading-5 text-zinc-50">{source.title}</h4>
                      </div>
                      <span className={`border px-2 py-1 text-[0.62rem] font-black uppercase ${statusClass(source.status)}`}>
                        {source.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="border border-zinc-800 bg-neutral-900 p-2">
                        <p className="text-[0.6rem] font-black uppercase text-zinc-500">Files</p>
                        <p className="mt-1 font-mono text-sm font-black text-zinc-100">{source.files_count}</p>
                      </div>
                      <div className={`border p-2 ${previewClass(source.preview_status)}`}>
                        <p className="text-[0.6rem] font-black uppercase opacity-70">Preview</p>
                        <p className="mt-1 break-all font-mono text-[0.66rem] font-black">{source.preview_status}</p>
                      </div>
                    </div>

                    <dl className="mt-3 grid gap-2 text-[0.68rem]">
                      <div>
                        <dt className="font-black uppercase text-zinc-500">Path</dt>
                        <dd className="break-all font-mono text-zinc-300">{source.path}</dd>
                      </div>
                      {source.route ? (
                        <div>
                          <dt className="font-black uppercase text-zinc-500">Route</dt>
                          <dd className="break-all font-mono text-cyan-200">{source.route}</dd>
                        </div>
                      ) : null}
                    </dl>

                    <p className="mt-3 text-xs font-bold leading-5 text-zinc-300">{source.positive_functionality}</p>
                    <p className="mt-3 border-l-2 border-cyan-300/60 pl-3 text-xs font-bold leading-5 text-cyan-100">
                      Merge call: {source.merge_question}
                    </p>

                    <div className="mt-3 border border-zinc-800 bg-neutral-900 p-2">
                      <p className="text-[0.62rem] font-black uppercase text-zinc-500">Representative files</p>
                      <ul className="mt-2 grid gap-1">
                        {source.representative_files.slice(0, 5).map((file) => (
                          <li key={file} className="break-all font-mono text-[0.66rem] text-zinc-400">
                            {file}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-3 break-all font-mono text-[0.66rem] text-zinc-600">generated_at: {manifest.generated_at}</p>
    </section>
  );
}
