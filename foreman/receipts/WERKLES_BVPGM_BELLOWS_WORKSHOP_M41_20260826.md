# Werkles BVPGM receipt — Bellows + Workshop M41

Date: 2026-08-26
Machine: BETSY
Repo: `C:\Users\Ben Leak\github\Werkles`
Branch / starting commit: `maker/site-g-20260703` / `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`

## Broad checkpoint

Make Workshop, Personal Bellows, and Public Bellows feel like one substantial, revisitable value loop rather than three disconnected content surfaces.

## V — packets issued before implementation

- `TO_HEIMERDINKER_V_WERKLES_BELLOWS_WORKSHOP_M41_20260826.md`
- `TO_ENDER_WERKLES_BELLOWS_WORKSHOP_M41_20260826.md`
- `TO_BEAN_WERKLES_BELLOWS_WORKSHOP_M41_20260826.md`
- `TO_LJ_WERKLES_BELLOWS_WORKSHOP_M41_20260826.md`

Ender received experience hierarchy; Bean received substance/trust; LJ received post-build visual rhythm. Ports 9335 and 9348 were not listening and no fresh M41 inbox receipt arrived. These packets are pullable artifacts, not completed reviews. No CBCC participation is credited.

## Baseline browser evidence

- Workshop: 4,956px desktop page; the hero sent the member backward to Intake before offering the work on the page.
- Personal Bellows: 6,537px desktop page; three complete lessons were expanded at once.
- Public Bellows: 1,658px desktop page; attractive doorway, but little visible evidence of the artifacts lessons can produce.

Screenshots:

- `foreman/receipts/browser-capture/m41-workshop-before.png`
- `foreman/receipts/browser-capture/m41-personal-before.png`
- `foreman/receipts/browser-capture/m41-public-before.png`

## G — implemented build

### Workshop

- Hero primary action now jumps to `#action-plan`: **Build or Review My Action Plan**.
- Intake remains available as a distinct **Review My Answers** action.
- Wrapped the Action Plan in a stable anchor.
- Converted the repeated four-room explanation into a compact native disclosure. The route order remains inspectable without occupying a full section by default.

### Personal Bellows

- Preserved all three tailored lessons, their reasoning, exercises, finish line, draft status, progress status, and lesson links.
- Recast each lesson as a ranked native disclosure with a useful closed-state summary.
- The complete three-step exercise opens on demand and remains keyboard accessible.

### Public Bellows

- Added a concrete **Three things you can make here** section.
- Demonstrates Supplier Comparison, Assumption Test, and Partnership Preparation with a plain-language purpose, promised output, and direct public lesson link.
- Keeps the full Public Bellows library one visible action away.

## M — measured result

- Workshop closed height: 4,690px (266px shorter); compact path closed; Action Plan anchor present.
- Personal Bellows closed height: 4,753px (1,784px shorter); 3 lessons present; 0 forced open; opening a summary exposes its exercise list.
- Public Bellows height: 2,279px (621px more useful content); 3 sample artifact cards present.
- Desktop: no horizontal overflow on all three audited pages.
- Mobile 390px: Personal Bellows and Public Bellows have `scrollWidth === clientWidth`; three lesson cards and three sample cards remain present.
- Browser console: no captured application errors after the final walk.

After screenshots:

- `foreman/receipts/browser-capture/m41-workshop-after.png`
- `foreman/receipts/browser-capture/m41-personal-after.png`
- `foreman/receipts/browser-capture/m41-public-after.png`
- `foreman/receipts/browser-capture/m41-personal-mobile.png`
- `foreman/receipts/browser-capture/m41-public-mobile.png`

## Verification

- `npm run typecheck` — PASS
- `node scripts/foreman/workshop-route-sequence-smoke.mjs` — PASS; contract updated for intentional Action Plan-first behavior
- `node scripts/foreman/member-workshop-account-continuity-smoke.mjs` — PASS
- `node scripts/foreman/personal-bellows-route-smoke.mjs` — PASS
- `npx tsx scripts/foreman/personal-bellows-learning-path-smoke.ts` — PASS
- `npx tsx scripts/foreman/member-language-and-revisit-smoke.ts` — PASS
- `node scripts/foreman/stable-member-header-match-deck-smoke.mjs` — PASS
- HTTP `/dashboard/blueprints`, `/bellows/personal`, `/bellows` — 200
- `git diff --check` on M41 paths — no whitespace errors; only existing Windows LF/CRLF notices

React quality pass:

- No new client data waterfall, effect, state, or serialized server payload.
- Static Public Bellows samples are module-scoped.
- Map keys use stable lesson hrefs.
- Native `<details>/<summary>` preserves keyboard activation and semantic disclosure.
- Mobile layout collapses to one column without overflow.

Known unrelated red contract:

- `scripts/foreman/bellows-lesson-route-smoke.mjs` still expects the older phrase `Next bounded check or Human Gate` inside Evidence Brief. That component was outside M41 and the stale assertion was not rewritten to manufacture a green result.

## Boundaries kept

No provider calls, credentials, schema/RLS changes, spend, foreground mouse/clipboard control, push, or deploy. Existing dirty-tree work was preserved.

## Operator walk

1. `/dashboard/blueprints` — use the hero Action Plan button, then inspect the collapsed route strip.
2. `/bellows/personal` — scan the three lesson summaries, open one, and confirm the complete exercise remains available.
3. `/bellows` — inspect and open one of the three public artifact samples.

