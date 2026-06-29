"use client";

import { FormEvent, useMemo, useState } from "react";

type HumanGate = {
  gate_id: string;
  title: string;
  tier: "TIER_1" | "TIER_2";
  status: string;
  source: string;
  artifact_path: string | null;
  html_path: string | null;
  approval_phrase: string;
  rejection_phrase: string;
  patch_phrase: string;
  confidence: string;
  unknowns: string[];
  blast_radius: string[];
  what_remains_blocked: string[];
};

type HumanGatesClientProps = {
  gates: HumanGate[];
};

function field(form: HTMLFormElement, name: string) {
  const data = new FormData(form);
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export default function HumanGatesClient({ gates }: HumanGatesClientProps) {
  const [latest, setLatest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [decisionGateTitle, setDecisionGateTitle] = useState("");
  const [decisionType, setDecisionType] = useState("APPROVED");
  const [artifactPath, setArtifactPath] = useState("");
  const [classification, setClassification] = useState<string | null>(null);

  const selectedDecisionGate = useMemo(
    () => gates.find((gate) => gate.title === decisionGateTitle) ?? null,
    [decisionGateTitle, gates]
  );
  const expectedPhrase = useMemo(() => {
    if (!selectedDecisionGate) return "Choose a gate to see the expected phrase.";
    if (decisionType === "APPROVED") return selectedDecisionGate.approval_phrase;
    if (decisionType === "REJECTED") return selectedDecisionGate.rejection_phrase;
    if (decisionType === "PATCH_REQUESTED") return `${selectedDecisionGate.patch_phrase} <notes>`;
    return "PAUSE <reason>";
  }, [decisionType, selectedDecisionGate]);

  async function submitGate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setLatest(null);

    try {
      const form = event.currentTarget;
      const response = await fetch("/api/tinkerden/human-gates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_gate",
          title: field(form, "title"),
          tier: field(form, "tier"),
          confidence: field(form, "confidence"),
          confidence_justification: field(form, "confidence_justification"),
          unknowns: field(form, "unknowns"),
          blast_radius: field(form, "blast_radius"),
          files_changed: field(form, "files_changed"),
          systems_affected: field(form, "systems_affected"),
          budget_implications: field(form, "budget_implications"),
          lane_status: field(form, "lane_status"),
          known_risks: field(form, "known_risks"),
          what_remains_blocked: field(form, "what_remains_blocked"),
          approval_phrase: field(form, "approval_phrase"),
          rejection_phrase: field(form, "rejection_phrase"),
          patch_phrase: field(form, "patch_phrase")
        })
      });
      const result = (await response.json()) as { ok?: boolean; error?: string; markdown_path?: string; html_path?: string | null };
      if (!response.ok || !result.ok) throw new Error(result.error || "CREATE_GATE_FAILED");
      setLatest(`Created ${result.markdown_path}${result.html_path ? ` and ${result.html_path}` : ""}`);
      form.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "CREATE_GATE_FAILED");
    } finally {
      setPending(false);
    }
  }

  async function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setLatest(null);

    try {
      const form = event.currentTarget;
      const response = await fetch("/api/tinkerden/human-gates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record_decision",
          gate_name: field(form, "gate_name"),
          gate_artifact_path: field(form, "gate_artifact_path"),
          exact_ben_phrase: field(form, "exact_ben_phrase"),
          decision: field(form, "decision"),
          next_gate: field(form, "next_gate")
        })
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        approval_log_path?: string;
        next_action_path?: string;
        receipt_path?: string;
      };
      if (!response.ok || !result.ok) throw new Error(result.error || "RECORD_DECISION_FAILED");
      setLatest(
        `Recorded durable gate decision in ${result.approval_log_path}; updated ${result.next_action_path}; receipt ${result.receipt_path}`
      );
      setDecisionGateTitle("");
      setDecisionType("APPROVED");
      setArtifactPath("");
      form.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "RECORD_DECISION_FAILED");
    } finally {
      setPending(false);
    }
  }

  async function validateDecision(form: HTMLFormElement) {
    setPending(true);
    setError(null);
    setLatest(null);

    try {
      const response = await fetch("/api/tinkerden/human-gates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate_decision_phrase",
          gate_name: field(form, "gate_name"),
          gate_artifact_path: field(form, "gate_artifact_path"),
          exact_ben_phrase: field(form, "exact_ben_phrase"),
          decision: field(form, "decision"),
          next_gate: field(form, "next_gate")
        })
      });
      const result = (await response.json()) as { ok?: boolean; error?: string; expected_phrase?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "VALIDATE_DECISION_FAILED");
      setLatest(`Phrase validates without mutation. Expected: ${result.expected_phrase}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "VALIDATE_DECISION_FAILED");
    } finally {
      setPending(false);
    }
  }

  async function refreshStaticArtifacts() {
    setPending(true);
    setError(null);
    setLatest(null);
    try {
      const response = await fetch("/api/tinkerden/human-gates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh_all_artifacts" })
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        active_queue_path?: string;
        manifest_path?: string;
        current_gate_review_path?: string;
        health_report_path?: string;
        health_status?: string;
        current_gate_packet_path?: string;
        operator_brief_path?: string;
        agent_handoff_path?: string;
      };
      if (!response.ok || !result.ok) throw new Error(result.error || "REFRESH_ALL_ARTIFACTS_FAILED");
      setLatest(
        `Refreshed ${result.active_queue_path}, ${result.manifest_path}, ${result.current_gate_review_path}, ${result.health_report_path}, ${result.current_gate_packet_path}, ${result.operator_brief_path}, and ${result.agent_handoff_path}. Health: ${result.health_status}`
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "REFRESH_STATIC_ARTIFACTS_FAILED");
    } finally {
      setPending(false);
    }
  }

  async function classifyAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setLatest(null);
    setClassification(null);
    try {
      const form = event.currentTarget;
      const response = await fetch("/api/tinkerden/human-gates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "classify_action",
          action_text: field(form, "action_text"),
          environment: field(form, "environment"),
          lane: field(form, "lane")
        })
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        classification?: string;
        reason?: string;
        stop_required?: boolean;
      };
      if (!response.ok || !result.ok) throw new Error(result.error || "CLASSIFY_ACTION_FAILED");
      setClassification(`${result.classification}: ${result.reason} Stop required: ${result.stop_required ? "yes" : "no"}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "CLASSIFY_ACTION_FAILED");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="td-command-console" aria-label="Active Human Gates actions">
      <header>
        <div>
          <p className="td-bridge__eyebrow">Active controls</p>
          <h3>Create or close a Human Gate</h3>
        </div>
        <strong>local cockpit only</strong>
      </header>

      {latest ? <p className="td-command-console__status td-command-console__status--ok">{latest}</p> : null}
      {error ? <p className="td-command-console__status td-command-console__status--error">BLOCKER: {error}</p> : null}

      <div className="td-command-console__quick-actions">
        <button type="button" disabled={pending} onClick={() => void refreshStaticArtifacts()}>
          REFRESH QUEUE + INDEX + HEALTH + PACKET
        </button>
      </div>

      <form className="td-command-console__form" onSubmit={classifyAction}>
        <label>
          <span>Proposed action classifier</span>
          <textarea name="action_text" required rows={3} placeholder="Describe the action. Example: run local typecheck, push to main, enter Stripe secret..." />
        </label>
        <label>
          <span>Environment</span>
          <input name="environment" defaultValue="local" />
        </label>
        <label>
          <span>Lane</span>
          <input name="lane" placeholder="Doctrine And Cockpit Maintenance" />
        </label>
        <button type="submit" disabled={pending}>
          CLASSIFY ACTION
        </button>
        {classification ? <p className="td-command-console__status td-command-console__status--ok">{classification}</p> : null}
      </form>

      <form className="td-command-console__form" onSubmit={submitGate}>
        <label>
          <span>Gate title</span>
          <input name="title" required placeholder="STRIPE LIVE CHECKOUT GO-LIVE" />
        </label>
        <label>
          <span>Tier</span>
          <select name="tier" defaultValue="TIER_1">
            <option value="TIER_1">Tier 1 - HTML + Markdown</option>
            <option value="TIER_2">Tier 2 - Markdown only</option>
          </select>
        </label>
        <label>
          <span>Confidence</span>
          <select name="confidence" defaultValue="MEDIUM">
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </label>
        <label>
          <span>Confidence justification</span>
          <textarea name="confidence_justification" rows={2} />
        </label>
        <label>
          <span>Unknowns</span>
          <textarea name="unknowns" rows={3} placeholder="- One per line" />
        </label>
        <label>
          <span>Blast radius</span>
          <textarea name="blast_radius" rows={3} placeholder="- Systems, money, deploys, data, doctrine" />
        </label>
        <label>
          <span>Files changed</span>
          <textarea name="files_changed" rows={2} placeholder="foreman/reviews/..." />
        </label>
        <label>
          <span>Systems affected</span>
          <textarea name="systems_affected" rows={2} />
        </label>
        <label>
          <span>Budget / spend implications</span>
          <textarea name="budget_implications" rows={2} />
        </label>
        <label>
          <span>Lane status</span>
          <textarea name="lane_status" rows={2} />
        </label>
        <label>
          <span>Known risks</span>
          <textarea name="known_risks" rows={3} />
        </label>
        <label>
          <span>What remains blocked</span>
          <textarea name="what_remains_blocked" rows={3} />
        </label>
        <label>
          <span>Approval phrase</span>
          <input name="approval_phrase" placeholder="APPROVE ..." />
        </label>
        <label>
          <span>Rejection phrase</span>
          <input name="rejection_phrase" placeholder="REJECT ..." />
        </label>
        <label>
          <span>Patch phrase</span>
          <input name="patch_phrase" placeholder="PATCH ...:" />
        </label>
        <button type="submit" disabled={pending}>
          {pending ? "Writing..." : "CREATE REVIEW ARTIFACT"}
        </button>
      </form>

      <form className="td-command-console__form" onSubmit={submitDecision}>
        <label>
          <span>Gate</span>
          <select
            name="gate_name"
            required
            value={decisionGateTitle}
            onChange={(event) => {
              const nextTitle = event.target.value;
              const nextGate = gates.find((gate) => gate.title === nextTitle) ?? null;
              setDecisionGateTitle(nextTitle);
              setArtifactPath(nextGate?.artifact_path ?? nextGate?.source ?? "");
            }}
          >
            <option value="">Choose active gate</option>
            {gates.map((gate) => (
              <option key={`${gate.gate_id}-${gate.source}`} value={gate.title}>
                {gate.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Artifact path</span>
          <input
            name="gate_artifact_path"
            required
            value={artifactPath}
            onChange={(event) => setArtifactPath(event.target.value)}
            placeholder="foreman/reviews/GATE-..."
          />
        </label>
        <label>
          <span>Decision</span>
          <select name="decision" value={decisionType} onChange={(event) => setDecisionType(event.target.value)}>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="PATCH_REQUESTED">PATCH_REQUESTED</option>
            <option value="PAUSED">PAUSED</option>
          </select>
        </label>
        <p className="td-command-console__status">Expected phrase: {expectedPhrase}</p>
        <label>
          <span>Exact Ben phrase</span>
          <textarea name="exact_ben_phrase" required rows={2} placeholder="Paste only the gate phrase Ben actually gave." />
        </label>
        <label>
          <span>Next gate</span>
          <input name="next_gate" required placeholder="[IN PROGRESS: ...] or [AWAITING HUMAN GATE: ...]" />
        </label>
        <div className="td-command-console__quick-actions">
          <button
            type="button"
            disabled={pending}
            onClick={(event) => {
              const form = event.currentTarget.form;
              if (form) void validateDecision(form);
            }}
          >
            VALIDATE PHRASE ONLY
          </button>
          <button type="submit" disabled={pending}>
            {pending ? "Recording..." : "RECORD BEN PHRASE"}
          </button>
        </div>
      </form>
    </section>
  );
}
