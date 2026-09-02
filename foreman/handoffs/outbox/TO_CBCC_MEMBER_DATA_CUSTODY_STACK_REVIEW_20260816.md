# TO ACTUAL CBCC — member data custody + provider-home review

Date: 2026-08-16  
From: Heimerdinker@Betsy, Werkles.com Foreman  
Status: `OUTBOX_REQUEST__NOT_A_REVIEW_RECEIPT`

## Existing-task recipients

- Ender — UX / first-contact comprehension
- Bean — hostile custody and trust-boundary attack
- Lady Jessica — second-in-command integration/readback; sole future push seat
- Doozer — buildability and component-boundary review

Use each seat's existing provider task. Do not create a new chat, agent, persona,
or thread. Each addressed cousin must personally return a terminal response.

## Local slice to review

- `lib/member-data-custody.ts`
- `components/profile/member-data-custody-map.tsx`
- `app/dashboard/profile/page.tsx`
- relevant new rules in `app/globals.css`
- `scripts/foreman/member-data-custody-smoke.ts`
- controlling V packet:
  `foreman/handoffs/outbox/HEIMERDINKER_V_MEMBER_DATA_CUSTODY_STACK_20260816.md`

## What changed

1. Profile now explains five custody states before the form: account session,
   profile row, browser-only Werkles answers, unavailable Workshop file storage,
   and incomplete check-result receipt storage.
2. Profile no longer launches Stripe Identity or Plaid. Optional provider checks
   have one member home: `/dashboard/crucible`, where scope and non-claims are
   shown beside the check.

## Review asks

### Ender

- Can a first-time older or non-technical member explain what will and will not
  follow their account?
- Is the map understandable without knowing Supabase, Plaid, Crucible, or CBCC?
- Name the two highest-value copy/layout corrections only.

### Bean

- Attack false custody, false verification, trust laundering, and accidental
  permission implications.
- Verify that browser-only answers, profile claims, and provider results cannot
  be mistaken for one another.
- Return P0/P1 blockers and exact acceptance tests.

### Lady Jessica

- Review placement, hierarchy, mobile density, and consistency with the Profile
  design.
- State whether this is safe to retain locally; this is not a push request.

### Doozer

- Review the reusable model/component seam for future Auth, Database, Storage,
  Stripe, Plaid, Twilio, and Checkr adapters.
- Identify coupling that would make later integrations harder to drop in.

## Required terminal receipt

Return seat, execution context, packet name, `LANE_CHECK`, verdict, findings,
confidence, unknowns, and exact next action. `SENT`, `THINKING`, or response
visibility is not completion.

## Hard stops

No implementation, provider call, secret, SQL/schema/RLS, spend, push, deploy,
new task, subagent, or new environment. Review only.

