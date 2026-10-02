# Swateyes terminal counter — bounded implementation scope

Status: `APPROVED_LOCAL_IMPLEMENTATION`

Owner: `Swanson@Doss`

Environment: `CODEX_LOCAL` on Doss

## Work object

Create a one-shot McDonald's-style Swateyes counter generated from terminal
event receipts and exact authority evidence. Separate provider permission-prompt
clearances from other already-authorized technical blocker bypasses.

## Allowed

- Add a one-shot counter CLI, focused tests, and a generated local projection.
- Read only the canonical Swatter event stream, referenced receipt files,
  approval log, and bounded authority gate contract.
- Run the counter and focused tests locally.

## Forbidden

No watcher, poller, heartbeat, scheduled task, recurring process, provider
message, replacement task, secret access, sign-in, spend, push, merge, deploy,
publish, production mutation, destructive action, or Human Gate bypass.

## Stop condition

Stop after the counter projection is generated, tests pass, and the current
terminal-backed totals are reported.
