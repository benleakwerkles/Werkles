# F — Harvey Source Truth and Build Mobilization — 2026-07-12

Packet ID: `F_HARVEY_SOURCE_TRUTH_AND_BUILD_MOBILIZATION_20260712`
Packet class: `F`
Status: `READY_TO_CLAIM`
Created by: `Dink @ Doss via Codex Desktop`
Repository: `benleakwerkles/Werkles`
Required branch: `machine-readiness-packets-20260711`
Cockpit outbox: `foreman/handoffs/outbox/`
Return inbox: `foreman/handoffs/inbox/`

## Mission

Catch the Harvey/ThinkIt lane up across the whole system and prepare bounded,
non-overlapping build orders. This packet gathers source truth and build capacity;
it does not authorize implementation yet.

The next F will assign actual build slices only after these receipts identify
canonical source, dirty work, machine capability, and integration hazards.

## Global Boundaries

- Read-only inspection only.
- No secrets or forbidden auth commands.
- No package installation, dev-server start, provider login, deploy, SQL, merge,
  push, branch switch, cleanup, reset, restore, stage, commit, or file editing.
- Do not infer machine-local state from another machine or a remote container.
- Preserve all dirty and untracked work.
- Report original terms and exact paths; do not rename Harvey, ThinkIt, or Aeye
  concepts during this pass.
- `SENT`, `OPENED`, and `CLAIMED` are not completion.

## Claim Contract

```text
RECEIVED
PACKET_ID: F_HARVEY_SOURCE_TRUTH_AND_BUILD_MOBILIZATION_20260712
CLAIM_ID: <packet/assignment/cousin/machine-or-host/timestamp>
ASSIGNMENT_ID: <assignment id>
COUSIN: <name or role>
MACHINE: <canonical machine name | REMOTE_CONTAINER>
HOSTNAME: <actual hostname>
EXECUTION_CONTEXT: <allowed context>
CLAIM_STATUS: CLAIMED
```

## Assignments

### `HARVEY_GITHUB_CANON_READBACK`

Eligible: Petra or any cousin with authoritative GitHub read access.

Report from `origin/main` and relevant published branches:

- commits and exact paths containing Harvey, ThinkIt, Tinkarden, and machine
  readiness work;
- which artifacts are on `main` versus packet/review branches;
- whether `/harvey`, `/thinkit`, Harvey Mobile, and rollout doctrine are committed;
- likely merge or duplication hazards, without proposing deletion;
- the exact commit that should anchor a future integration branch.

Remote containers must label all local-machine facts `UNVERIFIED`.

### `HARVEY_DOSS_LOCAL_READBACK`

Eligible: hands local to Doss.

Report:

- canonical repo path, branch, HEAD, remote, ahead/behind, and dirty summary;
- exact local Harvey/ThinkIt modified and untracked paths;
- whether `/harvey` and the ThinkIt compatibility change typecheck from the
  current dirty tree using read-only validation only;
- files that collide with `origin/main` or other published branches;
- recommended isolation boundary for future build work.

Do not stage or commit the dirty tree.

### `HARVEY_BETSY_FORGE_READBACK`

Eligible: HeimerDinker, Lady Jessica, or hands local to Betsy.

Report the local Werkles checkout, branch, HEAD, dirty state, Node/npm availability,
existing Harvey/ThinkIt work, localhost state, and capacity for a bounded UI build
slice. Do not start the server or edit files.

### `HARVEY_SPANZEE_FORGE_READBACK`

Eligible: hands local to Spanzee.
Dependency: complete `SPANZEE_WORKSPACE_CLI_BASELINE` first.

Use the proven checkout `C:\Users\BenLeak\Documents\GitHub\Werkles1`. Report
workspace/CLI baseline result, current branch/HEAD, the 37-entry dirty-tree status
or its current successor, Harvey/ThinkIt paths, and capacity for a bounded build
or test slice. Do not modify the checkout.

### `HARVEY_MEDULLINA_EPHEMERAL_CAPACITY`

Eligible: hands local to Medullina (`HOSTNAME: COURTNEY`).

Using the minimal-residue policy, report which bounded Harvey compute/test tasks
can run cloud-first and session-only without packages, persistent services, broad
sync, large caches, or long-lived local memory. Do not begin a build.

### `HARVEY_SALLY_ARCHIVE_READBACK`

Eligible: hands local to Sally.

Report only archive/snapshot evidence relevant to Harvey/ThinkIt continuity.
Respect the Ender@Sally retirement lock. Do not assign Sally a heavy build lane.

### `HARVEY_ROLE_AND_ARCHITECTURE_RED_TEAM`

Eligible: Petra, Ender not on Sally, Bean, Skybro, or another non-hands reviewer.

Read committed Harvey/ThinkIt doctrine and report:

- current claimed architecture;
- contradictions between Harvey identity and ThinkIt compatibility;
- missing evidence before implementation can be divided safely;
- three to seven bounded build slices with explicit dependencies and failure
  conditions;
- anything that should return `NO_WARRANTED_MECHANISM` instead of becoming code.

Do not invent machine state or approve a human gate.

## Required Terminal Receipt

```text
PACKET_ID: F_HARVEY_SOURCE_TRUTH_AND_BUILD_MOBILIZATION_20260712
CLAIM_ID: <claim id>
ASSIGNMENT_ID: <assignment id>
COUSIN: <name or role>
MACHINE: <machine or REMOTE_CONTAINER>
HOSTNAME: <actual hostname>
SOURCE_BRANCH: <branch read>
SOURCE_COMMIT: <commit read>
FILES_READ: <exact paths>
MUTATIONS_PERFORMED: NO
SECRETS_READ_OR_PRINTED: NO
FORBIDDEN_AUTH_COMMANDS_RUN: NO
EVIDENCE: <concise exact readback>
BLOCKERS: <NONE or specific blocker>
RECOMMENDED_BUILD_SLICE: <bounded slice or NONE>
NEXT_ACTION: <specific next action>
COMPLETED
```

or end with `BLOCKER: <specific blocker>`.

## Completion Gate

Foreman may issue the Harvey build F only after authoritative receipts cover:

1. GitHub committed source truth.
2. Doss dirty-tree truth.
3. At least one additional build-capable machine.
4. Spanzee baseline result before any Spanzee build assignment.
5. A role/architecture red-team result.
6. Explicit non-overlapping build slices and integration ownership.

