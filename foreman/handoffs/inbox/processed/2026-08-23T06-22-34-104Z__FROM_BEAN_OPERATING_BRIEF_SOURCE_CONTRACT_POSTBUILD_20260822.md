PERSONAL_REVIEW: YES
SUBAGENTS_OR_DOWNWARD_DELEGATION: NONE
CUSTODY_TOKEN: CUSTODY-BEAN-OPERATING-BRIEF-POSTBUILD-20260822-E95F

# Bean post-build hostile check — Operating Brief source contract

## Verdict

`PATCH`

The pure source module correctly restricts inputs to current accepted rows,
excludes generated/private/proposed/parked/withdrawn material, and carries the
non-agreement boundary. Two source-level repairs were required before renderer
review.

## Required repairs

1. Neutralize headings that imply legal/financial categorization:
   - `Purpose / Customer / Test`
   - `Roles / Decision Process`
   - `Contributions / Shared Wording`
   - `Ideas / IP / Confidentiality (only as written)`
   - `Pause / Exit / Open Unknowns`
2. Make staleness explicit: when an accepted source changes, a prior brief may
   not present the old text as current mutual acceptance until refreshed from a
   newly mutual current revision.

Both repairs were applied in `lib/werkle/operating-brief.ts` after this return.

## Five required post-render browser checks

1. Every empty section says exactly `Not yet written by both people.` and has no
   generated suggestion.
2. One accepted row renders verbatim under the correct neutral heading; no
   paraphrase or inferred role appears.
3. Private, proposed, and parked sentinels never appear in the brief.
4. Editing a previously accepted row makes the old brief absent/stale until
   refreshed; it never remains current mutual wording.
5. Every brief visibly says practice summary, browser-local/not-account-saved,
   not a legal document, and not an agreement; no upsell appears in that copy.

Nominated next reviewer: Lady Jessica for the visual/human renderer review.

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "BEAN",
  "custody_token": "CUSTODY-BEAN-OPERATING-BRIEF-POSTBUILD-20260822-E95F",
  "platform": "DeepSeek",
  "role": "Hostile trust/compliance audit",
  "requested_action": "post-build hostile check of Operating Brief source contract",
  "target_files": "none — review only",
  "lane": "IN_LANE",
  "DO_NOT": "NO_CODE; NO_PROVIDER_ACTION; NO_LEGAL_APPROVAL; NO_SECRETS; NO_SQL_SCHEMA_RLS; NO_PUSH; NO_DEPLOY; NO_SPEND; NO_NEW_TASK; NO_SUBAGENT; NO_SECONDARY_MODEL",
  "VERDICT": "PATCH",
  "CONFIDENCE": "HIGH",
  "UNKNOWNS": "exact renderer heading strings; whether source contract already includes acceptedRevision staleness flag; live Formation row status labels",
  "generated_at": "2026-08-22T23:05:00Z",
  "source_packet_id": "TO_BEAN_OPERATING_BRIEF_SOURCE_CONTRACT_POSTBUILD_20260822",
  "source_packet_file": "TO_BEAN_OPERATING_BRIEF_SOURCE_CONTRACT_POSTBUILD_20260822.md",
  "nextActionHash": "ddf58113ef50c4a72a8a602058677ed57032dd1ffcd4fa1f22db53e68a6474fe",
  "currentStateHash": "78e580fb3019107585768920e8d2f5fc289e6533f4b1716081bea719d772242a"
}
```

