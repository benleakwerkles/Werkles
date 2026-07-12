# KNOCK — All Aeyes Cockpit Pull — 2026-07-12

Packet ID: `KNOCK_ALL_AEYES_20260712`
Status: `CURRENT_UNIVERSAL_KNOCK`
Target: all Werkles Aeyes and execution surfaces
Repository: `benleakwerkles/Werkles`
Required branch: `machine-readiness-packets-20260711`

## Command

`KNOCK`

Meaning: retrieve the current Werkles cockpit, load the command language, identify
your role and execution surface, inspect active indexes, claim only eligible work,
and return receiver-side receipts.

Bare `K` and `K pull` are retired. Do not interpret `KNOCK` as acknowledgement.

## Command Refresher

- `FOREMAN`: create, update, validate, and publish system-wide packets/indexes.
- `KNOCK`: retrieve cockpit state, claim eligible work, and return receipts.
- `VPG VERIFY`: establish authoritative current truth.
- `VPG PREPARE`: perform safe reversible preparation within approved scope.
- `VPG GO`: execute the explicitly authorized action until completion or a true
  human gate/blocker.

Bare `F`, `K`, `V`, `P`, and `G` are retired because they are ambiguous across
tasks, providers, and surfaces.

Full bootstrap:

`foreman/handoffs/outbox/ALL_COUSINS_COMMAND_LANGUAGE_BOOTSTRAP_20260712.md`

## Retrieve

Do not default to `main`.

```text
Repository: benleakwerkles/Werkles
Branch: machine-readiness-packets-20260711
Cockpit: foreman/handoffs/outbox/
```

Direct bootstrap URL:

`https://raw.githubusercontent.com/benleakwerkles/Werkles/machine-readiness-packets-20260711/foreman/handoffs/outbox/ALL_COUSINS_COMMAND_LANGUAGE_BOOTSTRAP_20260712.md`

Direct current KNOCK URL:

`https://raw.githubusercontent.com/benleakwerkles/Werkles/machine-readiness-packets-20260711/foreman/handoffs/outbox/KNOCK_ALL_AEYES_20260712.md`

## Active Indexes

Read every index your surface can retrieve, then claim only applicable work:

- `F_COCKPIT_PACKET_INDEX_20260712.json`
- `F_HARVEY_BUILD_MOBILIZATION_INDEX_20260712.json`
- `F_ARTIFACT_CAPABILITY_INDEX_20260712.json`

Read the packet path named by each index before claiming an assignment.

## Identity And Evidence

Report both Aeye role and execution surface. Examples:

```text
COUSIN: Petra
SURFACE: ChatGPT Work
MACHINE: REMOTE_CONTAINER
HOSTNAME: <actual hostname>
```

```text
COUSIN: Swanson
SURFACE: Codex Desktop
MACHINE: Doss
HOSTNAME: DOSS
```

Remote containers and chat-only surfaces must not claim machine-local evidence.
Machine-local hands must begin with LOCAL HANDS READBACK.

## Claim Rules

1. Return `RECEIVED` before work.
2. Claim only `OPEN` work addressed to your role, machine, or capability.
3. Respect dependencies and completed states.
4. One ordinary assignment has one claimant unless the F explicitly requests
   independent verification or adversarial duplication.
5. Follow the claimed F exactly; do not improvise missing instructions.
6. Return `COMPLETED` or a specific `BLOCKER` with exact paths, hashes, versions,
   and evidence.

`SENT`, `DELIVERED`, `OPENED`, `ACKNOWLEDGED`, and `CLAIMED` are not completion.

## Credential-Prompt Boundary

- Do not poll a personal 1Password vault.
- Do not enable 1Password CLI desktop integration or automatic Windows Hello
  prompts as part of KNOCK.
- Do not memorize or Auto-Type personal passwords.
- Do not run `op account list`, `op whoami`, or `gh auth status`.
- If an unexpected PIN, MFA, Windows Hello, OAuth, or credential prompt appears,
  stop the triggering worker and return:
  `BLOCKER: UNEXPECTED_INTERACTIVE_CREDENTIAL_PROMPT`.

## Required KNOCK Receipt

```text
RECEIVED
PACKET_ID: KNOCK_ALL_AEYES_20260712
COUSIN: <name or role>
SURFACE: <GPT | ChatGPT Work | Codex | Claude | Cowork | other>
MACHINE: <canonical machine or REMOTE_CONTAINER>
HOSTNAME: <actual hostname>
SOURCE_BRANCH: machine-readiness-packets-20260711
SOURCE_COMMIT: <commit actually read>
COMMANDS_LOADED: FOREMAN; KNOCK; VPG VERIFY; VPG PREPARE; VPG GO
INDEXES_READ: <exact indexes>
ASSIGNMENTS_CLAIMED: <assignment IDs | NONE>
BLOCKERS: <NONE or specific blocker>
NEXT_ACTION: <specific next action>
COMPLETED
```

## Human Relay Block

This is the only text Ben should need to give a surface that has not yet been
configured to auto-check the cockpit:

```text
KNOCK

Load the current Werkles cockpit instruction from this exact URL and follow it:
https://raw.githubusercontent.com/benleakwerkles/Werkles/machine-readiness-packets-20260711/foreman/handoffs/outbox/KNOCK_ALL_AEYES_20260712.md

Return its required KNOCK receipt. Do not treat this as acknowledgement.
```

Once a surface's durable project/session-start instructions contain this URL,
Ben should not relay KNOCK manually for each new assignment.

