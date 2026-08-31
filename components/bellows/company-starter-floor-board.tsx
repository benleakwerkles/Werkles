"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "werkles:bellows:company-starter-floor:v1";
const MAX_NOTES = 600;
const STATUSES = ["unknown", "review", "decided"] as const;
type FloorStatus = (typeof STATUSES)[number];
type FloorRow = Readonly<{ id: string; title: string; prompt: string }>;
type FloorAnswer = { status: FloorStatus; notes: string };
type FloorAnswers = Record<string, FloorAnswer>;

const ROWS: readonly FloorRow[] = Object.freeze([
  Object.freeze({ id: "people-purpose", title: "People and purpose", prompt: "Who owns the business, what will it do, where will it operate, and might outside ownership or investment matter?" }),
  Object.freeze({ id: "state-structure", title: "State-law structure", prompt: "Which structures are available where you operate, and what formation, liability, ownership, annual filing, and registered-agent rules apply?" }),
  Object.freeze({ id: "federal-tax", title: "Federal tax treatment", prompt: "What is the default federal tax treatment, is an election being considered, why, and which eligibility or timing questions need a tax professional?" }),
  Object.freeze({ id: "ownership-pay", title: "Ownership and pay", prompt: "How will contributions, ownership, wages or fees, reimbursements, and distributions stay distinct in records and agreements?" }),
  Object.freeze({ id: "operating-floor", title: "Operating floor", prompt: "Which name, registration, tax ID, license, permit, bank, bookkeeping, contract, and insurance steps actually apply before taking money?" }),
  Object.freeze({ id: "professional-handoff", title: "Professional handoff", prompt: "Which questions need a state filing office, attorney, accountant, tax adviser, insurer, or licensing authority—and what source or deadline will you bring?" })
]);

function emptyAnswers(): FloorAnswers {
  return Object.fromEntries(ROWS.map(({ id }) => [id, { status: "unknown", notes: "" }])) as FloorAnswers;
}

function restoreAnswers(value: unknown): FloorAnswers | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== ROWS.length || !ROWS.every(({ id }) => id in record)) return null;
  const entries = ROWS.map(({ id }) => {
    const answer = record[id];
    if (!answer || typeof answer !== "object" || Array.isArray(answer)) return null;
    const row = answer as Record<string, unknown>;
    if (Object.keys(row).length !== 2 || !STATUSES.includes(row.status as FloorStatus)) return null;
    if (typeof row.notes !== "string" || row.notes.length > MAX_NOTES) return null;
    return [id, { status: row.status as FloorStatus, notes: row.notes }] as const;
  });
  if (entries.some((entry) => entry === null)) return null;
  return Object.fromEntries(entries as Array<readonly [string, FloorAnswer]>);
}

const STATUS_LABEL: Record<FloorStatus, string> = {
  unknown: "Unknown",
  review: "Needs professional review",
  decided: "Decided — record the source"
};

export function CompanyStarterFloorBoard() {
  const [answers, setAnswers] = useState<FloorAnswers>(emptyAnswers);
  const [status, setStatus] = useState("Nothing is saved or sent from this board.");
  const openCount = useMemo(() => ROWS.filter(({ id }) => answers[id]?.status !== "decided").length, [answers]);
  const copyText = useMemo(() => [
    "COMPANY STARTER FLOOR — WORKING BOARD",
    "Planning aid only. Confirm state, legal, tax, licensing, and insurance decisions with the right authoritative source or independent professional.",
    "",
    ...ROWS.flatMap(({ id, title, prompt }, index) => [
      `${index + 1}. ${title.toUpperCase()} — ${STATUS_LABEL[answers[id]?.status ?? "unknown"]}`,
      prompt,
      `Notes / source / deadline: ${answers[id]?.notes.trim() || "Not recorded"}`,
      ""
    ]),
    `${openCount} of ${ROWS.length} areas are not yet marked decided.`
  ].join("\n"), [answers, openCount]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const restored = restoreAnswers(JSON.parse(raw));
      if (!restored) {
        setStatus("The saved device board was invalid and was not restored. Nothing was sent.");
        return;
      }
      setAnswers(restored);
      setStatus("Saved launch board restored from this device. It was not shared.");
    } catch {
      setStatus("The saved device board could not be read. Nothing was sent.");
    }
  }, []);

  function update(id: string, patch: Partial<FloorAnswer>) {
    setAnswers((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
    setStatus("Working in this tab. Nothing is saved or sent.");
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
      setStatus("Saved on this device. It is not account-saved or shared.");
    } catch {
      setStatus("This browser could not save the board. Nothing was sent.");
    }
  }

  async function copyBoard() {
    try {
      await navigator.clipboard.writeText(copyText);
      setStatus("Launch board copied. Recheck every decision against the current rule and source that applies to you.");
    } catch {
      setStatus("Clipboard access failed. Your work remains in this tab only.");
    }
  }

  function clear() {
    window.localStorage.removeItem(STORAGE_KEY);
    setAnswers(emptyAnswers());
    setStatus("Device board cleared. Nothing was sent.");
  }

  return (
    <section className="launch-floor" aria-labelledby="launchFloorTitle">
      <header className="launch-floor__header">
        <div><p className="eyebrow">Reusable work product</p><h2 id="launchFloorTitle">Build the floor before you file the paperwork.</h2><p>Separate what you have decided from what still needs a current source or the right professional. A filing is one step; it is not the whole operating foundation.</p></div>
        <output className="launch-floor__count" aria-live="polite"><strong>{openCount}</strong><span>areas still open or awaiting review</span></output>
      </header>

      <aside className="launch-floor__plain-language">
        <h3>LLC and S corporation answer different questions.</h3>
        <p>An LLC is formed under state law. Its federal tax treatment can vary with its owners and elections. S corporation status is a federal tax election available only when the entity and owners qualify; it is not simply another name for an LLC.</p>
        <div className="launch-floor__sources">
          <a href="https://www.sba.gov/business-guide/launch-your-business/choose-business-structure" target="_blank" rel="noreferrer">Compare structures at the SBA</a>
          <a href="https://www.irs.gov/faqs/small-business-self-employed-other-business/entities/entities-3" target="_blank" rel="noreferrer">See IRS LLC classifications</a>
          <a href="https://www.irs.gov/businesses/small-businesses-self-employed/s-corporations" target="_blank" rel="noreferrer">See IRS S corporation rules</a>
        </div>
        <p><strong>Do not choose from that paragraph alone.</strong> State rules, ownership, payroll, profit, funding plans, timing, and professional costs can change the answer.</p>
      </aside>

      <div className="launch-floor__rows">
        {ROWS.map(({ id, title, prompt }, index) => (
          <fieldset key={id}>
            <legend>{index + 1}. {title}</legend>
            <p>{prompt}</p>
            <label>Status
              <select value={answers[id]?.status ?? "unknown"} onChange={(event) => update(id, { status: event.target.value as FloorStatus })}>
                {STATUSES.map((value) => <option value={value} key={value}>{STATUS_LABEL[value]}</option>)}
              </select>
            </label>
            <label>Notes, source, responsible person, or deadline
              <textarea rows={4} maxLength={MAX_NOTES} value={answers[id]?.notes ?? ""} onChange={(event) => update(id, { notes: event.target.value })} placeholder="Write what is known, who will confirm it, the source checked, and the date it matters." />
            </label>
          </fieldset>
        ))}
      </div>

      <div className="launch-floor__actions">
        <button className="button button-dark" type="button" onClick={save}>Save on This Device</button>
        <button className="button button-outline" type="button" onClick={copyBoard}>Copy Launch Board</button>
        <button className="button button-ghost" type="button" onClick={clear}>Clear Device Board</button>
        <p role="status">{status}</p>
      </div>
    </section>
  );
}
