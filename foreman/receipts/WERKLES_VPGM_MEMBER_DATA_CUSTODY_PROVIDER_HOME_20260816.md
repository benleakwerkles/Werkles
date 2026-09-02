# Werkles VPGM — member data custody + provider home

Date: 2026-08-16  
Foreman / builder: Heimerdinker@Betsy  
Execution context: `CODEX_LOCAL` on Betsy/Windows  
Status: `LOCAL_ACTUAL_CBCC_GUIDED_SLICE_COMPLETE__REVIEW_REQUEST_PENDING__NO_PUSH`

## V / P

Vision packet:
`foreman/handoffs/outbox/HEIMERDINKER_V_MEMBER_DATA_CUSTODY_STACK_20260816.md`.

Actual CBCC inputs used:

- Ender: `foreman/handoffs/inbox/FROM_ENDER_VPGM_20260816-223710.md`
- Bean: `foreman/handoffs/inbox/FROM_BEAN_INTAKE_DUAL_PURPOSE_ACTUAL_CBCC_v0.1.md`

Ender's first-contact, mother-test, and do-not-claim-saving rules controlled the
language. Bean's session/account custody, unknown-preservation, and narrow-proof
rules controlled the boundaries. No internal worker, outgoing packet, or test
was counted as CBCC participation.

The post-build review request is:
`foreman/handoffs/outbox/TO_CBCC_MEMBER_DATA_CUSTODY_STACK_REVIEW_20260816.md`.
It is not delivered/answered evidence. The final re-pull found no newer actual
CBCC receipt.

## G ideas executed

### G1 — Explain custody before asking for profile information

Added a reusable frozen five-record map covering sign-in session,
account-owned profile row, browser-only Werkles answers, unavailable Workshop
file storage, and partial check-status storage without the full receipt
lifecycle. The Profile page renders the map before its form. Each record says
where it lives, its honest state, and what that state does not establish.

### G2 — Give provider checks one member-facing home

Removed direct Stripe Identity/Plaid launch behavior from Profile. Profile now
stores member-authored claims only. Optional checks link to Crucible, where each
check's capability and limitation are shown. This removes duplicate provider
entry points and preserves one future adapter landing place.

## M ideas executed

1. Replaced touched Profile support copy such as `Proof doctrine` and `Foundry
   Dues` with ordinary descriptions of checks and membership.
2. Added a hostile static contract proving exact custody coverage, frozen
   records, browser-only truth, unavailable file storage, incomplete receipt
   lifecycle, and absence of Profile provider calls.

## Files

- `lib/member-data-custody.ts`
- `components/profile/member-data-custody-map.tsx`
- `app/dashboard/profile/page.tsx`
- `app/globals.css`
- `scripts/foreman/member-data-custody-smoke.ts`
- the two outbox packets named above

## Proof

- `npx.cmd tsx scripts/foreman/member-data-custody-smoke.ts` — PASS
- `npm.cmd run typecheck` — PASS
- `npm.cmd run build` — PASS; 84/84 static pages generated
- local HTTP `/dashboard/profile` — 200; custody map, browser-only warning,
  production-off note, no-provider-launch copy, and Crucible link present
- scoped `git diff --check` — PASS except expected Windows LF/CRLF notices

## Hard stops preserved

- No Chrome/browser-control use after Ben closed Chrome.
- No Codex subagents or new execution environments.
- No provider calls, secret access, spend, account action, schema, SQL, RLS,
  staging, commit, push, merge, deploy, or production mutation.
- Production provider runtime stays off.
- Current Intake answers remain browser/session-bound, not account custody.
- Post-build actual CBCC review and Lady Jessica seal remain pending.

