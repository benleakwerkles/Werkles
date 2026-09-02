# TO LADY JESSICA — M44 post-build visual/seal review

Review the exact local M44 candidate before any release checkpoint.

Files in the bounded product slice:

- `lib/site-nav.ts`
- `components/foundry/site-header.tsx`
- `app/dashboard/blueprints/page.tsx`
- `app/dashboard/intros/page.tsx`
- `app/dashboard/crucible/page.tsx`
- `app/globals.css`

Evidence:

- `foreman/receipts/browser-proof/M44-recommendations-desktop.png`
- `foreman/receipts/browser-proof/M44-recommendations-390.png`
- `foreman/receipts/browser-proof/M44-workshop-desktop.png`
- `foreman/receipts/browser-proof/M44-workshop-390.png`

Judge member-header hierarchy, 390px height, link affordance, van crop/placement, page rhythm, and whether removed route cards created any visual hole. Return `LJ_M44_POSTBUILD_GO`, `PATCH`, or `STOP`. Do not push or deploy.

