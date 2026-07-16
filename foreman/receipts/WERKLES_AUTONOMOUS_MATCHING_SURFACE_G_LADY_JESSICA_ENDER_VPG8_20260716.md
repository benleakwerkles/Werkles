# Werkles Autonomous Matching Surface G Re-review - Lady Jessica / Ender VPG8

Status: `GO - G SOURCE / TYPECHECK / PRODUCTION BUILD PASS`
Date: `2026-07-16`
Seat: `LadyJessica@Betsy` / Ender readability re-review
Repository: `C:\Users\Ben Leak\github\Werkles`
Branch / reviewed HEAD: `maker/site-g-20260703` / `d183d8bcab872c001ac0ba740fc8d9f86ec4efa0`
Packet product baseline: `92a30814a244fd99a3df0fd334103f984431a76c`

## Verdict

`GO` for the reviewed VPG8 source slice.

The final dirty snapshot:

- preserves the existing `Confidence` / percent presentation for default `ConfidenceMeter` consumers;
- opts only the public recommendation detail into `rules_score`;
- removes numeric/confidence framing from recommendation cards;
- disables all recommendation save controls before interaction and removes the client POST path;
- separates light-canvas and dark-tile foreground tokens with passing contrast;
- repairs the browser-found blocker-tile custom-property failure with an explicit fallback; and
- passes the focused proof, TypeScript check, and optimized production build.

No product file was edited by this reviewer. The only intended write from this G re-review is this receipt.

## Consumer-isolation proof

`components/squibb/confidence-meter.tsx` now declares:

```text
variant?: "confidence" | "rules_score"
variant = "confidence"
```

Only `components/squibb/recommendation-surface.tsx` passes `variant="rules_score"`.

The two existing shared consumers remain on the default branch because they pass no variant:

- `components/squibb/concierge-walkthrough.tsx`
- `components/squibb/speaker-human-read-panel.tsx`

The default branch exactly preserves the original non-rounded clamp, renders `Confidence` and `{clamped}%`, retains `aria-label="Confidence score N out of 100"`, and keeps the meter label `Recommendation confidence`. Only the recommendation rules-score branch derives `rulesScore = Math.round(clamped)`. That recommendation-only branch renders:

- `Rules score`
- `N out of 100`
- `Support band: Limited rule support | Moderate rule support | Stronger rule support`
- `This rules score shows how strongly the current rules support this option based on what you entered. It is not a probability of success, a measure of eligibility, or a predicted outcome.`

It also exposes `Rules score`, `N out of 100`, the support band, and `Not a probability` through meter accessibility text.

Result: `PASS - EXPLICIT VARIANT, DEFAULT CONSUMERS PRESERVED`.

## Card and saved-row proof

`components/squibb/recommendation-card.tsx` no longer destructures `confidence` and contains neither `confidence.score` nor `squibb-rec-card__confidence`. Ranked and compact cards therefore show no numeric score, percent, or confidence label.

The saved-row fallback no longer renders raw `packet.action`, raw `packet.state`, or `N%`. If a saved row is supplied, it renders only:

```text
Rules score: N out of 100
```

The current public page helper supplies an empty ledger in both public-flag states, so this fallback is dormant on the public example page.

Result: `PASS`.

## Save-truth proof

Current source shows:

- `SAVE_CLOSED_BETA = true`;
- exactly three controls disabled with `disabled={SAVE_CLOSED_BETA}`;
- the controls reference the adjacent status through `aria-describedby="squibbRecommendationSavingStatus"`;
- adjacent copy says: `Saving is unavailable during this beta. Nothing is sent to another person or organization from these controls.`;
- no `fetch(` call in the surface;
- no `stagePacket(` function or click path; and
- direct route `app/api/bellows/recommendations/packet/route.ts` remains an unconditional `403` with no storage/import/upsert/save branch.

Result: `PASS - CLIENT CLOSED; SERVER DEFENSE RETAINED`.

This re-review did not send a forged runtime POST. The direct no-write runtime proof remains a separate root/browser G responsibility.

## Exact contrast proof

Normal-text AA threshold used: `4.5:1`.

| Surface | Foreground / background | Ratio |
|---|---|---:|
| light primary | `#1f1814` / `#f6efe5` | `15.34:1` |
| light supporting | `#44362c` / `#f6efe5` | `10.16:1` |
| recommendation eyebrow | `#68411f` / `#f6efe5` | `7.78:1` |
| blocker summary | `#7b2929` / `#f6efe5` | `8.39:1` |
| dark primary on card smoke | `#f4e2b1` / `#2c231d` | `11.98:1` |
| dark supporting on card smoke | `#c9b896` / `#2c231d` | `7.90:1` |
| dark primary on workshop night | `#f4e2b1` / `#191817` | `13.81:1` |
| dark supporting on workshop night | `#c9b896` / `#191817` | `9.10:1` |

The re-review initially found three residual failures and one global eyebrow failure. The final snapshot repairs all four:

- gate summary: pastel red -> `#7b2929`;
- gate reviewer note and non-blocker approval: ember -> light-surface supporting ink;
- blocker approval: explicit dark-tile supporting ink; and
- recommendation `.eyebrow`: copper -> `#68411f`.

### Browser-found blocker tile defect

A browser screenshot exposed a defect that the first static proof missed: the blocker background declaration used `var(--werkles-workshop-night)` without a fallback. In that browser context the declaration became invalid, leaving light blocker text on the light canvas.

The final declaration is:

```css
background: color-mix(in srgb, #c44 8%, var(--werkles-workshop-night, #191817));
```

The resulting sRGB background is approximately `#271c1b`:

- blocker primary `#f4e2b1`: `12.90:1`;
- blocker supporting `#c9b896`: `8.50:1`.

The focused test is now anchored under `.squibb-gate--blocker` and requires its `background: color-mix(...)` to contain `var(--werkles-workshop-night, #191817)`. This closes the static-test blind spot found during the review.

Result: `PASS - STRICT AA SOURCE PAIRS`.

## Focused test review

Command:

```text
node scripts/foreman/test-matching-vpg8-surface.mjs
```

Final result: exit `0`, JSON `pass: true`.

Reported checks:

- `public_example_only_zero_personal_readers`
- `empty_public_ledger`
- `save_controls_disabled_and_no_client_post`
- `recommendation_only_rules_score`
- `shared_confidence_default_preserved`
- `page_scoped_light_dark_contrast_tokens`
- `direct_packet_post_still_403`

The test now also asserts the exact rules-score copy, all three support bands, card-number removal, three disabled controls, no client POST, light/dark palette values, gate summary/reviewer/approval colors, eyebrow color, and the blocker-specific workshop-night fallback.

## Build checks

### TypeScript

```text
npm.cmd run typecheck
```

Result: exit `0`; `tsc --noEmit` passed.

### Production build

```text
npm.cmd run build
```

Final result after the strict contrast corrections and default-confidence preservation tweak: exit `0`; root's final rerun generated `82/82` static pages. This reviewer re-ran the focused proof and `tsc --noEmit` against the same final confidence source, both exit `0`.

- Next.js `15.5.18`
- compiled successfully
- type/lint validity check passed
- generated `82/82` static pages
- `/bellows/recommendations` emitted as a dynamic route at `7.58 kB`, `113 kB` first-load JS
- `/bellows/recommendations/test-case-0` emitted as a static route

### Diff hygiene

Scoped `git diff --check` returned exit `0`; only existing LF-to-CRLF warnings were emitted.

## Final snapshot hashes

- `components/squibb/confidence-meter.tsx` - `5f0ba8638319fff724d0544db2570b97cf9546539e46a3e2c4f2c0c8170354b7`
- `components/squibb/recommendation-surface.tsx` - `47c87a2822fdffbe78a2d6e3a3a991b900b4e243d31067de1dc591e1508264ad`
- `components/squibb/recommendation-card.tsx` - `48a3d06a87c850bff9b5b9787e5ae6643f7c70c109d2398f883b4d7d47f0440e`
- `components/squibb/human-gate-strip.tsx` - `a3fa5ca92037ed70fbfaa442662bd3e987b389e13574bb8a773d2e47949c875d`
- `lib/squibb/recommendations.ts` - `9787ea2aedf22ddb225d331b435dcf493f5ab5623e63e97537e12dfb6e3058c8`
- `app/bellows/recommendations/squibb-recommendations.css` - `ad617bef25f150ec3e21a8023aa6b2f5133f5b5548eb005497cdfc076eb6019b`
- `lib/squibb/public-recommendation-session-server.ts` - `2d4b5cedf58642b5f6ad24f50c80887f25e8c47f5321169523de6a4aa722c915`
- `scripts/foreman/test-matching-vpg8-surface.mjs` - `16c8078387ef086c89a532fff22091306f89e0afe2381635a2052046fd196c8e`
- unchanged direct POST route - `ac2b3cdf3a19080b9c6592c0b3541f3ed0e5feb21666c610c24a473a9cdbc6ab`

## Remaining evidence boundaries and dormant debt

- This reviewer did not save or independently inspect the post-fix browser screenshot. The root/browser G owns the visual artifact and final page-load/console proof.
- `buildLiveIntakeRankedDeck()` still contains internal packet/dispatch/Swanson wording. The current public helper never calls that personal/live loader and always returns the example with an empty ledger, so those strings are not visible on the reviewed public page. They must be scrubbed before any authenticated personal/live recommendation path is re-enabled.
- The direct `403` response says the beta is closed, although public recommendation delivery is ON and only saving is closed. The visible UI is accurate; the direct-route error wording remains non-visible copy debt outside this six-file member-surface slice.
- Default `ConfidenceMeter` consumers intentionally retain confidence/percent framing. This is preservation, not a public recommendation-surface regression.
- This GO does not prove authenticated ownership, cross-member isolation beyond the example-only public helper, export, correction, deletion, retention, legal compliance, calibrated accuracy, fairness, eligibility, LLM enablement, external routing, purchases, or money movement.

No commit, push, deploy, feature-flag mutation, database write, provider action, or production mutation was performed by this reviewer.

## Pre-stage reproducibility addendum

Status: `GO - INCLUDE BOTH COPY FILES IN THE VPG8 STAGED SLICE`

The browser-reviewed dirty snapshot included these two files even though the original packets excluded them:

- `lib/squibb/recommendations.ts`
- `components/squibb/human-gate-strip.tsx`

Omitting either file would make a clean checkout diverge from the reviewed public page and reintroduce internal Operator, Dink, Petra, Crucible, and Ben wording. They are therefore required stage inclusions for the browser proof and this G receipt to be reproducible.

### Exact-diff classification

The complete `lib/squibb/recommendations.ts` diff is member-facing string replacement only. It does not change exported types, recommendation IDs or kinds, ranks, scores, confidence labels, evidence strengths, gate IDs, gate kinds, gate severities, `benMustApprove` values, deck ordering, branching, function signatures, or session construction. The copy changes apply to the seeded ranked deck, catalog deck, live-intake deck, gate labels/reasons, evidence labels/sources, suggested support/tool labels, and example context.

The complete `components/squibb/human-gate-strip.tsx` diff changes display copy and renames the local `benGates` variable to `approvalGates`. The compact/default branching, blocker selection, `benMustApprove` filtering, list rendering, severity classes, and conditions are unchanged.

Two recommendation gate strings now use `Your approval` / `Your judgment`. This is member-facing decision language, not a permission or authority grant: the underlying gates remain `benMustApprove: true`, and the shared strip still states that an authorized reviewer must approve. No action path, dispatch path, save path, API, authentication rule, or authorization check changes in either diff.

Result: `PASS - COPY-ONLY ADOPTION; NO RUNTIME BEHAVIOR OR EXECUTABLE AUTHORITY CHANGE`.

### Affected consumers

`lib/squibb/recommendations.ts` runtime data reaches:

- the current public `/bellows/recommendations` route through `loadPublicBellowsRecommendationPageData()` -> `loadSquibbRecommendationSession()` -> `SquibbRecommendationSurface`;
- the ranked and catalog cards/details rendered by `RecommendationCard`, `ReasoningPanel`, `ConfidenceMeter`, `EvidenceSection`, and `HumanGateStrip` through that surface; and
- the non-public/fallback `loadSquibbRecommendationSessionForBellows()` path through both `loadSquibbRecommendationSession()` and `buildLiveIntakeRankedDeck()` if that loader is reattached in a later authenticated slice.

The module's `RECOMMENDATION_KIND_LABELS` export and its type exports are unchanged, so runtime label-only consumers in Matching plus type-only imports are not affected by this diff. `shadowRunToRecommendationSession()` constructs its own recommendation copy and gates; it is likewise unaffected by the changed seeded/live-deck strings.

`components/squibb/human-gate-strip.tsx` has exactly two rendered consumers:

- `SquibbRecommendationSurface` on `/bellows/recommendations` using the default variant; and
- `ConciergeWalkthrough` on `/bellows/recommendations/test-case-0` using the compact variant.

The walkthrough has independent test-case recommendation data, so it receives only the shared gate-heading/approval-copy change, not the seeded recommendation-deck copy.

### Proof boundary

`scripts/foreman/test-matching-vpg8-surface.mjs` does not read either of these files. Its pass proves the privacy/save/score/contrast slice but cannot detect their omission from a staged commit. This addendum and the stage manifest must therefore carry the reproducibility requirement explicitly.

Scoped `git diff --check` for both files returned exit `0`, with only the existing LF-to-CRLF warnings.

Required final hashes:

- `lib/squibb/recommendations.ts` - `9787ea2aedf22ddb225d331b435dcf493f5ab5623e63e97537e12dfb6e3058c8`
- `components/squibb/human-gate-strip.tsx` - `a3fa5ca92037ed70fbfaa442662bd3e987b389e13574bb8a773d2e47949c875d`

No product file was edited by this pre-stage reviewer. This receipt addendum is the only write.

`COMPLETED - G RE-REVIEW GO`
