# Werkles Full Flock P Receipt — Bean VPG6

Status: `COMPLETED`  
Date: 2026-07-16  
Seat: `Bean@Betsy`  
Execution context: `LOCAL_SALLY_WINDOWS` on hostname `BETSY`  
Repository: `C:\Users\Ben Leak\github\Werkles`  
Branch / pulled HEAD: `maker/site-g-20260703` / `176a5862b2628d878d7b4ecc4105668fd880b8bd`  
Mode: hostile P pull and acceptance attack only; no product edit, test execution, Git action, deploy, data access, or public-state change

## Packets pulled

1. `foreman/handoffs/outbox/TO_HEIMERDINKER_WERKLES_COM_MATCHING_CONTAINMENT_FULL_FLOCK_VPG6_20260716.md`  
   SHA-256: `599a63ec3c9c7bb5a49c2118565db377cad5ffdb324b7fa0d2041d1284bd32b9`
2. `foreman/handoffs/outbox/TO_LADY_JESSICA_WERKLES_COM_MATCHING_TRUSTED_READOUT_FULL_FLOCK_VPG6_20260716.md`  
   SHA-256: `b5ebc29114e35ca14264dfe7e48bd20f791a255b5e6cc0a3856937cf07d8de81`

Finalized attack state pulled:

- `foreman/reviews/BEAN_MATCHING_AUTONOMOUS_GO_LIVE_ATTACK_REVIEW_20260716.md`  
  SHA-256: `e623e38137e8b2b3bf86ab8aec0dce647b71ab51448d87040d1ab762ccc0bede`
- `foreman/reviews/MATCHING_AUTONOMOUS_MULTI_ROLE_REVIEW_SYNTHESIS_20260716.md`  
  SHA-256: `8256d5cec178d7126f4c64a61145d3ab78657997321f5b50b40870b5c9ce1485`
- `foreman/reviews/THUFIR_MATCHING_AUTONOMOUS_LEGAL_COMPLIANCE_REVIEW_20260716.md`
- `foreman/reviews/ENDER_DOOZER_MATCHING_AUTONOMOUS_BUILD_READINESS_REVIEW_20260716.md`
- current source, `foreman/HUMAN_GATES.md`, `foreman/LANES.md`, `foreman/BUDGET.md`, `foreman/NEXT_ACTION.md`, `foreman/CURRENT_STATE.md`, and `foreman/OPERATOR_DASHBOARD.md`

## Current Flock state

- The source flag is still `MATCHING_AUTONOMOUS_PUBLIC=false` in `lib/matching/feature-flags.ts`.
- The current server loader still bypasses that OFF state because `lib/squibb/recommendation-session-server.ts:31` accepts a run when its permanent mode is `shadow`.
- The recommendation page still calls the unowned session and global ledger readers in `app/bellows/recommendations/page.tsx:19-23`.
- The packet route still parses a public request, loads the unowned global session, and writes repo artifacts without authentication or ownership proof in `app/api/bellows/recommendations/packet/route.ts:23-55`.
- The adapter still converts every scored path, including disqualified paths, sets `humanGates: []`, and aliases the full converted list into both `ranked` and `catalog` in `lib/matching/shadow-to-recommendations.ts:11-58`.
- `foreman/NEXT_ACTION.md` reflects the current Matching gate; `foreman/CURRENT_STATE.md` and `foreman/OPERATOR_DASHBOARD.md` remain stale June rescue-state documents. No implementation receipt should claim cockpit unanimity.
- The worktree was already dirty before this P receipt. In the proposed implementation neighborhood, `lib/squibb/recommendation-session-server.ts`, `lib/squibb/recommendations.ts`, and `lib/matching/score-paths.ts` contain pre-existing modifications. Dink must not absorb those files into this G commit.

## Bottom line

The four proposed G ideas are the correct containment direction, but their prose-level acceptance checks are not sufficient by themselves. A shallow implementation can pass the named checks while preserving an unauthenticated future-ON write path, time-of-check/time-of-use recommendation substitution, display-only gates, internal jargon, and percentage certainty.

`VERDICT: CONDITIONAL GO` for the bounded local G implementation only.  
`VERDICT: NO-GO` for public Matching, deploy, or flag enablement after this slice.

## Attack 1 — “OFF means demo-only and empty ledger”

### Exploit path

1. A repair checks `MATCHING_AUTONOMOUS_PUBLIC` only after starting `loadSquibbRecommendationSessionForBellows()` or `loadBellowsPacketLedger()` in `Promise.all`.
2. The page returns a demo and empty ledger, so a render assertion passes.
3. The unowned global readers still execute and can load personal intake/run/packet state during build or request processing.
4. A later source flip to ON lets a build/prerender execute those readers and cache global member content because the page has no explicit personalized dynamic boundary.

### Damage if shipped

The visible page looks contained while sensitive global reads still occur. A later redeploy or flag change can reintroduce cached cross-member content without touching the containment code.

### Required fix

- Branch on the server delivery decision **before constructing or awaiting any personal-reader promise**.
- OFF must construct the static demo session directly and return `{ intakes: [], optionPackets: [] }`; it must not call a helper that internally probes latest intake/run/ledger state.
- Keep the OFF decision and safe state in one bounded server helper so the page cannot accidentally mix demo session with a real ledger.
- Add an explicit request-bound rendering boundary before personalized delivery is ever possible. `force-dynamic`/equivalent is defense in depth, not a substitute for owner scoping.
- Do not solve this by editing the already-dirty `recommendation-session-server.ts` in this slice.

### Exact retest

1. Seed dependency fakes with unique personal-looking sentinels and counters for intake, run, and ledger reads.
2. With delivery OFF, call the bounded server helper and render the page: result is demo-only, both ledger arrays are empty, all personal-reader counters are exactly zero, and no sentinel is serialized.
3. Run the production build proof with seeded sentinels and assert no sentinel exists in prerender output or build artifacts.
4. Prove the OFF branch executes before promise construction by using reader fakes that throw on invocation; the page still returns the safe state.
5. Do not edit the real flag merely to test branches; inject the delivery decision into the bounded test seam.

## Attack 2 — “Reject packet mutation while OFF”

### Exploit path

1. A repair adds `if (!isMatchingPublicEnabled()) return 403` and otherwise preserves the current route.
2. The OFF regression passes.
3. A future authorized public flag flip automatically activates the existing unauthenticated global-session lookup and filesystem write path.
4. Stable IDs such as `shadow-find_partner` are not bound to a run, intake, owner, or page view. A stale tab can therefore post an ID that is resolved against whichever global session is latest at POST time.

### Damage if shipped

The flag becomes an authentication switch. A later go-live can expose unauthenticated packet writes and attach an action to a different intake/run than the user saw. OFF rollback closes the route only after the unsafe period begins.

### Required fix

- For this containment slice, deny public packet mutation unconditionally until authenticated owner custody exists. OFF-only denial is not enough to make the route safe for a future ON state.
- Return the denial before request-body parsing, global session lookup, recommendation resolution, directory creation, packet write, Speaker-entry write, or index append.
- Keep `pursue_path`, `keep_original_path`, and `request_more_proof` closed together; changing the action string must not bypass the denial.
- A later owner-scoped slice must bind the request to an immutable member + intake + run + recommendation tuple and reject stale tuples. Never re-resolve a stable kind-only ID against “latest global.”
- Normalize the denial response; do not return raw internal exception text or filesystem details.

### Exact retest

1. POST valid, malformed, forged, stale, missing, and oversized bodies while closed. Every response fails closed before body parsing and all session/store spies remain at zero calls.
2. Snapshot `data/squibb/recommendation-packets`, `foreman/speaker/entries`, and `data/squibb/recommendation-packets.jsonl`; prove byte-for-byte no write for every denied request.
3. Simulate a future “delivery allowed” decision without changing production state. Until auth/ownership exists, the packet mutation still denies and writes nothing.
4. Create fake Run A and Run B with the same recommendation kind. A Run A request after Run B becomes current must be rejected, never rebound to Run B.
5. Run concurrent denied requests and prove no partial file, directory, or index row is created.

## Attack 3 — “Disqualified means absent and non-actionable”

### Exploit path

1. The adapter filters `path.disqualified` from the rendered `ranked` list but leaves `catalog` built from the unfiltered set, or filters only after converting/aliasing the arrays.
2. The disqualified ID remains resolvable by the packet route or catalog UI.
3. Even if both arrays are filtered, the current POST re-loads the latest global session and uses kind-only IDs, so a stale recommendation can resolve to a different current run.
4. Filtering preserves original ranks, allowing the visible deck to begin at rank 2 or 3 and leak that hidden paths existed without explaining why.

### Damage if shipped

A path ruled unsafe by not-match remains stageable through direct POST or catalog drift. Users can also act on a different run than the one reviewed. A cosmetic filter would be mistaken for server-side denial.

### Required fix

- Filter disqualified scored paths **before** conversion, array aliasing, ID generation, and rank assignment.
- Re-rank the eligible output contiguously after filtering.
- Build both `ranked` and `catalog` only from the filtered collection; no disqualified ID may exist in either actionable array.
- Treat the closed packet route from Attack 2 as the required server-side compensating control for this slice. Do not claim filter-only server enforcement.
- If disqualified reasons are retained later, expose them only as non-actionable explanation data with no packet/save affordance.

### Exact retest

1. For every recommendation kind, supply eligible and disqualified fixtures and assert disqualified IDs are absent from `ranked` and `catalog` while eligible ranks are contiguous.
2. Supply an all-disqualified fixture and assert a safe proof/pause outcome or empty actionable deck, never a resurrected blocked path.
3. Assert the closed direct route cannot stage a known disqualified ID, a fabricated ID, or a stale formerly eligible ID and performs zero writes.
4. Assert the adapter never mutates the source `scoredPaths` array and repeated conversion is deterministic.

## Attack 4 — “Domain-aware human gates and plain beta language”

### Exploit path

1. A helper returns one `info` gate with `kind: "none"`; a weak test checks only `humanGates.length > 0` and passes.
2. The route still stages `pursue_path` because `humanGates` is display metadata and no server invariant consumes it.
3. A default switch branch silently gives a newly added recommendation kind a generic gate.
4. `stage_intro_candidate` is treated as one domain even though its target may be a person, lender, tool, space, or training provider.
5. Only `source.label` is renamed. Member-visible `operatorContext`, `confidence.why`, and `suggestedAgent` still expose “Shadow run,” “Layer 0,” “not-match,” and internal crew language.
6. The unchanged UI still renders heuristic path points as percentage “confidence,” so a beta label does not cure false precision.

### Damage if shipped

The product can claim every path is gated while no action is actually stopped. New kinds can silently escape review. Money, employment, relocation, training, and people recommendations can carry the wrong warning. Internal implementation jargon and percentage certainty still overstate what the deterministic rules know.

### Required fix

- Make the domain mapping exhaustive over `RecommendationKind`; a new kind must fail TypeScript or the focused test until deliberately classified. No permissive default.
- Require at least one real action boundary per automated recommendation. An informational “recommendation only” row does not satisfy the human-review proof.
- Capital/lending/ownership, people/intros, jobs/relocation, training, equipment/commitment, and proof/translation each need distinct wording. Treat ambiguous `stage_intro_candidate` with the most conservative relevant people/external-intro boundary until target-domain metadata exists.
- Keep all packet mutations closed in this slice; populated gate arrays are not server enforcement.
- Scrub all member-visible adapter fields, not only the source label. No `autonomous`, `shadow`, `Layer 0`, `not-match`, internal run ID, verified-match implication, or crew-routing jargon may reach the member session.
- Do not claim this slice fixes calibrated-confidence risk. The allowed files do not remove the existing percentage confidence UI. Public readiness remains blocked until that separate defect is repaired and tested.
- Do not duplicate the gate policy and call it canonical. `lib/squibb/recommendations.ts` already has private, pre-existing gate logic and is dirty. This slice may add a bounded automated-output helper, but a later clean slice must consolidate one canonical gate policy for demo and engine output.

### Exact retest

1. Enumerate every `RecommendationKind` and assert it has the expected domain gate set. Add a compile-time exhaustiveness assertion and a runtime list equality check so type widening cannot silently pass.
2. Assert every automated recommendation has at least one `warning` or `blocker` action boundary; `humanGates: []` and info-only arrays fail.
3. Assert exact high-risk boundaries by class: no money/eligibility/approval claim; no person/affiliation/intro claim; no job/placement/compensation claim; no relocation-suitability claim; no credential/licensure/outcome claim.
4. Serialize every member-visible session string and reject `autonomous`, `shadow`, `Layer 0`, `not-match`, raw run IDs, internal Aeye names, `verified match`, and probability/success wording.
5. Assert the member copy says, equivalently: “Based only on what you entered. Nothing was verified or sent to anyone.”
6. Assert direct packet mutation remains denied regardless of which gates are attached.

## Combined Bean acceptance bar for Dink G

The combined G receipt may say `PASS` only when all of these are true:

- OFF returns demo-only + empty ledger with **zero** personal-reader calls.
- No personal sentinel reaches page serialization, prerender output, or build artifacts.
- Packet mutation is closed before parsing/lookup/write even under a simulated future delivery-enabled decision.
- Disqualified paths are absent from both actionable arrays, re-ranked, and unstorable.
- Domain mapping is exhaustive and has a real warning/blocker boundary for every automated path.
- All member-visible adapter strings are plain and bounded; the receipt makes no claim that percentage-confidence risk is solved.
- Focused runtime regression and TypeScript pass.
- Scoped diff excludes the three pre-dirty source files named above and every unrelated worktree change.
- No flag flip, auth claim, owner-custody claim, public-readiness claim, deploy, SQL, production mutation, or legal approval is inferred from the local pass.

`COMPLETED — BEAN PULL; FOUR G IDEAS ATTACKED; PUBLIC STATE REMAINS NO-GO`
