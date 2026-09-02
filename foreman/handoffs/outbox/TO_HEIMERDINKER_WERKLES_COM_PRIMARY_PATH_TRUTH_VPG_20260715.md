# TO HEIMERDINKER — Werkles.com Primary Path Truth

Packet: `TO_HEIMERDINKER_WERKLES_COM_PRIMARY_PATH_TRUTH_VPG_20260715`  
Seat: `Dink@Betsy` / Heimerdinker  
Execution authority: Ben (Operator)  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Lane: Werkles.com only

## Current state

- Werkles helps a person state a business need, translate the real bottleneck, find a reachable next move, and inspect proof before reliance.
- The homepage and header both say `Tell us what you need`.
- Both links currently open `/signup`, which asks for an account before performing the action named by the button.
- The existing public intake route is `/bellows/intake`.

## Strongest idea

Make the primary promise mechanically true: route both `Tell us what you need` links directly to `/bellows/intake`.

Keep account signup, login, dues, and proof routes intact. Do not add middleware, auth logic, tracking, a new funnel, or a new component.

## Allowed files

- `components/foundry/hero-static.tsx`
- `components/foundry/site-header.tsx`
- this packet and its receipt

## Proof

- homepage hero link resolves to `/bellows/intake`
- header link resolves to `/bellows/intake`
- intake page loads locally
- signup remains reachable through existing account surfaces
- TypeScript passes

## Forbidden

No deploy, push, merge, SQL, secrets, production mutation, feature-flag change, Harvey/ThinkIt work, remote-machine action, or new subsystem.

## Stop

Stop after local proof and receipt. Ben owns later commit, push, deploy, or public promotion.
