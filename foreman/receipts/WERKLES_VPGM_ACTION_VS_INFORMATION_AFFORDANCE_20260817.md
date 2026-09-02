# Werkles VPGM receipt — Action versus information affordance

Date: 2026-08-17
Execution context: CODEX_LOCAL on Betsy/Windows
Canonical repo: `C:\Users\Ben Leak\github\Werkles`
Branch: `maker/site-g-20260703`
Base commit observed: `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`

## Human finding

Rounded information bubbles and rounded controls shared too much visual language.
Users could not reliably know which surfaces were clickable before trying them.
The rounded bubble system was to remain.

## Actual CBCC review

- Petra: PASS. Persistent trailing non-color action glyph; protect static bubbles.
- Doozer: PATCH. Add a narrow terminal divider/rail around the trailing glyph.
- Ender: packet prepared, but the registered Claude Desktop CDP route did not come
  up. No review claimed.
- Lady Jessica: packet opened in the existing Cursor surface; no return receipt
  observed. No review claimed.

## Built from the reviews

- Standard `.button` and `.header-cta` controls now have a persistent terminal
  divider and a small CSS-drawn chevron.
- Static rounded cards, bubbles, chips, pills, selection controls, and generic
  buttons/links are deliberately not guessed into the rule.
- Disabled controls keep the control signature with reduced cue weight and a
  not-allowed cursor.
- Forced-colors rules preserve the divider and chevron.
- The cue uses no animation, gradient, blanket shadow, or hover dependency.

## Proof

- `node scripts/foreman/action-information-affordance-smoke.mjs` — PASS
- `node scripts/foreman/home-maria-retirement-smoke.mjs` — PASS
- `npm.cmd run typecheck` — PASS
- Desktop Home and mobile Intake rendered with system Chrome; no Next overlay.
- Browser receipts:
  - `foreman/receipts/browser-proof/action-affordance-home-desktop.png`
  - `foreman/receipts/browser-proof/action-affordance-intake-mobile.png`

## Protected operations

No provider call, secret inspection, SQL, staging, commit, push, deploy, spend, or
new environment was used.

