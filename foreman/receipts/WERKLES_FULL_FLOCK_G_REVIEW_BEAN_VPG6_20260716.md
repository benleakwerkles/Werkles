# Werkles Full Flock G Review — Bean VPG6

Status: `COMPLETED`  
Date: 2026-07-16  
Seat: `Bean@Betsy`  
Execution context: `LOCAL_SALLY_WINDOWS` on hostname `BETSY`  
Repository: `C:\Users\Ben Leak\github\Werkles`  
Branch / inspected HEAD: `maker/site-g-20260703` / `176a5862b2628d878d7b4ecc4105668fd880b8bd`  
Scope: receiver-side hostile audit of the six owned VPG6 product/test files only  
Actions: read-only product inspection plus this receipt; no product edit, Git action, deploy, flag change, data access, or production mutation

## Files inspected

1. `app/bellows/recommendations/page.tsx`
2. `app/api/bellows/recommendations/packet/route.ts`
3. `lib/squibb/public-recommendation-session-server.ts`
4. `lib/matching/shadow-to-recommendations.ts`
5. `lib/matching/public-recommendation-gates.ts`
6. `scripts/foreman/test-matching-full-flock-vpg6.mjs`

Focused script observed: `PASS matching full-flock VPG6 containment and trusted-readout contracts`.

That PASS is not sufficient acceptance evidence for the reasons below.

## Verdict

`VERDICT: NO-GO`

The implementation is directionally correct and three critical controls are present in source: OFF branches before the explicit personal-reader promises, packet POST is unconditionally closed, and disqualified paths are filtered and re-ranked before adapter conversion. The G slice is not ready to claim complete because the test does not execute the most important boundaries and the adapter can silently rewrite user evidence while leaving other generated member-visible fields unsanitized.

This verdict is for the implemented G slice. Public Matching, deploy, and flag enablement remain separately `NO-GO` regardless.

## Controls that survived attack

### OFF order — source review PASS

- `lib/squibb/public-recommendation-session-server.ts:39-42` returns the closed demo before the explicit personal-reader `Promise.all` at lines 44-47.
- The closed result contains an empty intake and option-packet ledger.
- `app/bellows/recommendations/page.tsx:16` is `force-dynamic`.
- The page imports only the bounded public page-data loader, not the personal readers directly.

### Unconditional packet closure — source review PASS

- `app/api/bellows/recommendations/packet/route.ts:9-16` always returns `403`.
- The route has no request parsing, feature-flag branch, session loader, recommendation resolver, or packet store import.
- A later public-delivery flag flip cannot open this route by itself.

### Disqualified filtering and re-ranking — source review PASS

- `eligiblePublicMatchingPaths` filters before cloning/re-ranking.
- Eligible ranks are reassigned contiguously.
- The adapter converts only the filtered collection and uses it for both actionable arrays.
- The packet route is closed, so stable kind-only IDs are not currently writable.

### Exhaustive gate table — source review PASS

- `DOMAIN_GATES` uses `satisfies Record<RecommendationKind, HumanGateRequirement[]>`; a missing or extra typed recommendation key fails a real TypeScript check.
- Every current domain receives the shared blocker plus a domain-specific warning/blocker.
- `stage_intro_candidate` receives the conservative person/introduction boundary.

These are source findings, not proof that the current focused test exercises them end to end.

## Finding 1 — P0: the focused PASS is a source-text false-positive harness

### Exploit path

1. `test-matching-full-flock-vpg6.mjs:23-66` mostly searches source text with regular expressions and index ordering.
2. The OFF test checks only that the string `if (!isMatchingPublicEnabled())` appears before the first string `Promise.all`. A personal read added before the branch under another expression still passes.
3. The route test checks only that three known unsafe symbol names are absent. A renamed/imported writer or indirect mutator still passes.
4. The adapter test checks that helper-call strings and `catalog: ranked` exist. It never executes `shadowRunToRecommendationSession`; dead code, an ignored filtered result, a second unsafe return, or leaked generated text can pass.
5. Only the gate helper is transpiled and executed. The public boundary, route, page result, adapter result, all-disqualified case, and serialized member-facing strings are not executed.
6. No sentinel build/prerender check, reader call counter, file-write snapshot, malformed/concurrent POST, or input-mutation check exists.

### Damage if accepted

The receipt could claim the exact containment contract passed while future code still reads personal state under OFF, writes through an indirect route, returns a disqualified path, or leaks internal language. The test is coupled to spelling, not behavior.

### Required fix

- Add an injectable/pure boundary seam and execute OFF with session and ledger readers that throw and increment counters. Result must be demo-only, ledger empty, and counters zero.
- Execute `POST()` and assert `403` for representative requests; snapshot the three packet output locations and prove no writes.
- Execute `shadowRunToRecommendationSession` with synthetic runs rather than matching adapter source text.
- Test eligible + disqualified, all-disqualified, reordered, and repeated-conversion fixtures; assert contiguous ranks, both arrays, required gates, deterministic output, and unmodified input.
- Traverse the actual generated session object and inspect every system-generated member-facing string.
- Add a build/prerender sentinel check or equivalent production-build manifest proof for the page boundary.

### Exact retest

The focused script must fail if any of these deliberate mutations are introduced: a personal reader before the OFF branch, an indirect packet write, a disqualified path returned in either array, an info-only gate, internal jargon in a generated field, or mutation of the source run. Restore the code and prove it passes.

## Finding 2 — P1: the jargon scrubber corrupts member evidence

### Exploit path

1. `shadow-to-recommendations.ts:38` applies `memberFacingText` to every fact value.
2. `memberFacingText` globally rewrites `Layer 0`, `not-match`, `Squibb`, and the ordinary names `Dink`, `Thufir`, `Bean`, and `Ender`.
3. A self-reported fact such as `I work with Bean at Layer 0 Labs` becomes `I work with Werkles review at initial intake read Labs`.
4. The focused test never executes this function or checks preservation of self-reported text.

### Damage if accepted

Werkles can display a member's own evidence inaccurately, changing people, companies, or technical terms they actually entered. That undermines the truthfulness boundary the slice is intended to strengthen.

### Required fix

- Preserve self-reported values verbatim. Do not run free-form member input through a role-name/jargon replacement regex.
- Sanitize only structured, system-generated fields whose provenance is known.
- Prefer explicit member-facing construction over post-hoc global word replacement.
- Add fixtures containing `Bean`, `Ender`, `Dink`, `Thufir`, `Layer 0`, `not-match`, and `Squibb` as legitimate user text and prove exact round-trip preservation.

### Exact retest

Synthetic self-reported values must survive byte-for-byte in the returned evidence while system-generated primary bottleneck, translated need, rationale, operator context, source label/detail, suggested agent, and action labels contain no internal implementation jargon.

## Finding 3 — P1: not all generated member-visible fields pass the language boundary

### Exploit path

- `keepOriginalPathLabel` is copied directly from `run.squibb.keepOriginalPathLabel` at adapter line 44.
- Unknown fact labels fall back to raw `f.label` at lines 66-77.
- A `verified` fact exposes raw `f.source` at line 40 without proving scope or date.
- The test searches adapter source for four old phrases but never serializes an output fixture, so these fields are invisible to the check.

### Damage if accepted

Internal crew names, implementation terms, or overbroad verification wording can still reach the member even though the receipt claims the jargon boundary passed.

### Required fix

- Put every system-generated display field behind a structured allowlist or explicit member-facing formatter.
- Do not use raw fallback labels for unknown fact IDs on a public readout; use a neutral label or reject the unknown fact from public output.
- A verified label must carry a member-safe named source plus scope and timestamp/expiry, or be downgraded from `verified` for this surface.
- Runtime-test the complete serialized adapter result, not the source file text.

### Exact retest

Create a synthetic run with internal terms in each generated display field and assert none survive in the returned member session. Separately prove self-reported text remains unchanged.

## Finding 4 — P1: the categorical “nothing verified” copy conflicts with the adapter’s verified-fact branch

### Exploit path

1. Adapter line 40 explicitly supports facts with `strength === "verified"` and exposes their source.
2. Source detail at lines 56-57 categorically says no identity, income, credit, provider, partner, funding, or outcome was verified.
3. A future or stored run containing a legitimately verified fact can therefore display both `verified` evidence and a categorical no-verification statement.
4. No current test constructs a verified fact.

### Damage if accepted

The readout contradicts itself. Either the evidence overclaims verification or the disclaimer falsely denies it; both weaken trust and complicate later legal/compliance review.

### Required fix

- Use narrowly scoped copy: the recommendation itself is not a verified match, eligibility decision, introduction, funding decision, or guaranteed outcome.
- Describe each fact according to its own provenance. Do not make a categorical claim that can conflict with supported evidence states.
- Add verified, self-reported, inferred, missing, and stale/expired proof fixtures.

### Exact retest

For each evidence strength, prove the fact label, source, scope/date requirement, and global disclaimer are mutually consistent and never convert an inference into verified evidence.

## Finding 5 — P2: gate metadata is not future server enforcement

### Exploit path

`publicMatchingHumanGates` returns display objects. No route consumes them. Today this is contained because the packet route is completely closed; a future developer could reopen the route and mistake the populated arrays for enforced gates.

### Required fix

Keep the route unconditionally closed and state this limitation in the combined receipt. A future owned-mutation slice must enforce disqualification, immutable run binding, owner identity, and gate state on the server. Do not cite this display helper as authorization or enforcement.

### Exact retest

A simulated future public-delivery enable still receives `403` from packet POST. Reopening the route requires a new owner-scoped packet and its own hostile review.

## Reopen conditions

Bean will reconsider this G slice after:

1. the boundary and adapter are executed by behavior tests, not source regex alone;
2. reader-zero-call and no-write proofs pass;
3. self-reported evidence round-trips exactly;
4. all system-generated display fields pass the structured language boundary;
5. verified-state copy is internally consistent;
6. focused regression, production-build boundary proof, and TypeScript all pass; and
7. the receipt explicitly says the percentage-confidence UI, authentication/ownership, export/deletion, deploy, and public go-live remain unresolved.

`COMPLETED — BEAN G REVIEW; NO-GO PENDING BEHAVIORAL PROOF AND TRUTHFULNESS FIXES`

---

## Re-review — corrected VPG6 slice

Re-review date: 2026-07-16  
Files re-read: the same six scoped product/test files listed above  
Product edits by Bean: none

### Corrections verified

- The focused test now executes the actual OFF loader with seeded personal sentinels and proves both personal-reader counters remain zero.
- The focused test executes concurrent forged packet POSTs, receives `403`, and verifies the packet output locations remain unchanged.
- The focused test executes the actual adapter with mixed eligible/disqualified paths, all-disqualified paths, reordered ranks, repeated conversion, and an input-mutation snapshot.
- Disqualified paths are filtered, sorted, and re-ranked before both actionable arrays are created.
- Every current recommendation kind receives a non-info blocker; the typed exhaustive `Record<RecommendationKind, ...>` remains intact.
- Self-reported evidence containing internal-looking but legitimate words is preserved verbatim.
- Raw fact labels, the generated keep-path label, and raw verified-source claims were removed from the public adapter.
- Bare `verified` facts are downgraded because the readout lacks process, scope, and timestamp provenance.
- The categorical “nothing was verified” sentence was narrowed to the recommendation itself.
- Bean directly observed the corrected focused runtime script PASS.
- Root supplied sequential TypeScript, production-build, and post-build dynamic/non-prerender proof as PASS. Bean did not start another build because reviewers share `.next`.

### Remaining finding — P1: internal autonomous/shadow language can still escape through non-member evidence

#### Exploit path

1. `shadow-to-recommendations.ts:47-61` preserves `f.value` verbatim for **every** evidence strength, not only `self_reported`.
2. An inferred, missing, or downgraded-verified fact whose system-authored value contains `Autonomous matching`, `shadow run`, `Layer 0`, an Aeye name, or similar internal language is therefore rendered inside `evidence.label`.
3. `publicSystemText` protects primary bottleneck, translated need, and rationale, but its regex omits the exact terms `autonomous` and `shadow`.
4. The runtime test likewise omits `autonomous` and `shadow` from `internalLanguage` and excludes evidence labels from its system-generated string traversal. Its only jargon-bearing evidence fixture is self-reported, where verbatim preservation is correct.

#### Damage if accepted

The slice can still expose the old autonomous/shadow packaging or other internal prose through system-authored evidence while reporting that the member-language boundary passed.

#### Required fix

- Preserve `f.value` verbatim only when `f.strength === "self_reported"`.
- Pass inferred, missing, and downgraded-verified system values through `publicSystemText` with a neutral fallback, or construct them from a strict public allowlist.
- Add `autonomous` and `shadow` to the system-language rejection pattern. Because this filter is only for system-authored prose, withholding those terms will not corrupt member input.
- Extend the fixture with `Autonomous matching shadow run` in a non-self-reported evidence value.
- Inspect non-self-reported evidence labels in the generated-string traversal while continuing to assert exact round-trip preservation for the self-reported fixture.

#### Exact retest

1. Self-reported `I work with Bean at Layer 0 Labs on an autonomous shadow project` survives exactly.
2. The same terms in inferred, missing, or downgraded-verified fact values are withheld behind neutral public language.
3. No generated headline, translated need, rationale, evidence label/source, context, label/detail, gate, agent, or keep-path label contains `autonomous`, `shadow`, `Layer 0`, `not-match`, `Squibb`, or an internal Aeye name.
4. Focused runtime, TypeScript, production build, and post-build dynamic/non-prerender proof pass again.

### Final re-review verdict

`VERDICT: NO-GO`

The original behavioral-proof and member-input-corruption blockers are fixed. One small but concrete member-language escape remains. After the exact evidence-value and autonomous/shadow test patch above passes, this bounded local G slice can move to `GO`; that would still provide no public-go-live, deploy, authentication/ownership, export/deletion, percentage-confidence, or legal approval.

`COMPLETED — BEAN G RE-REVIEW; ONE MEMBER-LANGUAGE BLOCKER REMAINS`

---

## Final narrow-delta re-review

Re-review date: 2026-07-16  
Delta inspected: `lib/matching/shadow-to-recommendations.ts` and `scripts/foreman/test-matching-full-flock-vpg6.mjs` only  
Product edits by Bean: none

### Final blocker disposition

- `self_reported` evidence values are preserved verbatim.
- Every non-self-reported evidence value now passes `publicSystemText` with a neutral human-review fallback.
- `autonomous` and `shadow` are now forbidden by both the implementation boundary and runtime assertion.
- The verified fixture contains the full internal-language set and proves the value is withheld and the unsupported verified strength is downgraded.
- Runtime traversal now inspects every non-self evidence label in the fixture while separately proving the member's self-reported evidence round-trips.
- Bean directly reran the focused behavioral script and observed: `PASS matching full-flock VPG6 runtime containment and trusted-readout contracts`.
- Root supplied the final TypeScript PASS. Per coordination instruction, Bean did not run another production build against the shared `.next` directory.

### Final verdict

`VERDICT: GO`

This `GO` accepts only the bounded local VPG6 containment and trusted-readout implementation. It confirms the four scoped ideas and their behavioral proof: real OFF/demo boundary, unconditional packet-mutation closure, removal and re-ranking of disqualified paths, and exhaustive guarded plain-language adapter output.

It does **not** approve public Matching, flag enablement, deploy, authentication/ownership claims, export/deletion readiness, percentage-confidence presentation, legal/compliance approval, SQL, production mutation, or reopening packet writes. Those remain outside this slice and behind their existing gates.

`COMPLETED — BEAN FINAL G RE-REVIEW; BOUNDED LOCAL SLICE GO`
