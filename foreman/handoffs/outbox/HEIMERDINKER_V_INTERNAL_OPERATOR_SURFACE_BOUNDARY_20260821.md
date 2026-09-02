# V — Internal Operator Surface Boundary

Date: 2026-08-21
Foreman: Heimerdinker / Codex on BETSY
Lane: Werkles local product boundary and walkthrough clarity

## Operator reaction

Ben reached `/tinkerden/receipts`, `/tinkerden/inbox`, and `/thinkit` during a Werkles walkthrough and could not tell why they existed or whether Swanson and the Dragon needed to know about them.

## Observed truth

- All three are already classified as internal routes by `lib/route-audience.ts` and middleware returns 404 outside local development or an explicitly protected preview.
- They are not linked by customer/member navigation. They are linked from `/operator` and from their own internal surface switcher.
- Their current layouts still place the normal Werkles public/member header immediately above dense relay/build controls. That makes a direct local visit look like a strange customer feature instead of an internal workshop.
- ThinkIt is a Swanson relay client/proxy. TinkerDen Inbox creates local command packets; Receipts shows returned custody/proof and can post eligible returned receipts into the local canonical contract store.

## Product decision candidate

Preserve the underlying internal tools. Do not merge them into Match Deck, Bellows, Workshop, or the member walkthrough. Make the boundary unmistakable:

1. Add one shared operator-only banner directly under the normal site header on TinkerDen and ThinkIt routes.
2. State in plain language what each family does and that it is not part of the member product.
3. Give Ben obvious exits to Member Home and the Operator Bench.
4. Keep middleware denial, `noindex`, source files, receipts, and internal APIs unchanged.
5. Send Swanson an ownership/readback packet because ThinkIt explicitly depends on the Swanson relay core. Do not invoke the Dragon merely because an old internal UI exists; only route there if Swanson reports that source-truth or relay recovery requires it.

## Hard edges

No deletion, route migration, API mutation, relay action, posting of receipts, production exposure, schema, secrets, push, deploy, or spend. Existing Operator data and historical proof remain intact.

## Required outcome

A local direct visit must answer within one screen: “This is an internal Operator tool, what does it do, and how do I get back to Werkles?”
