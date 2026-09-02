# TO LADY JESSICA — Werkles.com Foundry Idle Guidance

Packet: `TO_LADY_JESSICA_WERKLES_COM_FOUNDRY_IDLE_GUIDANCE_VPG5_20260716`  
Seat: `Maker@Betsy` / Lady Jessica  
Execution authority: Ben (Operator)  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Lane: Werkles.com only

## Current state

- `copy.beta.idle` still says the signup is mock-only even though the form posts to the real beta endpoint.
- The form now requires an intentional lane choice and joins an interest list with manual follow-up.
- Canonical copy should explain that real, bounded action instead of describing obsolete implementation status.

## Strongest idea

Set the canonical idle guidance to:

`Choose your lane and join the Foundry interest list. Follow-up is manual; no automated email is sent.`

Keep the CTA, loading, success, error, payment boundary, and layout unchanged.

## Allowed files

- `lib/copy.ts`
- this packet and its receipt

## Proof

- canonical idle copy contains the intentional lane instruction
- canonical idle copy says follow-up is manual
- canonical idle copy says no automated email is sent
- obsolete mock-only idle copy is absent
- rendered status appears once
- TypeScript passes
- homepage has no browser errors

## Forbidden

No new promise, email automation, pricing decision, checkout work, copy rewrite outside the one idle value, layout or CSS change, valid beta submission, database/schema work, deploy, push, merge, SQL, secret, production mutation, Harvey/ThinkIt work, or remote-machine action.

## Stop

Stop after local proof and receipt. Ben owns later commit, push, deploy, or public promotion.
