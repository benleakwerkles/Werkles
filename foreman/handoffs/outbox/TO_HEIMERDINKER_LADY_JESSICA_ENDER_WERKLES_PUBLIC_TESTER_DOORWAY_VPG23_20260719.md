# VPG23 — Public Tester Doorway

PACKET_ID: `TO_HEIMERDINKER_LADY_JESSICA_ENDER_WERKLES_PUBLIC_TESTER_DOORWAY_VPG23_20260719`
STATUS: `COMPLETED`
FROM: `Heimerdinker@Betsy`
TO: `Heimerdinker@Betsy`, `LadyJessica@Betsy`, `Ender/Doozer@Betsy`
EXECUTION_OWNER: `Heimerdinker@Betsy`
SOURCE: `codex/werkles-public-test-vpg22-20260718@cd174ef`
EXECUTION_BRANCH: `codex/werkles-public-entry-vpg23-20260719`

## Operator direction

Ben issued `V, P, G`; the established shorthand authorizes exactly two fresh packets, crew pull, two executed ideas per packet, verification, receipts, and isolated branch push.

## Pulled state

- Production is healthy on `dpl_BBBNaeGfjnZJXy3FbQVmVjePVgxo`; public/auth routes are `200`, signed-out personal delivery is `401`, saving is `403`, and intake writes are `503`.
- The homepage header and hero still send the primary CTA to signup, and the homepage has no direct recommendation doorway.
- Live browser inspection exposes internal review language (`Draft visual`, `Draft Ghost Forge`, legacy imagery notes) and a `Mock-only` email form even though the form calls a real write API.
- Bellows says `Intake first` while intake submission is deliberately closed.

## Two ideas to execute

1. Make `See a recommendation` the header and hero primary CTA, pointing directly to `/bellows/recommendations` so testers see real value before account commitment.
2. Remove internal draft/mock/legacy notes from the public homepage, replace the beta email form with real signup/recommendation doors, and make Bellows describe the open recommendation/profile path while keeping closed intake secondary.

## Acceptance

- Header and hero each expose one direct `/bellows/recommendations` link.
- Anonymous recommendation remains explicitly example-only and retains safe sign-in/signup return links.
- Homepage contains no review-only, Ghost Forge, legacy-imagery, mock-only, email-capture, or `/api/beta` client language.
- Bellows no longer claims closed intake is the first active step.
- Existing VPG19–VPG22 auth, owner-binding, save, and intake boundaries remain unchanged.

## Receipts

- `foreman/receipts/WERKLES_FULL_FLOCK_VPG23_P_LADY_JESSICA_ENDER_20260719.md`
- `foreman/receipts/WERKLES_FULL_FLOCK_VPG23_G_PUBLIC_TESTER_DOORWAY_20260719.md`
