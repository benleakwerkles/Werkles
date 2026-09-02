# TO HEIMERDINKER — Werkles.com Deliberate Lane Choice

Packet: `TO_HEIMERDINKER_WERKLES_COM_DELIBERATE_LANE_CHOICE_VPG4_20260716`  
Seat: `Dink@Betsy` / Heimerdinker  
Execution authority: Ben (Operator)  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Lane: Werkles.com only

## Current state

- The Foundry form displays all six canonical lanes.
- Its select defaults to `Builder` before the visitor makes a choice.
- An untouched submission can therefore record an invented lane rather than the visitor's intent.

## Strongest idea

Replace the silent `Builder` default with a disabled `Choose your lane` prompt and make the select required.

This is browser-side intent protection only. Do not change the API or database contract in this slice.

## Allowed files

- `app/beta-signup-form.tsx`
- this packet and its receipt

## Proof

- default select value is empty
- `Choose your lane` appears once as a disabled prompt
- lane select is required
- all six canonical lanes remain available
- TypeScript passes
- homepage has no browser errors

## Forbidden

No valid beta submission, API contract change, database/schema work, Supabase configuration, new endpoint, dependency, deploy, push, merge, secret, feature-flag change, Harvey/ThinkIt work, or remote-machine action.

## Stop

Stop after local proof and receipt. Ben owns later commit, push, deploy, or public promotion.
