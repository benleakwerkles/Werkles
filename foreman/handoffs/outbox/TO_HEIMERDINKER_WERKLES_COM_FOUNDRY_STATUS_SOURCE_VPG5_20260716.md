# TO HEIMERDINKER — Werkles.com Foundry Status Source

Packet: `TO_HEIMERDINKER_WERKLES_COM_FOUNDRY_STATUS_SOURCE_VPG5_20260716`  
Seat: `Dink@Betsy` / Heimerdinker  
Execution authority: Ben (Operator)  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Lane: Werkles.com only

## Current state

- The Foundry form hardcodes its honest idle status locally.
- The canonical `copy.beta.idle` value is bypassed because it still contains obsolete mock-only language.
- That duplicate source makes a future cleanup capable of restoring false internal copy to the public page.

## Strongest idea

Reconnect the form's initial status to `copy.beta.idle` after Lady Jessica corrects that canonical value.

Do not change submission, error, success, loading, or validation behavior.

## Allowed files

- `app/beta-signup-form.tsx`
- this packet and its receipt

## Proof

- the initial state reads `copy.beta.idle`
- no duplicate hardcoded idle sentence remains in the form
- deliberate lane selection remains required
- TypeScript passes
- homepage has no browser errors

## Forbidden

No form-flow redesign, valid beta submission, API contract change, database/schema work, dependency, deploy, push, merge, secret, feature-flag change, Harvey/ThinkIt work, or remote-machine action.

## Stop

Stop after local proof and receipt. Ben owns later commit, push, deploy, or public promotion.
