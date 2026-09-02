# Swanson/Petra — Recommendation causal why pre-code review

Date: 2026-08-17
Response message: `4a3fae99-5e8a-4b27-86d1-219977b527ca`
Personal review: yes
Subagents used: none
Ruling: `PASS__PRE_CODE_ONLY`

## Accepted scope

One small repair to the existing Recommendation summary/readout seam. Make
`Why it fits` causally reference at least one specific Intake fact already
available from the submitted walkthrough. Preserve option label, why, caution,
next action, and visible fact-link structure.

## Exact sentence contract

```text
Because you said <specific Intake fact>, <option label> helps by <specific practical effect>.
```

Acceptable facts include a customer blocker, equipment blocker, constraint,
available asset, business stage, urgency, or local walkthrough answer. Generic
desire for recommendations/help, usefulness, or goal matching is insufficient.

## Rejected scope

No scoring, taxonomy, matching redesign, persistence, account custody, support
bands, reviewer workflow, governance language, provider work, new routes, push,
deploy, or full Intake echo.

## Required proof

At least one completed local Intake must visibly produce an option-labeled
why/caution/next-action readout where `Why it fits` cites a specific Intake fact
and explains its practical link. Full Intake echo and forbidden internal/custody
language must remain absent. Capture exact changed file hashes before hostile
review.

Candidate remains `BUILDER_ONLY__REVIEW_OWED` after repair until terminal exact-
candidate hostile review and assimilation.
