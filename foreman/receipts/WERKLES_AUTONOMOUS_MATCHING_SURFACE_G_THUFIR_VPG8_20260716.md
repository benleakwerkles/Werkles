# Autonomous Matching Surface G Re-review — Thufir — VPG8

Date: `2026-07-16`
Reviewer seat: `Thufir@Betsy`
Execution context: `CODEX_LOCAL` on `Betsy` / hostname `BETSY`
Repository: `C:\Users\Ben Leak\github\Werkles`
Branch / reviewed HEAD: `maker/site-g-20260703` / `d183d8bcab872c001ac0ba740fc8d9f86ec4efa0`
Review mode: G acceptance re-review only; **not legal advice or legal approval**

## Verdict

`GO — BOUNDED G SURFACE CLAIMS PASS`

The current VPG8 diff satisfies the Thufir P wording for the actual public recommendation route. This verdict is limited to UI truthfulness, closed-save disclosure, recommendation-only score semantics, and the example-only public delivery boundary described below.

## Evidence

### Recommendation-only Rules score

- `/bellows/recommendations` calls the shared `ConfidenceMeter` with `variant="rules_score"`.
- Other existing callers keep the default confidence variant; VPG8 does not relabel Speaker or walkthrough confidence as a rules score.
- The selected recommendation renders exactly:
  - `Rules score`
  - `N out of 100`
  - `Support band: Limited rule support`
  - `Support band: Moderate rule support`
  - `Support band: Stronger rule support`
- The proximate limitation is exact:

```text
This rules score shows how strongly the current rules support this option based on what you entered. It is not a probability of success, a measure of eligibility, or a predicted outcome.
```

- Recommendation cards render no numeric score, percent, or `Confidence` label.
- A residual saved row, if supplied later, renders `Rules score: N out of 100` and no longer exposes raw action or workflow-state values.
- The rules-score meter's internal CSS width uses a percentage for layout only; no percentage is presented as member copy.

### Saving is closed before interaction

- All three recommendation actions are natively disabled with `disabled={SAVE_CLOSED_BETA}` and `SAVE_CLOSED_BETA = true`.
- The client surface contains no `fetch()` call, no packet POST path, and no save/stage action handler.
- The adjacent disclosure is exact:

```text
Saving is unavailable during this beta. Nothing is sent to another person or organization from these controls.
```

- `app/api/bellows/recommendations/packet/route.ts` remains an unconditional source-level `403` with state `Blocked`; it parses no request body and imports or calls no writer. This re-review did not start a server, so it does not claim a fresh runtime POST or filesystem-snapshot proof.

### Actual public route and internal-language boundary

- The public helper now returns an example session and an empty ledger whether the public flag is ON or OFF.
- It imports or calls none of the global/latest personal session or ledger loaders.
- With public mode ON, the visible source label is `Autonomous Matching example` and the detail says the public beta uses an example and no personal recommendation is shown until it can be tied to the member's account.
- A direct load of the actual example session produced `3` ranked items and `12` catalog items. Its member-content values contained no `packet`, `Speaker`, `Swanson`, `dispatch`, `StagedForOperator`, Foreman path, or Squibb storage-path string.
- The remaining ordinary phrases `hands-on operator` and `operator training` describe a business role and training subject; they are not an internal Werkles operator, crew-routing instruction, or workflow state.

### Focused proof

Command:

```text
node scripts/foreman/test-matching-vpg8-surface.mjs
```

Result: `PASS`

Checks reported:

- `public_example_only_zero_personal_readers`
- `empty_public_ledger`
- `save_controls_disabled_and_no_client_post`
- `recommendation_only_rules_score`
- `shared_confidence_default_preserved`
- `page_scoped_light_dark_contrast_tokens`
- `direct_packet_post_still_403`

Scoped `git diff --check` returned no whitespace error; only Windows LF-to-CRLF warnings were emitted.

## Reviewed snapshot hashes

- `components/squibb/recommendation-surface.tsx` — `2dfb293f6b7afcae5399e65837727ff50fc675806a96c3a4aa6ba09b67bb2007`
- `components/squibb/confidence-meter.tsx` — `1e313ff41899813e11e9d62fc013848344d3a7840f69c9c0387858bbefdff28f`
- `components/squibb/recommendation-card.tsx` — `48a3d06a87c850bff9b5b9787e5ae6643f7c70c109d2398f883b4d7d47f0440e`
- `components/squibb/human-gate-strip.tsx` — `a3fa5ca92037ed70fbfaa442662bd3e987b389e13574bb8a773d2e47949c875d`
- `app/bellows/recommendations/squibb-recommendations.css` — `46621422842c24bc510642486c0a79f5b86c2dcb29ccc780f296f85460345d88`
- `lib/squibb/public-recommendation-session-server.ts` — `2d4b5cedf58642b5f6ad24f50c80887f25e8c47f5321169523de6a4aa722c915`
- `app/api/bellows/recommendations/packet/route.ts` — `ac2b3cdf3a19080b9c6592c0b3541f3ed0e5feb21666c610c24a473a9cdbc6ab`
- `scripts/foreman/test-matching-vpg8-surface.mjs` — `2de814d02c6f52f3c2f6b3d273b8f719faf25964b76ae2a53d2377be22e312f0`

## Authority and unresolved-risk boundary

This G verdict does **not** approve or prove legal compliance, personalized Autonomous Matching delivery, authenticated owner binding, member A/member B isolation for a future personal-result path, export, correction, deletion request/status, retention automation, calibrated accuracy, fairness, eligibility, predicted outcomes, LLM use, external introductions, applications, purchases, or money movement.

The public flag and operator-approved product name remain ON, while the current public recommendation page is deliberately example-only. Authenticated personal delivery and all member-rights controls remain later build and review gates. The prior operator acceptance of export/deletion residual risk is not a substitute for implementation or licensed-counsel review.

No product file, server, commit, push, deploy, flag, database, or production state was changed by this G re-review. The only Thufir write is this receipt.

`COMPLETED — G RE-REVIEW PASS — NO LEGAL APPROVAL CLAIM`

## Pre-stage integrity addendum

Verdict: **`A — ADOPT BOTH COMPLETE COPY DIFFS INTO VPG8`**

The final browser/readability proof depends on the full worktree versions of:

- `lib/squibb/recommendations.ts` — SHA-256 `9787ea2aedf22ddb225d331b435dcf493f5ab5623e63e97537e12dfb6e3058c8` (`HEAD` blob `a77fbaa`; reviewed worktree blob `9d301fb`)
- `components/squibb/human-gate-strip.tsx` — SHA-256 `a3fa5ca92037ed70fbfaa442662bd3e987b389e13574bb8a773d2e47949c875d` (`HEAD` blob `83f56f6`; reviewed worktree blob `989f845`)

Their complete diffs are coherent copy-only adoption for this slice. A structural comparison of the HEAD and worktree recommendation decks returned equal IDs, kinds, ranks, scores, score labels, evidence IDs/strengths, gate IDs/kinds/severities, and `benMustApprove` values: `3` ranked recommendations, `12` catalog recommendations, `33` gate instances, and `15` Ben-approval gate instances in both versions. `HumanGateStrip` changes only member-visible strings and a local variable name; its blocker and `benMustApprove` conditions are unchanged.

Authority meaning is preserved as follows:

- `An authorized reviewer must approve` and `Review required` are public abstractions for an existing gate; they do not delegate approval or change the cockpit rule that Ben is the decision-maker.
- `Your approval` and `Your judgment` add the member's consent/choice for introductions, purchases, and career decisions. They do not satisfy or replace any `benMustApprove: true` gate; the separate review-required notice remains visible.
- `No additional review` means no additional **approval authority** for that gate. It does not waive the adjacent requirement text. In particular, the three non-Ben financial-claims warnings still say the claims must be verified before a lender introduction.
- Legal-review, blocker, verification, no-introduction, no-funds, and no-contract protections remain present; no guarantee, eligibility, verified-person, calibrated-confidence, or predicted-outcome claim is added.

Exact non-blocking risks retained:

1. `Authorized reviewer` is intentionally generic and may leave a member unsure who reviews; cockpit authority remains controlling and the phrase must never be cited as delegation evidence.
2. `No additional review` can be read too broadly without its adjacent label/reason; future copy should prefer `No separate approval`, but the current rendered requirement still preserves financial verification.
3. The generic gate-strip copy also appears on the test-case/shared recommendation consumer, not only the main route. This is a consistent member-language change, not a logic expansion.
4. Dormant `buildLiveIntakeRankedDeck()` copy still contains packet/relay jargon that predates this adoption. The current public helper never calls that path and remains example-only. Any future authenticated personal-result enablement must scrub and re-review that dormant copy first.

Omitting either complete diff from the staged VPG8 commit would restore member-visible `Operator`, `Dink`, `Petra`, `Thufir`, `Ender`, `Crucible`, `Bellows`-workflow, or `Ben must approve` presentation from HEAD and would invalidate the current browser proof and this G receipt.

No product file was changed by this addendum.

`COMPLETED — PRE-STAGE INTEGRITY A — COPY DIFFS APPROVED FOR VPG8 ADOPTION ONLY`
