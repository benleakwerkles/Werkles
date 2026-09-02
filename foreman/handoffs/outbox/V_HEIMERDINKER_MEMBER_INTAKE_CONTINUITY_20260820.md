# V — Member Intake continuity

**Foreman:** Heimerdinker / Codex Local on Betsy  
**Date:** 2026-08-20  
**Lane:** Werkles member custody and matching continuity

## Outcome

A signed-in member's latest Concierge Intake has one durable, owner-bound source of truth and the same authenticated loader feeds Recommendations, Workshop, Intros, and related member readouts. Browser-only preview remains explicitly separate and cannot override an authenticated member.

## Strongest ideas

1. Audit and close the save-before-match path: verified Supabase user ownership, exact RLS contract, durable save first, and no ambiguous success when custody fails.
2. Replace cookie-only downstream continuity with one server-side account-aware loader while retaining a clearly bounded local/anonymous preview fallback.
3. Prove isolation and continuity with executable hostile tests: forged owner cookie, cross-user read, cold-loader readback, production example fallback, and signed-in precedence.

## Hard edges

- No live migration, provider call, credential or environment inspection, deployment, push, or spend.
- Do not claim the migration is applied or runtime Supabase is available without live proof.
- Do not use browser owner cookies as authentication or allow them to override a verified account.
- Preserve local Ghost Fleet walkthroughs without calling them account-bound.
- Use returned CBCC packets when available; do not impersonate a review receipt.

## Verification

- Focused custody/route/continuity smokes.
- Full TypeScript check.
- Browser walkthrough for honest local states.
- Scoped whitespace check and receipt naming all packet inputs and remaining gates.
