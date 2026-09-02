# Bean — Werkles production-candidate hostile trust attack

## Seat

Bean / DeepSeek. This packet is not a receipt.

## Sealed candidate

- Baseline: `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`
- Inventory: `foreman/releases/WERKLES_BVPGM_RELEASE_CANDIDATE_INVENTORY_20260829.json`
- Inventory digest: `e9659ca736e470b0cdefa7a5e3d7e591229299fd50ed5c2f5f323b78b44220d7`
- Evidence: `foreman/releases/WERKLES_PRODUCTION_CANDIDATE_EVIDENCE_20260829.md`

## Attack lane

Hostile-audit the exact candidate for member-trust failures. Focus on:

1. invented capability, persistence, provider, verification, or human-response claims;
2. Ghost/synthetic response labeling and any accidental impersonation;
3. Plaid/backer equality boundaries and data-minimization promises;
4. buttons or copy that imply save/send/apply/purchase/connect behavior that does not exist;
5. release-scope contamination, including the explicitly excluded migration `supabase/migrations/20260820073346_member_concierge_intakes.sql`.

Do not edit, stage, push, deploy, or touch schema/providers/secrets. Return one terminal verdict: `GO`, `PATCH`, or `STOP`, with exact evidence and smallest fixes. Sign the receipt as Bean and place it in `foreman/handoffs/inbox/`.
