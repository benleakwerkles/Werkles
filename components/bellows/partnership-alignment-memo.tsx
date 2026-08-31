"use client";

import { useEffect, useMemo, useState } from "react";

import { partnershipAlignmentTopics } from "@/lib/bellows/operator-library";
import {
  PARTNERSHIP_PREPARATION_CONTEXT_KEY,
  partnershipPreparationContextFrom,
  type PartnershipPreparationContext
} from "@/lib/bellows/partnership-preparation-context";
import {
  storedWerkleOperatingBriefFrom,
  WERKLE_OPERATING_BRIEF_DEVICE_KEY
} from "@/lib/werkle/operating-brief-device";
import type { WerkleOperatingBriefRow } from "@/lib/werkle/operating-brief";

const STORAGE_KEY = "werkles:bellows:partnership-alignment:v1";
const MAX_ANSWER_LENGTH = 800;
const TOPICS = partnershipAlignmentTopics.map(([label, question], index) => ({
  id: `topic-${index + 1}`,
  label,
  question
}));

type Answers = Record<string, string>;

function emptyAnswers(): Answers {
  return Object.fromEntries(TOPICS.map(({ id }) => [id, ""]));
}

function restoredAnswers(value: unknown): Answers | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== TOPICS.length || !TOPICS.every(({ id }) => keys.includes(id))) return null;
  if (!TOPICS.every(({ id }) => typeof record[id] === "string" && (record[id] as string).length <= MAX_ANSWER_LENGTH)) return null;
  return Object.fromEntries(TOPICS.map(({ id }) => [id, record[id] as string]));
}

export function PartnershipAlignmentMemo() {
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [preparationContext, setPreparationContext] = useState<PartnershipPreparationContext | null>(null);
  const [acceptedFormationRows, setAcceptedFormationRows] = useState<readonly WerkleOperatingBriefRow[]>([]);
  const [status, setStatus] = useState("Nothing is saved or shared from this memo.");
  const unanswered = useMemo(
    () => TOPICS.filter(({ id }) => !answers[id]?.trim()).length,
    [answers]
  );
  const copyText = useMemo(() => [
    "PARTNERSHIP ALIGNMENT MEMO — PRIVATE WORKING DRAFT",
    "This is preparation for a conversation and independent professional review. It is not an agreement.",
    "",
    ...TOPICS.flatMap(({ id, label, question }, index) => [
      `${index + 1}. ${label.toUpperCase()}`,
      question,
      `Draft answer: ${answers[id]?.trim() || "Unanswered"}`,
      ""
    ]),
    `${unanswered} of ${TOPICS.length} topics remain unanswered.`,
    "Compare each person's memo. Record differences and unresolved questions before asking independent legal and tax advisers to draft or review anything."
  ].join("\n"), [answers, unanswered]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = restoredAnswers(JSON.parse(raw));
        if (!parsed) {
          setStatus("The saved device draft was invalid and was not restored. Nothing was sent.");
        } else {
          setAnswers(parsed);
          setStatus("Saved preparation memo restored from this device. It was not shared.");
        }
      }
      const rawContext = window.localStorage.getItem(PARTNERSHIP_PREPARATION_CONTEXT_KEY);
      if (rawContext) setPreparationContext(partnershipPreparationContextFrom(JSON.parse(rawContext)));
      const rawBrief = window.localStorage.getItem(WERKLE_OPERATING_BRIEF_DEVICE_KEY);
      if (rawBrief) {
        const storedBrief = storedWerkleOperatingBriefFrom(JSON.parse(rawBrief));
        if (storedBrief) setAcceptedFormationRows(storedBrief.brief.sections.flatMap((section) => section.rows));
      }
    } catch {
      setStatus("The saved device draft could not be read. Nothing was sent.");
    }
  }, []);

  function update(id: string, value: string) {
    setAnswers((current) => ({ ...current, [id]: value }));
    setStatus("Working in this tab. Nothing is saved or shared.");
  }

  function saveDraft() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
      setStatus("Saved on this device. It is not account-saved or shared.");
    } catch {
      setStatus("This browser could not save the draft. Nothing was sent.");
    }
  }

  async function copyMemo() {
    try {
      await navigator.clipboard.writeText(copyText);
      setStatus("Memo copied. Compare answers and unresolved questions; do not treat it as an agreement.");
    } catch {
      setStatus("Clipboard access failed. Your entries remain in this tab only.");
    }
  }

  function clearDraft() {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(PARTNERSHIP_PREPARATION_CONTEXT_KEY);
    setAnswers(emptyAnswers());
    setPreparationContext(null);
    setStatus("Device draft cleared. Nothing was sent.");
  }

  return (
    <section className="alignment-workbook" aria-labelledby="alignmentWorkbookTitle">
      <header className="alignment-workbook__header">
        <div>
          <p className="eyebrow">Private preparation memo</p>
          <h2 id="alignmentWorkbookTitle">Write your answers before you negotiate the answers.</h2>
          <p>Complete this separately, then compare where your facts and expectations differ. Agreement starts with seeing the differences—not hiding them in friendly language.</p>
        </div>
        <output className="alignment-workbook__count" aria-live="polite">
          <strong>{unanswered}</strong>
          <span>{unanswered === 1 ? "question still needs" : "questions still need"} a written answer</span>
        </output>
      </header>

      {preparationContext ? (
        <aside className="alignment-workbook__match-context" aria-label="Practice profile preparation context">
          <p className="eyebrow">From your Match Deck practice</p>
          <h3>Prepare to compare expectations with {preparationContext.displayName}.</h3>
          <p><strong>Practice profile:</strong> {preparationContext.roleLabel}. This is still a synthetic profile—not a real member or introduction.</p>
          <dl>
            <div><dt>They say they can offer</dt><dd>{preparationContext.offers.join(" · ") || "Nothing specific yet"}</dd></div>
            <div><dt>They say they need</dt><dd>{preparationContext.seeks.join(" · ") || "Nothing specific yet"}</dd></div>
            <div><dt>Why Werkles put them here</dt><dd>{preparationContext.fitReasons.join(" · ") || "The ranking reason needs more information"}</dd></div>
            <div><dt>What could make the fit wrong</dt><dd>{preparationContext.fitCautions.join(" · ") || "No specific caution was recorded; fit is still unverified"}</dd></div>
          </dl>
          {preparationContext.practiceExchanges.length ? (
            <section className="alignment-workbook__practice" aria-labelledby="alignment-practice-title">
              <h4 id="alignment-practice-title">Practice questions you already explored</h4>
              <p>These are synthetic answers generated from the practice profile—not statements from a real person and not facts Werkles verified.</p>
              <ol>
                {preparationContext.practiceExchanges.map((exchange) => (
                  <li key={exchange.questionId}>
                    <strong>{exchange.question}</strong>
                    <span>{exchange.answer}</span>
                    <small>{exchange.source}</small>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          <p>Use those statements as questions to examine. Werkles has not verified them and has not filled any answer for you.</p>
        </aside>
      ) : null}

      {acceptedFormationRows.length ? (
        <aside className="alignment-workbook__accepted-context" aria-labelledby="accepted-formation-context-title">
          <div>
            <p className="eyebrow">Already accepted in Formation</p>
            <h3 id="accepted-formation-context-title">Start the conversation from what both people actually wrote.</h3>
            <p>This is accepted wording from the device-local Werkle Operating Brief. It can help you notice the next question, but it does not fill this private memo or become an agreement.</p>
          </div>
          <ul>
            {acceptedFormationRows.map((row) => (
              <li key={`${row.topicId}-${row.revision}`}>
                <strong>{row.label}</strong>
                <span>{row.text}</span>
                {row.adviserReview ? <small>Take the final wording to an independent adviser.</small> : null}
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      <div className="alignment-workbook__fields">
        {TOPICS.map(({ id, label, question }, index) => (
          <label key={id} htmlFor={`alignment-${id}`}>
            <span><strong>{index + 1}. {label}</strong>{question}</span>
            <textarea
              id={`alignment-${id}`}
              rows={4}
              maxLength={MAX_ANSWER_LENGTH}
              value={answers[id] ?? ""}
              onChange={(event) => update(id, event.target.value)}
              placeholder="Write what you currently expect, what is still unknown, and what would change your answer."
            />
          </label>
        ))}
      </div>

      <aside className="alignment-workbook__boundary">
        <strong>This memo is not an agreement.</strong>
        <span>It does not create ownership, authority, duties, or consent. Each person should prepare their own answers and use independent legal and tax advice for the real documents.</span>
      </aside>

      <div className="alignment-workbook__actions">
        <button className="button button-dark" type="button" onClick={saveDraft}>Save on This Device</button>
        <button className="button button-outline" type="button" onClick={copyMemo}>Copy Preparation Memo</button>
        <button className="button button-ghost" type="button" onClick={clearDraft}>Clear Device Draft</button>
        <p role="status">{status}</p>
      </div>
    </section>
  );
}
