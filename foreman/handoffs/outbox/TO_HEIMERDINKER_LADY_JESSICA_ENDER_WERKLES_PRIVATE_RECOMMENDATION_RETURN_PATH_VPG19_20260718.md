# Flock Packet — Werkles Private Recommendation Return Path VPG19

Packet ID: `TO_HEIMERDINKER_LADY_JESSICA_ENDER_WERKLES_PRIVATE_RECOMMENDATION_RETURN_PATH_VPG19_20260718`

Status: `OPEN`

Addressed seats: Heimerdinker / Dink@Betsy; Lady Jessica / Cursor@Betsy; Ender@Betsy

Execution, verification, commit, and isolated branch-push owner: Heimerdinker / Dink@Betsy

Repository: `benleakwerkles/Werkles`

Branch: `codex/werkles-full-flock-vpg19-20260718`

Starting source: `82bce7669588320f36500cadd1778ffa6b393f7f`

Operator authorization: `v P G`

## Current Truth

- Tier A can calculate a private, rules-only recommendation from the authenticated member's existing saved profile without saving the result.
- The earlier Profile Builder feedback is already complete: state picker, preferred contact email, bounded lane choices, human visibility labels, fillable goal suggestions, and workshop imagery all have focused proof.
- The member dashboard still presents the closed Bellows intake as the first working path and says recommendations use `demo + saved intake`.
- Login accepts an unchecked `next` value, and Profile Builder offers no direct return to the personal recommendation after a successful save.

## Mission — Exactly Two Ideas

1. Make the member home's primary sequence `Review/update profile` → `See recommendations`. Remove the false saved-intake claim, keep the intake walkthrough available only as a clearly closed/example secondary path, and never claim the dashboard knows profile completeness.
2. Preserve the personal-recommendation destination safely through sign-in and profile completion. Strictly accept only allowlisted internal member paths; reject external, protocol-relative, backslash, operator, and API destinations. After a successful profile save, reveal a direct `See my private recommendation` link without automatically navigating or adding storage.

## Expected Files

- `app/dashboard/member-dashboard-client.tsx`
- `app/login/page.tsx`
- `app/dashboard/profile/page.tsx`
- a small shared safe-return helper only if it avoids duplicated policy
- `scripts/foreman/test-matching-tier-a-personal-delivery-20260717.mjs`
- focused VPG19 regression if clearer than overloading the Tier A proof

## Acceptance

- No primary `Start intake` instruction or `saved intake` recommendation claim remains on the member dashboard.
- `/dashboard/profile` and `/bellows/recommendations` are the visible primary sequence.
- The closed intake remains reachable and honestly labeled as a walkthrough/example.
- Safe return handling allows the intended member routes and rejects external URLs, protocol-relative paths, backslashes, `/operator`, and `/api` paths.
- No automatic post-save redirect. The recommendation link appears only after an already-loaded usable profile or a successful profile save.
- No new fetch, route, persistence, schema, provider, or infrastructure.

## Boundaries

- No PR, merge, browser/cursor control, manual deploy, Production action, promotion, alias, flag change, SQL/schema/RLS, Supabase policy mutation, Tier B custody, LLM/provider call, member-data read outside the existing signed-in browser flow, or external delivery.
- Do not reopen intake saving, recommendation saving, introductions, applications, or purchasing.
- Do not alter the already-completed Profile Builder choices merely to make activity.

## P Readback

Lady Jessica and Ender must pull this packet and current branch state, then return exactly two strongest bounded refinements with exact files, tests, and risks. They make no product edits. Heimerdinker selects and executes only the two strongest ideas under this packet.

## Completion

Return a P receipt, a G receipt naming the two executed ideas, focused proof, and final branch/tip. `SENT`, `OPENED`, and `CLAIMED` are not completion.
