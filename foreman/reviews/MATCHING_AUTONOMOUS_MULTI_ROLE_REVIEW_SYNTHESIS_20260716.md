# Matching Autonomous Multi-Role Review Synthesis

Date: 2026-07-16  
Machine: `Betsy` / hostname `BETSY`  
Branch / inspected HEAD: `maker/site-g-20260703` / `176a5862b2628d878d7b4ecc4105668fd880b8bd`  
Review seats: Thufir (legal/compliance issue spotting), Bean (hostile attack review), Ender/Doozer (bounded build readiness)  
Status: `REVIEW COMPLETE — NO LEGAL APPROVAL`

## Combined disposition

`NO-GO`

Do not approve `GATE-matching-autonomous-go-live-20260716.md`. Keep `MATCHING_AUTONOMOUS_PUBLIC` off and replace the current flip gate with a containment-and-retest gate.

This verdict does not reject the deterministic matching core. It finds that the current delivery boundary, member custody, safety-gate conversion, data-rights implementation, launch claims, and operational proof are not public-ready.

## Verified live-state boundary

A read-only GET of `https://werkles.com/bellows/recommendations` returned:

- HTTP `200`
- `X-Vercel-Cache: PRERENDER`
- a visible `Demo scenario`
- no observed latest-intake or shadow-readout content

No current or historical cross-member disclosure was proven by this review. The source nevertheless contains a severe global-load path: the page loader reads the globally latest intake, shadow runs, and ledger without a member key, and the page can prerender that result. A future build, prerender, runtime invocation, or redeploy with stored intake data can expose or freeze another member's material. Preserve evidence and have licensed counsel determine whether a deeper incident assessment is required; do not label an incident confirmed without evidence.

## Shared launch blockers

1. **No member ownership boundary.** Personal intake, run, ledger, and saved-option reads are global rather than authenticated and owner-scoped.
2. **OFF is not a kill switch.** `loadSquibbRecommendationSessionForBellows()` permits a run when the public flag is on **or** the run mode is `shadow`; persisted runs are always shadow. The advertised rollback does not reliably close delivery.
3. **Unauthenticated mutation.** The recommendation-packet POST route has no authenticated ownership check.
4. **Safety conversion fails open.** Disqualified paths remain in the deck and can be saved, while `shadowRunToRecommendationSession()` assigns `humanGates: []` to every converted path.
5. **Policy state is internally inconsistent and not implemented.** The durable approval log records Matching Data Policy V0 as approved on 2026-07-12, while the policy artifact still says `RECOMMENDATION - NOT APPROVED POLICY`. More importantly, the approved policy requires authenticated export and deletion-request handling before public matching, and those controls do not exist.
6. **Evidence is too thin for the claim.** Three hand-authored golden paths prove a narrow smoke test, not isolation, negation, mixed-domain behavior, fairness, accessibility, correction, rights handling, calibration, or member outcomes.
7. **The readout overstates certainty and drops evidence.** A heuristic path score is displayed as percentage confidence; fact values, falsifiers, proof gaps, and what-would-change information do not survive the adapter into the member experience.
8. **Member control is incomplete.** There is no owned correction, rejection, appeal/human-review, export, deletion, or request-status workflow.

## Legal/compliance issue-spotting result

This review is not legal advice or legal approval.

- Truthful, substantiated product claims and reasonable data-security controls are immediate baseline concerns. `Autonomous`, actual `match`, unsupported `verified`, and percentage-confidence language are stronger than the present evidence supports.
- Comprehensive state privacy laws, California/Colorado automated-decision rules, Washington consumer-health-data rules, age/minor rules, and specific data-rights duties are fact- and threshold-dependent. Werkles needs a state/applicability and processor/data map before launch.
- FCRA, ECOA/credit, employment-AI, securities/broker, housing, insurance, education, and similar regimes are not established merely by giving user-side general guidance. Risk changes sharply if Werkles furnishes scores to decision-makers, makes or materially influences eligibility, performs introductions/routing, or receives referral or transaction compensation.
- Public matching should remain bounded to transparent, reversible user guidance. Any regulated decision, external introduction, provider routing, money movement, LLM use, or compensation relationship requires a separate product and legal gate.

## Smallest ordered build

0. **Containment:** make OFF real; keep anonymous output demo-only; prevent personalized prerendering; reject unauthenticated packet writes; preserve evidence.
1. **Owned custody and notice:** authenticate and owner-scope every artifact; preserve source intake separately from derived signals; record policy/retention metadata; add pre-submit notice, sensitive-data and age posture, and abuse/session controls.
2. **Truthful readout and enforced gates:** restore domain gates; block disqualified actions server-side; show facts, sources, proof gaps, falsifiers, and what would change; rename percentage confidence to an honest rules/rank score.
3. **Member rights and control:** correction, rejection, appeal/human review, feedback, authenticated export, deletion request, and visible status.
4. **Adversarial evaluation:** two-member isolation; static-build safety; negation and contradiction; every domain; direct-API gate bypass; accessibility; failure and rollback cases.
5. **Operations and replacement gate:** fail-closed runtime switch, privacy-safe monitoring, incident owner/runbook, accessibility proof, sampled human review, licensed-counsel scope determination, and a clean replacement go-live gate.

## Replacement gate posture

The existing approval phrase must not be reused as authority. A replacement gate should open only after Slices 0–5 have durable receipts and should enable only named recommendation domains.

Recommended disposition text:

```text
HOLD MATCHING AUTONOMOUS PUBLIC DELIVERY. KEEP THE PUBLIC FLAG OFF. REOPEN ONLY AFTER MEMBER OWNERSHIP, REAL OFF/ROLLBACK, SERVER-ENFORCED DISQUALIFIERS AND DOMAIN GATES, POLICY/NOTICE/EXPORT/DELETION IMPLEMENTATION, CORRECTION/APPEAL, ADVERSARIAL AND ACCESSIBILITY PROOF, OPERATIONS RECEIPTS, AND LICENSED-COUNSEL SCOPE REVIEW PASS.
```

## Role receipts

- `foreman/reviews/THUFIR_MATCHING_AUTONOMOUS_LEGAL_COMPLIANCE_REVIEW_20260716.md`
- `foreman/reviews/BEAN_MATCHING_AUTONOMOUS_GO_LIVE_ATTACK_REVIEW_20260716.md`
- `foreman/reviews/ENDER_DOOZER_MATCHING_AUTONOMOUS_BUILD_READINESS_REVIEW_20260716.md`

## Execution boundary

Review artifacts only. No product code, database schema, production data, environment flag, deployment, push, merge, or external message was changed.

`COMPLETED — REVIEW VERDICT NO-GO`
