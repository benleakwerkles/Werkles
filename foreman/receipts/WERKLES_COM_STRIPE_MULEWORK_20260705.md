# WERKLES_COM_STRIPE_MULEWORK_20260705

RECEIPT_ID: WERKLES_COM_STRIPE_MULEWORK_20260705
TIMESTAMP: 2026-07-05
LANE: Werkles.com / Gate 1 test checkout prep

## Before you click Pay (Ben)

1. Log in at https://werkles.com/login
2. Open profile once if checkout says dossier missing
3. Use test card `4242 4242 4242 4242` only
4. Proof = Stripe webhook event + /dashboard/billing — not success page

## Mechanical work done (no secrets printed)

| Step | Result |
|------|--------|
| Stripe API — Foundry Dues price IDs | Refreshed monthly + annual in 1Password |
| Stripe API — test webhook | Created `we_1Tq0y6BzNBvy0VkUWOJLgD6l` → werkles.com/api/webhooks/stripe |
| Old duplicate webhooks | Disabled 2 prior matching endpoints |
| STRIPE_WEBHOOK_SECRET | Updated in 1Password + synced Vercel Preview + Production |
| Vercel OpRefs sync | 8/8 ADDED both targets |

Receipts:
- `foreman/receipts/WERKLES_COM_STRIPE_DERIVED_FIELDS_TO_1PASSWORD_20260705.json`
- `foreman/receipts/WERKLES_COM_STRIPE_WEBHOOK_REPLACE_20260705.json`

## Ben-only remaining

Run test checkout on /membership → confirm webhook fires → confirm billing updates.

Gate phrase after proof: `APPROVE PAID CHECKOUT GO-LIVE (test mode)`
