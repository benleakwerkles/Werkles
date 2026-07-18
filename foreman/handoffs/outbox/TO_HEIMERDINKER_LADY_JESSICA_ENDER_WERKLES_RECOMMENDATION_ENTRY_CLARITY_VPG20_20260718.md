# Flock Packet — Werkles Recommendation Entry Clarity VPG20

Packet ID: `TO_HEIMERDINKER_LADY_JESSICA_ENDER_WERKLES_RECOMMENDATION_ENTRY_CLARITY_VPG20_20260718`

Status: `OPEN`

Addressed seats: Heimerdinker / Dink@Betsy; Lady Jessica / Cursor@Betsy; Ender@Betsy

Execution, verification, commit, and isolated branch-push owner: Heimerdinker / Dink@Betsy

Repository: `benleakwerkles/Werkles`

Branch: `codex/werkles-full-flock-vpg20-20260718`

Starting source: `70a35fe53b78203e5b064e5a4743eea001702a94`

Operator authorization: `V, P, G`

## Current Truth

- VPG19 made the member dashboard profile-first and gave signed-in members a safe Profile Builder return to the private recommendation.
- The recommendation page's own top navigation still labels the closed Bellows intake as `Review the intake`, which can make it look like the source of a personal result.
- The signed-out state offers sign-in but no equally direct new-account path, even though a safe recommendation destination already exists.
- The example walkthrough, ranking, human gates, private response contract, and closed save controls are already truthful and must not be reopened.

## Mission — Exactly Two Ideas

1. Replace the recommendation page's stale intake navigation with one neutral `Profile` link to `/dashboard/profile?next=%2Fbellows%2Frecommendations`. Do not claim that a profile belongs to the viewer before the client finishes checking auth.
2. Add one `Create account` option beside the existing signed-out sign-in path, carrying the same encoded recommendation destination. Keep every loading, profile-required, personal, and error state unchanged.

## Expected Files

- `app/bellows/recommendations/page.tsx`
- `components/squibb/personal-recommendation-delivery.tsx`
- a focused VPG20 regression

## Acceptance

- The recommendation page no longer presents the closed intake as the source or next step for a personal result.
- Its neutral Profile link uses the exact VPG19-safe return destination.
- Signed-out members can choose sign-in or create account, and both visible paths carry `/bellows/recommendations`.
- Existing example, personal, profile-required, loading, and error truth remains intact.
- No fetch, API, auth, ranking, gate, save control, persistence, or data-custody behavior changes under this packet.

## Boundaries

- No PR, merge, browser/cursor control, manual deploy, Production action, promotion, alias, flag change, SQL/schema/RLS, Supabase policy mutation, Tier B custody, LLM/provider call, new persistence, member-data expansion, or external delivery.
- Do not remove the closed intake walkthrough from Bellows or the member dashboard; only stop presenting it as this page's source path.
- Do not redo VPG19 dashboard, profile, response-contract, retry, custody, ranking, or eligibility-language work.

## P Readback

Lady Jessica and Ender must pull this exact packet and current branch state, then return exactly two strongest bounded refinements with exact files, tests, and risks. They make no product edits. Heimerdinker selects and executes only the two ideas named above.

## Completion

Return a P receipt, a G receipt naming the two executed ideas, focused proof, and final branch/tip. `SENT`, `OPENED`, and `CLAIMED` are not completion.
