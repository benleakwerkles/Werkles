"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { recommendationSolutionPath } from "@/lib/squibb/recommendation-solution-path";
import {
  normalizeRecommendationDraft,
  parseRecommendationDraft,
  RECOMMENDATION_DRAFT_MAX_FIELD_LENGTH,
  recommendationDraftStorageKey
} from "@/lib/squibb/recommendation-device-drafts";
import { bellowsDeviceArtifactForHref } from "@/lib/bellows/device-artifact-catalog";
import {
  buildMemberRecommendationPlan,
  type MemberRecommendationFact
} from "@/lib/squibb/member-recommendation-plan";
import type { RecommendationKind } from "@/lib/squibb/recommendations";

type RecommendationWorkPathProps = {
  kind: RecommendationKind;
  title: string;
  intakeFacts?: readonly MemberRecommendationFact[];
};

export function RecommendationWorkPath({ kind, title, intakeFacts = [] }: RecommendationWorkPathProps) {
  const path = recommendationSolutionPath(kind);
  const lessonArtifact = bellowsDeviceArtifactForHref(path.bellows.href);
  const plan = useMemo(() => buildMemberRecommendationPlan(kind, intakeFacts), [intakeFacts, kind]);
  const storageKey = recommendationDraftStorageKey(kind);
  const [draft, setDraft] = useState<Record<string, string>>(() => ({ ...plan.artifactDraft }));
  const [status, setStatus] = useState(
    plan.tailored
      ? "Werkles drafted a starting point from your answers. Correct every line before relying on it."
      : "Not saved. Add the missing Intake detail before treating this as a personal plan."
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) {
        setDraft({ ...plan.artifactDraft });
        return;
      }
      const restored = parseRecommendationDraft(kind, saved);
      if (!restored) throw new Error("Malformed device draft");
      setDraft(restored);
      setStatus("Restored from this device. It is not saved to your Werkles account or shared with anyone.");
    } catch {
      setStatus("A previous browser draft could not be restored. Start a fresh working draft below.");
    }
  }, [path, plan, storageKey]);

  const artifactText = useMemo(
    () => [
      "GENERAL EDUCATIONAL PLANNING DRAFT",
      "Member-authored and not independently verified. Not legal, tax, accounting, lending, investment, or other professional advice.",
      "",
      path.artifact.title,
      "",
      ...path.artifact.fields.map((item) => `${item.label}: ${draft[item.id]?.trim() || "Not filled yet"}`),
      "",
      "Prepared with Werkles. Review every statement and source before sharing or relying on it."
    ].join("\n"),
    [draft, path]
  );

  function saveDraft() {
    try {
      const normalized = normalizeRecommendationDraft(kind, draft);
      if (!normalized) throw new Error("Invalid device draft");
      window.localStorage.setItem(storageKey, JSON.stringify(normalized));
      setStatus("Saved on this device. It is not saved to your Werkles account or shared with anyone.");
    } catch {
      setStatus("This browser blocked the save. Your draft is still visible on this page.");
    }
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(artifactText);
      setStatus("Working draft copied. Review it before you share or rely on it.");
    } catch {
      setStatus("Copy was blocked. You can still select the working draft below.");
    }
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // State still clears even when browser storage is unavailable.
    }
    setDraft({});
    setStatus("Draft cleared from this device.");
  }

  return (
    <section className="squibb-work-path" aria-labelledby="squibbWorkPathTitle">
      <header className="squibb-work-path__hero">
        <div>
          <p className="eyebrow">Turn the idea into useful work</p>
          <h3 id="squibbWorkPathTitle">Build your {path.artifact.title.toLowerCase()}</h3>
          <p>{path.outcome}</p>
        </div>
        <span className="squibb-work-path__stamp">Werkles playbook</span>
      </header>

      <section className="squibb-work-path__decision" aria-labelledby="squibbDecisionPlanTitle">
        <div className="squibb-work-path__decision-copy">
          <p className="eyebrow">Werkles&apos;s first move</p>
          <h4 id="squibbDecisionPlanTitle">{plan.title}</h4>
          <p>{plan.verdict}</p>
        </div>
        <div className="squibb-work-path__decision-why">
          <strong>Why this—not the whole option catalog</strong>
          <ul>{plan.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </div>
        {plan.sprint.length > 0 ? (
          <ol className="squibb-work-path__sprint" aria-label="Recommended work sprint">
            {plan.sprint.map((step, index) => (
              <li key={step.title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.action}</p>
                  <small>Leave with: {step.output}</small>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
        <p className="squibb-work-path__finish"><strong>Done when:</strong> {plan.finishLine}</p>
      </section>

      <details className="squibb-work-path__general">
        <summary>Open the general playbook: {title}</summary>
        <ol className="squibb-work-path__steps" aria-label={`${title} playbook`}>
          {path.playbook.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </details>

      <div className="squibb-work-path__workspace">
        <div className="squibb-work-path__form">
          <div>
            <p className="eyebrow">Finish the working draft</p>
            <h4>{path.artifact.title}</h4>
            <p>{path.artifact.description}</p>
          </div>
          {path.artifact.fields.map((item) => (
            <label key={item.id}>
              <span>{item.label}</span>
              <textarea
                rows={3}
                maxLength={RECOMMENDATION_DRAFT_MAX_FIELD_LENGTH}
                value={draft[item.id] ?? ""}
                placeholder={item.placeholder}
                onChange={(event) => setDraft((current) => ({ ...current, [item.id]: event.target.value }))}
              />
            </label>
          ))}
          <div className="squibb-work-path__actions">
            <button type="button" onClick={saveDraft}>Save on this device</button>
            <button type="button" className="squibb-work-path__copy" onClick={copyDraft}>Copy Draft to Clipboard</button>
            <button type="button" className="squibb-work-path__clear" onClick={clearDraft}>Clear this draft</button>
          </div>
          <p className="squibb-work-path__action-note">
            Copying puts this three-field draft on your clipboard so you can paste it into notes, email, a document,
            or another Werkles field. It does not save, send, or attach anything.
          </p>
          <p className="squibb-work-path__status" role="status">{status}</p>
        </div>

        <aside className="squibb-work-path__artifact" aria-label={`${path.artifact.title} preview`}>
          <p className="squibb-work-path__artifact-boundary">
            General educational planning draft. Member-authored and not independently verified.
          </p>
          <p className="eyebrow">Your working draft</p>
          <h4>{path.artifact.title}</h4>
          <dl>
            {path.artifact.fields.map((item) => (
              <div key={item.id}>
                <dt>{item.label}</dt>
                <dd>{draft[item.id]?.trim() || "Not filled yet"}</dd>
              </div>
            ))}
          </dl>
          <p>Not legal, tax, accounting, lending, investment, or other professional advice.</p>
        </aside>
      </div>

      <div className="squibb-work-path__bridges">
        <article className="squibb-work-path__bridge squibb-work-path__bridge--bellows">
          <p className="eyebrow">Your Personal Bellows lesson</p>
          <h4>{path.bellows.title}</h4>
          <p>{path.bellows.description}</p>
          <p className="squibb-work-path__bridge-note">
            Keep your current working read beside the deeper lesson and its full work product. This three-field draft stays separate and device-only.
          </p>
          <Link href={lessonArtifact?.personalHref ?? path.bellows.href}>Open My Bellows Lesson →</Link>
          {lessonArtifact ? <Link href={path.bellows.href}>Open Public Version →</Link> : null}
        </article>
        <article className="squibb-work-path__bridge squibb-work-path__bridge--compare">
          <p className="eyebrow">Nearest and best—when evidence exists</p>
          <h4>{path.comparison.title}</h4>
          <ul>
            {path.comparison.criteria.map((criterion) => <li key={criterion}>{criterion}</li>)}
          </ul>
          <p className="squibb-work-path__disclosure">{path.comparison.disclosure}</p>
        </article>
      </div>
    </section>
  );
}
