# Push-custody review request: provider lifecycle foundation

LJ retains sole push custody. Nothing in this slice is staged, committed, pushed, or deployed.

## Slice

- fail-closed production runtime remains `configured: false`;
- test-only begin/consume/revoke composition boundary;
- actor/owner/authorization binding;
- action lease and outcome finalization contract;
- static factory slots for Stripe Identity, Plaid, Twilio Verify, and Checkr;
- offline hostile proofs only.

## Required before any push phrase

- Ben sign-off;
- Codex foreman sign-off;
- LJ readback and sign-off;
- preserve production OFF state;
- no provider credentials, SQL, or runtime activation bundled with this slice.

Please review file ownership and salvage boundaries before selecting any commit slice. No `git add .`.
