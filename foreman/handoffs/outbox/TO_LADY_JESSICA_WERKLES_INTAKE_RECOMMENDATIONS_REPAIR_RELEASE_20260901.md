# To Lady Jessica — Intake → Recommendations Repair Release

**Seat:** Lady Jessica / Maker@Betsy / sole push and deploy seat  
**From:** Heimerdinker@Betsy / Werkles Foreman  
**Operator key:** Ben said `Approve.` after confirming the reviewed repairs were
intended to be pushed live. Durable gate record:
`foreman/reviews/GATE-werkles-intake-recommendations-repair-release-20260901.md`.

## Exact candidate

- Baseline: `866c4587b8f0f672552aab843d5cdf12e846a6af`
- Branch: `maker/site-g-20260703`
- Digest: `1c8a07b7813105346422c24b5037a92d44a59374ba8abbd5d223f4ea22fc757a`
- Scope: the 22 paths listed below, and no others

```text
app/api/bellows/intake/route.ts
app/bellows/intake/concierge-intake.css
app/bellows/intake/page.tsx
app/bellows/recommendations/squibb-recommendations.css
components/squibb/account-aware-recommendation-surface.tsx
components/squibb/concierge-intake-form.tsx
components/squibb/confidence-meter.tsx
components/squibb/evidence-section.tsx
components/squibb/reasoning-panel.tsx
components/squibb/recommendation-surface.tsx
components/squibb/recommendation-work-path.tsx
lib/copy.ts
lib/squibb/browser-intake-draft.ts
lib/squibb/member-recommendation-plan.ts
lib/squibb/public-recommendation-session-server.ts
lib/squibb/recommendation-page-state.ts
lib/squibb/recommendations.ts
scripts/foreman/intake-recommendations-handoff-smoke.ts
scripts/foreman/member-copy-training-wheels-smoke.mjs
scripts/foreman/public-intake-browser-handoff-smoke.mjs
scripts/foreman/recommendation-draft-personal-bellows-continuity-browser-smoke.mjs
scripts/foreman/recommendation-solution-path-smoke.ts
```

The four gate screenshots and the gate Markdown/HTML are evidence artifacts,
not product payload. Decide whether to commit them with release custody files or
leave them local; do not let that choice widen the 22-file product manifest.

## Behavior to reproduce personally

1. Clean anonymous `/bellows/intake` starts empty—no preview user or ghost answers.
2. With anonymous server submission closed, a completed form still moves to
   ranked Recommendations by device-local custody.
3. The page says browser-profile custody, explains that clearing browser data
   removes it and that another browser/device will not have it, and does not
   claim account save.
4. No completed browser Intake yields no personal ranking and no bakery fixture.
5. A signed-in account-capable path still calls the Intake API.
6. No bakery-specific solution text appears for an unrelated business.
7. TypeScript, optimized build, and the three focused contracts pass.
8. Intake and Recommendations render at desktop and 390px without clipping or
   failed contrast; rerun axe and manually inspect the gradient items.

## CBCC terminal review

- Petra first returned PATCH on the old 18-file digest because persistence copy
  could imply more durability than browser-profile local storage provides.
- That patch was assimilated, the candidate expanded to the exact 22-file scope
  above, and all local checks were resealed.
- Petra then personally returned GO for final digest
  `1c8a07b7813105346422c24b5037a92d44a59374ba8abbd5d223f4ea22fc757a`,
  while correctly leaving repository-byte, build, browser, and deployment proof
  to this independent Lady Jessica seal.
- Doozer returned STOP on the old digest because its connected source surface
  could not inspect the dirty local candidate. It found no implementation
  defect and proved no direct notification route to this Maker/Cursor seat.
- Receipts:
  `foreman/handoffs/inbox/FROM_PETRA_WERKLES_INTAKE_RECOMMENDATIONS_RELEASE_REVIEW_20260901.md`
  and
  `foreman/handoffs/inbox/FROM_DOOZER_WERKLES_INTAKE_RECOMMENDATIONS_RELEASE_REVIEW_20260901.md`.

## Push/deploy custody

- Use an isolated exact-manifest stage. No `git add .`, `git add -A`, commit
  `-a`, or IDE stage-all.
- Verify the staged path list equals the 22-path manifest before commit.
- Deploy a candidate URL first. Smoke `/bellows/intake` and
  `/bellows/recommendations` before promotion.
- Promote only after candidate smoke. Repeat smoke on `werkles.com`.
- Prepare rollback to the current Ready production deployment before promotion.
- Halt on any digest drift, staged-path contamination, route/console failure,
  ghost answer, bakery fixture, or false persistence claim.

## Required terminal response

Return `GO`, `PATCH`, or `STOP`; include LOCAL HANDS READBACK, execution context,
candidate digest, staged paths, personally rerun checks, candidate URL result,
push/commit result, production deployment result, live smoke, and rollback target.
Do not call packet presence a receipt.
