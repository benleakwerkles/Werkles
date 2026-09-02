# Werkles BVPGM — Sellable Member Walk M20

Date: 2026-08-24  
Machine: Betsy  
Branch: `maker/site-g-20260703`  
Base observed: `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`

## Checkpoint

Walk and strengthen the local member experience from the home page through Intake, Recommendations, Workshop, Match Deck, Formation, Personal Bellows, Crucible, and Membership without activating providers, changing schema, pushing, deploying, or stealing foreground input.

## Browser walk

The signed-in practice-member path rendered successfully:

1. Home
2. Login / practice-member return
3. Intake with current Werkles and PookaKind answers
4. Recommendations with four distinct next moves
5. Workshop with current Intake state
6. Match Deck with nine possibilities, six visible, varied lanes, and same-city candidates
7. Formation with candidate-specific Ghost positions and carried conversation context
8. Personal Bellows with three tailored lessons
9. Crucible with narrow provider boundaries
10. Membership with free/member/shared-Werkle value ladder

No Next.js error overlay was present on the repaired Home, Personal Bellows, Workshop, or Formation renders.

## Failures found and repaired

- Removed stale bakery/oven/shared-kitchen advice from the digital-product Personal Bellows path by adding a digital `find_equipment` plan tied to observed product failures, cost, data risk, lock-in, and exit rules.
- Made Personal Bellows use the tailored plan title rather than a generic public-library title.
- Replaced unsupported homepage claims about other AI, live seller checks, and consultant pricing with honest statements about decision continuity, evidence boundaries, experts, and free public help.
- Replaced the old Workshop flow label `Intros` with `Match Deck`.
- Preserved role capitalization such as `HVAC` in Formation.
- Rewrote the Formation contribution sentence to read naturally.
- Clarified that Formation's fixed Ghost positions and the optional generic rehearsal are different surfaces; the rehearsal no longer appears to contradict the Ghost profile.

## Verification

- `npx tsx scripts/foreman/member-recommendation-plan-smoke.ts` — PASS
- `npx tsx scripts/foreman/personal-bellows-learning-path-smoke.ts` — PASS
- `npx tsx scripts/foreman/werkle-formation-contract-smoke.ts` — PASS
- `node scripts/foreman/bvpgm-m9-member-value-contract.mjs` — PASS 8/8
- `node scripts/foreman/bvpgm-m10-match-to-werkle-contract.mjs` — PASS 6/6
- `npm run typecheck` — PASS
- `npm run build` — PASS; 100 static pages generated
- Rendered Personal Bellows — tailored digital tool title present; bakery terms absent
- Rendered Workshop — Match Deck flow present; Intros flow absent
- Rendered Formation — HVAC preserved; generic rehearsal boundary present

## CBCC accounting

Fresh M20 packets were generated for Petra, Skybro, Ender, Bean, and Computer under command `WERKLES_M20_SELLABLE_MEMBER_WALK`.

Fresh returned receipts counted: **0**.

- Computer's desktop route was blocked at a sign-in wall.
- Ender's desktop route did not expose a usable route in this pass.
- No packet was credited as participation merely because it existed.
- No cousin review or independent seal is claimed for these M20 changes.

## Remaining honest limits

- Current continuity is still device/browser-bound on several member surfaces; cross-device account custody is not proven.
- Ghost profiles and their financial scenarios are synthetic and unverified.
- Provider pages describe and test narrow paths; production Plaid, live messaging, live identity checks, background screening, live charges, and raw-evidence retention were not activated.
- No push or deployment was performed.

