# All Cousins Command-Language Bootstrap — 2026-07-12

Packet ID: `ALL_COUSINS_COMMAND_LANGUAGE_BOOTSTRAP_20260712`
Status: `READY_FOR_ALL_COUSINS`
Target: every Werkles Aeye, cousin, Dink, Ender, Doozer, Maker, reviewer, and hands task
Repository: `benleakwerkles/Werkles`
Required branch: `machine-readiness-packets-20260711`

## Why You Are Receiving This

Werkles command shorthand was created in one conversation and was not reliably
shared with other tasks. A cousin interpreted bare `K` as acknowledgement instead
of “fetch the cockpit.” That was a command-portability failure.

Do not infer meanings for bare letters from memory or local conversation context.

## Command Language

### `FOREMAN`

Meaning: create, update, validate, and publish system-wide packets and indexes in
the canonical Werkles cockpit.

`FOREMAN` does not itself authorize deploy, secrets, spend, merge, push to main,
or another human gate. Each generated packet carries its own boundaries.

Retired ambiguous alias: bare `F`.

### `KNOCK`

Meaning: fetch the canonical cockpit, read current packet indexes and packets,
identify yourself, claim only eligible assignments, execute within the packet's
boundaries, and return receiver-side receipts.

`KNOCK` is not acknowledgement. It initiates cockpit retrieval and claim review.

Retired ambiguous alias: bare `K`.

### `VPG VERIFY`

Meaning: establish current authoritative truth before acting. Read the relevant
source surfaces and report evidence, gaps, and blockers.

Retired ambiguous alias: bare `V`.

### `VPG PREPARE`

Meaning: perform all safe, reversible, mechanical preparation allowed by the
active scope, stopping before a true human-only gate.

Retired ambiguous alias: bare `P`.

### `VPG GO`

Meaning: execute the explicitly authorized action through completion or a real
terminal blocker. It does not broaden scope or bypass secrets, approval, spend,
deploy, merge, or other human gates.

Retired ambiguous alias: bare `G`.

### `VPG`

When used without a phase, run the three phases in order only when the active
packet clearly defines the authorized action:

1. `VPG VERIFY`
2. `VPG PREPARE`
3. `VPG GO`

If the action or authority envelope is unclear, return a specific blocker instead
of guessing what `GO` means.

## Canonical Cockpit Retrieval

## Fleet Credential-Prompt Policy

Harvey work must not turn Ben into a PIN-entry loop or allow authentication
dialogs to steal desktop focus during unrelated work.

Default on every Windows Aeye workstation:

```text
1Password > Settings > Security > Show Windows Hello prompt automatically: OFF
1Password > Settings > Developer > Integrate with 1Password CLI: OFF
```

Rules:

- No idle worker, keepalive, watcher, scheduled task, or polling loop may call
  the personal 1Password account or trigger an unlock request.
- No Aeye may hide, auto-approve, dismiss, or repeatedly foreground an
  authentication prompt.
- No Swateye, Swatter, cousin, script, or automation may memorize personal
  passwords or use Auto-Type to type them into whichever window has focus.
- Personal login filling is deliberate and human-triggered through the browser
  extension, Quick Access, or another explicitly chosen 1Password action.
- Background automation must use a separate least-privilege credential lane,
  such as a narrowly scoped service account limited to a dedicated automation
  vault. It must not inherit Ben's general personal-vault access.
- An F that needs noninteractive secret access must name the exact machine,
  worker, vault scope, allowed items/actions, lifetime, revocation path, and
  terminal stop condition. Silence or a generic KNOCK is not authorization.
- If a task encounters a 1Password, Windows Hello, PIN, MFA, OAuth, or provider
  prompt that was not the explicitly requested human gate, return
  `BLOCKER: UNEXPECTED_INTERACTIVE_CREDENTIAL_PROMPT` and stop the triggering
  worker instead of asking Ben to keep approving prompts.

Doss verified state on 2026-07-12:

```text
SHOW_WINDOWS_HELLO_PROMPT_AUTOMATICALLY: OFF
INTEGRATE_WITH_1PASSWORD_CLI: OFF
VAULT_CONTENT_ACCESSED_DURING_CHANGE: NO
OP_COMMANDS_RUN_DURING_CHANGE: NO
AUTO_TYPE_ENABLED_BY_CHANGE: NO
```

This policy prevents prompt storms. It does not claim that 1Password is unlocked,
that a CLI or service account is ready, or that any secret-dependent job is
authorized.

```text
Repository: benleakwerkles/Werkles
Branch: machine-readiness-packets-20260711
Cockpit outbox: foreman/handoffs/outbox/
```

On `KNOCK`:

1. Fetch or open the exact required branch; do not default to `main`.
2. Read current F indexes and packets.
3. Prove `Cousin @ Machine`, hostname, and execution context.
4. Return `RECEIVED` before assignment work.
5. Claim only applicable `OPEN` work whose dependencies are satisfied.
6. Return `COMPLETED` or a specific `BLOCKER` with exact evidence.

`SENT`, `DELIVERED`, `OPENED`, `ACKNOWLEDGED`, and `CLAIMED` are not completion.

## Required Bootstrap Receipt

Return exactly:

```text
RECEIVED
PACKET_ID: ALL_COUSINS_COMMAND_LANGUAGE_BOOTSTRAP_20260712
COUSIN: <name or role>
MACHINE: <canonical machine name or REMOTE_CONTAINER>
HOSTNAME: <actual hostname>
SOURCE_BRANCH: machine-readiness-packets-20260711
SOURCE_COMMIT: <commit actually read>
COMMANDS_LOADED: FOREMAN; KNOCK; VPG VERIFY; VPG PREPARE; VPG GO
BARE_F_RETIRED: YES
BARE_K_RETIRED: YES
BARE_V_P_G_RETIRED: YES
BLOCKERS: <NONE or specific blocker>
COMPLETED
```

If this packet cannot be retrieved or read, return:

```text
RECEIVED
PACKET_ID: ALL_COUSINS_COMMAND_LANGUAGE_BOOTSTRAP_20260712
BLOCKER: COMMAND_LANGUAGE_BOOTSTRAP_NOT_RETRIEVABLE
```

## Copy/Paste Relay Block

Use this when initially introducing the command language to a cousin:

```text
COMMAND LANGUAGE BOOTSTRAP

Fetch and read this exact packet before interpreting Werkles commands:

Repository: benleakwerkles/Werkles
Branch: machine-readiness-packets-20260711
Path: foreman/handoffs/outbox/ALL_COUSINS_COMMAND_LANGUAGE_BOOTSTRAP_20260712.md

Return the packet's required bootstrap receipt. Do not treat this message or a
bare letter as acknowledgement. After loading the packet, use FOREMAN, KNOCK,
VPG VERIFY, VPG PREPARE, and VPG GO exactly as defined there.
```

