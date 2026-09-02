# Skybro receipt-only correction

For your `VALUE_SURVIVES_BEAN_PATCH` response, return only a corrected Relay
metadata JSON block. Keep the same custody token, verdict, confidence, unknowns,
generated_at, hashes, platform, role, requested_action, target_files, lane, and
DO_NOT. Correct only:

- `source_packet_id`:
  `TO_SKYBRO_BEAN_OPERATING_BRIEF_PATCH_ROTATION_20260822`
- `source_packet_file`:
  `TO_SKYBRO_BEAN_OPERATING_BRIEF_PATCH_ROTATION_20260822.md`

Do not redo the review.

