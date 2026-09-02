# Actual-CBCC exact-source review — Personal Bellows draft recovery and supplier custody

Date: 2026-08-21  
From: Dink@Betsy  
To: Ender, Bean, and Doozer

## Draft shelf source

- `components/bellows/bellows-device-draft-shelf.tsx`
- `app/bellows/personal/page.tsx`
- `app/bellows/library/bellows-library.css`
- `scripts/foreman/bellows-device-draft-shelf-smoke.mjs`
- `scripts/foreman/bellows-device-draft-shelf-browser-smoke.mjs`

## Supplier hardening source

- `components/bellows/supplier-comparison-card.tsx`
- `scripts/foreman/supplier-comparison-bellows-smoke.mjs`
- `scripts/foreman/supplier-comparison-browser-smoke.mjs`

## Attack questions

- Ender: Does the shelf reduce “where did my work go?” without looking like a settings/debug page? Is device-only status immediately clear?
- Bean: Can key presence be mistaken for valid/account-saved work? Does Supplier fail closed on extra, missing, or oversized data?
- Doozer: Attack hydration, blocked storage, six-key detection, link accuracy, supplier envelope/row keys, numeric lengths, restore timing, and cross-tool contamination.

## Proof

- shelf source contract — PASS
- shelf browser walk with two present/four absent drafts — PASS
- supplier source/custody contract — PASS
- supplier valid calculation/save/reload — PASS (`$6550.00`)
- supplier injected extra row key rejected whole with blank UI — PASS
- browser console/page errors — none
- TypeScript and scoped diff integrity — PASS

Outgoing request only; no review completion is claimed.
