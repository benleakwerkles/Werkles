# TO THUFIR — Matching Autonomous Legal and Compliance Review

Packet: `TO_THUFIR_MATCHING_AUTONOMOUS_LEGAL_COMPLIANCE_REVIEW_20260716`  
Owner: Thufir  
Requested by: Ben (Operator)  
Prepared by: Heimerdinker on Betsy  
Date: 2026-07-16  
Mode: review only

## Mission

Determine whether Werkles should publicly label its existing matching readout as autonomous and member-ready. Identify applicable or plausibly applicable U.S. legal/compliance regimes, missing facts, required product controls, and claims that should not be made.

This is issue spotting and launch-risk review, not legal advice or legal approval.

## Source artifacts

- `foreman/reviews/GATE-matching-autonomous-go-live-20260716.md`
- `foreman/reviews/WERKLES_MATCHING_DATA_POLICY_DECISION_V0_20260711.md`
- `foreman/receipts/WERKLES_MATCHING_READOUT_REDEPLOY_20260716.md`
- `foreman/NEXT_ACTION.md`
- `foreman/HUMAN_GATES.md`
- `lib/matching/**`
- public discovery/bellows intake and recommendation surfaces

## Known contradiction to resolve

The gate says Data Policy V0 was approved, while the policy artifact says `RECOMMENDATION - NOT APPROVED POLICY`. The policy also says authenticated export and deletion-request handling should exist before public matching; the gate says those surfaces are not built.

## Required legal issue areas

- privacy notice, consent, access, correction, export, deletion, retention, and sensitive-data handling
- profiling and automated-decision opt-out/appeal obligations where applicable
- employment, credit/lending, housing, insurance, education/training, or similar high-impact decision rules
- FTC/state UDAP risk from `autonomous`, `verified`, `match`, confidence, partner, and outcome claims
- FCRA/ECOA and employment-AI boundaries, including what facts would make them apply
- age/children, accessibility, discrimination, and recordkeeping considerations
- state-law applicability thresholds and facts still needed about users, geography, revenue, and processing volume

## Research rule

Use current primary or official sources for legal claims. Distinguish:

- clearly applicable requirement
- conditionally applicable requirement
- prudent control not yet legally required
- unknown requiring licensed counsel

Do not state that Werkles is legally compliant.

## Required output

Write:

`foreman/reviews/THUFIR_MATCHING_AUTONOMOUS_LEGAL_COMPLIANCE_REVIEW_20260716.md`

Include:

- executive verdict: `GO`, `CONDITIONAL GO`, or `NO-GO`
- controlling facts and unknowns
- issue matrix with source links
- minimum launch blockers
- required copy/product/policy changes
- counsel questions
- retest conditions

## Boundaries

No product edits, flag flip, deploy, push, merge, SQL, privacy-policy approval, legal approval, external communication, or production mutation.
