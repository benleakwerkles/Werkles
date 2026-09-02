# Werkles BVPGM M32–M33 — Workshop, Bellows, and Formation continuity

Date: 2026-08-24
Execution context: CODEX_LOCAL on BETSY
Branch: `maker/site-g-20260703`

## V — packets and participation

Authored and dispatched initial bounded reviews:

- `TO_SKYBRO_WERKLES_BVPGM_M32_WORKSHOP_VALUE_REVIEW_v0.1_20260824.md`
- `TO_BEAN_WERKLES_BVPGM_M32_WORKSHOP_CUSTODY_REVIEW_v0.1_20260824.md`

Skybro returned custody token `CUSTODY-SKYBRO-M32-20260824-WORKSHOP` with `SKYBRO_M32_GO`. Its material corrections were:

1. put the interactive work above static Workshop readouts;
2. require deliberate action before carrying in Personal Bellows context;
3. produce a concise single-page Action Plan Digest.

All three were implemented.

Bean returned no M32 response and receives no participation credit.

Post-build attack packets were authored for M33:

- `TO_SKYBRO_WERKLES_BVPGM_M33_WORKSHOP_FORMATION_POSTBUILD_REVIEW_v0.1_20260824.md`
- `TO_BEAN_WERKLES_BVPGM_M33_WORKSHOP_FORMATION_POSTBUILD_REVIEW_v0.1_20260824.md`

The prior background Chrome bindings were no longer callable after the runtime handoff, and the local CDP courier was not running. These M33 packets remain outbox artifacts and are **not** falsely marked delivered or returned.

## P/G — build from returned work

### Workshop became a working surface

- Added a member-authored Action Plan above the static Intake readout.
- Required: next outcome, smallest real test, observable result rule, owner, and review date.
- Optional Personal Bellows context is displayed only when present and enters only after `Use This as Context`.
- That action fills only the context field and never overwrites the plan.
- Save produces an Action Plan Digest with one outcome, one test, one result rule, one owner, and one review date.
- Save/restore/clear remain device-local and make no API request.
- The interface states that this is a working draft, not an agreement, provider result, shared promise, or account record.

### Bellows continuity

- Personal Bellows check-in labels are shared from one exported source rather than duplicated.
- A saved check-in can inform Workshop deliberately without being laundered into a plan automatically.

### Formation empathy and custody

- Walked the existing two-sided Formation experience with `ghost_095`.
- The member writes only their own side.
- The Ghost retains fixed synthetic profile answers and cannot be impersonated.
- Generic rehearsal data is explicitly not a reply from the Ghost.
- Only exact wording accepted by both practice records can enter the Operating Brief.
- Updated the stale hostile browser test that still expected the retired actor-switching UI.
- The hostile walk exposed a persistence race: `Clear my exercise` removed visible content but recreated an empty session artifact. Added one-write suppression so clear now removes the artifact completely without disabling later persistence.

## M — rendered defects found and repaired

The background rendered walk caught failures that source contracts did not:

1. Action Plan heading/body copy inherited paper ink and rendered dark on a dark panel.
2. The Workshop-to-Werkle heading rendered light on a pale panel.
3. Final Workshop wayfinding copy rendered dark on a dark gradient.
4. The humanizing Workshop image was lazy and remained a black void during the full-page walk.

Repairs:

- Added explicit component-boundary contrast rules for all three surfaces.
- Made the human image eager/priority-loaded.
- Confirmed the optimized image loaded at 1200 × 800 in the browser.

## Verification

- `npm run typecheck` — PASS
- `npx --yes tsx scripts/foreman/bvpgm-m32-workshop-action-plan-smoke.ts` — PASS
- `node scripts/foreman/workshop-route-sequence-smoke.mjs` — PASS
- `npx --yes tsx scripts/foreman/werkle-formation-contract-smoke.ts` — PASS
- `npx --yes tsx scripts/foreman/werkle-operating-brief-contract-smoke.ts` — PASS
- `node scripts/foreman/werkle-formation-bean-hostile-browser-smoke.mjs` — PASS after updating it to the current non-impersonation contract
- Background browser Action Plan save → digest → reload restore → clear — PASS
- Background browser Formation self answer → generic rehearsal → next conversation — PASS
- Rendered computed contrast checks — PASS
- Human image `currentSrc`, `naturalWidth`, `naturalHeight`, and `complete` — PASS
- Scoped `git diff --check` — PASS (line-ending warnings only)

Visual evidence:

- `foreman/receipts/browser-capture/m32/workshop-full-fixed-asset.png`
- `foreman/receipts/browser-capture/m32/formation-full.png`

## Boundaries

No provider activation, credential handling, schema/RLS work, production write, spend, push, deploy, new environment, subagent, or foreground desktop control occurred.

## Honest next walk

1. `/dashboard/blueprints` — author and save an Action Plan; confirm the Digest is useful rather than decorative.
2. `/dashboard/werkles/formation?candidate=ghost_095` — compare your side with the fixed Ghost profile, rehearse one generic second side, and decide whether the separation between rehearsal and actual mutual wording feels obvious.

