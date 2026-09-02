# Receipt — Bellows Artifact Custody Normalization

Date: 2026-08-21  
Executor: Dink@Betsy (`CODEX_LOCAL`)  
Branch/base: `maker/site-g-20260703` / `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`

## M ideas executed

1. Added explicit, validated device save/restore/clear to Assumption Test so member work no longer disappears on navigation or reload.
2. Replaced Evidence Brief's permissive partial restore with exact-envelope, exact-field, bounded-value, known-enum validation.

## Proof

- prior Assumption Test sentinel updated to preserve the new exact custody contract — PASS
- Bellows artifact custody source contract — PASS
- installed Edge valid save/reload/clear — PASS
- Assumption extra-key draft rejected whole — PASS
- Evidence oversized draft rejected whole — PASS
- rejected drafts left member fields blank — PASS
- browser console/page errors — none
- TypeScript — PASS
- scoped diff integrity — PASS

## CBCC state

Exact source is outgoing to Ender, Bean, and Doozer. It is not counted as participation or approval until a real receipt returns.

## Hard stops preserved

Device storage only. No account custody, network write, automatic share, production mutation, schema, provider, secret, payment, commit, push, or deployment.
