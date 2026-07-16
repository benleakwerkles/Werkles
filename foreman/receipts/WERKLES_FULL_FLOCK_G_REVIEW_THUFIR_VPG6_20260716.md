# Werkles Full Flock G Receiver Review — Thufir VPG6

Date: 2026-07-16  
Seat: `Thufir@Betsy`  
Execution context: `LOCAL_SALLY_WINDOWS` on hostname `BETSY`  
Repository: `C:\Users\Ben Leak\github\Werkles`  
Branch / inspected HEAD: `maker/site-g-20260703` / `176a5862b2628d878d7b4ecc4105668fd880b8bd`  
Mode: receiver-side claims/privacy/evidence-boundary review only; **not legal advice or legal approval**

## Verdict

`NO-GO — RECEIVER ACCEPTANCE INCOMPLETE`

The implementation moves in the correct containment direction, but it does not yet satisfy the exact Thufir P acceptance checks. Do not describe combined VPG6 proof as passed or use this receipt to support a scoped push until the four concrete gaps below are repaired and retested. Public Matching remains separately `NO-GO` and OFF.

## Six files inspected

- `app/bellows/recommendations/page.tsx`
- `app/api/bellows/recommendations/packet/route.ts`
- `lib/squibb/public-recommendation-session-server.ts`
- `lib/matching/shadow-to-recommendations.ts`
- `lib/matching/public-recommendation-gates.ts`
- `scripts/foreman/test-matching-full-flock-vpg6.mjs`

No other product/test file was reviewed for this receiver verdict.

## Acceptance findings

### 1. Runtime privacy proof is missing — blocker

The focused test reads source files and matches strings. It does not execute the OFF page-data loader with spies, render a seeded personal sentinel, or invoke the packet route while instrumenting downstream readers/writers. Therefore it does not prove the P requirements that:

- global intake/run/ledger readers receive zero calls while OFF;
- the POST rejects before any lookup or write; and
- seeded personal sentinel values cannot enter returned or rendered output.

Source ordering is favorable, but source-pattern inspection is not the requested execution proof.

### 2. Unsupported confidence presentation remains unresolved — blocker

`lib/matching/shadow-to-recommendations.ts:31-34` still exports `confidence.score` and `confidence.label` from the heuristic path score. The explanatory sentence says it is not a probability, but the six-file diff contains no rendered-output proof that members will not still see a percentage or calibrated-confidence presentation. The focused test checks only for the disclaimer string.

Acceptance requires rendered member output to identify any remaining number as a `rules score` and not present it as percentage confidence, probability, eligibility, or outcome likelihood.

### 3. `verified` evidence provenance remains incomplete — blocker

`lib/matching/shadow-to-recommendations.ts:40` preserves `strength: "verified"` and passes through only `f.source`. The P boundary requires a named verification process, scope, and timestamp before any fact is presented as verified. Those fields are neither required nor tested here.

Until complete provenance exists, the adapter must downgrade the member-facing claim or fail closed rather than present a bare verified classification.

### 4. Training-domain wording misses the exact boundary — blocker

The training gate tells the member to verify provider, price, admission, credential/license relevance, completion requirements, and outcome claims. It does not affirmatively say that Werkles has not verified or guaranteed admission, credential/license relevance, completion, eligibility, or outcome. The other regulated-domain gates use the required negative boundary more clearly.

## Checks that pass by inspection

- The page uses the new public boundary and declares `force-dynamic`.
- The OFF branch returns demo content plus empty intake/option ledgers before the personal-reader promise is constructed.
- Packet POST is closed with `403`, does not parse caller identifiers, and imports neither the global session loader nor packet writer.
- Disqualified paths are filtered before ranked/catalog construction and remaining paths are re-ranked.
- Every mapped recommendation kind receives the shared blocker gate plus a domain gate.
- Capital/lending/ownership, people/partner/introduction, jobs, relocation, and external-action claims are conservatively bounded.
- Source language uses `Automated path suggestion — beta` and states that no external send occurred.
- No reviewed implementation deletes, rewrites, or rotates production data, logs, cache/build records, or deployment history.

## Verification run

- `node scripts/foreman/test-matching-full-flock-vpg6.mjs` → `PASS matching full-flock VPG6 containment and trusted-readout contracts`
- `npm.cmd run typecheck` → `PASS` (`tsc --noEmit`)
- Initial `npm run typecheck` attempt was blocked only by the Windows PowerShell script-execution policy; the command-shim equivalent passed.

These passes establish static contract and type integrity, not the missing runtime/privacy and rendered-claim proofs.

## Exact retest needed for GO

1. Execute the OFF loader with instrumented personal readers and assert zero calls, empty ledgers, demo source, and absence of unique seeded personal sentinels.
2. Execute packet POST with instrumented lookup/write functions and assert `403` plus zero calls for forged identifiers and actions.
3. Render or otherwise evaluate the member-facing contract and assert no percentage-confidence/probability presentation; identify any number only as a rules score with the proximate limitation.
4. Require source + process + scope + timestamp for `verified`, or downgrade the member-facing classification when any element is absent; test both cases.
5. Change the training gate to state expressly that admission, credential/license relevance, completion, eligibility, and outcomes are not verified or guaranteed; assert that boundary.
6. Rerun the focused proof and TypeScript, then provide an isolated six-file diff receipt.

## Evidence and authority boundary

No current or historical disclosure is asserted. No incident-notification conclusion is made. No production-data inspection, public-flag change, deploy, git action, or legal/compliance approval is authorized or performed by this review.

`COMPLETED — THUFIR G REVIEW; NO-GO; NO LEGAL APPROVAL CLAIMED`

---

## Re-review — corrected VPG6 slice

Re-review date: 2026-07-16  
Re-reviewed scope: the same six product/test files listed above  
Final local-slice verdict: `CONDITIONAL GO — LOCAL CONTAINMENT/TRUSTED-READOUT COMMIT`  
Public-launch verdict: `NO-GO — MATCHING_AUTONOMOUS_PUBLIC MUST REMAIN OFF`

This section supersedes the initial receiver `NO-GO` **only for the bounded six-file local commit**. It is not public-launch, deploy, legal/compliance, incident, or production-data approval.

### Original blockers resolved

1. **Runtime OFF containment:** the corrected test executes the TypeScript boundary with injected personal readers, proves zero session-reader and ledger-reader calls while OFF, returns demo source plus empty ledgers, and proves a unique personal sentinel is absent from serialized output.
2. **Forged POST / no-write proof:** three forged/malformed POST inputs return `403` / `Blocked`. Before/after snapshots cover the packet JSONL index, packet directory, and Speaker packet-entry directory and remain identical.
3. **Verified-evidence boundary:** a bare `verified` fact is downgraded to `inferred` and labeled `Evidence supplied; verification details incomplete` because process, scope, and timestamp provenance are unavailable. Runtime fixtures assert the downgrade.
4. **Training-domain boundary:** the gate now states expressly that admission, eligibility, credential/license relevance, completion, provider claims, price, and outcomes are not verified or guaranteed. The runtime test asserts the required terms.
5. **Adapter behavior:** runtime fixtures prove disqualified-path removal from ranked and catalog results, deterministic conversion without source-run mutation, stable sorting/re-ranking, preservation of member-entered evidence, suppression of internal system language, nonempty blocker gates for every recommendation kind, and safe empty output when every path is disqualified.
6. **Categorical claim correction:** the source disclaimer is narrowed to what the recommendation does not establish; it no longer makes a blanket claim that no identity or underlying fact was verified.
7. **Build boundary:** `force-dynamic` remains set. The coordinating seat reports a clean sequential production build and post-build proof that `/bellows/recommendations` is present as a server page, absent from the prerender manifest, and emits no static HTML.

### Re-review verification

- Independent receiver run: `node scripts/foreman/test-matching-full-flock-vpg6.mjs` → `PASS matching full-flock VPG6 runtime containment and trusted-readout contracts`.
- Independent receiver run: `npm.cmd run typecheck` → `PASS` (`tsc --noEmit`).
- A duplicate receiver build collided with another reviewer's shared `.next` mutation after compilation and static generation. It was not used as evidence; the immediate rerun was terminated on coordinator instruction. The final build claim above relies on the coordinator's clean sequential build plus post-build proof.

### Remaining condition — not a blocker to this local safety commit

The adapter still carries heuristic `confidence.score` and `confidence.label` fields, and the pre-dirty UI renderer is outside this bounded slice. Therefore this review does not establish that a future public readout avoids percentage/confidence presentation.

That unresolved presentation issue does **not** block committing this containment/trusted-readout improvement because public Matching remains OFF, the public boundary returns demo-only data without invoking the adapter, and the commit reduces current exposure. It remains a hard prerequisite before any public-flag change:

- relabel or remove the percentage/confidence presentation in the member renderer;
- call any remaining number a `rules score`, not calibrated confidence or probability; and
- add rendered-output proof that no probability, eligibility, or outcome-likelihood implication remains.

### Conditions attached to GO

- Commit and push only the isolated six scoped product/test files plus authorized VPG receipts; no unrelated dirty-tree material.
- Keep `MATCHING_AUTONOMOUS_PUBLIC=false` and `MATCHING_LLM_TRANSLATE_ENABLED=false`.
- Do not deploy, inspect/mutate production data, delete preservation evidence, or reuse the obsolete public-go-live phrase.
- The always-closed packet POST may not be reopened until authenticated member/intake/run/recommendation ownership has its own scoped implementation and proof.
- Public launch still requires the broader member-ownership, rights, correction/appeal, rendered-claims, accessibility, operations, counsel-scope, and replacement human-gate receipts from the finalized multi-role review.

`COMPLETED — THUFIR G RE-REVIEW; CONDITIONAL GO FOR LOCAL SLICE ONLY; NO LEGAL APPROVAL CLAIMED`

---

## Final Bean-delta confirmation

Confirmation date: 2026-07-16  
Delta inspected: `lib/matching/shadow-to-recommendations.ts` and its runtime assertions in `scripts/foreman/test-matching-full-flock-vpg6.mjs`  
Verdict after delta: `CONDITIONAL GO — LOCAL CONTAINMENT/TRUSTED-READOUT COMMIT`

The narrow delta closes the remaining internal-language escape identified by Bean without corrupting member testimony:

- self-reported evidence values remain verbatim, including member-entered names or words that resemble internal vocabulary;
- non-self-reported evidence values pass through the same fail-closed system-language filter as other generated prose;
- an unsafe non-self value is replaced with `Details withheld pending human review`, not rewritten into a different factual claim;
- raw fact labels are replaced by the bounded member-facing label map, with unknown IDs falling back to `Additional information`;
- `autonomous` and `shadow` are now forbidden alongside the earlier internal vocabulary; and
- runtime assertions separately exclude the verbatim self-report from the generated-language scan while checking every non-self evidence label.

Independent confirmation:

- `node scripts/foreman/test-matching-full-flock-vpg6.mjs` → `PASS matching full-flock VPG6 runtime containment and trusted-readout contracts`
- `npm.cmd run typecheck` → `PASS` (`tsc --noEmit`)

No new claims/privacy/evidence blocker was introduced. The prior conditions remain unchanged: public Matching stays OFF; the pre-existing percentage/confidence renderer must be corrected and render-tested before any public gate; and this receipt supplies no deploy, production-data, incident, or legal/compliance approval.

`CONFIRMED — FINAL BEAN DELTA ACCEPTED FOR THE BOUNDED LOCAL COMMIT`
