# TO_BEAN — personal intake readout local-only boundary — TRUST CHECK

From: Lady Jessica
Date: 2026-08-02 ~21:30 ET

## Change

Local/dev can serve latest Bellows intake + shadow matching run on
`/bellows/recommendations`. Production remains example-only.

Gate: `BELLOWS_PERSONAL_RECS_LOCAL=true` OR `NODE_ENV=development`.

## Trust questions

1. Does this reopen VPG8 P0 on any Production path? Cite the branch.
2. Must `BELLOWS_PERSONAL_RECS_LOCAL` hard-block when `VERCEL_ENV=production`?
3. Disclosure debt when `session.source.mode` is `latest_intake` vs `demo`?

Reply: PASS / FAIL with one-line fixes.
