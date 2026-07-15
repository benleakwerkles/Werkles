# Harvey Red Team And Test Ladder

Status: `ACTIVE_FROM_OUTSET`  
Parent scope: `HARVEY_LOCAL_INTEGRATION_AND_FLEET_ACTIVATION_SCOPE_20260713`

## Independent seats

| Seat | Mission | May edit | Close condition |
|---|---|---:|---|
| Bean red team | Hostile security, proof-integrity, wrong-machine, and failure-mode audit | No | Returns prioritized findings and reruns each slice acceptance set |
| Petra | Cross-cutting synthesis, operator burden, and GO/NO-GO review | No | Returns independent GO/NO-GO after Bean and Maker evidence |
| Maker/Ender | Operator UX, readability, accessibility, and live-growth review | No | Returns Sally-visible acceptance criteria and final UX verdict |
| Swanson/Dink | Sally route, connectivity, topology, and receipt proof | No | Returns Sally-local proof path or exact transport blocker |
| Foreman @ Doss | Implementation and mechanical tests | Yes, within scope | Cannot approve its own red-team closure |

## Test ladder

Every implementation slice must stop for these checks before the next slice:

1. **Source boundary** — `git status`, changed-file manifest, zero unrelated staging.
2. **Static validity** — JSON parse, PowerShell parser where applicable, TypeScript typecheck.
3. **Security unit tests** — unauthenticated or mismatched machine writes fail closed; path and command allowlists hold.
   The authoritative machine/hostname mapping must be server-side; a caller may
   not supply both the claimed machine and its own expected hostname.
4. **Build** — production `next build` succeeds.
5. **Local runtime** — `/harvey` and read-only Harvey APIs return expected status.
6. **Live update** — a bounded Doss-side test change appears automatically in an already-open Harvey page.
7. **Sally acceptance** — the same live update is observed and receipted from Sally, with hostname evidence.
8. **Independent red team** — Bean reruns the slice-specific tests and returns `PASS`, `PASS_WITH_FINDINGS`, or `BLOCKER`.
9. **Receipt readback** — `SENT`, queueing, or commentary never closes the slice.

## Initial blockers discovered before product mutation

- `HARVEY_MACHINE_CONTROL_CALLER_IDENTITY_UNPROVEN`: LAN write endpoints accept machine heartbeats, commands, and terminal receipts without authenticated caller binding.
- `HARVEY_SALLY_LIVE_UPDATE_UNPROVEN`: the current page requires navigation or manual reload for server data; the monitor interval updates only the age label.
- `HARVEY_BROWSER_AUTOMATION_UNAVAILABLE`: the local in-app browser controller failed during baseline initialization; Sally acceptance cannot be replaced with Foreman self-review.

## Required receipt shape

```text
RECEIVED
SLICE_ID: <id>
REVIEWER: <independent seat>
TESTS_RUN: <exact tests>
FINDINGS: <NONE or exact list>
VERDICT: <PASS | PASS_WITH_FINDINGS | BLOCKER>
NEXT_ACTION: <smallest safe next move>
COMPLETED
```
