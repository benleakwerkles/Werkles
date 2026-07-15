# FOREMAN — Harvey Workstream Sync And Plan Request — 2026-07-13

Packet ID: `F_HARVEY_WORKSTREAM_SYNC_AND_PLAN_REQUEST_20260713`
Status: `LOCAL_READY_REMOTE_PUBLICATION_NOT_AUTHORIZED`
Created by: `Dink @ Doss via Codex Desktop`
Canonical repo: `C:\Users\BenLeak\github\Werkles`
Return inbox: `foreman/handoffs/inbox/`

## Purpose

Load Harvey's current file-backed workstream truth, identify what actually
applies to the receiving cousin, and return receiver-side proof. This packet
also establishes the exact return contracts for the new Demo and Locke seats.

## Required files

1. `foreman/harvey/HARVEY_WORKSTREAMS_20260713.json`
2. `foreman/harvey/DEMO_LOCKE_PLAN_INTAKE_CONTRACT_20260713.md`
3. `foreman/relay/BIRDEYE_FLEET_TOPOLOGY_20260712.json`

## Current truth

- Canonical machines: Doss, Betsy, Spanzee, Medullina, and Sally.
- Doss is the only machine currently represented by a live Handeye heartbeat.
- Demo means the ChatGPT Work writing/synthesis seat on Betsy.
- Locke means the Codex architecture/construction seat on Betsy.
- Naming a seat does not prove its route, machine context, or receipt path.
- No registered Codex receiver task named Demo or Locke was found during the
  Foreman verification on 2026-07-13.
- Mazer is not registered because no machine, seat, or assignment is confirmed.
- Passwords, vault contents, and provider authentication remain outside this
  packet. Harvey may carry redacted status/provenance only.

## Global boundaries

- No secrets, password values, tokens, OTPs, recovery codes, or vault contents.
- Do not run `op account list`, `op whoami`, or `gh auth status`.
- No provider sign-in submission.
- No package installation, background service, scheduled task, or persistence.
- No destructive Git command, branch switch, merge, rebase, push, or deploy.
- Do not infer machine-local state from a standing task label.
- `SENT`, `QUEUED`, `DELIVERED`, and `CLAIMED` are not completion.

## Assignment: `ALL_HANDS_HARVEY_WORKSTREAM_READBACK`

Eligible: any registered standing receiver that can read the required files.

1. Return `RECEIVED` before work.
2. Prove cousin role, execution surface, canonical machine if any, hostname,
   repo path, branch, commit, and execution context.
3. Read the workstream truth and report which workstream, if any, matches the
   receiver's actual role and machine context.
4. Do not claim machine-local work when the executing host is Doss or a remote
   container merely because the task title names Betsy, Spanzee, Sally, or
   Medullina.
5. Return `COMPLETED` for the readback only, or a specific `BLOCKER`.

## Assignment: `DEMO_BETSY_HARVEY_PLAN`

Eligible only: `Demo @ Betsy via ChatGPT Work`.
Current route state: `ROUTE_UNBOUND`.

Follow `foreman/harvey/DEMO_LOCKE_PLAN_INTAKE_CONTRACT_20260713.md` and return:

```text
foreman/handoffs/inbox/FROM_DEMO_HARVEY_PLAN_<timestamp>.md
```

The return must include source inventory, current truth, narrative/writing plan,
priorities, dependencies, acceptance proofs, disagreements, and next VPG.

## Assignment: `LOCKE_BETSY_HARVEY_ARCHITECTURE_PLAN`

Eligible only: `Locke @ Betsy via Codex`.
Current route state: `ROUTE_UNBOUND`.

Follow `foreman/harvey/DEMO_LOCKE_PLAN_INTAKE_CONTRACT_20260713.md` and return:

```text
foreman/handoffs/inbox/FROM_LOCKE_HARVEY_PLAN_<timestamp>.md
```

The return must include source inventory, current truth, architecture, interface
contracts, build order, technical risks, acceptance proofs, disagreements, and
next VPG.

## Required receiver receipt

```text
RECEIVED
PACKET_ID: F_HARVEY_WORKSTREAM_SYNC_AND_PLAN_REQUEST_20260713
CLAIM_ID: <packet>/<assignment>/<cousin>/<hostname>/<timestamp>
ASSIGNMENT_ID: <assignment or NONE>
COUSIN: <role or name>
SURFACE: <GPT | Work | Codex | Claude | Cowork | other>
MACHINE: <canonical machine or REMOTE_CONTAINER>
HOSTNAME: <actual hostname>
EXECUTION_CONTEXT: <allowed execution context>
REPO_PATH: <path or NONE>
BRANCH: <branch or NONE>
COMMIT: <commit or NONE>
FILES_READ: <exact paths>
MUTATIONS_PERFORMED: NO
SECRETS_READ_OR_PRINTED: NO
FORBIDDEN_AUTH_COMMANDS_RUN: NO
EVIDENCE: <concise readback>
BLOCKERS: <NONE or specific blocker>
NEXT_ACTION: <specific next action>
COMPLETED
```

If the packet or required files cannot be read, return:

```text
RECEIVED
PACKET_ID: F_HARVEY_WORKSTREAM_SYNC_AND_PLAN_REQUEST_20260713
BLOCKER: HARVEY_WORKSTREAM_PACKET_NOT_RETRIEVABLE
```

## Foreman acceptance

Foreman records a route as terminal only after the receiver returns `RECEIVED`
and then `COMPLETED` or a specific `BLOCKER`. A task title or dispatch result is
not machine proof.

