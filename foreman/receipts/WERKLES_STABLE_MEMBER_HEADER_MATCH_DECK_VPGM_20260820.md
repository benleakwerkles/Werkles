# Receipt — Stable member header and truthful Match Deck

Date: 2026-08-20  
Execution: CODEX_LOCAL on Betsy  
Vision: `foreman/handoffs/outbox/V_HEIMERDINKER_STABLE_MEMBER_HEADER_MATCH_DECK_20260820.md`

## Built

- One auth-aware Werkles header now switches to a stable member set:
  `Match Deck`, `Workshop`, `Recommendations`, `My Bellows`, `Profile`.
- `Match Deck` links exactly to `/dashboard/intros`, the current people and
  matching surface—not the general member home.
- The dashboard layout supplies the same header to every dashboard route.
- Core Intake, Recommendations, Personal Bellows, Workshop, Match Deck,
  Profile, Crucible, Billing, and member-home duplicate nav strips were removed.
- Server-confirmed HttpOnly walkthrough state cannot be downgraded by the
  weaker client storage check during hydration.
- A tab-scoped presentation marker keeps the member header when a signed-in
  member crosses back to public pages. It grants no route or data access.
- An authenticated account with no Intake receives an explicit Intake-first
  Match Deck state rather than a generic load failure.

## Browser proof

- Local gimprobotester sign-in → `/dashboard/intros`: Member navigation present;
  Match Deck, Workshop, Recommendations, My Bellows, Profile visible.
- Match Deck click → `http://localhost:3000/dashboard/intros`.
- Recommendations → Home retained the same member header.
- 390px Recommendations: document `390x390`; five member targets wrap cleanly;
  no redundant Werkles-help pseudo-header remained.
- Browser errors: none. Dev-only React notices only.

## Mechanical proof

- `node scripts/foreman/stable-member-header-match-deck-smoke.mjs` — PASS
- `npm.cmd run typecheck` — PASS
- scoped `git diff --check` — PASS (line-ending notices only)

## Boundaries

No provider, environment, Supabase, schema, account-data, git staging, push,
or deployment action was performed.

