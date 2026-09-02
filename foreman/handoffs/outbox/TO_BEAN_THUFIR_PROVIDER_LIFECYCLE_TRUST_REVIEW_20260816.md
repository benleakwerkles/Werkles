# Review request: provider lifecycle trust boundary

## Scope

Review the offline Werkles verification-provider composition seam for hostile authority and replay failures. Production remains unconfigured.

## Focus

- authenticated actor, owner, authorization, provider, trust-domain, capability, and action binding;
- atomic begin/revoke lease acquisition and durable success/failure finalization;
- repeat, concurrent, cross-owner, cross-provider, and cross-operation attacks;
- verified delivery-target references and redirect-origin allowlists;
- outward responses must not expose provider operation references or raw provider errors;
- revoke acknowledgement must not imply claim revocation, evidence deletion, provider-data deletion, or compliance completion.

## Files

- `lib/verification/provider-composition-root-internal.ts`
- `lib/verification/provider-composition-root.ts`
- `lib/verification/provider-composition-root.testing.ts`
- `scripts/foreman/provider-composition-root-smoke.ts`

## Requested readback

Return exact P0/P1 counterexamples or `PASS`. Do not call providers, inspect secrets, alter environments, apply SQL, stage, push, or deploy.
