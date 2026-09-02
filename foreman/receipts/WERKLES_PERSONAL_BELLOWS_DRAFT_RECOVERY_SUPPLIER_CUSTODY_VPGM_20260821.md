# Receipt — Personal Bellows Draft Recovery + Supplier Custody

Date: 2026-08-21  
Executor: Dink@Betsy (`CODEX_LOCAL`)  
Branch/base: `maker/site-g-20260703` / `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`

## M ideas executed

1. Added a six-tool device draft shelf to My Bellows so members can find work they already saved and return directly to it.
2. Closed Supplier Comparison's permissive restore path with exact envelope/row keys and bounded fields.

## Product truth

- The shelf reads key presence only and says so; each tool validates its own content on open.
- `Draft on this device` never means account-saved, synced, shared, or valid.
- The shelf cannot clear member work.
- Supplier requires exactly `requirement` plus three exact six-field rows and rejects malformed data whole.
- Valid prior v1 shape remains compatible.

## Proof

- six registered tools; two-present/four-absent browser walk — PASS
- correct Draft/Tool links — PASS
- Supplier `$6550.00` calculation and valid reload — PASS
- injected Supplier row key rejected whole; empty UI restored — PASS
- browser console/page errors — none
- TypeScript — PASS
- scoped diff integrity — PASS

## CBCC state

Exact source is outgoing to Ender, Bean, and Doozer. It is not counted as participation or approval until a real response returns.

## Hard stops preserved

No content read by the shelf, destructive shelf action, account custody, network write, provider ranking, production mutation, schema, secret, payment, commit, push, or deployment.
