# Werkles Autonomous Matching Surface - Bean P Attack VPG8

Status: `NO-GO - RETURN TO P`
Date: 2026-07-16
Seat: Bean hostile review
Repository: `C:\Users\Ben Leak\github\Werkles`
Branch: `maker/site-g-20260703`
Reviewed HEAD: `92a30814a244fd99a3df0fd334103f984431a76c`
Public flag at reviewed HEAD: `ON`
LLM flag at reviewed HEAD: `OFF`

## Inputs read

- `foreman/handoffs/outbox/TO_HEIMERDINKER_AUTONOMOUS_MATCHING_SAVE_TRUTH_VPG8_20260716.md`
- `foreman/handoffs/outbox/TO_LADY_JESSICA_AUTONOMOUS_MATCHING_READABILITY_VPG8_20260716.md`
- `foreman/receipts/WERKLES_HEIMERDINKER_MATCHING_CONTAINMENT_FULL_FLOCK_VPG6_20260716.md`
- public flip commit `92a30814a244fd99a3df0fd334103f984431a76c`
- the live diffs and call sites for all six allowed UI files

Bean did not edit product code, start a server, commit, push, deploy, or change a flag. The only Bean write is this receipt.

## Verdict

Do not run G from the current two packets.

The disabled-save implementation is directionally sound, but the public read path is not owner-bound. VPG6 proved that the `OFF` branch makes zero personal reads. HEAD `92a3081` turns the flag `ON`, and the `ON` branch calls the unscoped latest-intake, latest-shadow-run, and latest-ledger readers. An unauthenticated page request can therefore receive whichever person's intake and activity happen to be latest. Hiding path elements in JSX does not remove those values from the React Server Component payload because the full `session` and `ledger` objects are still passed into a client component.

The current rules-score and contrast drafts also create regressions outside the intended surface. The shared `ConfidenceMeter` now calls Speaker hypothesis confidence a `Rules score`, and the page-wide pale text-token override is unreadable on the route's light background while failing to override black headings on dark cards.

## Hostile findings

### P0 - Public ON bypasses the VPG6 privacy containment

- `lib/squibb/public-recommendation-session-server.ts:40-49` uses the safe example-only branch only when public matching is `OFF`.
- With public matching `ON`, lines 44-46 call `loadSquibbRecommendationSessionForBellows()` and `loadBellowsPacketLedger()`.
- `lib/squibb/recommendation-session-server.ts:25` reads the latest intake and latest five matching runs globally.
- `lib/squibb/recommendation-session-server.ts:71-75` reads the latest five intake and saved-option rows globally.
- The page and loader contain no authenticated member or owner lookup. The underlying intake indexes also carry no owner key.

This is a cross-person read hazard, not merely unfinished export/deletion UX. `Your latest intake`, `What you need`, `What we heard`, and `Your recent intake and saved options` can describe another person's data.

### P0 - Removing visible paths does not remove serialized paths

`components/squibb/recommendation-surface.tsx` remains a client component and accepts the full `SquibbRecommendationSession` and `BellowsPacketLedger`. Those types include `packetPath`, `speakerEntryPath`, source paths, packet IDs, and intake content. Next.js must serialize client-component props before the browser can hydrate them. Removing the `<code>` elements only changes the visible DOM; raw HTML/RSC can still contain the path strings and personal sentinels.

The VPG8 acceptance phrase `no packet paths ... remain in the member demo surface` must include the network payload, not only screenshot text.

### P1 - The rules-score change corrupts two shared confidence surfaces

`components/squibb/confidence-meter.tsx` is also used by:

- `components/squibb/concierge-walkthrough.tsx:95-99`
- `components/squibb/speaker-human-read-panel.tsx:109-115`

The current unconditional copy says the value is a rules score supported by current rules and member input. Those other callers provide Speaker/read-hypothesis confidence, not the Autonomous Matching path score. A global rename is false. Use an explicit display mode such as `mode="rules_score"` only from the recommendation surface, while preserving the existing confidence mode for other callers.

The support band should use the supplied label rather than re-derive it from the number: the pause path intentionally carries score `55` with label `low`. Member copy should read `Strong / Moderate / Limited rules support`; it must not say likelihood, probability, eligibility, success chance, or predicted outcome.

### P1 - The contrast patch fixes the wrong layer

The current CSS overrides dark-surface tokens on the entire light-background `<main>`:

- `#e2c9a0` on `#f6efe5` is `1.40:1`.
- `#b5a48c` on `#f6efe5` is `2.13:1`.
- `#f7ecd4` on `#f6efe5` is `1.03:1`.

At the same time, the global warm-paper selector still makes card headings/strong text approximately `#1f1814` on `#2c231d`, only `1.14:1`. The same leak affects strong text inside dark evidence and ledger rows. A screenshot may look different because of antialiasing, but these combinations are not materially readable.

Do not solve this with page-wide token substitution. Scope light-on-dark tokens to the actual dark cards, evidence rows, source block, gate rows, and ledger rows with enough selector specificity to beat `main:not(.foundry-cockpit) h*`, `p`, `li`, and `strong`. Keep warm-paper text dark. Normal text must reach at least `4.5:1`; large text and non-text UI boundaries must reach at least `3:1`.

### P1 - Blanket adoption absorbs unrelated dirty work and changes authority meaning

At review start, four of the six allowed UI files were already dirty:

- `components/squibb/recommendation-surface.tsx`
- `components/squibb/human-gate-strip.tsx`
- `components/squibb/recommendation-card.tsx`
- `lib/squibb/recommendations.ts`

`components/squibb/confidence-meter.tsx` and the page CSS were clean.

The pre-existing `human-gate-strip` diff affects `/bellows/recommendations/test-case-0`, not only the main recommendation page. The `recommendations.ts` diff is an 80-line product-copy rewrite, not a narrow internal-path removal. It changes gates whose data still says `benMustApprove: true` to `Your approval` and changes `Ben must approve` to `An authorized reviewer must approve`. That can falsely tell a member that their approval or any reviewer satisfies a gate that the model still defines as Ben-specific.

Do not stage these files wholesale. Stage only reviewed hunks. Either preserve the actual approval authority in member-safe language (`Werkles review required`, plus member consent where applicable) or change the underlying authority model in a separately approved lane. VPG8 does not authorize the latter.

### P2 - Disabled-save draft is acceptable only with browser proof

The current draft removes the client `fetch`, removes all save handlers, renders all three action buttons disabled, and places calm closure copy immediately after them. That is materially stronger than disabling a still-wired handler. The server route remains an unconditional `403`.

Before G, add `aria-describedby` from the disabled group/buttons to the closure explanation, and prove visually that disabled styling is distinct. Do not treat source grep alone as behavioral proof.

## Exact minimal reopen condition

This NO-GO can return to P, not directly to G, after the existing Heimerdinker VPG8 packet is amended in place so there are still exactly two VPG8 packets and it explicitly authorizes this narrow containment:

1. Keep `MATCHING_AUTONOMOUS_PUBLIC = true` and keep LLM off.
2. Until authenticated owner binding exists, make `/bellows/recommendations` return the public example session and `ledger: { intakes: [], optionPackets: [] }` even in public-ON mode.
3. In that public-ON example path, call none of `readLatestSpeakerIntake`, `readLatestShadowRuns`, `readLatestSpeakerIntakeRows`, `readLatestSquibbRecommendationPacketRows`, `loadSquibbRecommendationSessionForBellows`, or `loadBellowsPacketLedger`.
4. Do not build an auth subsystem in VPG8. Owner binding remains a later gate.
5. Add a focused test that sets public mode ON, injects throwing/spying personal readers, and proves zero calls, empty ledger, example source, and absence of a private sentinel.

That is the smallest safe scope expansion. It preserves the approved public product mode while preventing a public request from choosing a global person's data. After that test passes, the save-truth, scoped rules-score, contrast, and selective-copy work may continue through P.

## Required behavioral and browser tests

### `VPG8-OWN-01` - public ON is example-only

Arrange public mode `ON`; make every personal reader throw and increment a counter. Call `loadPublicBellowsRecommendationPageData()`.

Expected:

- all personal-reader counters: `0`
- `session.source.mode`: `demo`
- `ledger.intakes.length`: `0`
- `ledger.optionPackets.length`: `0`
- seeded `PRIVATE_OWNER_B_SENTINEL`: absent from the returned object

### `VPG8-OWN-02` - raw response contains no private or internal payload

In an isolated fixture, seed the global latest intake, shadow run, and ledger with:

- `PRIVATE_OWNER_B_SENTINEL`
- `data/squibb/private-owner-b.json`
- `foreman/speaker/entries/PRIVATE_OWNER_B.md`

From a fresh unauthenticated browser context, GET `/bellows/recommendations`, capture both the rendered page and raw document/RSC responses.

Expected: all three sentinels are absent from visible text, document HTML, streamed RSC, script payloads, and browser console. The page shows the bakery example and an empty activity ledger.

### `VPG8-SAVE-01` - disabled controls cannot send

At desktop width `1440x1000`, intercept `**/api/bellows/recommendations/packet` and count requests.

Expected:

- the buttons `Save this option`, `Keep original path` (or its selected-card equivalent), and `Ask what proof is needed` are all natively disabled
- the adjacent explanation says saving is unavailable during the beta and nothing is sent
- normal pointer clicks, Enter, Space, `HTMLElement.click()`, and a hostile DOM test that removes `disabled` then calls `.click()` produce `0` requests
- the buttons are skipped by sequential keyboard focus
- computed disabled opacity is at most `0.55` and cursor is `not-allowed`

### `VPG8-SAVE-02` - direct POST remains fail-closed

Snapshot the recommendation-packet index, packet directory, and Speaker-entry directory. POST valid JSON, malformed JSON, empty JSON, and no content type directly to `/api/bellows/recommendations/packet`.

Expected for every request:

- status `403`
- JSON `state` equals `Blocked`
- no request body parsing dependency
- all three filesystem snapshots unchanged

### `VPG8-SCORE-01` - recommendation score is honest

On `/bellows/recommendations`, inspect ranked and catalog tabs and select every card.

Expected:

- no visible `%` and no visible `Confidence` in cards or selected detail
- compact cards contain no score
- selected detail contains exactly one `Rules score`, `N out of 100`, and one proximate sentence saying it is not probability, eligibility, or predicted outcome
- support band uses descriptive rules-support language and never says likely, qualified, eligible, approved, success, or match probability
- the visible score is within `0..100`

### `VPG8-SCORE-02` - shared surfaces keep their real semantics

Load `/bellows/recommendations/test-case-0` and the surface that renders `SpeakerHumanReadPanel`.

Expected: those views retain `Confidence` language and do not display `Rules score` unless their own data contract is separately changed. This test fails the current unconditional `ConfidenceMeter` rewrite.

### `VPG8-CONTRAST-01` - computed contrast and screenshot

At `1440x1000`, capture a full-page screenshot after selecting each tab. Compute foreground/background contrast for at least:

- card title, headline, kind, and flags
- detail heading, reasoning, rules-score explanation, and disclaimer
- evidence labels, strengths, sources, and missing states
- gate heading, reason, severity, and approval note
- empty-ledger heading, body, and link
- disabled action labels and adjacent closure note

Expected: normal text `>= 4.5:1`; large text and UI boundaries `>= 3:1`; no horizontal overflow; no clipped rules-score badge; focus indicators remain visible. The screenshot is supporting evidence, not a substitute for the computed checks.

### `VPG8-DIRTY-01` - selective adoption proof

Before commit, inspect the staged diff separately from the working-tree diff.

Expected:

- no unrelated path is staged
- `human-gate-strip` does not silently alter the test-case route
- no `benMustApprove: true` gate is presented as satisfied by only `Your approval` or an unspecified reviewer
- the staged `recommendations.ts` hunks are limited to reviewed member-safe copy
- unrelated pre-existing hunks remain unstaged

## Final P decision

`NO-GO`

Reason: public-ON ownership isolation is absent; hidden client payloads remain possible; the shared score component is mislabeled; the current contrast patch fails on both light and dark surfaces; and blanket adoption would absorb authority-changing unrelated work.

Reopen: amend the existing Heimerdinker packet with the example-only, empty-ledger, zero-personal-reader containment above, then return the corrected UI diff and test evidence to P.

`COMPLETED - P RECEIPT ONLY`
