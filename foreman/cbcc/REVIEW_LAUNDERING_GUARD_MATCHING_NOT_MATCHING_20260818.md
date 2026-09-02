# Review laundering guard — Matching Not Matching recovery

Date: 2026-08-18  
State: `BUILDER_ONLY__UNREVIEWED_CANDIDATE__MUTATION_LOCKED`  
Mutation permission: `NO_MUTATION_ALLOWED`

## Process disclosure

```yaml
mutation_happened_before_current_slice_review: YES
old_reviews_used_as_context_only: YES
old_reviews_controlling_basis: NO
candidate_promoted: NO
candidate_reviewed_exactly: NO
```

## Exact candidate identity

Candidate capsule:

```text
bytes: 32320
sha256: 2c3d0431db60441427e82837a00e1cc4a0588218e02d682a4e68e8d5ef68b80d
```

The capsule contains these exact source files:

```text
lib/matching/opportunity-case.ts|9641|3d5dcea771845e7baf24ae05313cf0efb740937d0ee9c3c2fa4a21adbf226359
lib/matching/types.ts|4535|8d52abbf7bb983cdc1e063a9ea56e3de3cdd5a9237821fd9a0a085d95edd25a5
lib/matching/signals.ts|9797|dff8a544b6e691aadab5ceaaec8cfa8a6d8a69e0b0ecb8f2a4efb8d7f79d5a82
lib/matching/not-match.ts|6007|7fe494193005eef46191ebe5b716959d6285bc6e11e60661a436a9109cf5348c
lib/matching/shadow-to-recommendations.ts|6284|fd3ed69b0af939335b87bb1541d1385b0da6f1e3bd7aa32b373edc3c7f5da6e3
lib/squibb/recommendations.ts|18071|c8e1f016a9893d1a04c1d84fadef4ad5d045ed7683a8dfa600c0462732a6f7d4
lib/owner-surfaces/owner-state.ts|10962|e98d1605a9ffabdf3783252f7da850de78bf196a1ac71e8f3face2dbc8ef4123
app/dashboard/blueprints/page.tsx|11128|fdfc3478924b65437804ecf145bf508dbd2531cbf49d3a028c1981a7555ba3b3
components/squibb/recommendation-surface.tsx|14278|f9d8d1cf677658585f73a25f3f8e1f85010b170dd7bfc22a57bbc90540398bfa
scripts/foreman/matching-opportunity-case-smoke.ts|4468|3149c4fe63753bcbf0af5b5ea019b753eb1b5ecb5247c7fc6949385b5a47ce3b
```

## Recovered canon identity

Ordered canon-manifest SHA-256:
`cac93a5405c617e639f5eee8765525ddc705d257da2e8b3a2a9f977221889727`

```text
foreman/receipts/WERKLES_MATCHING_NOT_MATCHING_ENGINE_20260709.md|2290|50a6e72455826df7a1500143de081c2addee44791bfd9325a85c865e91457a56
company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md|9729|2a1a9f956aa799bb2149304a6744b705e445b399d363da68cdbd8b3e0f9ee931
company/WERKLES_MATCHING_RULES.md|1677|3f2082fc043a43b5c4b9c0002fbda2b55efa1b3c798ee5d33dcb8001951a8ec3
artifacts/matching-inbox/WERKLES_MATCHING_NOT_MATCHING_SOURCE_DOSSIER_20260708.md|227751|92ca85829b276a0e1f9d6b80aeccf3d5329f4073d88ec0da243ad4227802f754
foreman/speaker/entries/DRAFT_20260608-not-matching-matching.md|1954|2b5a4dedc99f032f1477c09bd53a986aedcd51aa73f626e08664dd4bfa20b246
```

## Old reviews

The earlier Bean, Ender, and Petra reviews are `PRIOR_CONTEXT_ONLY`.

For every such review:

```yaml
controlling_basis: NO
reviewed_current_candidate: NO
reviewed_current_recovered_architecture: NO
```

## Current participation

- Swanson/Petra process ruling:
  `FROM_SWANSON_PLEASANT_UNIVERSITY_BREACH_RECOVERY_20260818`
- Petra architecture ruling:
  `FROM_PETRA_MATCHING_NOT_MATCHING_RECOVERY_PRODUCT_RULING_20260818`
- Exact-source hostile review: `PENDING`
- Foreman assimilation: `NOT_ALLOWED_YET`

## Forbidden claims

- reviewed because old reviews existed;
- reviewed because a packet was sent;
- reviewed because local tests passed;
- reviewed because canon was recovered;
- reviewed because cousins discussed the topic previously;
- reviewed because a current cousin reviewed only the description rather than
  the exact candidate bytes.

