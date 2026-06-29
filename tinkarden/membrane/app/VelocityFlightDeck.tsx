"use client";

import { useEffect, useMemo, useState } from "react";

export type VelocityNode = {
  id: string;
  label: string;
  state: string;
  token_saturation: number;
  active: boolean;
  last_event_at?: string | null;
  event_source?: string;
};

export type ActionCapsule = {
  id: string;
  origin: string;
  target_mutations: string[];
  awaiting: string;
  source_path: string;
  status: string;
  timestamp: string;
};

type VelocityEvent = {
  type?: string;
  node?: Partial<VelocityNode>;
  capsule?: Partial<ActionCapsule>;
  interface_state?: {
    status?: string;
    badge?: string;
    timestamp?: string;
  };
};

type MomentumTapResult = {
  ok?: boolean;
  error?: string;
  tap?: {
    capsule_id: string;
    status: string;
    awaiting: string;
    event_path: string;
    tap_path: string;
    receipt_path?: string;
  };
};

type VelocityFlightDeckProps = {
  initialNodes: VelocityNode[];
  initialCapsules: ActionCapsule[];
};

function clampPercent(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeCapsule(value: Partial<ActionCapsule>): ActionCapsule {
  return {
    id: value.id || `capsule_${Date.now()}`,
    origin: value.origin || "UNKNOWN@BETSY",
    target_mutations: Array.isArray(value.target_mutations) && value.target_mutations.length > 0
      ? value.target_mutations.map(String)
      : ["UNSPECIFIED_FILE_MUTATION"],
    awaiting: value.awaiting || "PASTE_GPG_SIG",
    source_path: value.source_path || "speaker/logs/ingest.jsonl",
    status: value.status || "AWAITING_MOMENTUM_TAP",
    timestamp: value.timestamp || new Date().toISOString()
  };
}

function mergeCapsule(capsules: ActionCapsule[], next: ActionCapsule) {
  return [next, ...capsules.filter((capsule) => capsule.id !== next.id)].slice(0, 8);
}

function nodeTone(node: VelocityNode) {
  if (!node.active) return "border-zinc-800 bg-neutral-950 text-zinc-400";
  if (node.token_saturation >= 70) return "border-amber-300/80 bg-amber-300/10 text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.18)]";
  return "border-cyan-300/70 bg-cyan-300/10 text-cyan-100 shadow-[0_0_22px_rgba(103,232,249,0.14)]";
}

function nodeExplanation(node: VelocityNode) {
  if (node.id === "sally") return "Receipt intake pressure from Speaker raw inbox / ingest events.";
  if (node.id === "ender") return "Doctrine and thought-stream pressure from harvest or active doctrine events.";
  if (node.id === "thufir") return "Index validation pressure from rebuild-index events.";
  return "Log-derived Aeye pressure score.";
}

function capsulePlainStatus(capsule: ActionCapsule) {
  if (capsule.status === "PACKET_RELAY_COMPLETE") {
    return "Swanson relay wrote packet and receipt artifacts. Relay text is staged for operator paste/send; no auto-send happened.";
  }
  if (capsule.status === "OPTIONAL_PACKET_CREATED") {
    return "Optional packet created from Top 3 food. Waiting for a Momentum Tap before Swanson relay pickup.";
  }
  if (capsule.status === "MOMENTUM_TAPPED") {
    return "Tapped. Ready for Swanson functional relay pickup when that page exists.";
  }
  if (capsule.status === "CLIPBOARD_INGEST_SUCCESSFUL") {
    return "Ingested from clipboard. Needs operator review before relay.";
  }
  return "Staged, but not moving yet. A momentum tap records that this should advance.";
}

export default function VelocityFlightDeck({ initialNodes, initialCapsules }: VelocityFlightDeckProps) {
  const [nodes, setNodes] = useState(initialNodes);
  const [capsules, setCapsules] = useState(initialCapsules);
  const [streamState, setStreamState] = useState("CONNECTING");
  const [interfaceBadge, setInterfaceBadge] = useState<string | null>(null);
  const [tapPendingId, setTapPendingId] = useState<string | null>(null);
  const [tapReceipts, setTapReceipts] = useState<Record<string, MomentumTapResult["tap"]>>({});
  const activeCount = useMemo(() => nodes.filter((node) => node.active).length, [nodes]);

  useEffect(() => {
    const events = new EventSource("/api/velocity/events");
    events.addEventListener("open", () => setStreamState("SSE_CONNECTED"));
    events.addEventListener("error", () => setStreamState("SSE_RECONNECTING"));

    function handleVelocity(raw: MessageEvent<string>) {
      try {
        const event = JSON.parse(raw.data) as VelocityEvent;
        if (event.interface_state?.badge) {
          setInterfaceBadge(event.interface_state.badge);
          setStreamState(event.interface_state.status || "CLIPBOARD_INGEST_SUCCESSFUL");
        }
        if (event.node?.id) {
          setNodes((current) => current.map((node) => {
            if (node.id !== event.node?.id) return node;
            return {
              ...node,
              ...event.node,
              token_saturation: clampPercent(event.node.token_saturation ?? node.token_saturation),
              active: Boolean(event.node.active ?? node.active)
            };
          }));
        }
        if (event.capsule) {
          setCapsules((current) => mergeCapsule(current, normalizeCapsule(event.capsule || {})));
        }
      } catch {
        setStreamState("SSE_PARSE_BLOCKED");
      }
    }

    events.addEventListener("velocity", handleVelocity);
    events.addEventListener("transaction_capsule", handleVelocity);
    events.addEventListener("watch_substrate", handleVelocity);
    events.addEventListener("clipboard_ingest", handleVelocity);
    events.addEventListener("momentum_tap", handleVelocity);

    return () => events.close();
  }, []);

  async function momentumTap(capsule: ActionCapsule) {
    setTapPendingId(capsule.id);
    setStreamState("MOMENTUM_TAP_WRITING");

    try {
      const response = await fetch("/api/velocity/momentum-tap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ capsule })
      });
      const result = (await response.json()) as MomentumTapResult;
      if (!response.ok || !result.ok || !result.tap) throw new Error(result.error || "MOMENTUM_TAP_FAILED");

      setCapsules((current) =>
        current.map((candidate) =>
          candidate.id === capsule.id
            ? {
                ...candidate,
                status: "MOMENTUM_TAPPED",
                awaiting: result.tap?.awaiting || "SWANSON_FUNCTIONAL_RELAY_MERGE"
              }
            : candidate
        )
      );
      setTapReceipts((current) => ({ ...current, [capsule.id]: result.tap }));
      setInterfaceBadge("[ MOMENTUM_TAP: RECORDED ]");
      setStreamState("MOMENTUM_TAP_RECORDED");
    } catch (error) {
      setStreamState(`TAP_BLOCKED: ${error instanceof Error ? error.message : "unknown"}`);
    } finally {
      setTapPendingId(null);
    }
  }

  return (
    <section className="border-b border-cyan-300/20 bg-neutral-950 px-4 py-3" aria-label="Velocity Header and Transaction Conveyor">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">Velocity Header</p>
          <h2 className="mt-1 text-lg font-black text-zinc-50">Aeye computation vector / action queue</h2>
          <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-zinc-400">
            This is not live CPU. It is a log-derived pressure vector from Speaker ingest, harvest, and interface events. If the watched logs do not change, these numbers should hold still.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {interfaceBadge ? (
            <code className="border border-emerald-300/50 bg-emerald-300/15 px-3 py-2 text-[0.68rem] font-black uppercase text-emerald-100">
              {interfaceBadge}
            </code>
          ) : null}
          <code className="border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-[0.68rem] font-black uppercase text-cyan-100">
            {streamState} / {activeCount} active minds
          </code>
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Live Aeye velocity vector">
        {nodes.map((node) => (
          <section key={node.id} className={`min-w-[16rem] border px-3 py-2 ${nodeTone(node)} ${node.active ? "animate-pulse" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs font-black uppercase">[ {node.label}: {node.state} ]</span>
              <span className="font-mono text-[0.65rem] font-black">{node.token_saturation}%</span>
            </div>
            <p className="mt-2 text-[0.68rem] font-bold leading-4 text-zinc-400">{nodeExplanation(node)}</p>
            <p className="mt-2 break-all text-[0.66rem] font-bold leading-4 text-zinc-500">
              Last matching event: {node.last_event_at || "none yet"} / {node.event_source || "watched logs"}
            </p>
            <div className="mt-2 h-1 overflow-hidden bg-zinc-900">
              <div
                className={`h-full ${node.token_saturation >= 70 ? "bg-amber-300" : "bg-cyan-300"}`}
                style={{ width: `${node.token_saturation}%` }}
              />
            </div>
          </section>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Transaction Conveyor Belt</p>
            <p className="mt-1 text-xs font-bold leading-5 text-zinc-400">
              These cards are staged action capsules: source material or receipt files waiting for a human nudge. Momentum Tap writes a durable event; it does not mutate the target file.
            </p>
          </div>
          <span className="font-mono text-xs font-black text-zinc-400">{capsules.length} capsules staged</span>
        </div>

        <div className="mt-3 border border-cyan-300/30 bg-cyan-300/10 p-3 text-xs leading-5 text-cyan-50">
          <strong className="uppercase text-cyan-200">Swanson merge contract:</strong>{" "}
          when Swanson's functional relay page lands, it should consume momentum taps from <code>tinkarden/membrane/momentum_taps.jsonl</code> and the mirrored interface events in <code>speaker/logs/interface-notify.jsonl</code>.
        </div>

        <div className="mt-3 flex gap-3 overflow-x-auto pb-2" aria-label="Forward moving action capsules">
          {capsules.length === 0 ? (
            <p className="min-w-full border border-zinc-800 bg-neutral-900 p-4 text-sm font-bold text-zinc-400">
              Conveyor is armed. Waiting for `watch-substrate` or autonomic harvest to stage a transaction capsule.
            </p>
          ) : (
            capsules.map((capsule, capsuleIndex) => (
              <article
                key={`${capsule.id}:${capsule.timestamp}:${capsuleIndex}`}
                className="min-w-[22rem] animate-[capsule_slide_in_240ms_ease-out] border border-amber-300/40 bg-neutral-900 p-4 shadow-[0_0_26px_rgba(251,191,36,0.10)]"
              >
                {(() => {
                  const tapReceipt = tapReceipts[capsule.id];
                  return (
                    <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.65rem] font-black uppercase text-zinc-500">Origin</p>
                    <h3 className="mt-1 text-sm font-black text-zinc-100">{capsule.origin}</h3>
                  </div>
                  <span className="border border-amber-300 bg-amber-300 px-2 py-1 text-[0.62rem] font-black uppercase text-zinc-950">
                    {capsule.status}
                  </span>
                </div>

                <dl className="mt-4 grid gap-3 text-xs">
                  <div>
                    <dt className="font-black uppercase text-zinc-500">Targeted file mutations</dt>
                    <dd className="mt-1 grid gap-1">
                      {capsule.target_mutations.map((target, targetIndex) => (
                        <code key={`${target}:${targetIndex}`} className="break-all border border-zinc-800 bg-neutral-950 px-2 py-1 text-zinc-300">{target}</code>
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-black uppercase text-zinc-500">Source capsule</dt>
                    <dd className="mt-1 break-all font-mono text-zinc-400">{capsule.source_path}</dd>
                  </div>
                  <div>
                    <dt className="font-black uppercase text-zinc-500">Human meaning</dt>
                    <dd className="mt-1 text-zinc-300">{capsulePlainStatus(capsule)}</dd>
                  </div>
                </dl>

                <div className="mt-4 grid gap-3 border border-amber-300/70 bg-amber-300/10 p-3 text-center shadow-[0_0_22px_rgba(251,191,36,0.16)]">
                  <p className="font-mono text-sm font-black text-amber-100">[ {capsule.status}: {capsule.awaiting} ]</p>
                  <button
                    className="min-h-10 border border-amber-200 bg-amber-200 px-3 text-xs font-black uppercase text-neutral-950 disabled:cursor-progress disabled:opacity-60"
                    type="button"
                    disabled={tapPendingId === capsule.id || capsule.status === "MOMENTUM_TAPPED"}
                    onClick={() => void momentumTap(capsule)}
                  >
                    {capsule.status === "MOMENTUM_TAPPED" ? "Momentum tapped" : tapPendingId === capsule.id ? "Writing tap" : "Momentum tap"}
                  </button>
                  {tapReceipt ? (
                    <div className="border border-emerald-300/50 bg-emerald-300/10 p-2 text-left text-[0.68rem] text-emerald-100" role="status">
                      <p className="font-black uppercase">Momentum tap recorded</p>
                      <p className="mt-1 break-all font-mono">receipt {tapReceipt.receipt_path || "existing tap"}</p>
                      <p className="mt-1 break-all font-mono">event {tapReceipt.event_path}</p>
                    </div>
                  ) : null}
                </div>
                    </>
                  );
                })()}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
