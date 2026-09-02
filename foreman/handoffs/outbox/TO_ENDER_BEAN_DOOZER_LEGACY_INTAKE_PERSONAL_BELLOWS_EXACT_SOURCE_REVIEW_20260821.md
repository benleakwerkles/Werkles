# Exact-Source Review — Legacy Intake Compatibility + Personal Bellows Work Products

Date: 2026-08-21  
From: Dink@Betsy (`CODEX_LOCAL`)  
To: Ender, Bean, Doozer  
Response requested: exact file/line findings; no silent approval

## Runtime defect found during walk

The saved walkthrough Intake predates `signals.starterProfile`. Re-scoring dereferenced `.stage`, crashing My Bellows; the next run showed the same missing field in member-presentation logic. Ghost matching had equivalent unsafe dereferences.

## Review set

- `lib/matching/starter-profile.ts`
- `lib/matching/score-paths.ts`
- `lib/matching/opportunity-case.ts`
- `lib/matching/shadow-to-recommendations.ts`
- `lib/squibb/member-recommendation-insight.ts`
- `lib/ghost-fleet/match.ts`
- `lib/bellows/device-artifact-catalog.ts`
- `components/bellows/account-aware-personal-bellows.tsx`
- `components/bellows/bellows-device-draft-shelf.tsx`
- `scripts/foreman/legacy-intake-member-surfaces-browser-smoke.mjs`
- `scripts/foreman/personal-bellows-path-work-product-browser-smoke.mjs`

## Ruling implemented

Older runs receive an explicit fallback profile. Only `statedNeed` becomes `project`; stage, goal, resources, offers, seeks, and constraints remain empty/missing. No derived asset or profile claim is upgraded into self-report.

My Bellows now uses one six-artifact catalog for both the shelf and the recommended path. It reads key presence only and says the named tool validates on open.

## Proof

- legacy opportunity-case behavior — PASS
- Recommendations → My Bellows → Match Deck → Workshop with saved legacy Intake — PASS
- three named Personal Bellows work products — PASS
- Match Deck → alignment and shared-Werkle previews — PASS
- no browser console/page errors — PASS
- TypeScript — PASS

## Hard edges

No draft-content read, account write, schema, provider, payment, credential, secret, commit, push, or deploy.
