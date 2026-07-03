"use client";

import type { SelfKnowledgeAnswer, SelfKnowledgeQuestionId } from "./types";
import { useCallback, useRef, useState } from "react";

type SelfKnowledgeResponse = {
  ok: boolean;
  panel?: {
    generated_at: string;
    answers: SelfKnowledgeAnswer[];
  };
  error?: string;
};

export function useAskTheDen(activeId: SelfKnowledgeQuestionId) {
  const [answers, setAnswers] = useState<Partial<Record<SelfKnowledgeQuestionId, SelfKnowledgeAnswer>>>({});
  const [loadingId, setLoadingId] = useState<SelfKnowledgeQuestionId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  const cacheRef = useRef(answers);
  cacheRef.current = answers;

  const loadQuestion = useCallback(async (id: SelfKnowledgeQuestionId) => {
    if (cacheRef.current[id]) return;

    setLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/soledash/v1/self-knowledge?question=${id}`, { cache: "no-store" });
      const data = (await res.json()) as SelfKnowledgeResponse;
      if (!res.ok || !data.ok || !data.panel?.answers[0]) {
        throw new Error(data.error ?? "Self-knowledge fetch failed");
      }
      const answer = data.panel.answers[0];
      setAnswers((prev) => ({ ...prev, [id]: answer }));
      setLoadedAt(data.panel.generated_at);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Self-knowledge fetch failed");
    } finally {
      setLoadingId((current) => (current === id ? null : current));
    }
  }, []);

  return { answers, loadingId, error, loadedAt, loadQuestion, activeId };
}
