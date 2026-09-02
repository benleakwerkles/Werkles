# TO LADY JESSICA — Werkles.com Sixth Lane Choice

Packet: `TO_LADY_JESSICA_WERKLES_COM_SIXTH_LANE_CHOICE_VPG3_20260715`  
Seat: `Maker@Betsy` / Lady Jessica  
Execution authority: Ben (Operator)  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Lane: Werkles.com only

## Current state

- The homepage introduces six lanes: Spark, Operator, Backer, Connector, Builder, and Worker.
- The canonical user-lane choice list contains only five of them.
- As a result, `Worker` is missing from the homepage Foundry form, onboarding, and profile lane selectors.

## Strongest idea

Add `Worker` to the canonical `copy.laneOptions` list. Do not rewrite the lane model, reorder the existing five choices, or change any surrounding copy.

This makes the product's visible choice match the six-lane promise everywhere that already consumes the canonical list.

## Allowed files

- `lib/copy.ts`
- this packet and its receipt

## Proof

- `copy.laneOptions` contains six unique lanes
- `Worker` appears once in the homepage Foundry lane selector
- `Worker` remains present in the six-lane homepage section
- onboarding and profile continue consuming the same canonical list
- TypeScript passes
- homepage has no browser errors

## Forbidden

No new lane, lane redesign, copy rewrite, layout or CSS change, valid beta submission, database/schema work, deploy, push, merge, SQL, secret, production mutation, Harvey/ThinkIt work, or remote-machine action.

## Stop

Stop after local proof and receipt. Ben owns later commit, push, deploy, or public promotion.
