# Vision — Partnership Alignment Memo

Date: 2026-08-21  
Lane: Werkles / Public and Personal Bellows  
Executor: Dink@Betsy, local hands  
Review requested from: Petra and Doozer

## Product problem

The Partnership Alignment Bellows lesson currently explains ten decisions that prospective partners should discuss, but it leaves the member with prose instead of a usable artifact. A valuable Bellows lesson should help people prepare a concrete handoff without pretending Werkles drafted an agreement or supplied legal advice.

## Candidate

Add a private preparation memo directly to the `partnership-alignment` lesson:

- one response field for each of the ten canonical alignment topics;
- a live count of unanswered topics;
- explicit, validated device-only save and restore;
- a copyable memo for comparison with another person or handoff to independent counsel;
- plain boundaries that it is not an agreement, not shared automatically, and not saved to the member account.

## Hard edges

- No production, schema, provider, secret, payment, deploy, push, or account-setting action.
- No claim that two people agree merely because one person filled out the memo.
- No legal or tax conclusion.
- No automatic sharing or account-custody claim.
- Preserve the dirty shared worktree and existing member route behavior.

## Verification

Run a source smoke, TypeScript, diff checks, and a local browser save/reload/clear walkthrough. Return an implementation receipt and an exact-source review packet; do not claim Petra or Doozer reviewed it until a real return arrives.
