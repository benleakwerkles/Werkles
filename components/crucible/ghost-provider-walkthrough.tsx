"use client";

import { FormEvent, useState } from "react";

import {
  checkGhostPhoneCode,
  GHOST_PROVIDER_BOUNDARY,
  GHOST_TWILIO_CODE,
  nextGhostFundsState,
  nextGhostIdentityState,
  showGhostPhoneCode,
  type GhostFundsClaim,
  type GhostFundsState,
  type GhostIdentityState,
  type GhostPhoneState
} from "@/lib/ghost-provider-walkthrough";

const identityCopy: Readonly<Record<GhostIdentityState, string>> = Object.freeze({
  idle: "Nothing started.",
  reviewing: "A real identity flow would now ask for consent and provider-managed evidence.",
  completed_not_saved: "Synthetic completion only. No identity result or profile status was created."
});

const phoneCopy: Readonly<Record<GhostPhoneState, string>> = Object.freeze({
  idle: "Nothing started.",
  code_visible: "Enter the on-screen practice code below.",
  incorrect: "That practice code did not match. Nothing was saved.",
  completed_not_saved: "Synthetic completion only. No phone result or profile status was created."
});

const fundsCopy: Readonly<Record<GhostFundsState, string>> = Object.freeze({
  idle: "Nothing started.",
  scope_selected: "One narrow fictional claim is selected. No account or amount has been entered.",
  completed_not_saved: "Synthetic completion only. No bank connection, balance, or funds result was created."
});

export function GhostProviderWalkthrough() {
  const [identityState, setIdentityState] = useState<GhostIdentityState>("idle");
  const [phoneState, setPhoneState] = useState<GhostPhoneState>("idle");
  const [phoneCode, setPhoneCode] = useState("");
  const [fundsState, setFundsState] = useState<GhostFundsState>("idle");
  const [fundsClaim, setFundsClaim] = useState<GhostFundsClaim>("account_control");

  function submitPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPhoneState((current) => checkGhostPhoneCode(current, phoneCode));
  }

  function resetPhone() {
    setPhoneCode("");
    setPhoneState("idle");
  }

  return (
    <section className="ops-card ghost-provider-walkthrough" aria-labelledby="ghost-provider-walkthrough-title">
      <div className="card-heading">
        <p>Practice before you decide</p>
        <h2 id="ghost-provider-walkthrough-title">Try the shape of a check without running one</h2>
      </div>
      <p className="ghost-provider-walkthrough__lead">
        These two exercises teach the handoff and result language. They never contact Stripe or Twilio and cannot
        change anyone&apos;s profile.
      </p>

      <div className="ghost-provider-walkthrough__grid">
        <article data-ghost-provider="stripe_identity">
          <p className="ghost-provider-walkthrough__provider">Stripe Identity · synthetic</p>
          <h3>Practice an identity-check handoff</h3>
          <p>{GHOST_PROVIDER_BOUNDARY.identity}</p>
          <ol>
            <li className={identityState !== "idle" ? "is-reached" : undefined}>Start with a narrow reason for the check.</li>
            <li className={identityState === "reviewing" || identityState === "completed_not_saved" ? "is-reached" : undefined}>
              Review consent and what the provider would inspect.
            </li>
            <li className={identityState === "completed_not_saved" ? "is-reached" : undefined}>
              Return one scoped result—not a trust badge.
            </li>
          </ol>
          <p className="status-line" role="status">{identityCopy[identityState]}</p>
          <div className="ghost-provider-walkthrough__actions">
            {identityState === "idle" ? (
              <button type="button" className="button button-outline" onClick={() => setIdentityState((state) => nextGhostIdentityState(state, "start"))}>
                Start identity practice
              </button>
            ) : identityState === "reviewing" ? (
              <button type="button" className="button button-outline" onClick={() => setIdentityState((state) => nextGhostIdentityState(state, "complete"))}>
                Finish synthetic return
              </button>
            ) : (
              <button type="button" className="button button-outline" onClick={() => setIdentityState((state) => nextGhostIdentityState(state, "reset"))}>
                Reset identity practice
              </button>
            )}
          </div>
        </article>

        <article data-ghost-provider="twilio_verify">
          <p className="ghost-provider-walkthrough__provider">Twilio Verify · synthetic</p>
          <h3>Practice a phone-control check</h3>
          <p>{GHOST_PROVIDER_BOUNDARY.phone}</p>
          {phoneState === "idle" ? (
            <button type="button" className="button button-outline" onClick={() => setPhoneState(showGhostPhoneCode())}>
              Show an on-screen practice code
            </button>
          ) : phoneState === "completed_not_saved" ? (
            <button type="button" className="button button-outline" onClick={resetPhone}>
              Reset phone practice
            </button>
          ) : (
            <form onSubmit={submitPhone}>
              <p className="ghost-provider-walkthrough__code">
                Practice code: <strong>{GHOST_TWILIO_CODE}</strong>
              </p>
              <label>
                <span>Enter the practice code</span>
                <input
                  value={phoneCode}
                  onChange={(event) => setPhoneCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={6}
                />
              </label>
              <button type="submit" className="button button-outline">Check practice code</button>
            </form>
          )}
          <p className="status-line" role="status">{phoneCopy[phoneState]}</p>
        </article>

        <article data-ghost-provider="plaid">
          <p className="ghost-provider-walkthrough__provider">Plaid · synthetic</p>
          <h3>Practice choosing a funds claim</h3>
          <p>{GHOST_PROVIDER_BOUNDARY.funds}</p>
          <ol>
            <li className={fundsState !== "idle" ? "is-reached" : undefined}>Name the one claim that could change a decision.</li>
            <li className={fundsState === "scope_selected" || fundsState === "completed_not_saved" ? "is-reached" : undefined}>Limit the result to selected accounts and a specific date.</li>
            <li className={fundsState === "completed_not_saved" ? "is-reached" : undefined}>Return only that dated result—not a balance or wealth rank.</li>
          </ol>
          {fundsState === "idle" ? (
            <fieldset className="ghost-provider-walkthrough__funds-claim">
              <legend>What would you actually need to establish?</legend>
              <label>
                <input type="radio" name="ghost-funds-claim" checked={fundsClaim === "account_control"} onChange={() => setFundsClaim("account_control")} />
                Control of the selected financial account
              </label>
              <label>
                <input type="radio" name="ghost-funds-claim" checked={fundsClaim === "minimum_funds"} onChange={() => setFundsClaim("minimum_funds")} />
                At least an agreed minimum on a specific date
              </label>
              <button type="button" className="button button-outline" onClick={() => setFundsState((state) => nextGhostFundsState(state, "select_scope"))}>
                Preview This Claim
              </button>
            </fieldset>
          ) : fundsState === "scope_selected" ? (
            <aside className="ghost-provider-walkthrough__funds-preview">
              <strong>{fundsClaim === "account_control" ? "Account-control claim" : "Minimum-funds claim"}</strong>
              <dl>
                <div><dt>Scope</dt><dd>Only accounts the member deliberately selected</dd></div>
                <div><dt>Time</dt><dd>A dated snapshot, not a permanent status</dd></div>
                <div><dt>Werkles keeps</dt><dd>The narrow result and date—not account numbers or balances</dd></div>
              </dl>
              <button type="button" className="button button-outline" onClick={() => setFundsState((state) => nextGhostFundsState(state, "complete"))}>
                Finish Synthetic Return
              </button>
            </aside>
          ) : (
            <button type="button" className="button button-outline" onClick={() => setFundsState((state) => nextGhostFundsState(state, "reset"))}>
              Reset funds practice
            </button>
          )}
          <p className="status-line" role="status">{fundsCopy[fundsState]}</p>
        </article>
      </div>

      <p className="ghost-provider-walkthrough__note" role="note">
        A synthetic completion is not verification, eligibility, safety, or permission to contact someone.
      </p>
    </section>
  );
}
