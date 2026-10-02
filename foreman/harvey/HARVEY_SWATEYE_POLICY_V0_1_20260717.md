# Harvey Swateye policy v0.1

Harvey's Birdeyes carry packets and receipts. Swateyes perform small, pre-authorized machine-local maintenance actions that keep an approved lane moving without asking Ben to approve the same bounded action repeatedly.

A Swateye is not a general administrator and is not an Aeye that clicks every approval prompt. Each Swateye verb must have:

1. one fixed action name;
2. an explicit machine scope;
3. a fixed executable or script entry point;
4. internal allowlist and refusal checks;
5. a second check immediately before mutation;
6. a sanitized terminal receipt;
7. negative tests proving broader lookalike actions remain blocked.

## First verb

`SWATEYE_GIT_LFS_RECOVERY` is limited to canonical machine `Spanzee`, operating-system hostname `SPANZEE`.

The verb may stop an individual `git-lfs.exe` PID only when the local wrapper proves all of the following:

- the executable path is an installed, resolved Git LFS path;
- the process is at least ten minutes old;
- its parent is absent or its parent PID has been reused;
- its CPU time is unchanged within the allowed sampling tolerance;
- it owns no TCP connection;
- it has no child process; and
- process identity, creation time, parent state, child state, and TCP state still pass immediately before the stop.

Ambiguity fails closed. A zero-match run is a successful no-op. The wrapper stops exact PIDs only.

The following broad command is deliberately not authorized:

```powershell
Stop-Process -Name git-lfs -Force -ErrorAction SilentlyContinue
```

It could terminate a legitimate active transfer. Harvey must never report that a queued action, a prompt, or a `SENT` state is completion. Only the Handeye's terminal `COMPLETED` or `BLOCKER` receipt closes the action.

## Permission surfaces

- Harvey Handeye: a live Spanzee HMAC Handeye advertises the exact capability and may execute it after claiming a Harvey command.
- Codex in a trusted Werkles checkout: `.codex/rules/swateye.rules` permits only the fixed wrapper invocation after Codex restarts.
- Other Aeye products: the receiver must invoke the same wrapper or return `SWATEYE_ROUTE_NOT_INSTALLED`. Do not translate this policy into broad terminal access.

## Expansion rule

Every future Swateye verb gets its own policy ID, wrapper, machine boundary, refusal tests, and receipt contract. Similarity to an existing action is not authorization.
