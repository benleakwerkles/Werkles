import MergeDecisionPreviews from "./MergeDecisionPreviews";
import NextThreeBuildIdeas from "./NextThreeBuildIdeas";

export type AssemblyModule = {
  id: string;
  title: string;
  system: string;
  status: string;
  merge_state: "KEEP" | "LIVE_REVIEW" | "ATTACHED" | "BLOCKED";
  proof_path: string;
  detail: string;
  next_action: string;
  tone: "teal" | "cyan" | "amber" | "zinc";
};

type FinalAssemblyWorkbenchProps = {
  modules: AssemblyModule[];
  summary: {
    keep_count: number;
    review_count: number;
    blocker_count: number;
    generated_at: string;
  };
};

function toneClass(tone: AssemblyModule["tone"]) {
  if (tone === "teal") return "border-teal-400/40 bg-teal-400/10 text-teal-100";
  if (tone === "cyan") return "border-cyan-300/40 bg-cyan-300/10 text-cyan-100";
  if (tone === "amber") return "border-amber-300/50 bg-amber-300/10 text-amber-100";
  return "border-zinc-800 bg-neutral-950 text-zinc-300";
}

function stateClass(state: AssemblyModule["merge_state"]) {
  if (state === "KEEP") return "border-teal-300 bg-teal-300 text-neutral-950";
  if (state === "ATTACHED") return "border-cyan-200 bg-cyan-200 text-neutral-950";
  if (state === "LIVE_REVIEW") return "border-amber-200 bg-amber-200 text-neutral-950";
  return "border-zinc-700 bg-zinc-900 text-zinc-300";
}

export default function FinalAssemblyWorkbench({ modules, summary }: FinalAssemblyWorkbenchProps) {
  return (
    <section className="border-b border-teal-400/20 bg-neutral-950 px-4 py-4" aria-label="Final Assembly Live Merge Bench">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-300">Final Assembly / Live Merge Bench</p>
          <h2 className="mt-1 text-xl font-black text-zinc-50">TinkerDen + ThinkIt + Feral Membrane positives</h2>
          <p className="mt-2 max-w-4xl text-xs font-bold leading-5 text-zinc-400">
            This lane gathers the pieces that have live proof behind them. It is the review surface for shaping the final version before Swanson&apos;s functional relay build is treated as merged.
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center text-[0.68rem] font-black uppercase">
          <div className="border border-teal-400/40 bg-teal-400/10 px-3 py-2">
            <dt className="text-zinc-500">Keep</dt>
            <dd className="text-teal-100">{summary.keep_count}</dd>
          </div>
          <div className="border border-amber-300/40 bg-amber-300/10 px-3 py-2">
            <dt className="text-zinc-500">Review</dt>
            <dd className="text-amber-100">{summary.review_count}</dd>
          </div>
          <div className="border border-zinc-700 bg-neutral-900 px-3 py-2">
            <dt className="text-zinc-500">Blocked</dt>
            <dd className="text-zinc-200">{summary.blocker_count}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-5">
        {modules.map((module) => (
          <article key={module.id} className={`min-h-64 border p-3 ${toneClass(module.tone)}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-zinc-400">{module.system}</p>
                <h3 className="mt-1 text-sm font-black text-zinc-50">{module.title}</h3>
              </div>
              <span className={`shrink-0 border px-2 py-1 text-[0.62rem] font-black uppercase ${stateClass(module.merge_state)}`}>
                {module.merge_state}
              </span>
            </div>
            <p className="mt-3 text-xs font-black uppercase text-zinc-300">{module.status}</p>
            <p className="mt-2 text-xs font-bold leading-5 text-zinc-300">{module.detail}</p>
            <div className="mt-3 border border-zinc-800 bg-neutral-950 p-2">
              <p className="text-[0.62rem] font-black uppercase text-zinc-500">Proof path</p>
              <p className="mt-1 break-all font-mono text-[0.66rem] text-zinc-300">{module.proof_path}</p>
            </div>
            <p className="mt-3 border-l-2 border-teal-300/60 pl-3 text-xs font-bold leading-5 text-teal-100">
              Next: {module.next_action}
            </p>
          </article>
        ))}
      </div>

      <MergeDecisionPreviews modules={modules} />

      <NextThreeBuildIdeas modules={modules} />

      <p className="mt-3 break-all font-mono text-[0.66rem] text-zinc-600">generated_at: {summary.generated_at}</p>
    </section>
  );
}
