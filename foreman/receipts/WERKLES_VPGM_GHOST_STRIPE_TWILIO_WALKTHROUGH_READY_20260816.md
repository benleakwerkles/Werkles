# Werkles VPGM — ghost Stripe + Twilio walkthrough ready

Date: 2026-08-16  
Foreman / builder: Heimerdinker@Betsy  
Execution context: `CODEX_LOCAL` on Betsy/Windows  
Status: `PRIMARY_LOCAL_WALKTHROUGH_READY__POST_BUILD_CBCC_REVIEW_PENDING__NO_PUSH`

## V / P

Vision packet:
`foreman/handoffs/outbox/HEIMERDINKER_V_GHOST_STRIPE_TWILIO_WALKTHROUGH_20260816.md`.

Actual CBCC guidance used:

- Ender: `foreman/handoffs/inbox/FROM_ENDER_VPGM_20260816-223710.md`
- Bean: `foreman/handoffs/inbox/FROM_BEAN_INTAKE_DUAL_PURPOSE_ACTUAL_CBCC_v0.1.md`

Ender's first-contact and visible-causality rules controlled the interaction.
Bean's fail-closed, narrow-claim, unknown-preservation, and custody rules
controlled the synthetic boundary. No outgoing packet or automated test was
counted as cousin participation.

Post-build actual-CBCC review request:
`foreman/handoffs/outbox/TO_CBCC_GHOST_STRIPE_TWILIO_WALKTHROUGH_REVIEW_20260816.md`.
No new terminal cousin receipt appeared in the final pull.

## G ideas executed

### G1 — Stripe Identity practice without identity data

Added a three-state offline exercise: start with a narrow reason, explain
consent/provider-managed evidence, then show a synthetic completion-not-saved.
It accepts no document, selfie, name, birth date, or other identity data.

### G2 — Twilio Verify practice without a phone or SMS

Added an on-screen fixed practice code with incorrect and correct states. No
phone number is collected, Twilio sends no message, and no result is persisted.

## M ideas executed

1. Integrated both exercises only into the Ghost Fleet read-only Crucible path;
   real provider cards remain disabled without an eligible signed-in member.
2. Closed two primary-walkthrough route defects: Intros now uses the same
   server-decided Ghost/auth boundary as Crucible, and enabled actions without a
   destination fail closed instead of producing a dead `#` link.

## Proof

- `npx.cmd tsx scripts/foreman/ghost-provider-walkthrough-smoke.ts` — PASS
- `node scripts/foreman/member-walkthrough-route-inventory-smoke.mjs` — PASS;
  93 UI links, 8 model links, 17 destinations; one remaining finding belongs to
  the internal `/bellows/recommendations/test-case-0` worked example, not the
  primary member walkthrough
- `npx.cmd tsx scripts/foreman/ghost-fleet-playable-loop-smoke.ts` — PASS
- `npx.cmd tsx scripts/foreman/member-data-custody-smoke.ts` — PASS
- `npx.cmd tsx scripts/foreman/crucible-tech-stack-journey-smoke.ts` — PASS
- `npm.cmd run typecheck` — PASS
- `npm.cmd run build` — PASS; 84/84 static pages generated
- local HTTP primary route sweep — 7/7 returned 200
- Crucible HTTP — synthetic Stripe and Twilio controls and no-provider boundary
  present
- scoped `git diff --check` — PASS except expected Windows LF/CRLF notices

## Walkthrough order

1. `/bellows/intake`
2. `/dashboard/blueprints`
3. `/bellows/recommendations`
4. `/dashboard/intros`
5. `/dashboard/crucible` — run both Ghost provider practices here
6. `/dashboard/profile`
7. `/membership`

Base: `http://127.0.0.1:3000`

## Hard stops preserved

- No Chrome/browser-control use.
- No Codex subagents or new execution environments.
- No Stripe/Twilio/Plaid/Checkr call, SMS, identity upload, secret, spend,
  account action, persistence, profile status write, SQL/schema/RLS, staging,
  commit, push, merge, deploy, or production mutation.
- Production providers remain off.
- Actual post-build cousin review and Lady Jessica seal remain pending.

