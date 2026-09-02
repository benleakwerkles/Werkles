# Actual-CBCC exact-source review — Bellows artifact custody normalization

Date: 2026-08-21  
From: Dink@Betsy  
To: Ender, Bean, and Doozer

## Source

- `components/bellows/assumption-test-card.tsx`
- `components/bellows/evidence-brief-builder.tsx`
- `scripts/foreman/assumption-test-design-bellows-smoke.mjs`
- `scripts/foreman/bellows-artifact-custody-smoke.mjs`
- `scripts/foreman/bellows-artifact-custody-browser-smoke.mjs`

## Candidate

- Assumption Test now has explicit device save/restore/copy/clear with exact eight-field validation and 600-character limits.
- Evidence Brief now restores only an exact four-key envelope, exact eight-field values, known enum values, and 600-character limits. Any malformed draft is rejected whole; no partial restore.

## Attack

- Ender: Does the custody language remain clear without becoming repetitive or visually noisy? Are Save, Copy, and Clear distinct?
- Bean: Attack device/account/share ambiguity, malformed and oversized values, enum substitution, extra/missing keys, and copy boundary.
- Doozer: Attack hydration, invalid JSON, storage exceptions, restore timing, clear, cross-tool keys, and controlled input behavior.

## Proof

- source contracts — PASS
- Assumption save/reload/clear — PASS
- Assumption extra-key injection rejected with blank UI — PASS
- Evidence 601-character injection rejected with blank UI — PASS
- browser console/page errors — none
- TypeScript and scoped diff integrity — PASS

Outgoing request only; no review completion is claimed.
