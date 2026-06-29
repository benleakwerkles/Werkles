"use client";

import { useEffect, useMemo, useState } from "react";

export type VersionPreview = {
  id: string;
  title: string;
  family: string;
  status: "LIVE_SCREENSHOT" | "BLOCKED_RUNTIME" | "SOURCE_ONLY";
  source_url: string | null;
  image: string | null;
  source_path: string;
  evidence_path: string;
  why_it_matters: string;
  useful_parts: string[];
  honest_boundary: string;
};

export type VersionPreviewManifest = {
  generated_at: string;
  summary: {
    total_versions: number;
    live_screenshots: number;
    blocked_runtime: number;
    source_only: number;
  };
  versions: VersionPreview[];
};

type VersionDecision = {
  version_id: string;
  decision: "KEEP" | "STEAL_PARTS" | "LET_DIE";
  receipt_path?: string;
  decided_at?: string;
};

type VersionPreviewWallProps = {
  manifest: VersionPreviewManifest | null;
};

const ACTIONS: Array<VersionDecision["decision"]> = ["KEEP", "STEAL_PARTS", "LET_DIE"];

function statusClass(status: VersionPreview["status"]) {
  if (status === "LIVE_SCREENSHOT") return "border-teal-300 bg-teal-300 text-neutral-950";
  if (status === "BLOCKED_RUNTIME") return "border-red-200 bg-red-200 text-neutral-950";
  return "border-zinc-600 bg-zinc-800 text-zinc-200";
}

function actionLabel(action: VersionDecision["decision"]) {
  if (action === "STEAL_PARTS") return "STEAL PARTS";
  if (action === "LET_DIE") return "LET DIE";
  return action;
}

export default function VersionPreviewWall({ manifest }: VersionPreviewWallProps) {
  const [decisions, setDecisions] = useState<Record<string, VersionDecision>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("Decision receipts ready.");

  useEffect(() => {
    let live = true;

    async function loadDecisions() {
      try {
        const response = await fetch("/api/version-preview/decision", { cache: "no-store" });
        const result = (await response.json()) as { ok?: boolean; decisions?: VersionDecision[]; error?: string };
        if (!live || !response.ok || !result.ok || !Array.isArray(result.decisions)) return;
        setDecisions(
          Object.fromEntries(result.decisions.map((decision) => [decision.version_id, decision] as const))
        );
      } catch {
        if (live) setMessage("Decision history unavailable; new clicks will still try to write receipts.");
      }
    }

    void loadDecisions();
    return () => {
      live = false;
    };
  }, []);

  const selectedCount = useMemo(() => Object.keys(decisions).length, [decisions]);

  async function decide(version: VersionPreview, decision: VersionDecision["decision"]) {
    setBusy(`${version.id}:${decision}`);
    setMessage(`Writing ${actionLabel(decision)} decision for ${version.title}...`);

    try {
      const response = await fetch("/api/version-preview/decision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          version_id: version.id,
          title: version.title,
          family: version.family,
          decision,
          source_path: version.source_path,
          evidence_path: version.evidence_path,
          source_url: version.source_url,
          useful_parts: version.useful_parts
        })
      });
      const result = (await response.json()) as { ok?: boolean; error?: string; decision?: VersionDecision };
      if (!response.ok || !result.ok || !result.decision) throw new Error(result.error || "DECISION_WRITE_FAILED");
      setDecisions((current) => ({ ...current, [version.id]: result.decision as VersionDecision }));
      setMessage(`${version.title}: ${actionLabel(decision)} saved.`);
    } catch (error) {
      setMessage(`BLOCKER: ${error instanceof Error ? error.message : "decision write failed"}`);
    } finally {
      setBusy(null);
    }
  }

  if (!manifest) {
    return (
      <section className="border-b border-red-400/30 bg-red-950/20 px-4 py-4" aria-label="Version preview wall">
        <p className="text-xs font-black uppercase text-red-200">Version previews missing</p>
        <h2 className="mt-1 text-xl font-black text-zinc-50">No version preview manifest found.</h2>
      </section>
    );
  }

  return (
    <section className="border-b border-teal-400/20 bg-neutral-950 px-4 py-4" aria-label="Version preview wall">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-teal-300">Version Preview Wall / Live Decision Rail</p>
          <h2 className="mt-1 text-xl font-black text-zinc-50">See the versions before merging them</h2>
          <p className="mt-2 max-w-5xl text-xs font-bold leading-5 text-zinc-400">
            Screenshot cards show the live route families beside source-only recovery material. Command Dash Aeye Evidence and Sally Good SoleDash are separate cards because they are not the same evidence source.
          </p>
        </div>
        <dl className="grid grid-cols-4 gap-2 text-center text-[0.68rem] font-black uppercase">
          <div className="border border-teal-300/40 bg-teal-300/10 px-3 py-2">
            <dt className="text-zinc-500">Versions</dt>
            <dd className="text-teal-100">{manifest.summary.total_versions}</dd>
          </div>
          <div className="border border-cyan-300/40 bg-cyan-300/10 px-3 py-2">
            <dt className="text-zinc-500">Shots</dt>
            <dd className="text-cyan-100">{manifest.summary.live_screenshots}</dd>
          </div>
          <div className="border border-red-300/40 bg-red-300/10 px-3 py-2">
            <dt className="text-zinc-500">Blocked</dt>
            <dd className="text-red-100">{manifest.summary.blocked_runtime}</dd>
          </div>
          <div className="border border-zinc-700 bg-neutral-900 px-3 py-2">
            <dt className="text-zinc-500">Chosen</dt>
            <dd className="text-zinc-100">{selectedCount}</dd>
          </div>
        </dl>
      </div>

      <p className="mt-3 border border-zinc-800 bg-neutral-900 p-2 text-xs font-bold text-zinc-300" role="status">
        {message}
      </p>

      <div className="mt-4 grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
        {manifest.versions.map((version) => {
          const currentDecision = decisions[version.id];
          return (
            <article key={version.id} className="grid gap-3 border border-zinc-800 bg-neutral-900 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[0.66rem] font-black uppercase text-zinc-500">{version.family}</p>
                  <h3 className="mt-1 text-base font-black leading-5 text-zinc-50">{version.title}</h3>
                </div>
                <span className={`border px-2 py-1 text-[0.62rem] font-black uppercase ${statusClass(version.status)}`}>
                  {version.status}
                </span>
              </div>

              {version.image ? (
                <div className="overflow-hidden border border-zinc-800 bg-neutral-950">
                  <img src={version.image} alt={`${version.title} preview`} className="h-56 w-full object-cover object-top" />
                </div>
              ) : (
                <div className="grid h-56 place-items-center border border-zinc-800 bg-neutral-950 p-4 text-center text-xs font-bold text-zinc-500">
                  Source-only candidate. Use the file paths below for merge review.
                </div>
              )}

              <p className="text-xs font-bold leading-5 text-zinc-300">{version.why_it_matters}</p>

              <div className="grid gap-2 md:grid-cols-2">
                <div className="border border-zinc-800 bg-neutral-950 p-2">
                  <p className="text-[0.62rem] font-black uppercase text-zinc-500">Useful parts</p>
                  <ul className="mt-2 grid gap-1 text-xs font-bold text-zinc-300">
                    {version.useful_parts.map((part) => (
                      <li key={part}>{part}</li>
                    ))}
                  </ul>
                </div>
                <div className="border border-zinc-800 bg-neutral-950 p-2">
                  <p className="text-[0.62rem] font-black uppercase text-zinc-500">Boundary</p>
                  <p className="mt-2 text-xs font-bold leading-5 text-zinc-400">{version.honest_boundary}</p>
                </div>
              </div>

              <dl className="grid gap-2 text-[0.68rem]">
                {version.source_url ? (
                  <div>
                    <dt className="font-black uppercase text-zinc-500">Preview URL</dt>
                    <dd className="break-all font-mono text-cyan-200">{version.source_url}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="font-black uppercase text-zinc-500">Source</dt>
                  <dd className="break-all font-mono text-zinc-300">{version.source_path}</dd>
                </div>
                <div>
                  <dt className="font-black uppercase text-zinc-500">Evidence</dt>
                  <dd className="break-all font-mono text-zinc-300">{version.evidence_path}</dd>
                </div>
              </dl>

              <div className="grid gap-2 sm:grid-cols-3">
                {ACTIONS.map((action) => {
                  const selected = currentDecision?.decision === action;
                  return (
                    <button
                      key={action}
                      type="button"
                      onClick={() => void decide(version, action)}
                      disabled={busy !== null}
                      className={`border px-3 py-2 text-[0.68rem] font-black uppercase transition ${
                        selected
                          ? "border-teal-200 bg-teal-200 text-neutral-950"
                          : "border-zinc-700 bg-neutral-950 text-zinc-200 hover:border-teal-300 hover:text-teal-100"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {busy === `${version.id}:${action}` ? "Saving" : actionLabel(action)}
                    </button>
                  );
                })}
              </div>

              {currentDecision ? (
                <p className="break-all border border-teal-400/30 bg-teal-400/10 p-2 font-mono text-[0.66rem] text-teal-100">
                  saved: {actionLabel(currentDecision.decision)} / {currentDecision.receipt_path ?? "receipt pending"}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      <p className="mt-3 break-all font-mono text-[0.66rem] text-zinc-600">generated_at: {manifest.generated_at}</p>
    </section>
  );
}
