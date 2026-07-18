# Flock Packet — Werkles Signup Return Continuity VPG20

Packet ID: `TO_HEIMERDINKER_DOOZER_THUFIR_BEAN_WERKLES_SIGNUP_RETURN_CONTINUITY_VPG20_20260718`

Status: `OPEN`

Addressed seats: Heimerdinker / Dink@Betsy; Doozer@Betsy; Thufir@Betsy; Bean@Betsy

Execution, verification, commit, and isolated branch-push owner: Heimerdinker / Dink@Betsy

Repository: `benleakwerkles/Werkles`

Branch: `codex/werkles-full-flock-vpg20-20260718`

Starting source: `70a35fe53b78203e5b064e5a4743eea001702a94`

Operator authorization: `V, P, G`

## Current Truth

- VPG19 introduced an exact allowlist for `/dashboard`, `/dashboard/profile`, and `/bellows/recommendations` and applied it to login and Profile Builder.
- Login drops that sanitized destination on all three Create Account links.
- Signup ignores `next`, sends confirmation to a bare callback, and sends immediate sessions to bare onboarding.
- Auth callback always sends successful confirmations to bare onboarding, and every onboarding Profile exit drops the intended destination.
- New members must still complete onboarding; Profile Builder's existing readiness-gated manual link remains the final return to a personal recommendation.

## Mission — Exactly Two Ideas

1. Preserve the exact allowlisted destination through the auth doorway: Login → Signup, Signup → Login, immediate signup, and same-origin email confirmation → Auth Callback. Sanitize at each browser entry and build callback URLs with `URL` and `searchParams`, never raw concatenation.
2. Preserve the same destination through onboarding until Profile Builder owns the existing final handoff. Every successful onboarding Profile exit must use `/dashboard/profile?next=<encoded-safe-path>`; onboarding remains mandatory and Profile Builder must not auto-navigate.

## Expected Files

- `app/login/page.tsx`
- `app/signup/page.tsx`
- `app/auth/callback/page.tsx`
- `app/onboarding/page.tsx`
- reuse `lib/safe-member-return.ts` unchanged unless proof finds a defect
- a focused VPG20 regression

## Acceptance

- `/bellows/recommendations` survives Login → Signup and Signup → Login without double encoding.
- Dev-preview signup and an immediate Supabase session both go to onboarding with the safe destination.
- Email confirmation carries the safe destination on the same origin; code and hash-token callbacks preserve it into onboarding.
- Quick Weld, Full Audit, Blueprint, and explicit Open Profile exits reach Profile Builder with the safe destination.
- Missing or rejected values fall back to `/dashboard`; external, protocol-relative, backslash, operator, API, traversal, query, and fragment destinations remain rejected.
- Failed signup or callback never advances. Onboarding is not bypassed. Profile Builder does not auto-navigate.
- No new storage, API, persistence, provider, schema, or member-data read.

## Boundaries

- No PR, merge, browser/cursor control, manual deploy, Production action, promotion, alias, flag change, SQL/schema/RLS, Supabase policy mutation, Tier B custody, LLM/provider call, member-data expansion, or external delivery.
- Do not widen the exact safe-member allowlist or convert it to prefix matching.
- Do not bypass onboarding, alter profile readiness, or reopen recommendation saving.
- Do not change Supabase auth credentials, settings, templates, or policies.

## P Readback

Doozer, Thufir, and Bean must pull this exact packet and current branch state, then return exactly two strongest bounded refinements with exact files, tests, and risks. They make no product edits. Heimerdinker selects and executes only the two ideas named above.

## Completion

Return a P receipt, a G receipt naming the two executed ideas, focused proof, and final branch/tip. `SENT`, `OPENED`, and `CLAIMED` are not completion.
