"use client";

import { useEffect, useMemo, useState } from "react";

import type { AssemblyModule } from "./FinalAssemblyWorkbench";

type Decision = "MERGE" | "KEEP" | "LET_DIE";

type DecisionRecord = {
  decision_id: string;
  module_id: string;
  title: string;
  system: string;
  decision: Decision;
  decision_label: string;
  proof_path: string;
  status: string;
  decision_path: string;
  created_at: string;
};

type DecisionResponse = {
  ok: boolean;
  decisions?: DecisionRecord[];
  decision?: DecisionRecord;
  error?: string;
};

type MergeDecisionPreviewsProps = {
  modules: AssemblyModule[];
};

const DECISIONS: Decision[] = ["MERGE", "KEEP", "LET_DIE"];

function decisionLabel(decision: Decision) {
  return decision === "LET_DIE" ? "Let Die" : decision.charAt(0) + decision.slice(1).toLowerCase();
}

function previewFor(module: AssemblyModule, decision: Decision) {
  const base: Record<Decision, string> = {
    MERGE: "Promote this into the final first-screen workflow.",
    KEEP: "Keep this as a supporting proof lane without making it the main path.",
    LET_DIE: "Remove this from the final UI candidate set while preserving the proof trail."
  };

  if (module.id === "thinkit-origin-return") {
    return {
      MERGE: "Make origin-dash return receipts part of the primary proof strip.",
      KEEP: "Retain ThinkIt as a receipt source that can be checked when relay proof is disputed.",
      LET_DIE: "Drop the origin-return lane from the final UI and keep only the saved relay proof files."
    }[decision];
  }

  if (module.id === "tinkerden-command-receipts") {
    return {
      MERGE: "Make packet intake to receipt custody the backbone of the final relay page.",
      KEEP: "Keep TinkerDen receipts visible as an audit drawer beside the main Swanson relay flow.",
      LET_DIE: "Retire this as a visible lane, leaving command receipts as backend-only proof."
    }[decision];
  }

  if (module.id === "wonka-aeye-loop") {
    return {
      MERGE: "Carry the proven file-backed packet/write/receipt loop into the merged relay behavior.",
      KEEP: "Keep Wonka as a reference implementation for transport behavior while Swanson leads the UI.",
      LET_DIE: "Stop showing the Wonka lane and mine it only for implementation details."
    }[decision];
  }

  if (module.id === "feral-membrane-motion") {
    return {
      MERGE: "Make Top Three food, optional packets, and momentum taps the operator choice engine.",
      KEEP: "Keep Feral Membrane as the staging bench for optional packets before Swanson relay.",
      LET_DIE: "Remove the motion lane from the final surface and keep its packet receipts as archived context."
    }[decision];
  }

  if (module.id === "swanson-attached-relay") {
    return {
      MERGE: "Use Swanson as the final functional relay page once live behavior passes review.",
      KEEP: "Keep Swanson attached as the relay bridge while the membrane remains the decision bench.",
      LET_DIE: "Detach this relay candidate until a working Swanson page can prove itself again."
    }[decision];
  }

  return base[decision];
}

function buttonClass(decision: Decision, active: boolean) {
  const base = "border px-3 py-2 text-xs font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-60";
  if (decision === "MERGE") {
    return `${base} ${active ? "border-teal-200 bg-teal-200 text-neutral-950" : "border-teal-400/40 bg-teal-400/10 text-teal-100 hover:bg-teal-400/20"}`;
  }
  if (decision === "KEEP") {
    return `${base} ${active ? "border-cyan-200 bg-cyan-200 text-neutral-950" : "border-cyan-300/40 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20"}`;
  }
  return `${base} ${active ? "border-zinc-200 bg-zinc-200 text-neutral-950" : "border-zinc-700 bg-neutral-950 text-zinc-300 hover:border-zinc-500"}`;
}

export default function MergeDecisionPreviews({ modules }: MergeDecisionPreviewsProps) {
  const [decisions, setDecisions] = useState<Record<string, DecisionRecord>>({});
  const [busyKey, setBusyKey] = useState("");
  const [message, setMessage] = useState("Decision receipts ready.");

  useEffect(() => {
    let mounted = true;
    fetch("/api/final-assembly/decision", { cache: "no-store" })
      .then((response) => response.json() as Promise<DecisionResponse>)
      .then((payload) => {
        if (!mounted || !payload.ok || !Array.isArray(payload.decisions)) return;
        setDecisions(
          Object.fromEntries(payload.decisions.map((decision) => [decision.module_id, decision]))
        );
      })
      .catch(() => {
        if (mounted) setMessage("Decision receipts could not hydrate yet.");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const counts = useMemo(() => {
    return Object.values(decisions).reduce(
      (total, record) => {
        total[record.decision] += 1;
        return total;
      },
      { MERGE: 0, KEEP: 0, LET_DIE: 0 } as Record<Decision, number>
    );
  }, [decisions]);

  async function recordDecision(module: AssemblyModule, decision: Decision) {
    const key = `${module.id}:${decision}`;
    setBusyKey(key);
    setMessage(`Recording ${decisionLabel(decision)} for ${module.title}...`);

    try {
      const response = await fetch("/api/final-assembly/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module_id: module.id,
          title: module.title,
          system: module.system,
          status: module.status,
          merge_state: module.merge_state,
          proof_path: module.proof_path,
          decision
        })
      });
      const payload = (await response.json()) as DecisionResponse;

      if (!response.ok || !payload.ok || !payload.decision) {
        throw new Error(payload.error || "DECISION_WRITE_FAILED");
      }

      setDecisions((current) => ({
        ...current,
        [module.id]: payload.decision as DecisionRecord
      }));
      setMessage(`Receipt written: ${payload.decision.decision_path}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Decision receipt failed.");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <section className="mt-5 border border-zinc-800 bg-neutral-900 p-3" aria-label="Decision Previews">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <p className="text-xs font-black uppercase text-teal-300">Decision Previews</p>
          <h3 className="mt-1 text-lg font-black text-zinc-50">Merge, keep, or let die</h3>
          <p className="mt-2 max-w-3xl text-xs font-bold leading-5 text-zinc-400">
            Each choice writes an operator decision receipt. Code does not merge from this button; the receipt tells the final Swanson merge what you chose.
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center text-[0.68rem] font-black uppercase">
          <div className="border border-teal-400/40 bg-teal-400/10 px-3 py-2">
            <dt className="text-zinc-500">Merge</dt>
            <dd className="text-teal-100">{counts.MERGE}</dd>
          </div>
          <div className="border border-cyan-300/40 bg-cyan-300/10 px-3 py-2">
            <dt className="text-zinc-500">Keep</dt>
            <dd className="text-cyan-100">{counts.KEEP}</dd>
          </div>
          <div className="border border-zinc-700 bg-neutral-950 px-3 py-2">
            <dt className="text-zinc-500">Let Die</dt>
            <dd className="text-zinc-200">{counts.LET_DIE}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-5">
        {modules.map((module) => {
          const currentDecision = decisions[module.id];

          return (
            <article key={module.id} className="border border-zinc-800 bg-neutral-950 p-3">
              <div className="min-h-24">
                <p className="text-[0.65rem] font-black uppercase text-zinc-500">{module.system}</p>
                <h4 className="mt-1 text-sm font-black leading-5 text-zinc-50">{module.title}</h4>
                <p className="mt-2 text-[0.68rem] font-black uppercase text-zinc-400">{module.status}</p>
              </div>

              <div className="mt-3 grid gap-2">
                {DECISIONS.map((decision) => (
                  <section key={decision} className="border border-zinc-800 bg-neutral-900 p-2">
                    <p className="text-[0.68rem] font-black uppercase text-zinc-300">{decisionLabel(decision)}</p>
                    <p className="mt-1 min-h-16 text-xs font-bold leading-5 text-zinc-400">{previewFor(module, decision)}</p>
                    <button
                      type="button"
                      className={buttonClass(decision, currentDecision?.decision === decision)}
                      disabled={Boolean(busyKey)}
                      onClick={() => recordDecision(module, decision)}
                    >
                      {busyKey === `${module.id}:${decision}` ? "Saving..." : decisionLabel(decision)}
                    </button>
                  </section>
                ))}
              </div>

              <div className="mt-3 border border-zinc-800 bg-neutral-900 p-2">
                <p className="text-[0.62rem] font-black uppercase text-zinc-500">Current decision</p>
                <p className="mt-1 text-xs font-black text-zinc-100">
                  {currentDecision ? currentDecision.decision_label : "No decision yet"}
                </p>
                <p className="mt-1 break-all font-mono text-[0.62rem] text-zinc-500">
                  {currentDecision ? currentDecision.decision_path : module.proof_path}
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
