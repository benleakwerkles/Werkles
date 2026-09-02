# Werkles BVPGM Release Checkpoint M2 — Proof CSS

Date: 2026-08-23  
Foreman: Heimerdinker@Betsy  
Status: `LOCAL_REPAIR_PASS__INDEPENDENT_REVIEW_OWED`

## Operator report

Proof and the shared header appeared broken while the local candidate was being
prepared for a possible live push checkpoint.

## Reproduced failure

- `/proof` returned HTTP 200 but loaded zero stylesheets.
- The linked `/_next/static/css/app/layout.css` returned HTTP 404.
- The body fell back to Times New Roman and the unstyled header grew to 635px.
- Root cause: `next build` and the active `next dev` process shared `.next`, so
  the release compiler replaced the walkthrough server's CSS/chunk manifests.

## Bounded repair

- `next.config.ts`: development output now uses `.next-dev`; production remains
  on `.next`.
- `.gitignore`: `.next-dev/` is local generated output.
- `tsconfig.json`: Next registered `.next-dev/types/**/*.ts` as generated types.
- The candidate inventory now treats `tsconfig.json` as product configuration.

## Verification

- Proof stylesheet: HTTP 200, 389247 bytes.
- Rendered Proof after repair: 2 stylesheets, Inter typography, 131px sticky
  member header, no Next error overlay.
- Shared-header sweep: 7/7 PASS across Home, Login, Intake, Recommendations,
  Crucible, Formation, and Proof.
- Exact regression proof: `npm run build` completed while `next dev` stayed live;
  Proof remained styled after the build.
- `npm run build`: PASS, 100 routes.
- `npm run typecheck`: PASS when run after generated-type production.
- Receipt-bound candidate contracts: 29/29 PASS.
- Candidate boundary: 277 files, zero changed-import leaks.
- Candidate digest:
  `983e517f8181998b52b4d04a59e07d43bae121d64332c854b724851a789c829a`

## Rotation truth

The Ender and Edge/CBCC local routes on ports 9348 and 9335 were not listening.
The v0.2 source-bound mission and Lady Jessica review packet were updated with
the new digest and explicit CSS-collision reproduction leg. No fresh cousin
receipt or independent sign-off is claimed.

## Gate

Heimerdinker release sign-off remains open. Lady Jessica independent review and
sign-off remain open. Ben's exact push approval has not been requested. No push,
deploy, provider activation, schema/RLS action, secret access, production
mutation, or spend occurred.
