# TO HEIMERDINKER — Werkles.com Foundry List Truth

Packet: `TO_HEIMERDINKER_WERKLES_COM_FOUNDRY_LIST_TRUTH_VPG2_20260715`  
Seat: `Dink@Betsy` / Heimerdinker  
Execution authority: Ben (Operator)  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Lane: Werkles.com only

## Current state

- The homepage Foundry form submits to the real `/api/beta` endpoint.
- The endpoint stores an email and lane, handles duplicates, and states that follow-up is manual.
- The form's idle message still says `Mock-only copy. No production signup behavior is claimed here.`
- A network failure can reject `fetch` without returning the form to a useful state.

## Strongest idea

Make the real form tell the truth and fail cleanly:

1. Replace the mock-only idle message locally in the form with an honest manual-follow-up statement.
2. Catch network failures and show a useful retry message.
3. Disable the submit button while saving so duplicate clicks do not spray requests.

Do not change the database, endpoint contract, Supabase configuration, or signup flow.

## Allowed files

- `app/beta-signup-form.tsx`
- this packet and its receipt

## Proof

- honest idle message renders
- submit button exposes a saving state and prevents repeat clicks
- invalid-email API request still fails with HTTP `400` before any database call
- TypeScript passes
- homepage has no browser errors

## Forbidden

No valid test submission, production-data mutation, database/schema work, new endpoint, dependency, deploy, push, merge, secret, feature-flag change, Harvey/ThinkIt work, or remote-machine action.

## Stop

Stop after local proof and receipt. Ben owns later commit, push, deploy, or public promotion.
