# Thufir Review — Matching Autonomous Legal and Compliance

Date: 2026-07-16  
Reviewer: Thufir  
Execution context: `LOCAL_SALLY_WINDOWS` on `Betsy`  
Repository: `C:\Users\Ben Leak\github\Werkles`  
Branch / inspected HEAD: `maker/site-g-20260703` / `176a5862b2628d878d7b4ecc4105668fd880b8bd`  
Mode: issue spotting and launch-risk review only; not legal advice or legal approval

## Executive verdict

`NO-GO`

Do not set `MATCHING_AUTONOMOUS_PUBLIC = true`, do not describe the readout as autonomous or member-ready, and do not deploy the proposed public flip.

The immediate blocker is not merely missing export/deletion UX. The Bellows recommendation build/load path has no member authentication or ownership boundary and is coded to read the latest global Bellows shadow run. In `lib/squibb/recommendation-session-server.ts`, the condition:

```ts
if (matchingShadow && (isMatchingPublicEnabled() || matchingShadow.mode === "shadow"))
```

accepts every persisted matching run because `lib/matching/shadow-pipeline.ts` always creates runs with `mode: "shadow"`. `readLatestShadowRuns(5)` is global, not scoped to the requesting member. If this server path is executed with a persisted Bellows run available during a future build, prerender, runtime render, or redeploy, the public `/bellows/recommendations` surface can show another person's stated need, inferred readout, scores, and—when the file-backed intake is available—the raw `symptomBlock`. The same code reads a global file-backed ledger of recent intakes and saved options. The unauthenticated packet endpoint can also stage an action against the globally selected recommendation when such a recommendation is loaded.

**Verified live-state limitation:** Heimerdinker reported a 2026-07-16 GET to `https://werkles.com/bellows/recommendations` returned `200`, `X-Vercel-Cache: PRERENDER`, and rendered `Demo scenario`, not a latest intake or shadow readout. Accordingly, this review does **not** claim a proven current production disclosure. The source still creates a severe unscoped global-load and next-build/redeploy disclosure risk, and historical responses have not been ruled out. It requires containment before another build or redeploy and a counsel-led incident assessment; this review does **not** conclude that a legally reportable breach occurred.

The public mode also has no implemented notice-at-collection, comprehensive privacy notice, member-specific access/correction/export/deletion flow, enforceable retention job, sensitive-data handling, age policy, or calibrated evidence supporting its percentage-like confidence and “autonomous” framing. Three synthetic golden paths do not substantiate a general claim that the engine produces reliable, fair, or member-ready recommendations.

## Controlling product facts

1. `MATCHING_AUTONOMOUS_PUBLIC` and LLM translation are OFF at the inspected commit. The matching engine is deterministic/rules-based today, but that does not necessarily remove it from laws that define automated decision technology to include computation producing recommendations, rankings, classifications, or scores.
2. Discovery intake collects name, email or phone, lane, assets, and broad free text about work, money, constraints, goals, location, and circumstances. Bellows intake collects five broad free-text answers. Users can foreseeably disclose health, disability, family, immigration, financial, religious, sexual, or other sensitive facts even though those fields are not expressly requested.
3. Matching runs persist the full `signals.intakeTextBlob`, keywords, inferred leverage classification, flags for capital/job/training/relocation, ranked paths, score, confidence label, and a causal draft.
4. Supabase service-role code writes and reads the matching tables. Database RLS restricts direct authenticated reads to operators, but server-side service-role reads can be returned through an unauthenticated public route if the global server load path executes with a persisted run available. The verified live prerender currently shows demo content; RLS is nevertheless not a substitute for application-level subject isolation.
5. Bellows intake and recommendation records are keyed by generated intake IDs, not a verified member identity. There is no reliable ownership mapping for authenticated export, correction, deletion, or appeal.
6. `ensureIntakeCustody()` upserts `discovery_intakes.normalized_payload` using a different minimized shape after the discovery record write. This complicates an accurate account of which fields remain in which store and makes export/deletion completeness unproven.
7. The recommendation UI presents numeric scores as percentages and labels them confidence, but the score is a rules total mapped to low/medium/high. No calibration shows that it represents probability of correctness or outcome success.
8. The engine can recommend paths involving jobs, training, lenders, credit unions, capital raising, bankers, partners, relocation, and equipment. It says no transaction, intro, or money movement happens automatically, which reduces but does not eliminate domain risk.
9. The existing disclaimer says dues do not guarantee trust, verification, funding, legal clearance, or partner outcomes. That disclaimer does not cure a contradictory or unsupported net impression created by “autonomous,” “matching,” “verified,” or percentage confidence claims.

## Policy contradiction resolved

The data-policy artifact says `RECOMMENDATION - NOT APPROVED POLICY`, but `foreman/gates/APPROVAL_LOG.md` records an `APPROVED` decision on 2026-07-12. Under `foreman/HUMAN_GATES.md`, the approval log is the durable approval record. The most accurate conclusion is:

- the policy recommendation was later approved in the cockpit;
- the policy artifact's status line was never reconciled and is stale;
- policy approval did **not** implement the policy; and
- the approved policy itself requires authenticated export and deletion-request handling before public matching, while the gate admits those controls are absent.

The go-live gate therefore may say the policy was approved, but it may not treat approval as proof of implementation or satisfaction of the policy's own launch prerequisite.

## Unknowns that control legal scope

- Werkles legal entity, principal place of business, and states in which it intentionally offers the service.
- Current and projected annual revenue; whether California's inflation-adjusted revenue threshold is met.
- Annual counts of total consumers and consumers by state; whether personal data is sold, shared for cross-context advertising, or exchanged for any discount or other value.
- Whether Werkles is for adults only, and whether it has actual knowledge of any user under 13 or other minors.
- Production analytics, cookies, advertising, session replay, support, email, and other processors not visible from the reviewed matching files.
- Whether existing production visitors submitted real Bellows intake data and whether any different visitor retrieved it through the global recommendation surface.
- The actual retention, backup, log, Vercel, Supabase, and local-file lifecycle—not merely the proposed 90/365-day policy.
- Whether Werkles will furnish readouts or scores to employers, employment agencies, lenders, credit unions, landlords, insurers, schools, training providers, investors, or counterparties.
- Whether counterparties pay listing, lead, referral, success, transaction, or revenue-share compensation.
- Whether “partner” includes equity or securities introductions, and whether Werkles will solicit, negotiate, screen investors, or participate in a transaction.
- Whether Werkles makes or materially influences eligibility, access, price, terms, compensation, admission, hiring, referral, lending, insurance, housing, or other consequential decisions.
- Security program, processor contracts, incident-response plan, accessibility audit, bias/fairness evaluation, and consumer-support capacity.

## Issue matrix

| Issue | Classification on current facts | Analysis and launch implication | Current official source |
|---|---|---|---|
| FTC and state unfair/deceptive acts; product claims | **Clearly applicable baseline** to a U.S. commercial service; exact state statutes require counsel | Express and implied claims must be truthful, non-misleading, and supported before publication. “Autonomous,” “matching,” “verified,” “facts,” partner language, and percentage confidence can create a stronger net impression than the code and three golden tests support. A footer disclaimer is not a substitute for a clear, proximate qualification. | [FTC Advertising and Marketing](https://www.ftc.gov/business-guidance/advertising-marketing); [FTC small-business advertising FAQ](https://www.ftc.gov/business-guidance/resources/advertising-faqs-guide-small-business); [FTC Workado AI accuracy action](https://www.ftc.gov/news-events/news/press-releases/2025/04/ftc-order-requires-workado-back-artificial-intelligence-detection-claims) |
| Data security and unauthorized disclosure | **Clearly applicable prudent control; likely legal exposure under FTC/state law if consumer data is exposed** | The code-supported global latest-run lookup and unauthenticated display path violate basic least-privilege and subject-isolation expectations, although the verified live prerender currently returns demo content and does not prove a disclosure. Contain before any build/redeploy, preserve evidence, then determine whether any historical or future response exposed real consumer data and whether notification duties attach. | [FTC Start with Security](https://www.ftc.gov/business-guidance/resources/start-security-guide-business); [FTC Privacy and Security](https://www.ftc.gov/business-guidance/privacy-security) |
| General state privacy rights and notices | **Conditionally applicable** based on geography, entity status, volume, revenue, and sale/sharing | Covered laws commonly require notice, minimization, access, correction, deletion, portability, appeal, sensitive-data consent, risk assessment, and profiling opt-out. None is operationally complete here. California currently uses an inflation-adjusted revenue threshold plus 100,000-consumer/household and sale/share-revenue alternatives; Colorado uses 100,000 consumers or 25,000 plus sale-related revenue/discount; Texas generally exempts SBA small businesses except sensitive-data sales. A 50-state applicability table is required. | [California CCPA FAQ and thresholds](https://cppa.ca.gov/faq); [California consumer rights and notices](https://oag.ca.gov/privacy/ccpa); [Colorado Privacy Act](https://coag.gov/resources/colorado-privacy-act/); [Texas Data Privacy and Security Act](https://www.texasattorneygeneral.gov/es/node/259071) |
| California automated decision technology | **Conditionally applicable; compliance date and scope require counsel** | Final CCPA regulations became effective in 2026; businesses using ADMT for significant decisions begin ADMT compliance in 2027. Coverage requires both CCPA business status and an in-scope use. User-side planning advice may be outside “significant decision,” but forwarding or using a score for employment, lending, housing, insurance, education, or other access decisions can change the answer. “No LLM” is not a safe harbor. | [CPPA final ADMT regulations](https://cppa.ca.gov/regulations/ccpa_updates.html); [CPPA implementation announcement](https://cppa.ca.gov/announcements/2025/20250923.html) |
| Colorado profiling and ADMT | **Conditionally applicable** | The Colorado Privacy Act gives covered consumers rights to access, correct, delete, port, and opt out of specified profiling. Colorado's 2026 ADMT law defines covered technology broadly enough to include computation generating recommendations, rankings, and scores used to make or assist consequential decisions. Its official summary describes point-of-interaction notice, adverse-outcome explanation, correction, human review/reconsideration, and three-year records for covered uses, with specified duties beginning in 2027. Whether Werkles' user-side recommendation is itself a consequential decision is a counsel question; furnishing or using it for eligibility is much riskier. | [Colorado Privacy Act](https://coag.gov/resources/colorado-privacy-act/); [Colorado SB26-189 as enacted](https://leg.colorado.gov/bills/sb26-189) |
| Washington consumer health data | **Conditionally applicable with no practical small-business escape** if a Washington consumer supplies or the system infers health data | Broad free text can contain physical or mental health facts, and the matching engine derives classifications from it. Washington defines collection to include access, retention, inference, and derivation, and consumer health data includes inferred health status. Regulated entities and small businesses must publish a consumer-health privacy policy on collection pages; collection/share generally requires specified-purpose consent or necessity for the requested service, and users have access/withdrawal/deletion-related rights. No such policy or control exists. Either reliably prohibit and purge health data or implement a counsel-approved Washington flow before public intake. | [RCW 19.373.010 definitions](https://app.leg.wa.gov/RCW/default.aspx?cite=19.373.010); [RCW 19.373.020 privacy policy](https://app.leg.wa.gov/RCW/default.aspx?cite=19.373.020); [RCW 19.373.030 consent](https://app.leg.wa.gov/RCW/default.aspx?cite=19.373.030); [RCW 19.373.040 rights](https://app.leg.wa.gov/RCW/default.aspx?cite=19.373.040) |
| FCRA | **Not established on current user-only/self-report facts; conditionally applicable if readouts are furnished for eligibility** | A path recommendation to the consumer is not by itself shown to be a consumer report. Risk changes materially if Werkles assembles/evaluates consumer information and furnishes a dossier or score to an employer, lender, landlord, insurer, or another party for eligibility. Then CRA, user, accuracy, file disclosure, dispute, permissible-purpose, authorization, and adverse-action duties may apply. Do not make that product transition without FCRA counsel and a separately gated program. | [CFPB Regulation V overview](https://www.consumerfinance.gov/rules-policy/regulations/1022/); [CFPB Circular 2024-06 on algorithmic employment scores](https://www.consumerfinance.gov/compliance/circulars/consumer-financial-protection-circular-2024-06-background-dossiers-and-algorithmic-scores-for-hiring-promotion-and-other-employment-decisions/) |
| ECOA / credit and lending | **Not established for a generic “find lender” suggestion; conditionally applicable if Werkles participates in credit decisions or discouragement** | Werkles is not shown to be a creditor and the current engine does not approve credit. Do not let the score become an underwriting, prescreen, pricing, denial, or discouragement tool. If a creditor uses it, specific and accurate adverse-action reasons remain required regardless of algorithm complexity. Loan-broker and lead-generator licensing/marketing rules also require a state-by-state counsel review before actual lender routing or compensation. | [CFPB Regulation B](https://www.consumerfinance.gov/rules-policy/regulations/1002/); [CFPB Circular 2022-03](https://www.consumerfinance.gov/compliance/circulars/circular-2022-03-adverse-action-notification-requirements-in-connection-with-credit-decisions-based-on-complex-algorithms/) |
| Employment, referrals, and employment AI | **Not established for advice to a user; conditionally applicable if Werkles regularly refers workers or employers use the output** | “Find better job” advice does not alone make Werkles an employment agency or selection tool. Regular job referral can bring employment-agency nondiscrimination duties regardless of payment. Employer/agency use in NYC can trigger Local Law 144 bias-audit, publication, and notice duties when the tool substantially assists hiring or promotion. Federal employment law can prohibit discriminatory selection and require job-related validation/accommodation. Keep the engine out of candidate ranking/referral until scope, validation, bias, and accessibility controls are counsel-approved. | [EEOC employment agency coverage](https://www.eeoc.gov/employers/coverage-employment-agencies); [EEOC selection procedures](https://www.eeoc.gov/laws/guidance/employment-tests-and-selection-procedures); [NYC Local Law 144 enforcement page](https://home4.nyc.gov/site/dca/about/automated-employment-decision-tools.page) |
| Education/training, housing, insurance, health care, and public benefits | **Conditionally applicable; counsel-required boundaries** | Recommending that a consumer consider training is materially different from ranking admission or eligibility. The same is true for general information versus deciding access to housing, insurance, health care, or benefits. Product contracts and APIs must prohibit counterparties from using the readout as an eligibility score unless a separately reviewed regulated program is built. | [Colorado SB26-189 consequential-decision categories](https://leg.colorado.gov/bills/sb26-189); [Texas profiling-right categories](https://www.texasattorneygeneral.gov/es/node/259071) |
| Securities, capital, investor, and partner paths | **Conditionally applicable; licensed securities counsel required before actual introductions or compensation** | Generic education about “raise capital” is not enough to establish broker activity. Finding investors, referrals, solicitation, negotiation, transaction participation, handling funds, and transaction-based compensation are broker-dealer warning factors. Do not route investor introductions, recommend specific investments, or take success/transaction compensation without a written securities-law determination and any required registration. | [SEC Guide to Broker-Dealer Registration](https://www.sec.gov/about/divisions-offices/division-trading-markets/division-trading-markets-compliance-guides/guide-broker-dealer-registration) |
| Children and teens | **Conditionally applicable** | COPPA applies to child-directed services and general-audience services with actual knowledge they collect personal information from a child under 13. The public intake collects contact information and free text but has no age policy or under-13 stop. Select an adult-only or compliant minor strategy; if adult-only, state it and implement a neutral pre-collection age screen/response procedure without retaining excess age data. State teen privacy laws require separate counsel review. | [FTC COPPA Rule](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa); [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions); [FTC 2026 age-verification policy](https://www.ftc.gov/news-events/news/press-releases/2026/02/ftc-issues-coppa-policy-statement-incentivize-use-age-verification-technologies-protect-children) |
| Accessibility and disability discrimination | **Likely applicable if Werkles is a public accommodation; exact Title III coverage is counsel-dependent** | DOJ takes the position that public-facing goods and services offered on the web must be accessible. The intake, error states, recommendation cards, confidence visualization, and correction/appeal mechanisms need keyboard, screen-reader, contrast, zoom, focus, plain-language, and manual assistive-technology testing. Accessibility is also essential before any employment or training selection use. | [DOJ guidance on web accessibility and the ADA](https://www.ada.gov/resources/web-guidance/); [ADA Title III overview](https://www.ada.gov/topics/title-iii/) |
| Retention, recordkeeping, and deletion | **Conditionally required by privacy/ADMT laws; prudent and policy-required now** | The approved internal policy proposes 90 days for raw intake and 365 days for minimized matching metadata, but no `policy_version`, `retention_class`, `delete_after`, scheduled enforcement, dependent deletion, backup handling, or member workflow is implemented. Conversely, future covered ADMT or regulated-domain use may require preserving decision records. Counsel must reconcile deletion rights/exceptions with audit retention; the product cannot improvise this after launch. | [California consumer rights](https://oag.ca.gov/privacy/ccpa); [Colorado SB26-189 recordkeeping summary](https://leg.colorado.gov/bills/sb26-189); [FTC Start with Security](https://www.ftc.gov/business-guidance/resources/start-security-guide-business) |

## Minimum launch blockers

All of the following are blockers for a public matching readout, not optional polish:

1. **Contain cross-user access before any build or redeploy.** Require a verified member session for personal readouts; bind every intake, matching run, and saved option to an owner; query by owner plus intake ID; deny anonymous reads; remove the `matchingShadow.mode === "shadow"` bypass; and preserve the currently observed demo-only public behavior whenever no authenticated owned intake exists.
2. **Contain unauthenticated writes.** Require ownership and CSRF-appropriate controls for recommendation packet staging. Do not allow a public caller to stage an action against the latest global recommendation.
3. **Run an incident assessment without presuming an incident.** Preserve relevant Vercel/Supabase/application logs, cache/build behavior, and deployment history; determine whether real Bellows intakes existed during any render, whether any historical response returned them to a different user or crawler, what fields—if any—were exposed, and which residents—if any—were affected. The current live demo response is favorable evidence but does not answer historical behavior or the next-redeploy risk. Have licensed privacy counsel decide whether notification or regulator obligations exist. Do not delete evidence in the name of retention until counsel clears preservation.
4. **Publish notice before collection.** Provide an accurate notice-at-collection and comprehensive privacy notice naming categories, purposes, sources, retention, processors/recipients, automated inference, rights, request/appeal methods, contact, and effective date. List actual Supabase, Vercel, analytics, support, and future model processors after a complete data map.
5. **Implement rights, not promises.** Build verified access, correction, portable export, deletion request, appeal/reconsideration, and status receipts. Cover discovery intake, Bellows intake files, `discovery_intakes`, dependent matching runs, saved recommendation packets, backups, and derived causal drafts. Test identity verification without exposing another member's data.
6. **Enforce retention.** Resolve the 90/365-day decision, record `policy_version`, `retention_class`, and `delete_after`, implement reviewed deletion, define backup/log behavior and legal holds, and return receipts proving completion or exception.
7. **Handle sensitive and health data.** Either prevent and promptly purge prohibited sensitive/health content before persistence and inference, or implement the required state-specific notices, consent, withdrawal, minimization, rights, processor terms, and security. A generic “do not share sensitive data” warning alone is not a reliable control for Washington health data.
8. **Choose an age posture.** Adopt and enforce an adult-only or minor-capable policy before collecting contact/free-text data. Define how staff handles actual knowledge that a submitter is under 13.
9. **Reduce regulated-domain scope.** Keep the output as user-controlled general next-step guidance. Prohibit furnishing scores/readouts for employment, credit, housing, insurance, education admission, health care, benefits eligibility, or investor selection. No specific lender, employer, insurer, school, investor, or partner routing until separate legal/product gates pass.
10. **Substantiate and qualify claims.** Replace unsupported “autonomous” and percentage-confidence framing, complete a representative quality/fairness/edge-case evaluation, and document what the system can and cannot infer. Three golden paths are a smoke test, not claim substantiation.
11. **Accessibility proof.** Complete automated and manual keyboard/screen-reader/zoom/contrast/error-recovery tests of intake, readout, correction, and appeal. Provide an accessible support route.
12. **Counsel sign-off.** Obtain written advice on entity/geographic privacy scope, Washington health-data handling, incident obligations, employment/referral status, lending/lead-generation licensing, securities finder/broker boundaries, insurance/education/housing rules, minor posture, and terms/disclosures.

## Required copy changes

Before retest, the member-facing product should use language no stronger than the evidence:

- Replace **“Autonomous matching”** with **“Automated path suggestion — beta”** or equivalent unless and until counsel and performance evidence support a stronger term.
- Replace **“match”** where no actual verified person, provider, lender, job, or program has been matched. Use **“recommended path”** or **“ranked options.”**
- Display the number as **“rules score”**, not a percentage confidence. Say explicitly: “This is not a probability of success or eligibility.”
- Use **“verified”** only for a named fact independently checked by a named process, with source, scope, and timestamp. Self-reported and inferred facts must stay visibly distinct.
- Say near the result, not only in a footer: “Based only on what you entered. No identity, income, credit, job eligibility, provider, partner, or outcome was verified. Werkles has not sent this to anyone.”
- Explain the automated role, major input categories, principal reasons, important missing facts, limitations, and how the user can correct input or request human reconsideration.
- Do not imply that a “partner,” employer, lender, credit union, investor, training provider, or other counterparty exists, endorses Werkles, is reachable, or has approved the user unless that exact fact is proven.
- Do not make earnings, funding, savings, job, approval, timing, or outcome claims without claim-specific substantiation and required disclosures.

## Required product and policy changes

### Product

- Owner-scoped schema and server queries for every personal artifact.
- Authentication/authorization on readout and staging endpoints, with negative authorization tests.
- Data inventory and field-level classification for identifiers, contact data, free text, inferences, sensitive data, and regulated-domain data.
- Member-visible source facts, inference labels, model/rules version, generated time, reason codes, correction, appeal/human review, and an outcome that never silently acts externally.
- Privacy rights center with verified manual fallback; a human-operated workflow is acceptable if truthful, secure, timely, and receipt-backed.
- Retention/deletion worker and legal-hold path with least-privilege access, audit logs, and failure alerts.
- Sensitive-data redaction/quarantine strategy and an approved Washington health-data posture.
- Rate limiting, abuse controls, CSRF/session controls, secure error handling, and no internal file paths or run identifiers exposed without need.
- Accessibility and fairness/quality test suites with documented limitations and release thresholds.

### Policy and governance

- Reconcile the stale status line in `WERKLES_MATCHING_DATA_POLICY_DECISION_V0_20260711.md` with the approval log, without pretending implementation is complete.
- Convert the approved recommendation into an operational policy with owner, effective date, systems covered, processors, retention schedule, request SLAs, appeal process, exceptions, legal holds, incident response, and audit cadence.
- Define prohibited uses and contractually prohibit counterparties from using the readout for regulated eligibility or adverse decisions.
- Document whether Werkles is controller/business, processor/service provider, employment agency, lead generator, finder, or other regulated actor for each planned relationship.
- Maintain a state applicability register containing geography, thresholds, user counts, revenue, sale/share facts, sensitive-data facts, and effective dates; refresh before launch and at least annually.
- Require a separate legal gate before LLM use, third-party data enrichment, actual introductions, paid referrals, transaction-based compensation, or regulated eligibility use.

## Questions for licensed counsel

1. Given the latent unauthenticated global latest-run code path, the verified current prerendered demo response, and unknown historical render/cache behavior, did any exposure occur under an applicable privacy promise, state consumer-protection law, contract, or breach-notification statute, and what evidence must be preserved now?
2. Which comprehensive state privacy laws cover the entity at launch and at projected 12- and 24-month volumes? Include nonprofit/small-business treatment, consumer definitions, and sale/share/valuable-consideration facts.
3. Does accepting Washington free text and deriving “intrinsic” or other psychological/behavioral hypotheses process consumer health data under RCW 19.373, and can the service rely on requested-service necessity or must it obtain consent?
4. Is the service adults-only? What age screen, terms, deletion, and actual-knowledge process is appropriate for under-13 and teen users in intended states?
5. Does ranking “find better job,” staging candidates, or making introductions make Werkles an employment agency or covered referral service in any state? When would NYC Local Law 144 or Colorado SB26-189 apply?
6. At what point do lender/credit-union paths make Werkles a loan broker, lead generator, creditor participant, FCRA consumer reporting agency/user, or ECOA actor?
7. At what point do capital/partner introductions, screening, solicitation, negotiation, or compensation require broker-dealer, funding-portal, investment-adviser, or state securities registration?
8. What licensing and disclosure rules attach to insurance, housing, education/training, professional licensing, or health-care referrals in intended states?
9. Which records must be retained for claims substantiation, algorithmic decisions, disputes, adverse outcomes, and litigation holds, and how should those duties interact with deletion rights and the proposed tombstone?
10. Are the proposed automated-role disclosures, confidence language, terms, warranty disclaimers, limitations of liability, consent, and human-review process sufficient for the actual product—not a hypothetical future version?

## Retest conditions

Return to the go-live gate only when each condition has a tangible receipt:

1. Two-member isolation test proves Member A cannot read, enumerate, stage, export, correct, or delete Member B's intake, run, readout, or option. Anonymous access returns demo-only content or a denial and never queries personal latest-run data.
2. Production-data incident assessment is completed by authorized personnel and expressly distinguishes the verified current demo response from historical unknowns and future build/redeploy risk, with counsel's notification decision recorded separately from this engineering review.
3. Notice-at-collection and privacy/consumer-health notices are reviewed against the actual data map and visible before submission on every intake surface.
4. Access, correction, export, deletion, withdrawal/opt-out where applicable, appeal, and human reconsideration pass end-to-end tests, including dependent data and verified request ownership.
5. Retention fields and enforcement pass tests for raw and minimized records, failures alert, legal holds work, and no requested deletion is falsely marked complete.
6. Public copy contains no unsupported “autonomous,” “verified,” actual “match,” calibrated confidence, affiliation, or outcome implication; counsel and product review the net impression in context.
7. A broader synthetic test suite covers sparse, contradictory, sensitive, employment, credit, training, relocation, capital, partner, health, minor, abuse, and out-of-scope inputs; results include false-positive/false-negative review and protected-class/proxy analysis without collecting live protected data for experimentation.
8. Accessibility testing covers keyboard-only, screen reader, 200% zoom, contrast, focus order, labels, errors, status announcements, score explanation, correction, and appeal.
9. The data-policy artifact, gate, approval log, implementation receipts, and production behavior agree. No artifact labels an unimplemented control complete.
10. Licensed counsel provides a written launch-scope determination and lists forbidden future uses. Ben then makes a new Tier 1 launch decision; the prior phrase must not be reused as authority.

## Final disposition

The safer product is not “autonomous matching.” It is an owner-scoped, transparent, reversible **automated path suggestion** that never exposes another member, never implies eligibility or a real counterparty, distinguishes self-report from inference and verification, lets the member correct or reject the result, and stops before regulated decisions or transactions.

Until the minimum blockers and retest conditions are satisfied:

`NO-GO — MATCHING_AUTONOMOUS_PUBLIC MUST REMAIN OFF`
