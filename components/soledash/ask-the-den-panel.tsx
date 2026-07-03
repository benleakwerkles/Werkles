"use client";

import {
  SELF_KNOWLEDGE_QUESTIONS,
  type SelfKnowledgeAnswer,
  type SelfKnowledgeQuestionId
} from "@/lib/soledash/self-knowledge/types";
import { useAskTheDen } from "@/lib/soledash/self-knowledge/use-self-knowledge";
import { useEffect, useState, type ReactNode } from "react";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function renderValue(value: unknown, depth = 0): ReactNode {
  if (value === null || value === undefined) {
    return <span className="sd-ask-den__null">—</span>;
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return <span className="sd-ask-den__scalar">{String(value)}</span>;
  }
  if (typeof value === "string") {
    return <span className="sd-ask-den__string">{value || "—"}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="sd-ask-den__null">[]</span>;
    }
    if (depth > 2) {
      return <pre className="sd-ask-den__raw">{JSON.stringify(value, null, 2)}</pre>;
    }
    return (
      <ul className="sd-ask-den__list">
        {value.map((item, index) => (
          <li key={index}>{renderValue(item, depth + 1)}</li>
        ))}
      </ul>
    );
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return <span className="sd-ask-den__null">{"{}"}</span>;
    }
    if (depth > 2) {
      return <pre className="sd-ask-den__raw">{JSON.stringify(value, null, 2)}</pre>;
    }
    return (
      <dl className="sd-ask-den__fields">
        {entries.map(([key, entryValue]) => (
          <div key={key} className="sd-ask-den__field">
            <dt>{key}</dt>
            <dd>{renderValue(entryValue, depth + 1)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return <pre className="sd-ask-den__raw">{JSON.stringify(value, null, 2)}</pre>;
}

function AnswerBody({ answer }: { answer: SelfKnowledgeAnswer }) {
  return (
    <div className="sd-ask-den__answer">
      <p className="sd-ask-den__endpoint">
        <span>Endpoint</span> {answer.endpoint}
      </p>
      {answer.sources.length > 0 ? (
        <p className="sd-ask-den__sources">
          <span>Sources</span> {answer.sources.join(" · ")}
        </p>
      ) : null}
      <div className="sd-ask-den__payload">{renderValue(answer.answer)}</div>
    </div>
  );
}

export function AskTheDenPanel() {
  const [activeId, setActiveId] = useState<SelfKnowledgeQuestionId>("what_are_we_building");
  const { answers, loadingId, error, loadedAt, loadQuestion } = useAskTheDen(activeId);

  const activeAnswer = answers[activeId];
  const panelBusy = loadingId === activeId;

  useEffect(() => {
    void loadQuestion(activeId);
  }, [activeId, loadQuestion]);

  function onSelect(id: SelfKnowledgeQuestionId) {
    setActiveId(id);
  }

  return (
    <section className="sd-ask-den" aria-label="Ask the Den">
      <header className="sd-ask-den__head">
        <h2 className="sd-ask-den__title">Ask the Den</h2>
        <p className="sd-ask-den__lead">
          Dink endpoints only — tap a question; answers are file-backed payloads, not invented summaries.
          {loadedAt ? ` · Updated ${new Date(loadedAt).toLocaleTimeString()}` : null}
        </p>
      </header>

      <div className="sd-ask-den__questions" role="tablist" aria-label="Self-knowledge questions">
        {SELF_KNOWLEDGE_QUESTIONS.map((question) => {
          const isActive = activeId === question.id;
          const isLoading = loadingId === question.id;
          return (
            <button
              key={question.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`sd-ask-den__question ${isActive ? "sd-ask-den__question--active" : ""}`}
              onClick={() => onSelect(question.id)}
            >
              {question.label}
              {isLoading ? " …" : null}
            </button>
          );
        })}
      </div>

      <div className="sd-ask-den__panel" role="tabpanel">
        {error ? <p className="sd-ask-den__error">{error}</p> : null}
        {panelBusy && !activeAnswer ? (
          <p className="sd-ask-den__loading">Fetching from Dink…</p>
        ) : activeAnswer ? (
          <AnswerBody answer={activeAnswer} />
        ) : (
          <p className="sd-ask-den__loading">No endpoint data yet.</p>
        )}
      </div>
    </section>
  );
}
