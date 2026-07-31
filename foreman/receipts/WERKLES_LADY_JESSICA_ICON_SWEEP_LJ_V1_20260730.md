# Receipt — Public-route icon sweep to lady-jessica-v1 family

Seat: Lady Jessica (Cursor @ Sally) — Werkles.com Foreman
Date: 2026-07-30 ~23:40 ET
Trigger: Direct Operator order during walkthrough ("the icons I hate").

## What landed (local floor, `C:\Users\Ben Leak\github\Werkles`)

Seven new icons generated in the product-icon style (flat vector, black
outline, violet #4520c9 / teal #027665 / cream #f3e9d7, transparent
background via flood-fill, 512px PNG), saved to
`public/assets/brand/product-icons/lady-jessica-v1/`:

| Icon id | File | Subject |
| --- | --- | --- |
| step-dossier | werkles-step-dossier-v1.png | clipboard + pencil |
| step-fit | werkles-step-fit-v1.png | caliper sizing a bolt |
| step-knock | werkles-step-knock-v1.png | door ajar + check badge |
| icon-armory | werkles-armory-v1.png | open toolbox |
| check-funds | werkles-check-funds-v1.png | coins + checked ledger |
| nav-proof | werkles-proof-shield-v1.png | shield + teal check |
| icon-dossier | werkles-dossier-folder-v1.png | string-clasp folder |

Wiring: `lib/site-icons.ts` remapped those seven ids from
`/assets/draft/icons/*-v0.1.png` to the new family. Pipeline script:
`scripts/one-off/make-step-icons-transparent.mjs`.

## Proof

- Production build clean; server bounced on :3000.
- Served-HTML audit across `/`, `/proof`, `/pricing`, `/discovery`,
  `/spark`, `/space`, `/formation`, `/bellows`, `/membership`,
  `/signup`, `/login`: zero `draft/icons/icon-*` references remain.
- Visual check: homepage "Name it. Verify it. Move." steps and the
  pricing Armory card render the new set.

## Still on the old set (queued, authed-only)

check-identity, check-license, check-employment, check-reference
(Crucible verification cards) and unused ids (nav-dues, icon-deck,
icon-knock, icon-register, icon-blueprint, lane-*). Next icon round.

## Process

Landed without red-team pre-review under the direct-Operator-order
exception; filed for post-review in
`TO_REDTEAM_WALKTHROUGH_CHANGES_20260730.md` §4. Touches the sealed
polish-v2 surface — fresh RESEAL required before any push.
