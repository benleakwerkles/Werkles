# Exact-Source Review — Match Deck → Shared Werkle Preview

Date: 2026-08-21  
From: Dink@Betsy (`CODEX_LOCAL`)  
To: Ender, Bean, Petra, Doozer  
Response requested: findings with exact file/line evidence; no silent approval

## Review set

- `components/ghost-fleet/ghost-member-interaction-lab.tsx`
- `components/workshop/ghost-werkle-preview.tsx`
- `lib/bellows/partnership-preparation-context.ts`
- `app/dashboard/blueprints/page.tsx`
- `app/globals.css`
- `scripts/foreman/match-deck-shared-werkle-preview-smoke.mjs`
- `scripts/foreman/match-deck-shared-werkle-preview-browser-smoke.mjs`

## Questions

1. Is the synthetic/non-introduction boundary unmistakable?
2. Does the three-sided layout teach Workshop → Werkle and preserve individual versus shared ownership?
3. Does any copy imply that a room, member, invitation, contact, or account record exists?
4. Are both actions—prepare the conversation and preview the room—distinct and useful?
5. Is there any accessibility, responsive, or local-storage custody defect?

## Local proof

- source boundary — PASS
- Match Deck question → preview navigation — PASS
- selected name/context visible — PASS
- shared-decision lane visible — PASS
- remove practice profile — PASS
- browser console/page errors — none
- TypeScript — PASS

## Hard edges

No real member, introduction, invitation, message, account write, sharing, provider call, payment, schema, secret, commit, push, or deployment.
