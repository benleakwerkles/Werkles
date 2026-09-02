# Werkles VPGM receipt — Formation legibility red team

Date: 2026-08-22
Foreman: Heimerdinker@Betsy
Route: `/dashboard/werkles/formation?candidate=ghost_095#formation-table`

## V — Vision

- Issued `HEIMERDINKER_V_WERKLE_FORMATION_LEGIBILITY_REDTEAM_20260822.md` and the focused `WERKLE_FORMATION_LEGIBILITY_REDTEAM_20260822` mission.
- Acceptance was reset from “labels meet a numeric floor” to “the Operator can comfortably read and scan the actual rendered page.”

## P — Actual CBCC pull

- Sent the current packet to Bean in Bean's established DeepSeek task.
- Bean returned the matching custody token and `PATCH (P0 trust-signal fixes required before GO)`.
- Harvested the formation-only response as `foreman/handoffs/inbox/FROM_BEAN_WERKLE_FORMATION_LEGIBILITY_REDTEAM_20260822_v0.1.md`; relay status is `OK`.
- Bean's controlling findings: provenance was fine print, mutuality disappeared during the long scroll, qualitative status was buried, and twelve dense cards made the page tiring.
- Ender's desktop route was attempted; CDP did not become available. No Ender review is claimed.

## G — Reviewed changes

1. Added a compact room-wide practice rail stating the exact mutual-consent, no-compatibility-score, browser-only, and account-custody boundaries.
2. Added an explicit `Mutual wording` / `Not mutual yet` signal to every formation topic.
3. Promoted source provenance from muted small print into a 16px, high-contrast block directly attached to each source statement.
4. Raised normal source copy and decision controls to 17px; all compact trust/state copy now has a 16px floor and open line spacing.
5. Replaced the misleading `No score means compatible` wording with `No compatibility score is calculated here.`

## M — Cascade-level repair

- The exact in-app route exposed the root failure after the first rebuilt pass: global site prose rules were overriding formation colors and turning dark-card text brown.
- Repaired the cascade at the formation-page boundary for arrival, readiness, actor instructions, shared-floor warnings, history, and save/custody copy.
- Added a rendered dark-surface audit so any brown/black prose on those purple surfaces fails the browser test.

## Proof

- Bean receipt status — `OK`, matching custody token and packet hashes.
- `npx tsx scripts/foreman/werkle-formation-contract-smoke.ts` — PASS.
- `node scripts/foreman/werkle-formation-legibility-browser-smoke.mjs` — PASS at 1440px and 390px; 16px trust/provenance floor, visible mutuality, no console errors, no overflow.
- `npm run typecheck` — PASS.
- Exact in-app page at 320px — zero dark-text violations across arrival, dashboard, actor, floor, history, save, and trust-rail surfaces; no horizontal overflow.

No form answers, formation decisions, account data, schema, providers, production state, push, or deploy were changed.
