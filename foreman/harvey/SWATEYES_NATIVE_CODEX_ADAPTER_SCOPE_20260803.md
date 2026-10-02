# Swateyes native Codex adapter — bounded implementation scope

Status: `APPROVED_LOCAL_IMPLEMENTATION`

Owner: `Swanson@Doss`

Environment: `CODEX_LOCAL` on Doss

## Work object

Connect the existing authenticated held-prompt, exact-operation authority, and
exact task-binding artifacts to a one-shot native Codex continuation contract.
The contract must claim one use before exposing a send, address only the exact
existing task, and admit success only after a fresh terminal native-task result.

## Allowed

- Edit `lib/harvey/swateyes-native-codex-adapter.ts`, focused tests, and local
  Swateyes receipts/documentation.
- Run focused local tests and typecheck.
- Inspect the native Codex task catalog once per VPGM cycle and send one
  continuation only when an exact current non-human held task is proved.
- Attempt up to two bounded repairs for a failed proof.

## Required truth boundary

- Prepared, claimed, or sent is not a successful Swat.
- Native tool evidence is supplied by the trusted Codex-app caller; local JSON
  alone is not cryptographic provider proof.
- A terminal receipt must match host, task, prompt, continuation, and a fresh
  post-send cursor before `RESUMED` may be recorded.

## Forbidden

No secret access, sign-in, spend, push, merge, deploy, publish, production
mutation, destructive action, recurring operation, watcher, poller, heartbeat,
background retry, GUI automation, cursor/keyboard injection, replacement task,
or Human Gate bypass.

## Stop condition

Stop at a passing focused test receipt plus either one proved terminal Swat or
`NO_CURRENT_NON_HUMAN_HELD_TASK` from the native 50-task catalog.
