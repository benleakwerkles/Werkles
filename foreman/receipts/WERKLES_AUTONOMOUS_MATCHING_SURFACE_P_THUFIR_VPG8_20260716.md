# Autonomous Matching Surface P — Thufir — VPG8

Date: `2026-07-16`
Reviewer seat: `Thufir@Betsy`
Execution context: `CODEX_LOCAL` on `Betsy` / hostname `BETSY`
Repository: `C:\Users\Ben Leak\github\Werkles`
Branch: `maker/site-g-20260703`
Packet starting authority: `92a30814a244fd99a3df0fd334103f984431a76c`
Current reviewed HEAD: `d183d8bcab872c001ac0ba740fc8d9f86ec4efa0`
Mode: product-claims and privacy issue spotting only; **not legal advice or legal approval**

## Inputs pulled

- `foreman/handoffs/outbox/TO_HEIMERDINKER_AUTONOMOUS_MATCHING_SAVE_TRUTH_VPG8_20260716.md`
- `foreman/handoffs/outbox/TO_LADY_JESSICA_AUTONOMOUS_MATCHING_READABILITY_VPG8_20260716.md`
- durable operator approval and public-flip implementation at commit `92a3081`, including `foreman/reviews/GATE-matching-autonomous-go-live-20260716.md`, `foreman/gates/APPROVAL_LOG.md`, and `lib/matching/feature-flags.ts`
- `foreman/receipts/WERKLES_AUTONOMOUS_MATCHING_GO_LIVE_20260716.md`
- `foreman/reviews/MATCHING_AUTONOMOUS_MULTI_ROLE_REVIEW_SYNTHESIS_20260716.md` and the three underlying role reviews
- the six packet-allowed member-surface files:
  - `components/squibb/recommendation-surface.tsx`
  - `components/squibb/human-gate-strip.tsx`
  - `lib/squibb/recommendations.ts`
  - `components/squibb/confidence-meter.tsx`
  - `components/squibb/recommendation-card.tsx`
  - `app/bellows/recommendations/squibb-recommendations.css`

## Controlling current state

- Autonomous Matching public delivery is **ON** by durable operator approval.
- LLM matching is **OFF**.
- Recommendation saving is **closed**: the direct packet POST currently returns `403` without parsing a body or writing an artifact.
- The go-live gate expressly accepted the then-known absence of member export/deletion UX and deletion automation. That operator risk decision is not a legal approval and does not prove those controls are implemented.
- When the public flag is ON, `loadPublicBellowsRecommendationPageData()` still enters the personal loader path. That path still uses global latest-intake, latest-run, and ledger reads without an authenticated member-owner boundary. This VPG8 UI slice does not repair that read/custody boundary.

## Current surface findings

1. The current selected detail says `Confidence`, renders a percent, and labels the meter `Recommendation confidence`. Recommendation cards and saved-activity rows also render percent scores. This still presents a rules total like calibrated certainty.
2. The current save controls can call `fetch("/api/bellows/recommendations/packet", ...)` and reveal the server closure only after interaction. The server correctly denies the write, but the interface still advertises an action it cannot perform.
3. The pending plain-language edits remove many internal paths, crew names, and operator labels from rendered controls. They are directionally sound. Member-visible strings in `lib/squibb/recommendations.ts` still include packet/dispatch framing and `Swanson's relay build`; those must not survive the bounded G surface.
4. Muted workshop colors remain too weak for important explanatory copy, evidence, gates, and empty states. The packet's page-scoped contrast repair is appropriate; it must not become a redesign.

## Exact acceptance wording

### Rules score

The selected detail must use these member-facing strings exactly:

```text
Rules score
N out of 100
Support band: <band>
This rules score shows how strongly the current rules support this option based on what you entered. It is not a probability of success, a measure of eligibility, or a predicted outcome.
```

Render the existing internal labels with these exact descriptive bands:

| Internal label | Member-facing band |
|---|---|
| `low` | `Limited rule support` |
| `medium` | `Moderate rule support` |
| `high` | `Stronger rule support` |

Accessibility wording must also say `Rules score`, use `N out of 100`, and expose the descriptive band. It must not announce `confidence` or a percent.

Recommendation cards may show the descriptive band, but no card may show a percent, `Confidence`, or a numeric score. Compact cards must omit the score entirely. If a legacy saved-activity row remains visible, it must not render `N%`; use `Rules score: N out of 100` or omit the number.

### Closed saving

Place this exact disclosure directly beside the disabled recommendation actions:

```text
Saving is unavailable during this beta. Nothing is sent to another person or organization from these controls.
```

All three recommendation actions must be disabled unconditionally. The client surface must have no active save handler and no reachable packet POST. The server-side `403` remains required as defense in depth.

Do not describe the entire beta as closed: recommendation delivery is public; **saving alone is closed**. The present direct-route response phrase `while this beta is closed` is imprecise copy debt outside this six-file surface slice, but the required `403` behavior is correct.

### Plain-language boundary

Rendered member copy must not expose packet paths, Speaker paths, run/storage identifiers, `Swanson`, internal crew routing, `operator`, `dispatch`, or raw workflow states such as `StagedForOperator`. Internal TypeScript names may remain when they are not rendered.

`Squibb` may remain as the approved mascot voice, but it must not make or imply verification, eligibility, guaranteed fit, or outcome claims.

## Privacy and launch boundary

This G slice may be described only as a **truthfulness, disabled-action, readability, and contrast repair**. It must not be described as fixing, approving, or proving:

- authenticated member ownership of intake, run, recommendation, or ledger records;
- anonymous/member A/member B isolation or protection against global-latest reads;
- authenticated export, correction, deletion request, deletion status, or retention automation;
- legal compliance, calibrated accuracy, fairness, eligibility, or predicted outcomes;
- a new go-live decision, LLM enablement, external introduction, provider routing, application, purchase, or money movement.

Those remain distinct build/review gates even though the operator approved public Autonomous Matching with stated residual risk.

## P verdict

`CONDITIONAL GO FOR BOUNDED G — UI TRUTHFULNESS ONLY`

Acceptance requires all exact wording and member-visible scrub conditions above, plus focused proof that:

1. no rendered card, detail, meter, or saved row uses `%` or `Confidence`;
2. the selected detail says `Rules score`, `N out of 100`, a mapped support band, and the full non-probability/non-eligibility/non-outcome sentence;
3. every recommendation action is disabled before interaction, the surface contains no client packet POST, and the direct route remains `403` with no write;
4. member-visible internal paths, crew/routing terms, and raw workflow states are absent;
5. the contrast patch is page-scoped and does not alter layout or introduce a new design system; and
6. receipts explicitly preserve the unresolved ownership, isolation, export, and deletion risks without claiming legal approval.

No product file, server, commit, push, deploy, flag, database, or production state was changed by this P review.

`COMPLETED — P RECEIPT ONLY — NO LEGAL APPROVAL CLAIM`
