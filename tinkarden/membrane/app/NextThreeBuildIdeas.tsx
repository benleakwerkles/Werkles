"use client";

import { useEffect, useState } from "react";

import type { AssemblyModule } from "./FinalAssemblyWorkbench";

type BuildIdea = {
  id:
    | "swanson_handoff_manifest"
    | "operator_momentum_script"
    | "let_die_ledger"
    | "operator_decision_summary"
    | "swanson_merge_checklist"
    | "receipt_health_check"
    | "version_decision_picklist"
    | "button_relay_smoke_pack"
    | "swanson_adapter_contract"
    | "live_review_agenda"
    | "merge_candidate_matrix"
    | "success_signal_index";
  wave: "G1" | "G2" | "G3" | "G4";
  title: string;
  intent: string;
  output: string;
  why: string;
  next: string;
};

type IdeaBuild = {
  build_id: string;
  idea_id: BuildIdea["id"];
  title: string;
  status: string;
  artifact_path: string;
  created_at: string;
};

type IdeaResponse = {
  ok: boolean;
  builds?: IdeaBuild[];
  build?: IdeaBuild;
  error?: string;
};

type NextThreeBuildIdeasProps = {
  modules: AssemblyModule[];
};

const IDEAS: BuildIdea[] = [
  {
    id: "swanson_handoff_manifest",
    wave: "G1",
    title: "Swanson handoff manifest",
    intent: "Turn the merge bench into a single handoff file Swanson can consume.",
    output: "A manifest with every candidate lane, proof path, current state, and open operator decision.",
    why: "This keeps the final relay page from guessing what lives where.",
    next: "Use as the merge contract once Swanson's functional page is ready."
  },
  {
    id: "operator_momentum_script",
    wave: "G1",
    title: "Operator momentum script",
    intent: "Make the human action loop obvious and tap-driven.",
    output: "A runbook for Top Three food to optional packet to momentum tap to Swanson relay.",
    why: "This answers what the conveyor belt is and what a momentum tap means.",
    next: "Use it to rehearse the final click path without auto-sending anything."
  },
  {
    id: "let_die_ledger",
    wave: "G1",
    title: "Let-die ledger",
    intent: "Give dead candidates a clean place to go without losing proof.",
    output: "A retirement ledger that preserves source paths and explains what should not enter the final UI.",
    why: "This keeps pruning honest: nothing disappears without a trail.",
    next: "Use it when an operator chooses Let Die on a lane."
  },
  {
    id: "operator_decision_summary",
    wave: "G2",
    title: "Operator decision summary",
    intent: "Summarize what has been chosen and what still needs a click.",
    output: "A decision coverage report across merge, keep, and let-die lanes.",
    why: "This makes the decision bench actionable instead of decorative.",
    next: "Use it before Swanson consumes the handoff manifest."
  },
  {
    id: "swanson_merge_checklist",
    wave: "G2",
    title: "Swanson merge checklist",
    intent: "Translate the live bench into pre-merge gates for Swanson.",
    output: "A checklist of required receipts, decisions, and no-auto-send guardrails.",
    why: "This tells the final relay page what must be true before it can be trusted.",
    next: "Run it immediately before the Swanson functional page becomes canonical."
  },
  {
    id: "receipt_health_check",
    wave: "G2",
    title: "Receipt health check",
    intent: "Check whether the proof paths behind the candidates still exist.",
    output: "A source/path health report for each candidate lane.",
    why: "This catches proof rot before the UI claims a lane is ready.",
    next: "Fix or mark source-missing paths before merging the final relay surface."
  },
  {
    id: "version_decision_picklist",
    wave: "G3",
    title: "Version decision picklist",
    intent: "Turn the gathered dashboard previews into explicit review choices.",
    output: "A site-only call sheet for Keep, Steal Parts, or Let Die decisions across the version wall.",
    why: "This makes the gathered dashboards useful for live review instead of another pile of screenshots.",
    next: "Use it while deciding what survives into the Swanson merge."
  },
  {
    id: "button_relay_smoke_pack",
    wave: "G3",
    title: "Button relay smoke pack",
    intent: "Prove which buttons write receipts and which success message should appear.",
    output: "A smoke-test matrix for version decisions, final assembly choices, G receipts, optional packets, momentum taps, and Swanson relay.",
    why: "The page needs visible success or blocker signals for every action button.",
    next: "Run it before treating the merged dashboard as functional."
  },
  {
    id: "swanson_adapter_contract",
    wave: "G3",
    title: "Swanson adapter contract",
    intent: "Define what Swanson's functional page should consume from the membrane.",
    output: "A site-only adapter map from decisions, optional packets, momentum taps, and relay receipts into Swanson.",
    why: "This keeps Swanson from guessing and keeps unrelated source lanes out of the dashboard merge lane.",
    next: "Use it when Swanson's functional relay build lands."
  },
  {
    id: "live_review_agenda",
    wave: "G4",
    title: "Live review agenda",
    intent: "Order the gathered previews into a live conversation path.",
    output: "A decision agenda that tells the operator which surface to review next and what choice is required.",
    why: "The preview wall becomes useful when it has an order and a question for each source.",
    next: "Use it during live review to decide what merges, stays support, gets mined, or dies."
  },
  {
    id: "merge_candidate_matrix",
    wave: "G4",
    title: "Merge candidate matrix",
    intent: "Map every gathered version to the final assembly module it should influence.",
    output: "A module-alignment matrix with merge readiness, useful parts, source path, and evidence path.",
    why: "This prevents the final page from blending source families without an explicit owner.",
    next: "Use it to assign final UI behavior to the correct source family."
  },
  {
    id: "success_signal_index",
    wave: "G4",
    title: "Success signal index",
    intent: "Show which controls have durable success evidence and which are still empty.",
    output: "A receipt-backed index of version decisions, final decisions, optional packets, momentum taps, relays, and G builds.",
    why: "A button is only functional if the UI reports success and a durable receipt/log record exists.",
    next: "Use it to choose the next button smoke test or repair target."
  }
];

function toneClass(ideaId: BuildIdea["id"]) {
  if (ideaId === "swanson_handoff_manifest") return "border-teal-400/40 bg-teal-400/10";
  if (ideaId === "operator_momentum_script" || ideaId === "operator_decision_summary") return "border-cyan-300/40 bg-cyan-300/10";
  if (ideaId === "swanson_merge_checklist" || ideaId === "swanson_adapter_contract") return "border-amber-300/40 bg-amber-300/10";
  if (ideaId === "version_decision_picklist" || ideaId === "button_relay_smoke_pack") return "border-teal-300/30 bg-neutral-950";
  if (ideaId === "live_review_agenda" || ideaId === "merge_candidate_matrix" || ideaId === "success_signal_index") return "border-cyan-200/35 bg-neutral-950";
  return "border-zinc-700 bg-neutral-950";
}

export default function NextThreeBuildIdeas({ modules }: NextThreeBuildIdeasProps) {
  const [builds, setBuilds] = useState<Record<string, IdeaBuild>>({});
  const [busyIdea, setBusyIdea] = useState("");
  const [message, setMessage] = useState("Ready to build the next three ideas.");

  useEffect(() => {
    let mounted = true;
    fetch("/api/final-assembly/next-best-idea", { cache: "no-store" })
      .then((response) => response.json() as Promise<IdeaResponse>)
      .then((payload) => {
        if (!mounted || !payload.ok || !Array.isArray(payload.builds)) return;
        setBuilds(Object.fromEntries(payload.builds.map((build) => [build.idea_id, build])));
      })
      .catch(() => {
        if (mounted) setMessage("Next-three build receipts could not hydrate yet.");
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function buildIdea(idea: BuildIdea) {
    setBusyIdea(idea.id);
    setMessage(`Building ${idea.title}...`);

    try {
      const response = await fetch("/api/final-assembly/next-best-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea_id: idea.id,
          modules: modules.map((module) => ({
            id: module.id,
            title: module.title,
            system: module.system,
            status: module.status,
            merge_state: module.merge_state,
            proof_path: module.proof_path,
            next_action: module.next_action
          }))
        })
      });
      const payload = (await response.json()) as IdeaResponse;

      if (!response.ok || !payload.ok || !payload.build) {
        throw new Error(payload.error || "NEXT_BEST_IDEA_BUILD_FAILED");
      }

      setBuilds((current) => ({ ...current, [idea.id]: payload.build as IdeaBuild }));
      setMessage(`Built: ${payload.build.artifact_path}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Next-three build failed.");
    } finally {
      setBusyIdea("");
    }
  }

  return (
    <section className="mt-5 border border-cyan-300/25 bg-neutral-900 p-3" aria-label="G Next Three Builds">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <p className="text-xs font-black uppercase text-cyan-200">G / Next Three Builds</p>
          <h3 className="mt-1 text-lg font-black text-zinc-50">Built idea queue</h3>
          <p className="mt-2 max-w-3xl text-xs font-bold leading-5 text-zinc-400">
            G builds receipt-backed idea waves. These artifacts do not record merge decisions, mutate target files, or auto-send a relay.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-center text-[0.68rem] font-black uppercase">
          <div className="border border-cyan-300/40 bg-cyan-300/10 px-3 py-2">
            <dt className="text-zinc-500">Built</dt>
            <dd className="text-cyan-100">{Object.keys(builds).length}</dd>
          </div>
          <div className="border border-zinc-700 bg-neutral-950 px-3 py-2">
            <dt className="text-zinc-500">Ready</dt>
            <dd className="text-zinc-200">{IDEAS.length}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        {IDEAS.map((idea) => {
          const build = builds[idea.id];

          return (
            <article key={idea.id} className={`border p-3 ${toneClass(idea.id)}`}>
              <div className="min-h-32">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-zinc-500">{idea.wave} / {idea.id}</p>
                <h4 className="mt-1 text-base font-black text-zinc-50">{idea.title}</h4>
                <p className="mt-2 text-xs font-bold leading-5 text-zinc-300">{idea.intent}</p>
              </div>

              <dl className="mt-3 grid gap-2 text-xs">
                <div className="border border-zinc-800 bg-neutral-950 p-2">
                  <dt className="font-black uppercase text-zinc-500">Output</dt>
                  <dd className="mt-1 leading-5 text-zinc-300">{idea.output}</dd>
                </div>
                <div className="border border-zinc-800 bg-neutral-950 p-2">
                  <dt className="font-black uppercase text-zinc-500">Why</dt>
                  <dd className="mt-1 leading-5 text-zinc-300">{idea.why}</dd>
                </div>
                <div className="border border-zinc-800 bg-neutral-950 p-2">
                  <dt className="font-black uppercase text-zinc-500">Next</dt>
                  <dd className="mt-1 leading-5 text-zinc-300">{idea.next}</dd>
                </div>
              </dl>

              <button
                type="button"
                className="mt-4 min-h-10 w-full border border-cyan-200 bg-cyan-200 px-3 text-xs font-black uppercase text-neutral-950 disabled:cursor-progress disabled:opacity-60"
                disabled={Boolean(busyIdea)}
                onClick={() => buildIdea(idea)}
              >
                {busyIdea === idea.id ? "Building..." : build ? "Rebuild receipt" : "Build receipt"}
              </button>

              <div className="mt-3 border border-zinc-800 bg-neutral-950 p-2">
                <p className="text-[0.62rem] font-black uppercase text-zinc-500">Latest build</p>
                <p className="mt-1 text-xs font-black text-zinc-100">{build ? build.status : "Not built yet"}</p>
                <p className="mt-1 break-all font-mono text-[0.62rem] text-zinc-500">
                  {build ? build.artifact_path : "receipt pending"}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-3 border border-zinc-800 bg-neutral-950 px-3 py-2 font-mono text-[0.68rem] text-zinc-400">{message}</p>
    </section>
  );
}
