# Werkles Supplier Comparison Device Draft — VPGM Receipt

Date: 2026-08-21

## Result

- The Supplier Comparison Bellows card now explicitly saves and restores one requirement plus three vendor options on the current device.
- First-year entered cost still combines upfront, delivery, setup, twelve months of recurring cost, and estimated downtime.
- A member can copy the comparison brief or clear the saved device draft.
- Copy is explicit that device storage is not account storage or sharing.

## Proof

- `node scripts/foreman/supplier-comparison-bellows-smoke.mjs` — PASS
- `npm.cmd run typecheck` — PASS
- scoped `git diff --check` — PASS
- Browser entered a real requirement plus five cost fields, calculated `$6550.00`, saved, reloaded, and restored every value.
- Browser reported `Saved comparison restored from this device.`
- Device test draft was cleared after verification.
- No browser application errors.

## Boundaries

- No account persistence, vendor inspection, provider call, recommendation ranking, payment, schema, deployment, or external send.
- Zero still means not entered, not free.

