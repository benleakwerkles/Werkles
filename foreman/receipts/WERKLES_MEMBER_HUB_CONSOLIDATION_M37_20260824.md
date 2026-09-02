# Werkles member-hub consolidation — M37 receipt

PROJECT_ID: WERKLES  
WORK_ID: MEMBER_HUB_CONSOLIDATION  
CYCLE_ID: M37_20260824  
SEAM_ID: PROFILE_CRUCIBLE_WORKSHOP_MATCH_DECK_IA

## Outcome

- Profile is now a human-grounded member hub with a photographic first viewport, one clear `Who You Are` editing section, and one `Prove It` overview.
- `Prove It` states the narrow boundary of identity, phone, funds, and future manual review. Funds language explicitly rejects public balance display and wealth ranking.
- Detailed custody/storage language remains available behind `Where this information saves`; it no longer leads the page.
- The member header is reduced from seven choices to four: `My Work`, `People`, `Bellows`, `About Me`.
- Workshop now presents `People for this work` directly after its Action Plan, with a tested doorway to the existing Match Deck.
- The detailed Profile, Crucible, Match Deck, Formation, Recommendations, and Bellows routes remain intact. No mature route was deleted.
- Crucible's proved-empty decorative atmosphere strip was removed; its human visual and full provider/check workflows remain.

## Changed files

- `app/dashboard/profile/page.tsx`
- `app/dashboard/blueprints/page.tsx`
- `components/crucible/crucible-panel.tsx`
- `lib/site-nav.ts`
- `app/globals.css`
- `scripts/foreman/member-data-custody-smoke.ts`
- `scripts/foreman/stable-member-header-match-deck-smoke.mjs`

## Verification

- `npm run typecheck`: PASS
- `npx --yes tsx scripts/foreman/member-data-custody-smoke.ts`: PASS
- `node scripts/foreman/stable-member-header-match-deck-smoke.mjs`: PASS
- `node scripts/foreman/sitewide-header-continuity-smoke.mjs`: PASS — 77 rendered routes, 74 shared-header routes, 3 explicit exceptions
- Targeted `git diff --check`: PASS (line-ending warnings only)
- Headless desktop/mobile Profile walk: PASS
- Headless desktop/mobile Workshop walk: PASS
- Headless Crucible first-viewport walk: PASS; empty strip absent
- Profile `Open detailed checks` -> `/dashboard/crucible`: PASS
- Workshop `Compare people` -> `/dashboard/intros`: PASS
- Browser console errors: none observed
- React best-practices review: PASS; no new waterfall, heavy client dependency, unsafe render pattern, or accessibility defect found

## Visual evidence

- `foreman/receipts/browser-capture/m37-profile-member-nav.png`
- `foreman/receipts/browser-capture/m37-profile-mobile.png`
- `foreman/receipts/browser-capture/m37-workshop-desktop.png`
- `foreman/receipts/browser-capture/m37-workshop-mobile.png`
- `foreman/receipts/browser-capture/m37-crucible-desktop.png`

## CBCC custody

- Ender packet authored: `TO_ENDER_WERKLES_MEMBER_HUB_COPY_CHALLENGE_M37_20260824.md`; native route not proved callable; COMPOSED_NOT_SENT; no receipt credited.
- Bean packet authored: `TO_BEAN_WERKLES_MEMBER_HUB_TRUST_CHALLENGE_M37_20260824.md`; native route not proved callable; COMPOSED_NOT_SENT; no receipt credited.
- Lady Jessica packet authored: `TO_LJ_WERKLES_MEMBER_HUB_VISUAL_VERIFY_M37_20260824.md`; native route not proved callable; COMPOSED_NOT_SENT; no receipt credited.
- Local Foreman performed the build and headless verification. No external CBCC review is claimed.

## Boundaries preserved

No foreground input, clipboard, credentials, providers, production data, schema/RLS, spend, push, or deploy. Unrelated dirty work was preserved.

## Checkpoint

Ready for Operator walkthrough at `/dashboard/profile`, then `/dashboard/blueprints`. This is a reversible soft consolidation; deep routes remain available until the combined experience earns a harder merge.
