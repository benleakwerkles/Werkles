# To Ender — member-truth review of provider lifecycle

Date: 2026-08-16
From: Heimerdinker / Werkles Foreman
Lane: member experience, UX, emotional truth
Manifest: `foreman/handoffs/outbox/CBCC_PROVIDER_FOUNDATION_REVIEW_MANIFEST_20260816.md`

## Why you are receiving this

This is the pre-build experience review, not a request to bless finished work. The implementation currently has no member-facing route. Your judgment should determine what a future Crucible interaction is allowed to say and show.

## Exact states to review

The future surface may need to communicate these states:

- not configured;
- preparing a provider handoff;
- waiting for the member;
- provider flow open;
- provider action accepted but no proof yet;
- provider progress pending / requires input / cancelled;
- completed provider observation, still subject to Werkles claim policy;
- member closed or provider failed;
- provider side effect occurred but Werkles could not durably record the outcome (`action_outcome_unrecorded`);
- provider-operation revoke acknowledged, while claim/evidence/deletion state remains unchanged.

## Questions

1. What should each state say in ordinary language so the member never confuses starting, connecting, checking, verifying, saving, revoking, deleting, or redacting?
2. Which two states are too technical or frightening to expose directly, and how should they be converted into a useful recovery instruction?
3. Where must the UI stop the member from blindly retrying?
4. What should remain operator/audit-only?
5. What would make this feel like Werkles helping a person, rather than a compliance application?
6. Provide the smallest useful state hierarchy for desktop and phone; do not design twelve equal text cards.

## Required response

Return `BLOCK`, `PATCH_THEN_REVIEW`, or `PASS_FOR_COPY_ARCHITECTURE`. Include exact recommended member copy for the five most important states and one thing the interface must never do. Name the packet and manifest lineage. Save as `FROM_ENDER_PROVIDER_FOUNDATION_MEMBER_TRUTH_REVIEW_20260816.md` in the inbox.

## Do not

Do not perform a security seal, implement code, approve production, or assume a provider check proves safety, honesty, competence, solvency, or employability.

---

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "ENDER",
  "generated_at": "2026-08-16T04:42:08.493Z",
  "currentStateHash": "78e580fb3019107585768920e8d2f5fc289e6533f4b1716081bea719d772242a",
  "nextActionHash": "e9013120a47d3a0b2de6bed157a54ef772111268b687c3c0ccb2711dd226e8ea",
  "source_files_included": [
    "foreman/NEXT_ACTION.md",
    "foreman/CURRENT_STATE.md"
  ],
  "REQUIRED_RESPONSE_FIELDS": [
    "schemaVersion",
    "cousin",
    "source_packet_id",
    "source_packet_file",
    "generated_at",
    "nextActionHash",
    "CONFIDENCE",
    "VERDICT",
    "UNKNOWNS"
  ],
  "packet_id": "TO_ENDER_PROVIDER_FOUNDATION_MEMBER_TRUTH_REVIEW_20260816",
  "source_packet_file": "TO_ENDER_PROVIDER_FOUNDATION_MEMBER_TRUTH_REVIEW_20260816.md",
  "role_lane": "product / UX — not SQL, billing, security, or deploy execution",
  "human_gate_required": true
}
```
