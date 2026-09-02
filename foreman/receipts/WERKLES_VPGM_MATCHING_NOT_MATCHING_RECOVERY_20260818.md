# VPGM Receipt — Matching / Not-Matching Recovery

Date: 2026-08-18  
Seat: Heimerdinker / Codex Foreman  
Execution context: `CODEX_LOCAL` on Betsy  
Repo: `C:/Users/Ben Leak/github/Werkles`  
Branch: `maker/site-g-20260703`  
Starting commit: `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`

## V — packet authored

- `foreman/handoffs/outbox/V_HEIMERDINKER_MATCHING_NOT_MATCHING_ARTIFACT_RECOVERY_20260818.md`

Vision: recover the original system before inventing a replacement; identify
canon, implementation, superseded decisions, shortcuts, and the next safe
build; no SQL, LLM/provider, public flag, deploy, push, or production-data
action.

## P — pulled

### Original system

- `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md`
- `company/WERKLES_MATCHING_RULES.md`
- `foreman/speaker/entries/DRAFT_20260608-not-matching-matching.md`
- `artifacts/matching-inbox/WERKLES_MATCHING_NOT_MATCHING_SOURCE_DOSSIER_20260708.md`
- `foreman/receipts/WERKLES_MATCHING_NOT_MATCHING_ENGINE_20260709.md`
- `foreman/receipts/WERKLES_MATCHING_SHADOW_QA_20260710.md`
- `foreman/handoffs/outbox/TO_DINK_MATCHING_NOT_MATCHING_SHADOW_QA_20260710.md`
- `foreman/reviews/MATCHING_AUTONOMOUS_MULTI_ROLE_REVIEW_SYNTHESIS_20260716.md`
- `foreman/receipts/WERKLES_GHOST_MATCH_ENGINE_REDTEAM_SEAL_20260803.md`
- Dink archaeology under `C:/Users/Ben Leak/Desktop/MouseWithoutBorders/`

### Actual CBCC returns assimilated

- Bean: `foreman/handoffs/inbox/FROM_BEAN_INTAKE_DUAL_PURPOSE_ACTUAL_CBCC_v0.1.md`
- Ender: `foreman/handoffs/inbox/FROM_ENDER_VPGM_20260816-223710.md`
- Petra: `foreman/handoffs/inbox/FROM_PETRA_BELLOWS_TWO_SEAT_PRODUCT_RULING_20260817.md`

These are actual returned reviews. The Ender packet is stale for cockpit
lineage but its exact Intake/matching findings remain directly relevant and
were treated as review evidence, not current authority. No outgoing packet was
counted as cousin participation.

## G — strongest ideas executed

### G1. Recover the architecture and identify the bypass

Created:

- `foreman/reviews/MATCHING_NOT_MATCHING_ARTIFACT_RECOVERY_20260818.md`
- `foreman/crew-dispatch/missions/CBCC_MATCHING_NOT_MATCHING_RECOVERY_20260818.json`

Finding: the engine is not absent. The current member surface partially bypasses
it by depending on a handful of bespoke scenario branches; the generic fallback
is thin. The durable center should be one shared causal case consumed by
Recommendations, Workshop, Intros, Crucible, provider discovery, and later
formation matching.

The new mission was not dispatched. The relay correctly blocked on unread
actual CBCC returns, which were then pulled. That block prevented another false
“crew involved” claim.

### G2. Build the shared causal-case contract

Created:

- `lib/matching/opportunity-case.ts`
- `scripts/foreman/matching-opportunity-case-smoke.ts`

Integrated:

- `lib/matching/shadow-to-recommendations.ts`
- `lib/squibb/recommendations.ts`
- `lib/owner-surfaces/owner-state.ts`
- `app/dashboard/blueprints/page.tsx`
- `components/squibb/recommendation-surface.tsx`

The object keeps self-report, rule-derived hypothesis, and missing information
separate. It carries explicit project, stage, goal, current obstacle,
resources, offer, and constraints; hypotheses with supporting and missing
evidence plus falsifiers; not-match/suppressed paths; path support; and the
explicit starter-profile contribution. Unknown profile fields remain unknown.

Workshop now consumes the same object and shows a current hypothesis, missing
answers/evidence, and the most-supported structures. Recommendations now shows
the support classification and first lowering/exclusion reason for the selected
path.

### G3. Make structured path status executable

Updated:

- `lib/matching/types.ts`
- `lib/matching/signals.ts`
- `lib/matching/not-match.ts`

`Considering`, `Tried`, and `Ruled out` are now preserved as structured signals.
Only `Considering` can contribute to current intent. A ruled-out funding,
partner, employee/contractor, equipment/system, training/adviser, or relocation
path becomes an explicit not-match disqualification. The capital-plus-partner
Layer 0 result now suppresses premature person paths as the original Dink QA
required.

## M — momentum ideas

1. Shared the causal case with Workshop instead of leaving it as dead matching
   infrastructure.
2. Added member-visible support / lowering trace to Recommendations without
   reopening the full Intake transcript by default.

## Proof

PASS:

- `npx.cmd tsx scripts/foreman/matching-opportunity-case-smoke.ts`
- `npx.cmd tsx scripts/foreman/dual-purpose-intake-matching-smoke.ts`
- `npx.cmd tsx scripts/foreman/recommendation-insight-not-echo-smoke.ts`
- `npm.cmd run typecheck`
- scoped `git diff --check` (only expected CRLF notices)
- local browser `/dashboard/blueprints`: shared working-read section rendered
  from Ben's current nine-answer intake; no console errors
- local browser `/bellows/recommendations`: support and lowering trace rendered;
  no console errors

Known stale contract:

- `scripts/foreman/workshop-route-sequence-smoke.mjs` fails before the new
  assertions because it still requires the old post-submit string
  `router.push("/bellows/recommendations")`. The current product sequence has
  changed. This was not weakened or falsely reported as green.

## Hard stops preserved

- no Codex subagents or new environments;
- no new CBCC review claimed from the undispatched mission;
- no SQL/schema/RLS;
- no provider or LLM call;
- no production data mutation;
- no public matching enablement;
- no secret inspection;
- no git stage/commit/push/merge;
- no deploy.

## Next build

Use `OpportunityCase` to replace the scenario islands in
`member-recommendation-plan.ts` with compositional planning rules, then create
the evidence-bearing solution/provider record that can support sourced local
supplier, professional, lender, training, equipment, and member comparisons.

