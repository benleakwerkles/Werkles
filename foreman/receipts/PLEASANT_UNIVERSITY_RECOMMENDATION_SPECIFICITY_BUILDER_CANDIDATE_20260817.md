# Pleasant University — Recommendation specificity builder candidate

Date: 2026-08-17
Foreman/builder: Heimerdinker@Betsy
State: `BUILDER_CANDIDATE_ONLY`
Member-facing ready: `NO`

## Review-first chain

- Operator critique: `BEN_RECOMMENDATIONS_PITHY_SPECIFIC_USEFUL_20260817`
- Vision: `foreman/handoffs/outbox/V_HEIMERDINKER_PLEASANT_UNIVERSITY_REVIEW_FIRST_PILOT_20260817.md`
- Admission: `foreman/cbcc/REVIEW_FIRST_ADMISSION_RECOMMENDATION_SPECIFICITY_20260817.md`
- Pre-code review: `foreman/handoffs/inbox/FROM_SWANSON_RECOMMENDATION_SPECIFICITY_PRECODE_REVIEW_20260817.md`
- Synthesis: `foreman/reviews/RECOMMENDATION_SPECIFICITY_PRECODE_SYNTHESIS_20260817.md`

The admission, terminal personal review, and synthesis all predate the product
mutation.

## Bounded mutation

`components/squibb/recommendation-surface.tsx` now surfaces one existing public
rationale, one existing caution, and one existing next step under the labels
`Why it fits`, `Watch for`, and `Do next`. It does not add matching logic, new
source data, custody, persistence, workflow, routes, providers, or governance UI.

The prior three-step block was removed from the main reading path to avoid
repetition. Detailed reasoning, gates, evidence, and the collapsed answer trace
remain below.

## Candidate hashes

```text
71cbc54d822fbeda05eed3c8c631ad099dcc11b33d44a60ec68f959ee054f5d2  components/squibb/recommendation-surface.tsx
3e5b4f14dcf1ed89c5e6348d03e87d8c6587cb546685b0c05daeed8929f02bed  scripts/foreman/recommendation-specificity-pilot-smoke.ts
fd8b8a02b2ef7d4f760695d53cab2a53263c3533f10b2f3928ad2ea731b81a05  scripts/foreman/pithy-recommendations-custody-smoke.ts
```

Mutation timestamp: `2026-08-17T03:32:55.5000946-04:00`

## Mechanical proof

- Recommendation specificity Pleasant University pilot: PASS
- Pithy Recommendations + local Intake recovery: PASS
- TypeScript: PASS
- Scoped whitespace: PASS, expected Windows LF/CRLF warning only
- Rendered local page: two ranked cards; selected `Strengthen your case`;
  all three reviewed labels and nonempty values visible; banned copy absent
- The stale dev runtime initially returned 404 for generated CSS. The exact
  canonical Next dev process was restarted; both stylesheet URLs then returned
  HTTP 200 and responsive computed dimensions returned.

## Hard stop

This is not reviewed, ready, accepted, baseline, or member-facing complete.
Exact-candidate hostile review from a different actual cousin is required before
Foreman assimilation.

## Exact-candidate hostile review and repair

Orson/Doozer personally reviewed the first exact candidate and returned
`BLOCKER`; receipt:
`foreman/handoffs/inbox/FROM_ORSON_DOOZER_RECOMMENDATION_SPECIFICITY_HOSTILE_REVIEW_20260817.md`.

The bounded repair now derives all three visible fields through a pure
member-facing selector. Empty or operational/internal candidates are rejected;
honest fixed fallbacks keep `Why it fits`, `Watch for`, and `Do next` nonempty.
No matching, source, custody, persistence, provider, route, profile, or
governance behavior changed.

Repaired candidate hashes:

```text
e6d18f1268fa2ae4c142dbb64fb70e55d8213491df3b0a8492234a4035b47c03  components/squibb/recommendation-surface.tsx
ce77440807ec31133ea7469e1548f195544e85cf81c2f4d147261b3a6f0b2187  lib/squibb/member-facing-recommendation-summary.ts
3f81cb05c51759d190add0db69033a7d6ed3497bee0fe8985c220070153d4080  scripts/foreman/recommendation-specificity-pilot-smoke.ts
f166b73d3344dedfc683ff5fa81db2fab839215d9ad2476e5cd965506622c786  scripts/foreman/recommendation-member-facing-summary-smoke.ts
fd8b8a02b2ef7d4f760695d53cab2a53263c3533f10b2f3928ad2ea731b81a05  scripts/foreman/pithy-recommendations-custody-smoke.ts
```

Repair proof: hostile summary contract PASS; specificity contract PASS;
prior pithy/custody contract PASS; TypeScript PASS; scoped whitespace PASS.

State remains `BUILDER_CANDIDATE_ONLY`, `member_facing_ready: NO`, pending
Orson/Doozer review of the repaired exact hashes.

## Exact-source hostile review and bounded repair

Orson/Doozer personally inspected all five relayed source files and returned a
second `BLOCKER`; receipt:
`foreman/handoffs/inbox/FROM_ORSON_DOOZER_RECOMMENDATION_SPECIFICITY_EXACT_SOURCE_REVIEW_20260817.md`.

The blocker and decision were recorded before mutation in:
`foreman/reviews/HOSTILE_REVIEW_ASSIMILATION_RECOMMENDATION_SPECIFICITY_EXACT_SOURCE_20260817.md`.

The single authorized repair normalizes only the text used for internal-copy
screening, while returning the original display sentence unchanged. It now
rejects numbered, release, plural, hyphenated, multiple-space, and line-break
gate/support-band variants. Each named bypass is an isolated hostile case.

Second-repair candidate hashes:

```text
e6d18f1268fa2ae4c142dbb64fb70e55d8213491df3b0a8492234a4035b47c03  components/squibb/recommendation-surface.tsx
fe77dc020fe8cf7bdf922a0fe4da1bff1f36bfd4c4d3b339234cba5ecba58793  lib/squibb/member-facing-recommendation-summary.ts
a8bb44bfc20ed14b9a8561131976ed5c04e04d185d263019851ee50f593c659f  scripts/foreman/recommendation-specificity-pilot-smoke.ts
baa7ef35c6c17faafcc6526b83baf4dd7efbe9793c9cf3c2282b4ba8bd037354  scripts/foreman/recommendation-member-facing-summary-smoke.ts
fd8b8a02b2ef7d4f760695d53cab2a53263c3533f10b2f3928ad2ea731b81a05  scripts/foreman/pithy-recommendations-custody-smoke.ts
```

Proof: hostile summary contract PASS; specificity contract PASS; prior
pithy/custody contract PASS; TypeScript PASS; scoped whitespace PASS.

State remains `BUILDER_CANDIDATE_ONLY`, `member_facing_ready: NO`, pending the
terminal review of this second-repair exact candidate.

## Terminal actual-CBCC seal

Orson/Doozer returned a third terminal personal review after the exact relay and
snake-case repair. All three changed source payloads matched their declared
byte lengths and SHA-256 hashes. Ruling: `PASS`; required repair: `NONE`.

Receipt:
`foreman/handoffs/inbox/FROM_ORSON_DOOZER_RECOMMENDATION_SPECIFICITY_THIRD_REPAIR_SEAL_20260817.md`

Assimilation:
`foreman/reviews/HOSTILE_REVIEW_ASSIMILATION_RECOMMENDATION_SPECIFICITY_THIRD_REPAIR_20260817.md`

Final reviewed hashes:

```text
e6d18f1268fa2ae4c142dbb64fb70e55d8213491df3b0a8492234a4035b47c03  components/squibb/recommendation-surface.tsx
6bacb2257c1f691b8fa2b8724ba603cea54c247140dba9f0729a109a254692a5  lib/squibb/member-facing-recommendation-summary.ts
b956e5c80c6cb5b8ed9bf702a4924ad55caf635a951c5b074e0c510f1dcabed3  scripts/foreman/recommendation-specificity-pilot-smoke.ts
46275cccda8b367059d39ae916df1b3e86c8b42db42eb61fe129191094a5b829  scripts/foreman/recommendation-member-facing-summary-smoke.ts
fd8b8a02b2ef7d4f760695d53cab2a53263c3533f10b2f3928ad2ea731b81a05  scripts/foreman/pithy-recommendations-custody-smoke.ts
```

Final state: `ACTUAL_CBCC_REVIEWED__LOCAL_BUILDER_CANDIDATE_COMPLETE`.
This is not pushed, deployed, or a claim that the entire Recommendations page
or matching product is complete.

## Lesson 5 causal-why candidate

Lesson 4's local walkthrough found that the visible `Why it fits` could repeat
the member's goal without explaining why the selected option followed from a
specific Intake fact. Swanson personally reviewed the pre-code admission and
returned `PASS`; the Foreman synthesis limited the repair to the existing
summary/readout seam.

The local Lesson 5 candidate now prefers one already-derived blocker, decision,
constraint, asset, stage, or urgency fact over the general goal. Its visible
sentence names the Intake fact, the selected option, and the option's existing
practical guidance. No scoring, taxonomy, matching, persistence, custody,
provider, route, profile, or governance behavior changed.

Candidate hashes:

```text
a0b737d1279cb3332e463a551946a2310f85daa987f3530886d184492d6c6afd  components/squibb/recommendation-surface.tsx
2f4a293f621c50675d3db4b64bbd37fd6975b26a553d3bba5fd6865e880ac03e  lib/squibb/member-facing-recommendation-summary.ts
57c3eefae20df1bfbed3e560e4fd35bc899a4b2313d0dfbd5c407434e40a3f09  scripts/foreman/recommendation-member-facing-summary-smoke.ts
2520ba6026c3847441f690c1ad12a685d93cbd4e48d045cae9f634f599075515  scripts/foreman/recommendation-specificity-pilot-smoke.ts
```

Mechanical proof: causal hostile contract PASS; specificity contract PASS;
prior pithy/custody contract PASS; TypeScript PASS; scoped whitespace PASS.
Rendered local proof shows the selected option's `Why it fits` citing
`Customers or sales; Tools, equipment, or space`, naming `Strengthen your
case`, and explaining the existing practical effect. Intake details remain
collapsed above the result.

Lesson 5 state: `BUILDER_ONLY__REVIEW_OWED`. This candidate is not assimilated,
ready, pushed, or deployed until a different actual cousin personally reviews
these exact bytes and the Foreman records the response.
