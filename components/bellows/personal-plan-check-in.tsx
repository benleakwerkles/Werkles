"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  createPersonalPlanCheckIn,
  PERSONAL_PLAN_CHECK_IN_CHOICES,
  PERSONAL_PLAN_CHECK_IN_DESTINATIONS,
  PERSONAL_PLAN_CHECK_IN_KEY,
  PERSONAL_PLAN_CHECK_IN_LABELS,
  storedPersonalPlanCheckInFrom,
  type PersonalPlanCheckInChoice,
  type StoredPersonalPlanCheckIn
} from "@/lib/bellows/personal-plan-check-in";

export function PersonalPlanCheckIn() {
  const [choice, setChoice] = useState<PersonalPlanCheckInChoice>("keep_working");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState<StoredPersonalPlanCheckIn | null>(null);
  const [status, setStatus] = useState("Nothing saved yet.");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PERSONAL_PLAN_CHECK_IN_KEY);
      const stored = raw ? storedPersonalPlanCheckInFrom(JSON.parse(raw)) : null;
      if (!stored) return;
      setSaved(stored);
      setChoice(stored.choice);
      setNote(stored.note);
      setStatus("Your last check-in is ready to review on this device.");
    } catch {
      setStatus("This browser could not read a previous check-in.");
    }
  }, []);

  function saveCheckIn() {
    try {
      const next = createPersonalPlanCheckIn(choice, note);
      window.localStorage.setItem(PERSONAL_PLAN_CHECK_IN_KEY, JSON.stringify(next));
      setSaved(next);
      setStatus("Saved on this device. Nothing was sent or used to change your matches.");
    } catch {
      setStatus("This browser could not save the check-in. Nothing was sent.");
    }
  }

  function clearCheckIn() {
    try {
      window.localStorage.removeItem(PERSONAL_PLAN_CHECK_IN_KEY);
    } catch {
      // State still clears even when device storage is unavailable.
    }
    setChoice("keep_working");
    setNote("");
    setSaved(null);
    setStatus("Check-in cleared from this device.");
  }

  const destination = PERSONAL_PLAN_CHECK_IN_DESTINATIONS[saved?.choice ?? choice];

  return (
    <section className="bellows-plan-check-in" aria-labelledby="bellowsPlanCheckInTitle">
      <div className="bellows-plan-check-in__heading">
        <div>
          <p className="eyebrow">Return when something changes</p>
          <h2 id="bellowsPlanCheckInTitle">What is different since your last pass?</h2>
        </div>
        <p>
          Werkles does not watch your clicks or infer progress. Tell it what changed, keep that note on this device,
          and choose the right next room deliberately.
        </p>
      </div>

      <fieldset>
        <legend>Which statement is true now?</legend>
        <div className="bellows-plan-check-in__choices">
          {PERSONAL_PLAN_CHECK_IN_CHOICES.map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="personal-plan-check-in"
                value={value}
                checked={choice === value}
                onChange={() => setChoice(value)}
              />
              <span>{PERSONAL_PLAN_CHECK_IN_LABELS[value]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="bellows-plan-check-in__note">
        <span>What changed? <small>Optional · 800 characters</small></span>
        <textarea
          value={note}
          maxLength={800}
          rows={4}
          placeholder="For example: The first customer test worked, but delivery takes twice as long as expected."
          onChange={(event) => setNote(event.target.value)}
        />
        <small>{note.length} / 800</small>
      </label>

      <div className="bellows-plan-check-in__actions">
        <button className="button button-dark" type="button" onClick={saveCheckIn}>Save This Check-In</button>
        {saved ? <button className="button button-outline" type="button" onClick={clearCheckIn}>Clear It</button> : null}
      </div>
      <p role="status">{status}</p>

      {saved ? (
        <aside className="bellows-plan-check-in__result" aria-labelledby="bellowsPlanCheckInResultTitle">
          <div>
            <p className="eyebrow">Your next useful room</p>
            <h3 id="bellowsPlanCheckInResultTitle">{PERSONAL_PLAN_CHECK_IN_LABELS[saved.choice]}</h3>
            {saved.note ? <p><strong>Your note:</strong> {saved.note}</p> : null}
            <p>{destination.explanation}</p>
            <small>Saved {new Date(saved.savedAt).toLocaleString()} on this device.</small>
          </div>
          <Link className="button button-dark" href={destination.href}>{destination.label}</Link>
        </aside>
      ) : null}
    </section>
  );
}
