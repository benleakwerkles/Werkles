# Werkles BVPGM M17 — Distributed feature stakes

**Execution context:** `LOCAL_SALLY_WINDOWS` / Heimerdinker@Betsy  
**Checkpoint:** Build distinct feature stakes, rotate them through actual CBCC review, and integrate only reviewed work.  
**Release posture:** Gate 05 HOLD. No push, deploy, schema/RLS, credential, provider, or spend action.

## V — authored and issued

- Vision packet: `foreman/handoffs/outbox/HEIMERDINKER_V_BVPGM_DISTRIBUTED_FEATURE_STAKES_M17_20260824.md`
- Feature-stake mission: `foreman/crew-dispatch/missions/WERKLES_BVPGM_DISTRIBUTED_FEATURE_STAKES_M17_20260824.json`
- Heimerdinker stake: `foreman/handoffs/outbox/HEIMERDINKER_M17_STAKE_WORKSHOP_WERKLE_NEXT_DECISION_20260824.md`
- Pre-build red-team mission: `foreman/crew-dispatch/missions/WERKLES_M17_HEIMERDINKER_NAVIGATION_STAKE_REDTEAM_20260824.json`
- Post-build red-team mission: `foreman/crew-dispatch/missions/WERKLES_M17_HEIMERDINKER_NAVIGATION_STAKE_POSTBUILD_20260824.json`

## P — actual terminal receipts

- Petra returned `PETRA_M17_STAKE — CROSS-REVIEW ONLY; GATE 05 HOLD` for the broad integration matrix.
- Petra returned `PETRA_M17_NAV_GO` before implementation with exact stage, copy, local-state, 390px, and custody acceptance conditions.
- Petra returned `PETRA_M17_NAV_POSTBUILD_GO` for candidate digest `7b9bf210204ba047230bd8e8cf6cc508e1bf99554754c32789d820c82587298c`; no acceptance check failed and Gate 05 remains HOLD.
- The three Petra returns were harvested through the CDP courier, token-correlated, consumed, and moved to `foreman/handoffs/inbox/processed/`.

## G — reviewed feature implemented

The signed-in journey now identifies exactly one current room and one next action:

1. `Your Workshop` → `Improve My Workshop`
2. `Match Deck` → `Compare Matches`
3. `Possible Werkle` → `Continue This Possible Werkle`
4. `Existing Werkle on this device` → `Review the Saved Brief`

The stage is route-derived. Formation promotes only after a valid device-local Operating Brief for the current formation. Malformed JSON is removed; a valid brief for another formation is ignored. Save/removal emits a same-tab event so the stage updates without reload. The visible boundary says the card does not mean another person responded, agreed, paid, or joined a company.

Files:

- `lib/member-work-location.ts`
- `components/foundry/member-work-location-readout.tsx`
- `components/werkle/formation-workbench.tsx`
- `app/dashboard/blueprints/page.tsx`
- `app/dashboard/intros/page.tsx`
- `app/dashboard/werkles/formation/page.tsx`
- `app/globals.css`
- `scripts/foreman/member-work-location-smoke.ts`
- `scripts/foreman/match-deck-shared-werkle-preview-browser-smoke.mjs`

## Verification

- `npm run typecheck` — PASS
- `npx tsx scripts/foreman/member-work-location-smoke.ts` — PASS
- 1440px browser walk: Workshop → Match Deck → Formation → save Operating Brief → Personal Bellows → Crucible → Match Deck — PASS
- 390px version of the same browser walk plus Workshop, Match Deck, and Formation horizontal-overflow assertions — PASS
- Browser console/page errors during both complete walks — none
- `npm run build` — PASS; 100 static pages generated and all relevant routes compiled

## M — rotation reality

- Initial producer packets were issued for Ender, Bean, Skybro, Computer, Petra, and Heimerdinker.
- Bean and Skybro's signed-in Chrome tabs were discovered. The extension listed them and briefly exposed them as controlled tabs, but every claim/DOM operation timed out. Chrome, the extension, and the native-host manifest all passed diagnostics. No packet was transmitted and no participation is claimed.
- Ender's desktop route was proactively launched with CDP but port 9348 did not come up. No packet was transmitted and no participation is claimed.
- Computer's desktop route was proved at port 9349, but the receiver is signed out. No packet was transmitted and no participation is claimed.
- Lady Jessica's packet remains queued without a terminal receipt. No push authority is implied.
- Therefore the Heimerdinker stake completed its Petra pre-build/build/post-build loop, but the intended multi-producer/cross-review ring is **not yet achieved**. The remaining producer legs stay open; no solo substitute is counted as crew work.

## Hard stops preserved

- No foreground keyboard, clipboard, cursor, or physical mouse automation.
- No invented custody or imaginary crew receipts.
- No schema, RLS, credentials, provider activation, spend, push, deploy, or release action.

