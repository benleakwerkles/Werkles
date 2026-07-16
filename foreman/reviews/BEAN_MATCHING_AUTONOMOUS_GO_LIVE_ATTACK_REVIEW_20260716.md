# Bean Attack Review — Matching Autonomous Go-Live

Reviewer: DeepSeek Bean  
Machine: `BETSY`  
Branch inspected: `maker/site-g-20260703`  
Source commit: `176a5862b2628d878d7b4ecc4105668fd880b8bd`  
Review mode: hostile, read-only inspection  
Gate attacked: `foreman/reviews/GATE-matching-autonomous-go-live-20260716.md`

## Bottom line

The proposed gate is not safe to approve. The repository does not currently have a trustworthy public-delivery switch, member-scoped recommendation custody, enforceable not-match controls, approved data policy, export/deletion handling, or domain-specific human gates. The gate understates the blast radius and overstates both policy status and test coverage.

The code contains a path that can select global shadow recommendations while `MATCHING_AUTONOMOUS_PUBLIC` is false. Setting the flag back to false is therefore not a reliable code-level kill switch. This review does **not** claim that current production discloses a member's intake on every page request.

### Live observation boundary

An authorized live observation reported `GET https://werkles.com/bellows/recommendations` as HTTP `200` with `X-Vercel-Cache: PRERENDER`; the rendered source was `Demo scenario`, not a latest-intake or shadow session. That observation is evidence against claiming a current per-request cross-user disclosure. It also sharpens the risk: the unscoped loader can execute during a build/prerender or another dynamic server invocation, and a future redeploy could bake globally selected member content into cached HTML unless ownership and rendering boundaries are fixed. Historical exposure and current dynamic-route behavior were not established by this review.

## Remaining findings — proven defects

### P0 — Recommendation loading is global and unscoped, creating a build/dynamic-execution disclosure path

**Evidence**

- `middleware.ts:28-42` does not guard `/bellows`, `/bellows/recommendations`, `/api/bellows`, `/discovery`, or `/api/discovery`.
- `app/bellows/recommendations/page.tsx:19-23` loads the recommendation session and ledger without an authenticated member identity or an explicit dynamic-render/member-session boundary.
- `lib/squibb/recommendation-session-server.ts:23-32` loads the globally latest Bellows intake and the latest five matching runs, then selects by intake ID; it never supplies or checks an owner ID.
- `lib/squibb/concierge-intake-storage.ts:114-139` and `:142-164` read the last global intake rows, not the current member's rows.
- `lib/matching/shadow-store.ts:112-121` reads globally newest Supabase matching runs with a service-role client. `lib/supabase/server.ts:4-13` confirms service-role access, which bypasses member RLS by design.
- `components/squibb/recommendation-surface.tsx:154-185` would render the selected session's stated need, inferred need, context, and, on the fallback path, the complete symptom block. Lines `289-330` would render global recent intake and option activity as “Your” activity when the loader returns those records.
- `app/api/bellows/recommendations/packet/route.ts:23-55` accepts a save action without authentication or ownership verification.
- Live boundary: the observed production GET returned `X-Vercel-Cache: PRERENDER` and rendered `Demo scenario`. No current member-content disclosure was observed in that response.

**Exploit path**

1. Member A submits a Bellows intake containing employment, financial, family, identity, or situational details.
2. A deployment build/prerender or another dynamic server invocation executes the unscoped loader while A's record is globally latest.
3. The loader chooses that global record without an authenticated owner check.
4. The resulting HTML/session can contain A's stated need and generated reasoning; the fallback can contain A's complete symptom block. If prerendered, that content could be cached and served broadly after deployment.
5. Separately, the unauthenticated packet endpoint can execute the same unscoped session loader and has no ownership check before staging an action.

**Damage if shipped**

Potential cross-member or build-time disclosure, confidential employment/financial detail exposure, false attribution of another person's recommendation, unauthorized activity written against another intake, breach-response cost, and loss of trust. These are consequences of the proven unscoped design; a confirmed current or historical production incident has **not** been established.

**Required fix**

- Keep the member recommendation surface closed immediately.
- Require an authenticated member on every intake read, recommendation read, ledger read, and packet write.
- Add immutable `owner_id`/member custody to intake, run, and packet records; derive it server-side, never from the request body.
- Query by authenticated owner and explicit intake/session ID. Never use “latest global” as member state.
- Enforce the same ownership check in the packet POST route.
- Assess whether public production has already exposed one member's content to another and prepare an incident decision if evidence exists.

**Retest instruction**

Use two synthetic accounts plus an anonymous client in Preview. Test dynamic rendering, production-equivalent build/prerender, post-deploy cached HTML, and packet POST separately. Prove A cannot read or act on B's intake/run/ledger, B cannot read or act on A's, anonymous requests receive denial, no member content enters build artifacts/cache, and service-role reads remain keyed to the authenticated owner. Include concurrent and failed-pipeline cases.

### P0 — `MATCHING_AUTONOMOUS_PUBLIC` is not the public-delivery gate or a usable rollback

**Evidence**

- `lib/matching/feature-flags.ts:9-20` claims the flag controls end-user output.
- `lib/squibb/recommendation-session-server.ts:31-33` returns a shadow run when `isMatchingPublicEnabled()` **or** `matchingShadow.mode === "shadow"`.
- Every run is permanently shadow: `lib/matching/types.ts:264`, `lib/matching/shadow-pipeline.ts:35-53`, and the database constraint in `supabase/migrations/00004_matching_shadow_persistence.sql:20` all fix mode to `shadow`.
- Therefore the second side of the OR is true for every stored run and the flag is bypassed.
- `app/api/discovery/intake/route.ts:36-40` and `app/api/bellows/intake/route.ts:52-56` use the flag only to change the response label/message.
- `lib/matching/shadow-to-recommendations.ts:50-55` always labels the resulting member session `Autonomous matching (shadow)`, regardless of the flag.

**Exploit path**

Execute the recommendation loader while a stored shadow run is available and the public flag is false. The code accepts the run because its mode is `shadow`; this can occur during a build/prerender or dynamic invocation. The current observed production GET served a cached Demo scenario, so this review does not claim that simply opening that URL currently reproduces the defect on every request.

**Damage if shipped**

The human gate, rollout claim, rollback plan, and kill-switch claim are unsound at the code level. Operators can believe public output is guaranteed off even though the loader condition permits shadow output when it executes. A flip can also produce contradictory labeling: the intake API says autonomous while the recommendation surface still says shadow.

**Required fix**

Create one server-side delivery boundary: when public delivery is false, no shadow run may be returned to member routes or member APIs. Keep operator inspection on a separately authenticated operator path. Make the public label derive from the same decision. Add a real emergency disable that blocks reads as well as changing copy.

**Retest instruction**

Test the complete matrix in Preview: flag off/on, anonymous/authenticated, member/operator, discovery/Bellows, fresh/stored run. With the flag off, assert zero member-visible engine content and zero actionable engine packet. Flip on, prove only the owning member sees it. Flip off again and prove immediate denial without redeleting data.

### P0 — Disqualified high-risk paths remain actionable, and conversion erases every human/legal gate

**Evidence**

- `lib/matching/score-paths.ts:329-379` retains disqualified paths, caps their score at 15, and includes them in the returned six.
- `lib/matching/shadow-to-recommendations.ts:11-43` converts every scored path into a recommendation, including disqualified paths.
- The conversion sets `humanGates: []` for every path at line `40`.
- It then places the same complete set in both `ranked` and `catalog` at lines `45-59`.
- `components/squibb/recommendation-surface.tsx:209-280` renders those paths and enables “Save this option,” “Keep original path,” and “Ask what proof is needed.”
- `app/api/bellows/recommendations/packet/route.ts:39-55` accepts any recommendation present in ranked or catalog. It does not reject a disqualified recommendation.
- This bypasses the domain gates already defined for capital, ownership, lending, career, relocation, and intros in `lib/squibb/recommendations.ts:125-210`.

**Exploit path**

Use the proven capital-plus-partner scenario. The not-match layer disqualifies capital/intro paths, but the conversion still places them in the member deck, strips their blockers, and allows the user to save one as a next move.

**Damage if shipped**

The safety layer is cosmetic. A user can act on a path the engine explicitly ruled out, while the UI falsely shows an empty “Before anything moves” section. Capital, lending, equity, job, relocation, and training recommendations are flattened into the same ungated workflow despite materially different risks.

**Required fix**

- Exclude disqualified paths from actionable rankings.
- If disqualified paths are shown for explanation, mark them blocked and disable every mutation server-side as well as in the UI.
- Attach mandatory gates by recommendation kind during shadow conversion. Capital/lending/equity paths need the strongest review; career/relocation/training paths need their own policy rather than inheriting an empty array.
- Enforce gates and disqualification in the packet API, not only in display code.

**Retest instruction**

For every recommendation kind, generate eligible and disqualified cases. Prove disqualified IDs cannot be saved by direct POST, eligible high-risk paths carry the expected legal/financial/operator gates, and a missing gate fails closed.

### P1 — The gate calls an unapproved policy approved and violates its explicit launch prerequisite

**Evidence**

- `foreman/reviews/WERKLES_MATCHING_DATA_POLICY_DECISION_V0_20260711.md:3` says `RECOMMENDATION - NOT APPROVED POLICY`.
- The same file requires authenticated member export and deletion-request handling **before public matching** and says Preview must prove read/write, RLS, deletion, and rollback before Production.
- `foreman/reviews/GATE-matching-autonomous-go-live-20260716.md` calls Data Policy V0 approved while admitting export/deletion handling is not built.
- `foreman/NEXT_ACTION.md` repeats “policy approved; job gated.” That is false source-state.
- Repository inspection found no member export, deletion-request, matching appeal, or matching correction implementation.
- `supabase/migrations/00004_matching_shadow_persistence.sql` lacks `policy_version`, `retention_class`, and `delete_after`; its intake foreign key uses `ON DELETE RESTRICT` at lines `24-26`.

**Exploit path**

Approve the gate based on the statement that policy is approved, collect public free text, then receive an export or deletion request that the product cannot authenticate, fulfill, or audit.

**Damage if shipped**

Launch violates Werkles' own stated prerequisite. Data becomes operationally difficult to locate, export, age, and delete. Operators can accidentally claim compliance based on a nonexistent approval.

**Required fix**

Correct the cockpit and gate status. Obtain an explicit policy decision, then build authenticated export, authenticated deletion request/fulfillment, dependent-run deletion order, minimal tombstone, retention metadata, and a separately gated deletion job. Public matching stays closed until all are proven.

**Retest instruction**

For a synthetic member with multiple intakes/runs/packets, prove the export is complete and contains no other member's data; prove deletion removes or lawfully retains each dependent record exactly as policy states; prove only the minimal tombstone remains; prove overdue data is discoverable by `delete_after`.

### P1 — Three self-fulfilling golden paths do not validate a broad recommendation system

**Evidence**

- `scripts/foreman/test-matching-shadow-smoke.Inner.mjs:11-77` contains exactly three hand-authored scenarios and hard-codes the expected top path for each.
- The current receipt proves those three API posts returned the same three expected labels. It does not test false positives, false negatives, negation, ambiguity, conflicts, stale state, ownership, correction, accessibility, or downstream user outcomes.
- Signal detection is keyword matching in `lib/matching/signals.ts`. A read-only probe against its exact regular expressions produced these misses: “I need financing,” “My financial situation,” “I need a career change,” “I need training,” “I need certification,” “I may relocate,” and “Relocation is required.”
- The same probe marks both capital and partner as present in “I do not need money and I do not want a partner.” Negation is not modeled.
- Rule order in `lib/matching/layer0.ts:11-80` chooses the first matching domain, not a reviewed multi-domain policy.

**Exploit path**

Use normal synonyms, inflected words, negated needs, or a mixed-domain intake. The engine silently misses the intended domain or treats a rejected option as desired, then ranks a different path with a numeric confidence display.

**Damage if shipped**

Bad recommendations, suppression of relevant options, resurfacing of expressly rejected options, and systematic gaps for users whose wording differs from the three fixtures. The public claim is much broader than the evidence.

**Required fix**

Build a versioned, reviewed evaluation set covering every recommendation domain, negation, synonyms, misspellings, contradictory inputs, sparse inputs, protected/sensitive context, multilingual or explicitly unsupported input, and adversarial phrasing. Set launch thresholds for serious errors, not merely three expected labels.

**Retest instruction**

Run a blinded evaluation set with expected safe behavior and record confusion matrices by domain, severe-error counts, abstention quality, and regression results. The three golden paths may remain smoke checks but cannot be launch evidence by themselves.

### P1 — Heuristic points are presented as calibrated confidence percentages

**Evidence**

- `lib/matching/score-paths.ts:33-218` assigns hand-written base points and keyword bonuses.
- Lines `222-228` turn the resulting point total directly into low/medium/high “confidence.”
- `components/squibb/recommendation-card.tsx:29-35` and `components/squibb/confidence-meter.tsx:9-31` render that score as a percentage and call it “Confidence score N out of 100.”
- `lib/matching/layer0.ts:82-87` never returns high confidence and derives low/medium from word count and count of keyword categories, not evidence validation.
- `lib/matching/layer0.ts:108-116` nevertheless marks `preflightComplete: true` unconditionally.
- The three golden scenarios contain no calibration or outcome evidence.

**Exploit path**

A user supplies a long but inaccurate or stale narrative. Keyword bonuses produce a 55–70 score, which the UI renders as 55–70% confidence even though the number is neither a probability nor validated accuracy.

**Damage if shipped**

False precision and excessive reliance, especially for money, work, relocation, and partnership decisions. “Self-reported” and “inferred” labels do not cure a prominent percentage that looks statistically meaningful.

**Required fix**

Until calibrated, call the number a transparent heuristic/path score and do not use a percent-confidence meter. Separate input completeness, evidence strength, and recommendation rank. Mark preflight incomplete when proof is missing. Add explicit freshness and “last updated” handling.

**Retest instruction**

Have representative users interpret the display and verify they do not read it as probability or verified accuracy. If Werkles later uses confidence percentages, require held-out calibration data, error bars, per-domain performance, and documented thresholds.

### P1 — Discovery custody overwrites the contact-bearing intake with a different payload

**Evidence**

- `app/api/discovery/intake/route.ts:27-28` first writes the full discovery record, then immediately runs matching.
- `lib/discovery/intake-custody.ts:111-126` upserts the full record, including required name and contact, into `discovery_intakes.normalized_payload`.
- `lib/matching/shadow-store.ts:33-51` then upserts the same intake ID and replaces `normalized_payload` with a different object containing the signals but not the submitted name/contact.
- No policy or migration defines this overwrite as intentional minimization, and no separate authenticated owner/contact custody is referenced.

**Exploit path**

A user submits a valid discovery intake expecting follow-up. Matching persistence succeeds and replaces the only Supabase normalized payload with a version that drops contact information.

**Damage if shipped**

Werkles may be unable to contact the person who requested help, export the exact submitted record, or explain which version is authoritative. Concurrent retries can also rewrite intake custody timestamps and payload shape.

**Required fix**

Define one immutable intake custody contract. Store member ownership/contact separately from minimized matching signals, or preserve the full submitted record and write derived signals to a distinct field/table. Make retries idempotent without silently changing record shape.

**Retest instruction**

Submit a synthetic discovery intake, read back the exact authorized export, and prove required contact, original fields, derived signals, timestamps, and lineage all survive without one payload overwriting another.

### P1 — No correction, appeal, feedback, monitoring, incident, or enforceable emergency-stop path exists

**Evidence**

- The member UI offers save, keep original path, and request more proof (`components/squibb/recommendation-surface.tsx:256-280`). It does not offer “this input is wrong,” correction, appeal, adverse-outcome report, or safety report.
- The generated sovereignty note says a user may reject, modify, or ask Werkles to inspect another path (`lib/matching/deliver.ts:197-200`), but the public workflow does not implement modification or inspection requests.
- No recommendation-quality event, outcome monitor, domain incident threshold, or rollback drill is included in the gate evidence.
- The stated flag rollback is not enforceable because the public-read condition bypasses it.
- Recommendation reads use “latest” without a member-bound session, TTL, or stale-data rejection.

**Exploit path**

The engine produces a materially wrong or stale recommendation. The user cannot correct the source, appeal the path, or report harm in-product. Operators receive no structured signal, and disabling the advertised flag does not remove delivery.

**Damage if shipped**

Errors persist silently, repeated harms are invisible, stale recommendations remain actionable, and incident containment is slower than the product claim implies.

**Required fix**

Add correction, appeal/feedback, and safety-report workflows tied to member/run/version; define owner, response SLA, and outcome state. Add domain metrics, severe-incident triggers, an actual kill switch, rollback drill, audit logs, and freshness expiry.

**Retest instruction**

Exercise wrong-input correction, rejected recommendation, harm report, stale recommendation, severe incident, and kill-switch drills end to end. Prove the user sees state, operators receive an owned queue item, and disabled delivery is immediate.

## Remaining findings — legal and operational unknowns

These are unresolved questions, not legal conclusions. Code review cannot determine governing jurisdiction, Werkles' legal role, the effect of future compensation/provider relationships, or whether the risky code paths have historically exposed production member content.

### U1 — Privacy, notice, consent, retention, and data-rights obligations are unclassified

**Exploit path**

Public free-text intake collects identity, contact, employment, financial, and situational details without a matching-specific notice, consent record, member-scoped rights flow, or approved retention schedule.

**Damage if shipped**

Potential consumer-privacy, security, breach-notice, contractual, and unfair/deceptive-practice exposure varies by user location and data use. The proven cross-member design defect makes this question urgent.

**Required fix**

Thufir/counsel must classify applicable jurisdictions and roles; approve collection notice, purpose limitation, consent/legal basis where needed, retention, subprocessors, security, export/deletion, and incident obligations. Do not treat a generic outcomes disclaimer as privacy consent.

**Retest instruction**

Map every collected field and derived inference to purpose, storage, access, retention, deletion, export, and notice text. Counsel signs the versioned matrix before public use.

### U2 — Capital, lending, equity, employment, relocation, training, and partner paths need separate legal classification

**Exploit path**

One generic engine and UI recommends paths spanning credit unions, bankers, capital raises, equity partners, jobs, relocation, equipment, and training. Future intros, ranking, payment, lead generation, verification, or use by employers/lenders can change the legal role substantially.

**Damage if shipped**

Depending on conduct and jurisdiction, exposure may include lending/credit marketing rules, unfair or deceptive claims, securities or broker activity, employment/automated-decision rules, endorsement/referral duties, professional-advice limits, accessibility, and discrimination risk. Applicability is unproven, not absent.

**Required fix**

Create a counsel-reviewed matrix by recommendation kind covering: permitted claim, prohibited claim, required disclosure, required human review, verification, compensation/referral status, protected-trait handling, recordkeeping, appeal, and stop condition. Default unknown domains to non-actionable education.

**Retest instruction**

For each kind, run one safe and one prohibited scenario through UI and API. Prove prohibited actions fail closed and required notices/gates travel with the recommendation and saved packet.

### U3 — Live exposure, serverless persistence behavior, and outcome quality have not been measured

**Exploit path**

The static code supports unscoped/global reads and local filesystem packet storage, but this review intentionally performed no production data read or external attack traffic. The observed production page was a prerendered Demo scenario, not member content. Actual historical exposure, behavior during future builds/redeploys, dynamic packet-route selection, instance-to-instance persistence, and user outcomes are therefore unknown.

**Damage if shipped**

Werkles may underestimate an existing privacy incident, lose source/option packets across serverless instances, or ship serious recommendation errors without knowing the rate.

**Required fix**

Perform a separately authorized, synthetic Preview isolation test; inspect production access/log evidence without reading member content; document serverless durability; and establish a labeled outcome/evaluation program before public claims.

**Retest instruction**

Return receipts for two-account isolation, storage durability across instances/deploys, production exposure assessment, and per-domain quality metrics. Do not use live member content as an ad hoc test corpus.

## Gate contradictions that must be corrected

1. “Data Policy V0 approved” is false; the source artifact explicitly says not approved.
2. “Public matching OFF” is false as a code-level delivery guarantee; the loader's shadow-mode OR condition bypasses the flag whenever that loader executes.
3. “Flip changes member delivery” is overstated; it primarily changes API wording while the Bellows loader is coded to accept shadow runs and keeps a hard-coded shadow label. The currently observed live page is a prerendered Demo scenario, so current per-request shadow delivery is not claimed.
4. “Rollback: set flag false” is insufficient as containment; the code condition does not close the member-read path during build/prerender or dynamic execution.
5. “Three golden paths PASS” proves only three fixtures, not access control, broad semantic safety, calibration, legality, data rights, or operations.
6. “MEDIUM confidence” is not supportable while P0 ownership and gate-control defects remain. This is a launch blocker, not a residual-risk note.

## Verdict

Do not approve or conditionally approve the current gate. Keep the public flag false, close the code path capable of member-visible shadow delivery, fix ownership and server-side enforcement, resolve the data-policy decision and prerequisites, obtain domain/legal classification, and rebuild the gate from verified evidence.

`VERDICT: NO-GO`
