# TO LADY JESSICA — Werkles.com Foundry Interest Truth

Packet: `TO_LADY_JESSICA_WERKLES_COM_FOUNDRY_INTEREST_TRUTH_VPG4_20260716`  
Seat: `Maker@Betsy` / Lady Jessica  
Execution authority: Ben (Operator)  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Lane: Werkles.com only

## Current state

- The Foundry card explains the value of paid Foundry Dues.
- The form inside that card is an interest-list signup, not checkout.
- The surrounding body copy does not explicitly separate those two facts before the visitor reaches the form.

## Strongest idea

Add one plain sentence to the existing Foundry body: `The form below joins the interest list; it does not collect payment.`

Keep the headline, dues explanation, form, and layout unchanged.

## Allowed files

- `lib/copy.ts`
- this packet and its receipt

## Proof

- the interest-list/payment boundary renders before the form
- existing Foundry Dues explanation remains
- existing manual-follow-up status remains
- no pricing or checkout claim changes
- TypeScript passes
- homepage has no browser errors

## Forbidden

No pricing decision, checkout work, Stripe change, copy rewrite beyond the single boundary sentence, layout or CSS change, valid beta submission, database/schema work, deploy, push, merge, SQL, secret, production mutation, Harvey/ThinkIt work, or remote-machine action.

## Stop

Stop after local proof and receipt. Ben owns later commit, push, deploy, or public promotion.
