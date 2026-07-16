# Ender / Doozer — Matching Autonomous Build Readiness Review

Status: `COMPLETED — REVIEW ONLY`  
Machine: `Betsy`  
Role: Ender / Doozer build-readiness seat  
Branch reviewed: `maker/site-g-20260703` @ `176a5862b2628d878d7b4ecc4105668fd880b8bd`  
Production receipt reviewed: `a2c5a6ca224e925b3c90fbf390808f57c19afdda`  
Date: 2026-07-16

## Recommended gate disposition

`NO-GO`

Keep `MATCHING_AUTONOMOUS_PUBLIC` off. Withdraw the current public-flip gate and replace it with a build-and-retest gate after the ordered slices below are complete.

This is not a rejection of the matching core. It is a finding that the current core is an internal hypothesis generator with useful safety ideas, while the surrounding member experience, ownership boundary, data rights, domain gates, quality proof, and incident controls are not yet ready for a public autonomous claim.

## Human-experience verdict

A member can give Werkles personal free text and receive something that looks more certain and more member-specific than the implementation can presently defend. The engine internally distinguishes self-reported and inferred facts, records proof gaps, offers falsifiers, and supports a not-match pause. Those are good bones. The public journey does not carry all of those protections through to the screen or the saved action.

The smallest responsible move is not a sidebranch or platform rewrite. It is to close five seams around the existing engine: ownership, notice, explanation, member control, and operations.

## Evidence boundary

- The three production golden scenarios passed: `capital_partner`, `job_change`, and `training_not_partner`.
- Those checks prove three expected outputs and durable writes. They do not establish broad recommendation quality, member isolation, fairness, accessibility, data-rights handling, or incident readiness.
- A coordinator live GET of `https://werkles.com/bellows/recommendations` returned `200`, `X-Vercel-Cache: PRERENDER`, and the visible `Demo scenario`. This review therefore does **not** claim a currently observed cross-member disclosure.
- The deployed source nevertheless uses global “latest” readers with no member key and can prerender the result. A build containing stored intake data could embed globally selected data, and the recommendation-packet POST is unauthenticated and unscoped. That is a proven unsafe data flow and mutation boundary even though current live HTML showed only the demo.
- The durable approval log records Matching Data Policy V0 as approved on 2026-07-12, but the policy document still says `RECOMMENDATION - NOT APPROVED POLICY`. The decision may be real, but the source artifacts contradict each other and must be reconciled before they govern public claims.

## Thufir and Bean synthesis

The finalized independent reviews agree with this `NO-GO` and sharpen the minimum build:

- Thufir distinguishes the favorable current `PRERENDER` demo response from the severe future build/runtime exposure path and requires an evidence-preserving, counsel-led incident assessment without presuming a breach occurred.
- Thufir confirms the policy was durably approved in `foreman/gates/APPROVAL_LOG.md`; the policy artifact's status is stale. Bean's wording that the policy was never approved overstates that point, but Bean is correct that the approved policy's prerequisites are not implemented.
- Thufir requires a real sensitive/health-data posture, an adult-only or minor-capable age posture, a data/processor inventory, rate/abuse/CSRF controls, prohibited downstream regulated uses, and written counsel scope before launch.
- Bean proves that disqualified paths remain in the engine deck, lose all human/legal gates, and can be submitted to the packet endpoint. A disqualifier must be enforced server-side, not merely described in the UI.
- Both reviews reject “autonomous,” actual “match,” unsupported “verified,” and percentage-confidence language until the claim is substantiated in context.

## Current journey failure points

| Journey point | Current implementation | Human failure |
|---|---|---|
| Before submission | Discovery and Bellows ask for free-text situation, employment, financial, identity/contact, and constraint information without an adjacent retention, access, export, deletion, automated-analysis, or sensitive-data notice. | A member cannot make an informed choice about custody. |
| Submission | Discovery and Bellows intake APIs accept public writes. Bellows storage and recommendation packet storage are repo/file-global; durable matching custody does not carry an authenticated member owner. | There is no durable answer to “whose intake is this?” or “who may retrieve or act on it?” |
| Custody | `ensureIntakeCustody()` upserts the matching signal payload into the same `discovery_intakes` row used for the original discovery record. Policy fields such as `policy_version`, `retention_class`, and `delete_after` do not exist. | Original intake custody can be overwritten by a reduced matching payload, while retention and provenance are not inspectable. |
| Recommendation retrieval | `loadSquibbRecommendationSessionForBellows()` calls global `readLatestSpeakerIntake()`, `readLatestShadowRuns()`, and global ledger readers. Its condition accepts every run whose mode is `shadow`, so the public flag does not actually prevent member-facing shadow output. | “Your latest intake” is not demonstrably the current member’s intake, and OFF is not a trustworthy delivery boundary. |
| Static delivery | `/bellows/recommendations` is prerenderable and has no request/member context. | A build can freeze a global result into HTML; personalized data must never depend on build-time “latest.” |
| Readout | Internal facts contain values, strengths, sources, falsifiers, and proof gaps. The adapter drops fact values, falsifiers, and proof gaps before the UI. | Members see labels and conclusions without the complete evidence needed to inspect or challenge them. |
| Confidence | Path score is displayed as a percentage “Confidence,” while Layer 0 separately reports low/medium confidence. | A ranking weight can be mistaken for calibrated probability or certainty. |
| Domain safety | Existing demo/live-deck gates cover capital, partners, jobs, and intros, but `shadowRunToRecommendationSession()` sets `humanGates: []`. | The real engine path silently removes protections that the demo path teaches members to expect. |
| Disqualified paths | Scoring retains disqualified paths in the returned six; the adapter converts them into recommendations and the packet API accepts any recommendation present in the deck. | A member can save a high-risk path that the not-match layer explicitly ruled out. |
| Member choice | Members may save, keep, or request proof, but there is no correction, reject-as-wrong, appeal/review, feedback, or “what data did you use?” workflow tied to an owned run. | Sovereignty is copy, not an operational control. |
| Data rights | No authenticated export, deletion request, deletion status, or tombstone flow exists. The foreign key uses `on delete restrict`. | The approved policy prerequisite for public matching is unmet. |
| Operations | Public delivery uses a source-code constant and rollback-by-redeploy. There is no run-quality monitor, incident state, bounded member notification path, or sampled-review receipt. | A bad or leaky result cannot be stopped, explained, and audited quickly enough. |

## Must build before public delivery

1. **A real member boundary.** Every personalized intake, run, recommendation, saved option, export, and deletion request must have an authenticated owner or a deliberately designed one-time anonymous retrieval capability. No global “latest” member path.
2. **A trustworthy OFF state.** When public delivery is off, no shadow readout reaches a public/member recommendation surface. Personalized pages must be request-bound, not prerendered from repository data.
3. **Pre-submit notice and explicit policy version.** Say what is collected, why matching uses it, who can read it, what is self-reported versus inferred, the intended 90-day raw/365-day minimized retention, and how to request export/deletion. Record the accepted policy version and time.
4. **Inspectible custody.** Store owner, source, policy version, retention class, delete-after time, and linked attempt. Preserve the submitted source record; do not overwrite it with the matching signal projection.
5. **A truthful readout.** Show the member’s source facts and values, inferred hypotheses, missing/verified proof, confidence basis, falsifiers, alternatives, and what would change the result. Do not present a rank score as a calibrated confidence percentage.
6. **Restore domain gates to engine output.** Capital, lending, partnership, intro, job, relocation, training, and proof-verification paths need the same or stricter guarded-action language and stops as the existing demo deck.
7. **Correction, rejection, appeal, and feedback.** A correction creates a linked new attempt and never rewrites the prior run. A member can mark a read wrong, explain why, ask for human review, and see status.
8. **Authenticated export and deletion request/status.** Export the owned intake and dependent runs. Deletion removes dependent runs before the intake, records a non-personal tombstone, and exposes requested/in-review/completed/blocked status.
9. **Broader deterministic tests and human sample review.** Prove isolation, negation, thin/contradictory text, every recommendation domain, irrelevant demographic variation, proof states, failures, rights flows, accessibility, and rollback—not only three happy scenarios.
10. **Fail-closed operations.** Add an operational public-delivery switch defaulting off, monitoring, a named incident owner, stop conditions, a sampled-review cadence, a clean rollback receipt, and a member-facing correction path for affected runs.
11. **Sensitive-data, age, and abuse posture.** Choose and enforce how health/sensitive free text is prevented, quarantined, purged, or lawfully handled; choose an adult-only or minor-capable posture; add rate limiting, CSRF/session protection, safe errors, and data minimization.
12. **Legal launch scope.** Record the data/processor inventory, applicable-state facts, prohibited downstream regulated uses, and written licensed-counsel launch determination. User-side guidance must not silently become a score furnished for eligibility or adverse decisions.

## Domain-specific public boundaries

| Domain | Before public | Boundary that must remain visible |
|---|---|---|
| Capital / lending | Require structure/proof review before any lender, credit-union, investor, or raise-capital action. Restore the capital and financial-claims gates on engine results. | A ranked path is not credit eligibility, underwriting, investment advice, an offer, or a guarantee. No money, application, or intro moves automatically. |
| Jobs / relocation | Treat preferences, qualifications, constraints, and availability as self-reported unless separately verified. Require human choice before any external use. | The readout must not make hiring, firing, screening, compensation, or adverse-action decisions and must not infer protected characteristics. |
| Training / credentials | Show provider, cost, accreditation/licensure relevance, time, and outcome claims as unknown until sourced and current. | A training recommendation is not a promise of licensure, employment, earnings, or provider quality. |
| Partners / people / intros | Keep person paths suppressed when “partner” may be a symptom; require identity/proof checks and a human introduction gate. | No trust, fit, background, equity, availability, or outcome guarantee. No contact or intro without both sides’ deliberate participation. |
| Proof verification | Bind every `verified` fact to a current verification receipt and expiry; keep self-report and inference visibly distinct. | Missing proof is not automatically negative proof, and an engine inference never becomes “verified” by repetition. |

## Accessibility and plain-language requirements

- Use “Werkles recommendation” or “recommendation readout” on the member surface. Do not use “autonomous” as a benefit claim; it describes implementation, not member value.
- Explain “inferred,” “self-reported,” “verified,” “rank score,” “what would change this,” “human review,” and “delete request” in ordinary language next to the control.
- Do not rely on color for evidence strength, confidence, blockers, or status.
- Keyboard and screen-reader users must be able to select a recommendation, read the selected state, inspect evidence, submit correction/appeal/export/deletion, and hear async status changes.
- Preserve focus after errors and updates; associate field errors and character limits; support 200% zoom, small screens, reduced motion, and high contrast.
- Run an automated accessibility scan plus a manual keyboard and screen-reader pass on intake, readout, correction, export, and deletion-status flows.

## Smallest ordered build slices

### Slice 0 — Contain unscoped delivery now

**Build**

- Make the public flag a real delivery boundary: OFF means no personalized shadow readout or global saved-activity ledger on public/member surfaces.
- Stop `/bellows/recommendations` from prerendering personalized data.
- Reject unauthenticated/unowned recommendation-packet mutations. Until ownership exists, the only safe public state is a clearly labeled demo with no personal ledger.
- Before another build or redeploy, preserve relevant deployment/cache/log evidence and perform an authorized incident assessment without reading member content ad hoc or presuming that a disclosure occurred. Do not destroy possible evidence under a retention cleanup until counsel clears preservation.

**Allowed files**

- `lib/matching/feature-flags.ts`
- `lib/squibb/recommendation-session-server.ts`
- `app/bellows/recommendations/page.tsx`
- `app/api/bellows/recommendations/packet/route.ts`
- `components/squibb/recommendation-surface.tsx`
- one focused containment test under `scripts/foreman/`

**Proof**

- OFF + anonymous: demo only, no intake-derived text, no saved activity.
- OFF + existing shadow run: still no member delivery.
- Anonymous packet POST: `401` or `403`, no artifact written.
- Production build output contains no intake-derived text and the page is request-bound if personalized.
- Incident-assessment receipt distinguishes the observed current demo response, historical unknowns, future execution risk, evidence preserved, and counsel's separate notification determination.

### Slice 1 — Member-owned custody and informed intake

**Build**

- Require an authenticated member for Bellows personalized storage/retrieval, or design a narrow one-time anonymous retrieval capability before accepting anonymous matching. Do not mix the two.
- Add owner and custody metadata to intake, matching run, and saved-option records.
- Preserve the source intake and store matching signals as a projection instead of overwriting source custody.
- Add the short pre-submit notice, full privacy/data-use page, consent checkbox where needed, and recorded policy version/time.
- Choose and enforce the sensitive/health-data and age posture; add rate limiting, CSRF/session protection, safe errors, and no unnecessary internal file/run identifiers in public responses.
- Reconcile the approved decision in `foreman/gates/APPROVAL_LOG.md` with the stale status in the policy artifact before coding to it.

**Allowed files**

- `middleware.ts` and the existing server-auth helper only as needed
- `app/bellows/intake/page.tsx`
- `components/squibb/concierge-intake-form.tsx`
- `app/api/bellows/intake/route.ts`
- `app/discovery/page.tsx`
- `app/discovery/discovery-intake-form.tsx`
- `app/api/discovery/intake/route.ts`
- one bounded public privacy/data-use route
- `lib/discovery/{schema,concierge,intake-custody}.ts`
- `lib/squibb/{concierge-intake-storage,recommendation-packet-storage,recommendation-session-server}.ts`
- `lib/matching/{types,shadow-store}.ts`
- one new matching-custody migration under `supabase/migrations/`
- `foreman/reviews/WERKLES_MATCHING_DATA_POLICY_DECISION_V0_20260711.md`
- focused ownership/custody tests

**Proof**

- Anonymous, Member A, and Member B test: no cross-member read, list, mutation, export, or identifier lookup.
- Static HTML contains no member data; build with seeded fixtures cannot embed them.
- Database rows carry `member_id`, `policy_version`, `retention_class`, `delete_after`, source, and linked-attempt metadata.
- Submitted source payload remains intact after matching storage.
- Missing/old consent version fails closed without writing.
- Sensitive/health-data, underage, abuse-rate, CSRF, and oversized-input tests fail in the approved manner and do not persist prohibited content.
- RLS/schema application remains a separate Tier 1 SQL gate with its own receipt.

### Slice 2 — Truthful readout and restored gates

**Build**

- Carry fact value, evidence strength, source, proof gaps, falsifiers, alternatives, and “what would change” from `MatchingReadout` into the member UI.
- Separate rank score from epistemic confidence; remove percentage certainty until calibration exists.
- Reuse one canonical domain-gate function for demo and engine decks. Never emit `humanGates: []` by default.
- Remove disqualified paths from actionable rankings or render them as blocked explanations, and enforce the same disqualification and gate checks in the packet API.
- Rename member-facing “Autonomous matching (shadow)” to plain, state-accurate language.

**Allowed files**

- `lib/matching/{types,deliver,shadow-to-recommendations}.ts`
- `lib/squibb/recommendations.ts`
- `components/squibb/{recommendation-surface,recommendation-card,reasoning-panel,evidence-section,confidence-meter,human-gate-strip}.tsx`
- `app/bellows/recommendations/squibb-recommendations.css`
- `app/api/bellows/recommendations/packet/route.ts`
- focused adapter/render tests

**Proof**

- Every displayed conclusion can be traced to a displayed self-reported, inferred, verified, or missing item.
- Fact values, falsifiers, proof gaps, and what-would-change text survive adapter and render tests.
- Low Layer 0 confidence cannot render as “high confidence” because a path score is high.
- Every recommendation kind has the expected domain gate; capital/person/job paths cannot save as action-ready when their gate is unmet.
- Direct POST of a disqualified or ungated recommendation ID fails closed and writes nothing.
- A member can understand the result without knowing “Layer 0,” “not-match,” “shadow,” or “Squibb.”

### Slice 3 — Correction, appeal, export, deletion, and status

**Build**

- Add owned controls for: correct source facts, reject this read, explain why, request human review, provide feedback, export data, request deletion, and inspect request status.
- Corrections create a new linked intake/run attempt; append-only history remains intact.
- Export includes the owned intake, readouts, saved options, policy metadata, and clear evidence labels.
- Deletion removes dependent matching runs and member-owned packets before the intake, then writes only the approved non-personal tombstone.

**Allowed files**

- a focused member matching page under `app/dashboard/matching/`
- matching-rights routes under `app/api/member/matching/`
- one bounded rights service under `lib/matching/`
- the Slice 1 custody migration or one separate rights migration under `supabase/migrations/`
- existing intake/readout components only where controls render
- focused rights-flow tests

**Proof**

- Member A cannot address Member B’s run even with a known ID.
- Correction yields a new run linked to the old one; the old run is unchanged.
- Rejection/appeal status is visible and survives refresh.
- Export round-trip matches owned records and contains no other member data.
- Deletion test proves dependent-order removal, final tombstone contents, repeat-request idempotency, failure recovery, and visible completion status.
- Destructive production deletion automation stays behind its own reviewed gate.

### Slice 4 — Domain and adversarial test matrix

**Build**

- Convert the engine scenarios into deterministic fixtures with expected eligible, disqualified, confidence, evidence, and gate outcomes.
- Add explicit negation/contradiction handling before keyword signals are treated as positive intent.
- Add a redacted, bounded human review rubric for recommendation usefulness and harm.

**Allowed files**

- `lib/matching/{signals,leverage,layer0,not-match,score-paths,deliver}.ts`
- matching fixtures/tests under `scripts/foreman/`
- no new production subsystem

**Proof matrix**

| Class | Minimum cases |
|---|---|
| Isolation | anonymous, Member A/Member B, guessed ID, stale session, static build, unauthenticated POST |
| Thin / contradictory | empty, one vague answer, conflicting answers, “I do not want a loan/partner/job,” sarcasm, typo, long text, Unicode, non-English/unsupported language |
| Capital | idea/no customers, verified revenue, emergency money, debt aversion, partner plus capital, proof-only stop |
| Jobs | better job, stay put, training first, schedule/pay/geography constraints, irrelevant protected-trait variation |
| Training | credential required, optional course, unaffordable course, unknown accreditation, no earnings claim |
| Partners / intros | partner-as-symptom, operator-for-hire, co-owner, network present/absent, no intro before gate |
| Proof | self-report only, inferred only, verified receipt, stale receipt, missing proof, conflicting proof |
| Controls | keep original, reject, correct, appeal, feedback, export, delete, repeated requests, partial failure |
| Failure | storage unavailable, duplicate run ID, stale run, no eligible path, kill switch during request |

Exit requires all deterministic assertions plus a reviewed sample containing misses and false positives, not only passes.

### Slice 5 — Operations, accessibility, and launch candidate

**Build**

- Replace code-edit-as-switch with a server-side, fail-closed public-delivery control defaulting OFF and an exact disable runbook. LLM remains separately OFF.
- Record privacy-safe run metrics: source, engine version, eligible top path, not-match outcome, confidence band, domain gates, correction/appeal rate, errors, and latency—never raw free text in general logs.
- Define alerts and incident states for cross-member exposure, wrong high-impact domain path, evidence-label failure, storage errors, elevated corrections/appeals, and rollback failure.
- Run the full browser/accessibility/plain-language pass and a clean-candidate deploy rehearsal.

**Allowed files**

- `lib/matching/feature-flags.ts`
- intake and matching API routes only for structured metrics/error handling
- one matching operations runbook under `foreman/reviews/`
- focused smoke/accessibility scripts under `scripts/foreman/`
- no LLM, provider, or unrelated observability platform
- the matching policy/governance artifact only as needed to record processors, legal holds, prohibited downstream uses, and review cadence

**Proof**

- Kill switch changes public delivery to the safe state without a source edit; in-flight and next requests fail closed.
- Rollback identifies the previous clean deployment and completes inside the runbook target time.
- Alerts fire on synthetic failure cases without exposing intake text.
- Sample-review receipt records count, domain mix, false-positive/false-negative findings, reviewer, and corrective action.
- Keyboard, screen-reader, 200% zoom, mobile, reduced-motion, focus/error, and plain-language checks pass for the complete member path.
- Clean production candidate passes ownership, rights, all domain fixtures, three legacy golden scenarios, public OFF rehearsal, public ON preview rehearsal, rollback, and post-rollback smoke.
- Licensed counsel records the launch geography/role determination, sensitive/health-data and age posture, incident conclusion, forbidden downstream uses, and copy limitations before Ben receives a replacement gate.

## Monitoring and incident minimum

- **Owner:** one named operational owner per launch window.
- **Review cadence:** first 25 public runs reviewed; then a fixed weekly stratified sample across every active domain until calibration is credible.
- **Immediate stop:** any cross-member exposure; a capital/person/job action losing its gate; inferred fact labeled verified; deletion affecting the wrong owner; or an unbounded storage/5xx spike.
- **Incident flow:** switch delivery OFF, preserve non-sensitive run IDs and deployment evidence, block saved actions, identify affected owners, correct or delete under policy, issue the required member communication after legal review, patch, rerun the matrix, and require a new go-live decision.
- **Rollback:** public delivery OFF first; previous clean deployment second. Never drop schema as the first rollback.

## Should build after a bounded public launch

- Outcome follow-up and calibration by domain, including “recommendation was wrong” analysis.
- A member preference center for reminders, review requests, and stored-history visibility.
- Broader language support after unsupported-language handling is honest.
- A quality dashboard showing domain mix, abstentions, corrections, gate stops, and stale-proof rates without raw intake text.
- Verified provider/catalog freshness for training, lenders, jobs, or people only under their separate legal/provider gates.
- LLM translation only under its existing separate gate, with its own data-use, evaluation, cost, and rollback proof.

## Explicit non-goals

- No new matching architecture or platform rewrite.
- No LLM enablement.
- No public person catalog, lender application, job screening, training enrollment, provider purchase, or external intro.
- No money movement, contract, equity action, credit decision, hiring decision, adverse action, or guaranteed outcome.
- No automatic claim that a member, partner, lender, job, course, or proof item is verified.
- No production SQL, deletion automation, flag flip, deploy, push, or merge from this review.
- No use of “autonomous” to imply accuracy, independence from member choice, or legal/compliance approval.

## Retest and gate reopen conditions

Reopen a replacement public-delivery gate only when:

1. Slices 0–5 have receipts from a clean candidate.
2. Thufir’s legal blockers and Bean’s attack findings have explicit dispositions.
3. The policy artifact and approval log agree.
4. Member A/B/anonymous isolation, export, correction, deletion, domain gates, accessibility, sampled quality, kill switch, and rollback all pass.
5. The proposed member-facing copy is reviewed as a **recommendation readout**, not a promise of autonomous correctness.
6. The replacement gate names the exact enabled domains and keeps all external action, LLM, provider, money, and introduction gates separate.

Final verdict: `NO-GO`
