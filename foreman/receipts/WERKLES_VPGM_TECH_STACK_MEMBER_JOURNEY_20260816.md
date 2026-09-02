# Werkles VPGM — tech-stack member journey

Date: 2026-08-16  
Foreman / builder: Heimerdinker@Betsy  
Execution context: `CODEX_LOCAL` on Betsy/Windows  
Status: `LOCAL_REVIEWED_SLICE_COMPLETE__NO_PUSH`

## V / CBCC receipts

The newest actual cousin returns remain:

- Bean: `foreman/handoffs/inbox/FROM_BEAN_INTAKE_DUAL_PURPOSE_ACTUAL_CBCC_v0.1.md`
- Ender: `foreman/handoffs/inbox/FROM_ENDER_VPGM_20260816-223710.md`

Bean's narrow-proof and fail-closed rules and Ender's first-contact/plain-language
rules controlled this member-facing structure. No outgoing packet, automated
test, Codex subagent, or invented seat was counted as cousin participation.
There is no newer Lady Jessica, Doozer, Skybro, Computer/Thufir, or Petra
receipt for this cycle.

## G ideas executed

### G1 — Put the whole technology stack into one understandable member journey

Added one four-stage journey to `/dashboard/crucible` covering every current
stack slot exactly once:

1. account and membership — Supabase Auth and Stripe Billing;
2. durable member records — Supabase Postgres and Storage;
3. narrow checks when needed — Stripe Identity, Twilio Verify, and Plaid;
4. separately governed background screening — Checkr.

Each entry says what the service can do, what it cannot establish, where it
belongs in the site, its honest static state, and `productionLive:false`.
Provider names never become trust badges.

### G2 — Make readiness, owner status, and actions visibly different things

The page now routes members to the correct account, membership, profile,
Workshop, or exact verification-card anchor without calling a provider. Static
labels distinguish code paths, foundation-only work, sandbox demonstration,
policy block, and not-connected state. The production-off boundary is visible
beside the journey. Existing member state and action eligibility remain separate
and fail closed.

## M ideas executed

1. Removed first-contact insider copy from this surface: `Runway clearing`,
   `Foundry Dues needed`, `Proof doctrine`, `Run the concierge intake`, and the
   unexplained Squibb instruction. Replaced them with literal descriptions of
   membership, questions, checks, and next moves.
2. Added an executable contract for exact eight-service coverage, frozen
   production-off states, proof boundaries, anchors, and the plain-language
   surface. Re-pulled the actual-CBCC inbox after the build; Bean and Ender are
   still the only current returns.

## Files in this slice

- `lib/crucible-tech-stack-journey.ts`
- `components/crucible/tech-stack-journey.tsx`
- `components/crucible/crucible-panel.tsx`
- `components/crucible/verification-card.tsx`
- `app/dashboard/crucible/page.tsx`
- `app/globals.css`
- `lib/copy.ts`
- `scripts/foreman/crucible-tech-stack-journey-smoke.ts`

## Proof

- `npx.cmd tsx scripts/foreman/crucible-tech-stack-journey-smoke.ts` — PASS
- `npx.cmd tsx scripts/foreman/tech-stack-slot-catalog-smoke.ts` — PASS
- `npx.cmd tsx scripts/foreman/crucible-provider-readiness-smoke.ts` — PASS
- `node scripts/foreman/crucible-provider-readiness-integration-smoke.mjs` — PASS
- `npx.cmd tsx scripts/foreman/operator-tech-stack-diagnostics-smoke.ts` — PASS
- `npx.cmd tsx scripts/foreman/provider-adapter-factory-slots-smoke.ts` — PASS
- `npm.cmd run typecheck` — PASS
- `npm.cmd run build` — PASS; 84/84 static pages generated
- rendered local `/dashboard/crucible` — PASS: all eight services present,
  production-off warning present, removed jargon absent
- scoped `git diff --check` — PASS except expected Windows LF/CRLF notices

## Hard stops preserved

- Production provider runtime remains off.
- Plaid public-token exchange and funds-proof custody remain disabled.
- No provider call, secret read/write, schema, SQL, RLS, spend, staging, commit,
  push, merge, or deploy.
- Member Intake remains browser/session-bound, not durable account custody.
- Lady Jessica remains the only push/deploy seat after all required sign-offs.

