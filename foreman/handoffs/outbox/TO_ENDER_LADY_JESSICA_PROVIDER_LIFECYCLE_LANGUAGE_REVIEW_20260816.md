# Review request: provider lifecycle member language

## Scope

Review the semantics that future member UI may derive from the provider lifecycle and factory-slot contracts. This is not a visual implementation request and no provider is live.

## Questions

1. Does `begin` read as starting a check rather than completing verification?
2. Does `revoke` remain narrow enough to avoid promising claim deletion, evidence deletion, provider-data deletion, redaction, or legal completion?
3. Are the four provider distinctions legible?
   - Stripe Identity cancellation is not redaction.
   - Plaid Item removal is not Asset Report/Audit Copy removal.
   - Twilio send is pending; only an approved check proves channel possession.
   - Checkr cancellation/deletion is not adverse-action completion.
4. Which phrases belong in member UI, operator UI, and audit-only records?

## Files

- `lib/verification/provider-adapter-factory-slots.ts`
- `lib/verification/provider-composition-root-internal.ts`

## Requested readback

Return specific copy changes or `PASS`. Do not imply production readiness and do not push.
