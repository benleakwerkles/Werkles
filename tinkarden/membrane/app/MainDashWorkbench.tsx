import type { AssemblyModule } from "./FinalAssemblyWorkbench";
import type { VersionPreviewManifest } from "./VersionPreviewWall";

type MainDashWorkbenchProps = {
  modules: AssemblyModule[];
  versionPreviews: VersionPreviewManifest | null;
};

const DECISION_STACK = [
  {
    label: "Main shell",
    call: "TinkerDen Bridge",
    reason: "Best human-facing structure: Top 3 moves, receipt pickup, command console, and Human Gate in one place."
  },
  {
    label: "Merge into shell",
    call: "Command relay + proof chain + ThinkIt return",
    reason: "These are the proof lanes: packet left, Aeye custody happened, answer returned to origin."
  },
  {
    label: "Steal UX from",
    call: "Sally Good SoleDash",
    reason: "Action queue, active mission framing, mock-test receipt mode, and options-market pacing are useful."
  },
  {
    label: "Reference only",
    call: "Static launcher, mood reference, salvage bundles",
    reason: "Good source material, but not the functional operator surface."
  }
];

const OPERATOR_FLOW = [
  {
    step: "1",
    title: "Pick a Top 3 move",
    detail: "Petra/Skybro food becomes an optional packet. This creates momentum material but does not execute it."
  },
  {
    step: "2",
    title: "Give it a momentum tap",
    detail: "The tap writes a durable event for Swanson pickup. It records intent; it does not mutate the target file."
  },
  {
    step: "3",
    title: "Relay or command",
    detail: "Choose a verified Aeye@Machine destination and write the file-backed packet/receipt chain."
  },
  {
    step: "4",
    title: "Read the return proof",
    detail: "The dash should show ACK, BLOCKER, or ARTIFACT with packet id, receipt id, and origin-return evidence."
  }
];

function moduleById(modules: AssemblyModule[], id: string) {
  return modules.find((module) => module.id === id);
}

function statusTone(status?: string) {
  if (!status) return "border-zinc-800 bg-neutral-950 text-zinc-400";
  if (status.includes("PROVEN") || status.includes("COMPLETE")) return "border-teal-300/50 bg-teal-300/10 text-teal-100";
  if (status.includes("ATTACHED") || status.includes("PARTIAL")) return "border-amber-300/50 bg-amber-300/10 text-amber-100";
  return "border-zinc-800 bg-neutral-950 text-zinc-300";
}

export default function MainDashWorkbench({ modules, versionPreviews }: MainDashWorkbenchProps) {
  const commandModule = moduleById(modules, "tinkerden-command-receipts");
  const thinkItModule = moduleById(modules, "thinkit-origin-return");
  const motionModule = moduleById(modules, "feral-membrane-motion");
  const swansonModule = moduleById(modules, "swanson-attached-relay");

  return (
    <section className="border-b border-teal-400/20 bg-neutral-950 px-4 py-4" aria-label="Main dashboard candidate">
      <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
        <article className="border border-teal-400/40 bg-neutral-900 p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-300">Main Dash Candidate</p>
          <h2 className="mt-1 text-xl font-black text-zinc-50">TinkerDen Bridge becomes the working surface.</h2>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-zinc-300">
            This build turns the preview wall into an operator flow. The first screen should let you choose a useful move,
            write or relay a packet, see whether it succeeded, and keep the proof trail visible without making you read a
            wall of hashes first.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {DECISION_STACK.map((item) => (
              <section key={item.label} className="border border-zinc-800 bg-neutral-950 p-3">
                <p className="text-[0.65rem] font-black uppercase text-zinc-500">{item.label}</p>
                <h3 className="mt-1 text-sm font-black text-zinc-50">{item.call}</h3>
                <p className="mt-2 text-xs font-bold leading-5 text-zinc-400">{item.reason}</p>
              </section>
            ))}
          </div>
        </article>

        <article className="border border-cyan-300/30 bg-neutral-900 p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Operator Flow</p>
          <h2 className="mt-1 text-xl font-black text-zinc-50">What to click, what it means, what proof appears.</h2>
          <div className="mt-4 grid gap-2">
            {OPERATOR_FLOW.map((item) => (
              <section key={item.step} className="grid grid-cols-[2.2rem_minmax(0,1fr)] gap-3 border border-zinc-800 bg-neutral-950 p-3">
                <span className="grid h-9 w-9 place-items-center border border-cyan-200 bg-cyan-200 font-mono text-sm font-black text-neutral-950">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-sm font-black text-zinc-50">{item.title}</h3>
                  <p className="mt-1 text-xs font-bold leading-5 text-zinc-400">{item.detail}</p>
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-4">
        <section className={`border p-3 ${statusTone(commandModule?.status)}`}>
          <p className="text-[0.65rem] font-black uppercase opacity-75">Command custody</p>
          <h3 className="mt-1 text-sm font-black">{commandModule?.status ?? "UNKNOWN"}</h3>
          <p className="mt-2 text-xs font-bold leading-5 opacity-85">{commandModule?.detail ?? "No command module loaded."}</p>
        </section>
        <section className={`border p-3 ${statusTone(thinkItModule?.status)}`}>
          <p className="text-[0.65rem] font-black uppercase opacity-75">Origin return</p>
          <h3 className="mt-1 text-sm font-black">{thinkItModule?.status ?? "UNKNOWN"}</h3>
          <p className="mt-2 text-xs font-bold leading-5 opacity-85">{thinkItModule?.detail ?? "No ThinkIt return loaded."}</p>
        </section>
        <section className={`border p-3 ${statusTone(motionModule?.status)}`}>
          <p className="text-[0.65rem] font-black uppercase opacity-75">Momentum lane</p>
          <h3 className="mt-1 text-sm font-black">{motionModule?.status ?? "UNKNOWN"}</h3>
          <p className="mt-2 text-xs font-bold leading-5 opacity-85">{motionModule?.detail ?? "No optional packet lane loaded."}</p>
        </section>
        <section className={`border p-3 ${statusTone(swansonModule?.status)}`}>
          <p className="text-[0.65rem] font-black uppercase opacity-75">Swanson handoff</p>
          <h3 className="mt-1 text-sm font-black">{swansonModule?.status ?? "NOT_ATTACHED"}</h3>
          <p className="mt-2 text-xs font-bold leading-5 opacity-85">{swansonModule?.detail ?? "Swanson is not attached yet."}</p>
        </section>
      </div>

      <p className="mt-3 border border-zinc-800 bg-neutral-900 px-3 py-2 text-xs font-bold leading-5 text-zinc-400">
        Gathered sources remain below for audit: {versionPreviews?.summary.total_versions ?? 0} dashboard versions are still available for
        keep / steal parts / let die receipts.
      </p>
    </section>
  );
}
