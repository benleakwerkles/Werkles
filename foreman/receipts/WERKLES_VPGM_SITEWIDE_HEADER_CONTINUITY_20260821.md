# Werkles VPGM receipt — sitewide header continuity

Date: 2026-08-21  
Machine: BETSY  
Branch: `maker/site-g-20260703`  
Scope: local code and localhost verification only

## Outcome

The sitewide scan enumerated all 76 rendered App Router pages. Seventy-three ordinary pages now inherit exactly one canonical Werkles header. The only three exceptions are explicit, versioned, and mechanically checked:

- `/gd/command-console` — redirect-only utility.
- `/gd/speaker` — redirect-only utility.
- `/soledash` — deliberate full-screen operator app with one visible `Return to Werkles` control.

## V — vision

Controlling packet: `foreman/handoffs/outbox/HEIMERDINKER_V_SITEWIDE_HEADER_CONTINUITY_20260821.md`

Acceptance rule: same public Werkles row on ordinary pages; signed-in navigation is additive; local page navigation sits below it; no duplicate or lookalike headers; exceptions are named and justified.

## P — actual CBCC pull

Fresh pre-build review:

- `foreman/handoffs/inbox/FROM_COMPUTER_SITEWIDE_HEADER_CONTINUITY_20260821_20260821-065824.md`
- Computer / Thufir verdict: `PASS_WITH_CONDITIONS`.
- Conditions assimilated: compute full ancestor layout inheritance, key the check to canonical identity rather than any `<header>`, enforce duplicate/missing/replacement tripwires, publish a versioned exception list, and retain a visible Werkles return path on full-screen exceptions.
- Custody caveat: `RECEIVED_WITHOUT_CUSTODY_CHALLENGE`; actual response bytes were harvested, but the cousin did not echo the packet hash/challenge.

Ender's native desktop route was attempted once and returned no usable terminal response. No Ender review is claimed.

Fresh post-build review:

- `foreman/handoffs/inbox/FROM_COMPUTER_SITEWIDE_HEADER_CONTINUITY_POSTBUILD_20260821_20260821-070445.md`
- Computer / Thufir terminal verdict: `PASS`.
- It found no visible header-continuity defect in the supplied structural and rendered evidence and ruled the separate TinkerDen hydration mismatches non-blocking for this slice.
- Custody caveat remains `RECEIVED_WITHOUT_CUSTODY_CHALLENGE`.

## G — build

- Added stable canonical DOM identity: `#werkles-site-header`.
- Added shared header inheritance to `/membership`, `/onboarding`, `/proof`, `/operator`, `/nerdkle`, `/thinkit`, and `/tinkerden` route families.
- Removed direct page-level headers on membership and proof where the new layouts would otherwise duplicate them.
- Kept SoleDash as an intentional full-screen exception and added a persistent, keyboard-visible return control.
- Added an AST-based sitewide smoke test that resolves ancestor layout chains and checks all routes against exact-one or explicit-exception rules.
- Added the versioned exception artifact.

## M — momentum / verification

- `node scripts/foreman/sitewide-header-continuity-smoke.mjs` — PASS: 76 routes, 73 shared-header routes, 3 exceptions.
- `node scripts/foreman/operator-header-continuity-smoke.mjs` — PASS.
- `npm run typecheck` — PASS.
- Rendered browser walk — 33 ordinary routes across public, login, signup, membership, onboarding, proof, Bellows, dashboard, Operator, Nerdkle, ThinkIt, and TinkerDen: exactly one canonical header, exactly one primary navigation, canonical labels in order, meaningful page content, and no framework overlay.
- Anonymous `/dashboard` redirected to `/login?next=/dashboard` while preserving the canonical header.
- SoleDash rendered zero shared headers, one visible `Return to Werkles` link, and no framework overlay.

## Honest follow-ons

- The browser was anonymous during this matrix, so a same-route authenticated DOM diff remains useful future coverage for the additive member row. It does not invalidate the structural header scan.
- Two pre-existing TinkerDen dynamic-content hydration mismatches were exposed by browser logs. They did not affect header identity/count and are not silently counted as fixed.

## Files in this slice

- `components/foundry/site-header.tsx`
- `app/operator/layout.tsx`
- `app/membership/layout.tsx`
- `app/membership/page.tsx` (header de-duplication only within this slice)
- `app/onboarding/layout.tsx`
- `app/proof/layout.tsx`
- `app/proof/page.tsx` (header de-duplication only within this slice)
- `app/nerdkle/layout.tsx`
- `app/thinkit/layout.tsx`
- `app/tinkerden/layout.tsx`
- `app/soledash/layout.tsx`
- `app/soledash/soledash.css`
- `scripts/foreman/sitewide-header-continuity-smoke.mjs`
- `foreman/reviews/SITEWIDE_HEADER_EXCEPTIONS_20260821.md`

No push, deploy, commit, schema, secrets, provider production action, or spend occurred.
