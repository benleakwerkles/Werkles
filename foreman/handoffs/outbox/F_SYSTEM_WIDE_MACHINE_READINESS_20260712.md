# F — System-Wide Werkles Machine Readiness — 2026-07-12

Packet ID: `F_SYSTEM_WIDE_MACHINE_READINESS_20260712`
Packet class: `F`
Status: `READY_TO_CLAIM`
Created by: `Dink @ Doss via Codex Desktop`
Cockpit: `foreman/handoffs/outbox/`
Return inbox: `foreman/handoffs/inbox/`
Canonical repository: `benleakwerkles/Werkles`
Published packet branch: `machine-readiness-packets-20260711`
Published source commit: `3b407e66385a56d74a8bb8356b854c20f2494b3a`

## System Rule

This is one system-wide cockpit letter. It is not a separate packet-distribution
system for each machine.

Every Dink, Ender, Doozer, Maker, Computer, or other hands-capable cousin who
receives a K should:

1. Open this canonical F packet.
2. Identify itself as `Cousin @ Machine` and prove the current hostname.
3. Claim only an assignment matching its role, machine, or capability.
4. Execute locally within that assignment's boundaries.
5. Return `RECEIVED`, then `COMPLETED` or a specific `BLOCKER`.

Machine names remain evidence boundaries. They are not separate cockpits.

## Global Boundaries

- No secrets.
- Do not read, print, copy, export, or transform passwords, passkeys, OTP seeds,
  recovery codes, tokens, private notes, or banking data.
- Do not mutate 1Password vaults or items.
- Do not run `op account list`, `op whoami`, or `gh auth status`.
- Do not submit provider sign-in forms.
- Do not install packages unless a later packet explicitly authorizes it.
- Do not reset, clean, restore, destructively checkout, merge, rebase, push, or
  otherwise alter an existing dirty repository.
- Do not infer one machine's state from another machine.
- `SENT` and `CLAIMED` are routing states, not completion.

## Claim Contract

Return this before doing assignment work:

```text
RECEIVED
PACKET_ID: F_SYSTEM_WIDE_MACHINE_READINESS_20260712
CLAIM_ID: <packet id>/<assignment id>/<cousin>/<hostname>/<timestamp>
ASSIGNMENT_ID: <assignment id>
COUSIN: <role or name>
MACHINE: <canonical machine name>
HOSTNAME: <actual hostname>
EXECUTION_CONTEXT: <CODEX_LOCAL | LOCAL_SALLY_WINDOWS | COWORK_BROWSER | UNKNOWN>
CLAIM_STATUS: CLAIMED
```

If the hostname or execution context cannot prove the required machine-local
seat, return `BLOCKER: NOT_TARGET_MACHINE_LOCAL_CONTEXT` and stop.

## Open Assignments

### Assignment `SPANZEE_CHECKOUT_DISCOVERY`

Eligible claimant: any hands-capable cousin actually local to Spanzee.
Preferred claimant: `Direwolf Dink @ Spanzee`.
Known state: credential baseline returned; local Werkles checkout path unproven.

Mission:

1. Fetch or open
   `foreman/machine-readiness/SPANZEE_WERKLES_CHECKOUT_DISCOVERY_PACKET_20260711.md`.
2. Run its read-only discovery locally on hostname `SPANZEE`.
3. Return candidate paths, exact non-secret Git remotes, classifications, and
   the packet's redacted receipt.
4. Do not clone or repair a repository during discovery.
5. If a unique canonical checkout is proven, report
   `NEXT_ACTION: RUN_WORKSPACE_CLI_BASELINE_FROM_PROVEN_CHECKOUT`.

Publication caveat: the improved discovery packet currently exists at local
commit `a07d3b54917b961f9e9f751b36ad430c20063d80` but is not yet proven present on
GitHub because the canonical push guard blocked publication. If the claimant
cannot retrieve that exact packet from the cockpit or an attached letter,
return `BLOCKER: SPANZEE_DISCOVERY_PACKET_NOT_RETRIEVABLE`. Do not substitute a
remembered or improvised packet.

### Assignment `MEDULLINA_FIRST_READINESS`

Eligible claimant: any hands-capable cousin actually local to Medullina.
Known state: no fresh baseline receipt has been imported.

Operator-confirmed identity:

- Canonical machine: `Medullina`
- Proven Windows hostname: `COURTNEY`
- Machine owner: Courtney
- Ben and Courtney both have user accounts; report the actual current user.

Operating policy:

- `foreman/machine-readiness/MEDULLINA_IDENTITY_AND_MINIMAL_RESIDUE_POLICY_20260712.md`
- Cloud-first, session-only compute
- Smallest practical storage, cache, and background-memory footprint
- No persistent services, watchers, workers, indexers, broad sync, or package
  installation unless a later explicit packet authorizes them

Mission:

1. Pull the published packet
   `foreman/machine-readiness/DINK_PULL_MACHINE_READINESS_FROM_GITHUB_PACKET_20260711.md`
   from branch `machine-readiness-packets-20260711`.
2. Use machine nickname `Medullina`.
3. Run only the published read-only readiness wrapper.
4. Return `DINK_MACHINE_READINESS_RESULT` with receipt paths, SHA-256, statuses,
   and concrete blockers.
5. Accept `HOSTNAME: COURTNEY` as operator-confirmed proof for canonical machine
   `Medullina`; also report the actual current Windows user.
6. If the wrapper would install, persist, sync, create large caches, clone an
   additional repository, or start a background service, return
   `BLOCKER: MEDULLINA_MINIMAL_RESIDUE_POLICY_CONFLICT` before that action.

### Assignment `ALL_HANDS_COCKPIT_READBACK`

Eligible claimant: any hands-capable cousin receiving K.

Mission:

1. Confirm this single cockpit packet is readable.
2. Report the cousin role, canonical machine name, hostname, repo path if any,
   and whether one of the open assignments applies.
3. Do not run an unrelated baseline merely because the packet is visible.

This assignment is complete when visibility and applicability are reported. It
does not prove machine readiness.

## Required Terminal Receipt

```text
PACKET_ID: F_SYSTEM_WIDE_MACHINE_READINESS_20260712
CLAIM_ID: <claim id>
ASSIGNMENT_ID: <assignment id>
COUSIN: <role or name>
MACHINE: <canonical machine name>
HOSTNAME: <actual hostname>
SOURCE_COMMIT: <commit actually read>
FILES_READ: <packet paths>
MUTATIONS_PERFORMED: NO
SECRETS_READ_OR_PRINTED: NO
FORBIDDEN_AUTH_COMMANDS_RUN: NO
EVIDENCE: <receipt paths, hashes, and concise readback>
BLOCKERS: <NONE or specific blockers>
NEXT_ACTION: <specific next action>
COMPLETED
```

If incomplete, replace `COMPLETED` with:

```text
BLOCKER: <specific blocker>
```

## Foreman Acceptance Gate

Foreman closes an assignment only after authoritative receiver-side readback
shows:

1. `RECEIVED` with a unique claim ID.
2. A machine-local hands readback when machine state is asserted.
3. `COMPLETED` or a specific `BLOCKER`.
4. Exact receipt handles, paths, and hashes when artifacts were produced.
5. No secret-boundary or forbidden-auth violation.

`SENT`, `QUEUED`, `DELIVERED`, `CLAIMED`, or a successful POST response alone do
not close the work.

