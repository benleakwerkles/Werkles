# Flock Packet — Werkles Personal Result Truth Contract VPG19

Packet ID: `TO_HEIMERDINKER_DOOZER_THUFIR_BEAN_WERKLES_PERSONAL_RESULT_TRUTH_CONTRACT_VPG19_20260718`

Status: `OPEN`

Addressed seats: Heimerdinker / Dink@Betsy; Doozer@Betsy; Thufir@Betsy; Bean@Betsy

Execution, verification, commit, and isolated branch-push owner: Heimerdinker / Dink@Betsy

Repository: `benleakwerkles/Werkles`

Branch: `codex/werkles-full-flock-vpg19-20260718`

Starting source: `82bce7669588320f36500cadd1778ffa6b393f7f`

Operator authorization: `v P G`

## Current Truth

- The personal result is authenticated, owner-bound, rules-only, generated in memory, and returned with private no-store headers.
- Delivered recommendation copy still says `eligible path` while the adjacent limitation says the rules score is not eligibility.
- Source copy says `nothing was saved or sent` even though the source is intentionally an existing saved profile; only the calculated result is ephemeral.
- The browser accepts a loose personal-response union. A malformed `200` can drift custody/source semantics instead of failing closed on the still-truthful example.
- The Tier A regression has one stale source assertion from before VPG18's ephemeral-document activity-ledger guard; it must be repaired without weakening that guard.

## Mission — Exactly Two Ideas

1. Close the member-visible qualification and custody contradictions. Replace only delivered `eligible path` wording with `path not ruled out by the current rules`; distinguish the existing saved profile from the unsaved/unforwarded result; and show one compact personal-success status with friendly input categories plus an `Edit profile` link.
2. Make personal delivery fail closed and recoverable. Require an explicit successful, non-persisted, authenticated-profile response contract before replacing the example. On malformed data or a transient failure, keep the example visibly labeled and offer one GET-only retry that cannot save, send, or mutate anything.

## Expected Files

- `lib/matching/shadow-to-recommendations.ts`
- `lib/matching/profile-recommendation.ts`
- `app/api/bellows/recommendations/personal/route.ts`
- `components/squibb/personal-recommendation-delivery.tsx`
- `app/bellows/recommendations/squibb-recommendations.css`
- `scripts/foreman/test-matching-rules-only-language-vpg15-20260717.mjs`
- `scripts/foreman/test-matching-tier-a-personal-delivery-20260717.mjs`
- focused VPG19 regression if needed

## Acceptance

- No delivered recommendation calls a path eligible or implies qualification; the limitation may still truthfully say the score is not eligibility.
- Scores, ranks, filtering, rule-support values, human gates, and save-closed controls are unchanged.
- Personal custody says the existing profile is saved and the calculated result itself is not saved or forwarded to a provider/external recipient.
- A personal-success status appears only after an authenticated personal response succeeds, does not move focus, names friendly profile-input categories without values/IDs, and links to Profile Builder.
- The client requires `success: true`, `persisted: false`, `status: personal`, a valid V1 session, and `source.mode: authenticated_profile` before replacing the example.
- Invalid or malformed success responses retain the example and expose no raw response/profile details.
- Retry performs only the existing personal GET and remains abort-safe on unmount.
- The repaired Tier A proof preserves the VPG18 ephemeral-document activity-ledger guard.

## Boundaries

- No PR, merge, browser/cursor control, manual deploy, Production action, promotion, alias, flag change, SQL/schema/RLS, Supabase policy mutation, Tier B custody, new persistence, recommendation saving, LLM/provider call, member-data expansion, or external delivery.
- Do not change internal eligibility filtering names merely to rewrite user-facing language.
- Better copy and validation do not claim legal clearance, calibrated accuracy, appeal/history, or verified profile facts.

## P Readback

Doozer, Thufir, and Bean must pull this packet and current branch state, then return exactly two strongest bounded refinements with exact files, tests, and risks. They make no product edits. Heimerdinker selects and executes only the two strongest ideas under this packet.

## Completion

Return a P receipt, a G receipt naming the two executed ideas, focused proof, and final branch/tip. `SENT`, `OPENED`, and `CLAIMED` are not completion.
