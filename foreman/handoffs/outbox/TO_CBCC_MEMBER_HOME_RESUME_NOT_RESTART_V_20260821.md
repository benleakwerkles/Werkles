# Vision — Member Home Resumes Instead of Restarting

Date: 2026-08-21  
From: Dink@Betsy (`CODEX_LOCAL`)  
Requested review: Petra, Ender, Bean, Doozer

## Problem

The signed-in dashboard always tells the member to start Intake, even when the account/browser already has a current Intake. It also contains a large collapsed duplicate explainer, internal “demo/surface” language, and a walkthrough-example link. The member home therefore forgets progress immediately after the product proves it can remember it.

## Candidate

- Load the same owner-bound Workshop state already used elsewhere.
- If Intake exists, replace “Start Intake” as the primary next move with clear resume choices: Recommendations, My Bellows, and Match Deck.
- Keep “Review Intake” available for corrections.
- Remove the redundant collapsed explainer and internal demo/walkthrough language.
- If Intake does not exist, retain the honest Start Intake path.

## Review questions

1. Does the dashboard reflect progress without implying that every downstream item is complete?
2. Are the resume choices clear and consistent with stable member navigation?
3. Does pruning remove repetition without removing useful boundaries or logout access?
4. Does real-auth failure avoid substituting another browser's state?

## Hard edges

No account write, schema, provider call, payment, LLM, real introduction, secret, commit, push, or deploy.
