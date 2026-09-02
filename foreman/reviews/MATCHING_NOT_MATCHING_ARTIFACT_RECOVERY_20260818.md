# Matching / Not-Matching Artifact Recovery

Date: 2026-08-18  
Seat: Heimerdinker / Codex Foreman  
Execution context: `CODEX_LOCAL` on Betsy  
Status: `RECOVERED — BUILD MAP, NOT GO-LIVE APPROVAL`

## Finding

Werkles is not missing its matching architecture. It is partially built and
partially bypassed.

The recovered product is a **need-translation and formation system**. It asks
which structure can move a member forward before it asks which person matches
them. A valid result can be proof, a test, a supplier, training, capital
preparation, a person, a crew, or an honest pause. “No match yet” is a first-
class result, not an empty-state failure.

The current Recommendations page does execute the deterministic shadow
pipeline, but the member-facing intelligence is split between generic path
guidance and narrow hand-authored scenario branches. That creates the exact
failure Ben identified: the page can look personalized while the reasoning
does not generalize beyond cases someone anticipated in code.

## Recovered authority trail

| Artifact | Classification | What it establishes |
| --- | --- | --- |
| `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md` | Canonical doctrine, still DRAFT | Layer 0 Need Translation precedes the five-layer match stack; the output is a useful structure, not automatically a person. |
| `foreman/speaker/entries/DRAFT_20260608-not-matching-matching.md` | Causal warning, DRAFT | Interrupt any “matching algorithm” build that skips Layer 0, user sovereignty, and the possibility that the stated need is wrong. |
| `company/WERKLES_MATCHING_RULES.md` | Cross-linked product law, review draft | Explainability and Blueprint-centric multi-member formation. |
| `artifacts/matching-inbox/WERKLES_MATCHING_NOT_MATCHING_SOURCE_DOSSIER_20260708.md` | Recovered source dossier | Preserves Maker, Dink, Speaker, Wizard-of-Oz, recommendation-card, leverage, and early implementation history. |
| `foreman/receipts/WERKLES_MATCHING_NOT_MATCHING_ENGINE_20260709.md` | Implementation receipt | Deterministic shadow pipeline: signals → Layer 0 → not-match → path score → recommendation card → Squibb voice. |
| `foreman/receipts/WERKLES_MATCHING_SHADOW_QA_20260710.md` | Human QA receipt | Proved the pipeline ran and caught generic `verify_proof` dominance; demanded scenario-specific ranking. |
| `foreman/reviews/MATCHING_AUTONOMOUS_MULTI_ROLE_REVIEW_SYNTHESIS_20260716.md` | Actual Thufir/Bean/Ender-Doozer review synthesis | NO-GO on public delivery until ownership, gates, evidence, rights, adversarial proof, and operations were repaired. It did not reject the deterministic core. |
| `foreman/receipts/WERKLES_GHOST_MATCH_ENGINE_REDTEAM_SEAL_20260803.md` | Local Ghost Fleet implementation receipt | Added rules-only person ranking with visible capital, offer/blocker, reciprocity, situation, geography, and credential reasons. Explicitly said no CBCC seat had reviewed that slice at receipt time. |
| `foreman/handoffs/outbox/TO_DINK_MATCHING_NOT_MATCHING_SHADOW_QA_20260710.md` | Actual Dink mission packet | Confirms this was path-type reasoning first, not people matching. |
| `foreman/handoffs/inbox/FROM_BEAN_INTAKE_DUAL_PURPOSE_ACTUAL_CBCC_v0.1.md` | Actual Bean return, harvested 2026-08-16 | Requires explicit goal, blocker, assets, constraints, tried/considering/ruled-out state, horizon, and offer; unknown preservation; quote + rule traceability; negation/history fail-closed. |
| `foreman/handoffs/inbox/FROM_ENDER_VPGM_20260816-223710.md` | Actual Ender return, stale lineage but directly relevant content | Identifies the deficit-only Intake as both an emotional and matching failure; requires structured path status, assets, reciprocal offer, editable brief, and visible causality. |
| `foreman/handoffs/inbox/FROM_PETRA_BELLOWS_TWO_SEAT_PRODUCT_RULING_20260817.md` | Actual Petra ruling | Requires claim, source/freshness, support vs inference, contradiction/gap, next check, and Human Gate to remain separate in any sellable Bellows artifact. |
| `C:/Users/Ben Leak/Desktop/MouseWithoutBorders/FROM_DINK_20_USER_CONCIERGE_PROCESS_V1.md` | Recovered pre-repo Dink artifact | Preserves the human concierge method: hypotheses, evidence, reachable tests, pause, sovereignty, follow-up, and failure criteria. Imported into the source dossier. |

No distinct PookaKind repository was found under `C:/Users/Ben Leak/github` or
`Documents`. The older Dink material survives under
`Desktop/MouseWithoutBorders` and is already imported into the source dossier.
Any PK artifact Ben supplies should be compared against this trail rather than
treated as a replacement by default.

## The recovered architecture

### A. Opportunity reasoning — before any person search

1. Preserve the member's stated goal, blocker, stage, resources, offer, and
   constraints as separate self-reported inputs.
2. Diagnose possible leverage gaps: intrinsic, relational, amplification,
   structural, and optionality.
3. Produce multiple bottleneck hypotheses, each with supporting facts,
   missing facts, and falsifiers.
4. Evaluate not-match rules. Pause, proof-only, or suppress a risky path when
   the evidence does not justify it.
5. Rank **solution structures**: reversible test, proof, equipment, supplier,
   training, professional help, job/runway, capital preparation, a person, or
   a crew.
6. Give the member one concrete artifact or test they can complete, not a
   sentence of advice.

### B. Formation matching — only after a person or crew earns consideration

1. Layer 1: hard eligibility; impossible candidates are not soft-scored.
2. Layer 2: quality / anti-gaming throttle.
3. Layer 3: explainable compatibility.
4. Layer 4: two-sided preference and consent; one-sided ranking is not mutual
   matching.
5. Layer 5: Blueprint crew formation with complementary seats, redundancy,
   risk, geography, and missing-role coverage.

### C. Trust and proof — constrains both layers

Self-report, inferred signal, provider observation, verified claim, and human
judgment are distinct. A high rules score cannot stand in for identity,
capacity, credentials, consent, or trust. Crucible evidence can clear a named
gate; it cannot turn a recommendation into a universal badge.

## What exists in code now

| Layer | Current implementation | Honest state |
| --- | --- | --- |
| Intake → structured inputs | `lib/matching/signals.ts` | Real deterministic extraction; improved separation of past attempts from current intent; still regex/token based. |
| Leverage diagnosis | `lib/matching/leverage.ts` | Real coarse rules. |
| Layer 0 | `lib/matching/layer0.ts` | Real but shallow ordered templates; confidence is still partly word-count based. |
| Not-match | `lib/matching/not-match.ts` | Real pause/proof/person/capital guards. |
| Path scoring | `lib/matching/score-paths.ts` | Real deterministic scoring across twelve path types. |
| Explainable readout | `lib/matching/deliver.ts` | Facts, reasons, alternatives, proof gaps, falsifiers, and recommendation-card structure exist. |
| Member adapter | `lib/matching/shadow-to-recommendations.ts` | Re-scores saved signals and enforces public gates, but drops or flattens parts of the causal readout. |
| Work product | `lib/squibb/recommendation-solution-path.ts` | Twelve general playbooks and editable artifacts. |
| Personal plan | `lib/squibb/member-recommendation-plan.ts` | Strong for a few hand-authored digital-product and bakery/capacity patterns; generic fallback remains thin. |
| Person ranking | `lib/ghost-fleet/match.ts` | Local synthetic rules-only ranking with reciprocity, geography, and visible blockers. Not the five-layer production matcher. |
| Durable member/account custody | Not complete | Browser/file owner state is not durable account-owned continuity. |
| Layer 4 mutuality | Not complete | No two-sided choice/consent resolver. |
| Layer 5 crews | Not complete | Blueprints are doctrine/UI scaffolding, not a cohort builder. |

## The bypass causing today's product failure

`shadowRunToRecommendationSession()` does run the recovered pipeline, but then
the screen obtains its strongest content from `memberRecommendationPresentation()`
and `buildMemberRecommendationPlan()`. Those functions contain narrow
scenario detectors and bespoke prose. When a member falls outside a detector,
the generic fallback says to name a decision, name a fact, and run a test. That
is why one walkthrough can feel intelligent while another feels like a toy.

The correction is not “add more canned cases.” The correction is to make the
causal case itself the reusable product object.

## Build map

### Slice 1 — causal case contract (local, no schema)

Create one immutable deterministic object for every intake:

- member goal, stage, blocker, decision, resources, offer, constraints;
- hypotheses with evidence-for, evidence-against, missing evidence, and
  falsifiers;
- not-match result and suppressed paths;
- ranked solution structures;
- the one selected reversible test/artifact;
- profile contributions that can later feed formation matching;
- explicit provenance (`self_reported`, `rule_derived`, `verified`, `missing`).

The Recommendations page, Workshop, Intros, Crucible, and future LLM layer must
consume this same object rather than independently reinterpret the intake.

### Slice 2 — compositional plan builder

Replace scenario-sized prose branches with small reusable reasoning components:
stage × bottleneck × assets × constraint × path × evidence posture. Bespoke
playbooks remain useful, but they become templates populated by the causal case
rather than alternate brains.

### Slice 3 — solution/provider graph

Represent solutions as evidence-bearing records: category, geography, member
eligibility, job-to-be-done, cost/terms, source, observed date, sponsorship or
referral relationship, and falsifiers. This supports honest “nearest and best”
supplier/professional/lender comparison without inventing live providers.

### Slice 4 — formation graph

Use the starter profile plus live need, offer, trust gate, availability,
preferred first step, and proof to evaluate people only when a person path is
still eligible. Add two-sided preference before calling it a match; add crew
assembly only after enough real member evidence exists.

### Slice 5 — durable custody and optional semantic reasoning

Account-owned intake/profile/case persistence requires a reviewed schema/RLS
gate. An LLM may later propose hypotheses or summarize evidence, but deterministic
gates, provenance, member correction, and not-match authority remain outside
the model.

## Immediate decision

Do not throw away the current engine. Do not keep adding hand-authored special
cases as the main intelligence. Preserve the current path scorer and work-path
artifacts, then put a shared causal-case contract between Intake and every
downstream surface.

## Hard stops preserved

- no public matching flag flip;
- no LLM/provider enablement;
- no SQL/schema/RLS apply;
- no production member-data mutation;
- no push/deploy;
- no claim that an outbox request equals a CBCC review.
