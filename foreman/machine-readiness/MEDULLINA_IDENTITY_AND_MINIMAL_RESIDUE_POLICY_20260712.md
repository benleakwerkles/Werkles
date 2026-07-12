# Medullina Identity and Minimal-Residue Policy — 2026-07-12

Status: `OPERATOR_CONFIRMED`
Confirmed by: Ben
Date: `2026-07-12`

## Identity Truth

- Canonical machine name: `Medullina`
- Proven Windows hostname: `COURTNEY`
- Machine owner: Courtney
- Windows users relevant to this work: Courtney and Ben
- `COURTNEY` is a hostname in machine evidence; it does not rename the machine
  or imply that Courtney is the executing cousin.

Future receipts should report both fields:

```text
MACHINE: Medullina
HOSTNAME: COURTNEY
USER: <actual current Windows identity>
```

This operator confirmation clears:

`MEDULLINA_HOST_ALIAS_NEEDS_OPERATOR_CONFIRMATION`

## Operating Intent

Werkles/Harvey work may run on Medullina while leaving the smallest practical
memory and storage imprint on Courtney's machine.

Medullina is a cloud-first, session-only compute seat. It is not a durable
Werkles memory warehouse, always-on relay node, or background indexing host.

## Default Allowed Posture

- Use GitHub and other approved cloud source surfaces as durable memory.
- Fetch only the packet, source, or branch required for the current task.
- Prefer shallow or sparse retrieval when it satisfies the work.
- Use local compute only while an authorized Werkles/Harvey session is active.
- Keep receipts redacted and return durable results to the canonical cockpit.
- Report local paths and hashes without reading or transmitting secrets.
- Stop work cleanly when the session ends.

## Default Forbidden Without A Later Explicit Packet

- No full historical archive or memory corpus replication.
- No broad Google Drive or business-drive mirroring.
- No offline pinning of large cloud folders.
- No repository proliferation or duplicate long-lived clones.
- No `node_modules`, build cache, model cache, vector store, or artifact archive
  retained merely for convenience.
- No always-on dev server, watcher, relay, indexer, sync agent, worker, scheduled
  task, startup entry, or background memory service.
- No package installation or machine-wide configuration changes.
- No secrets, 1Password mutation, provider sign-in submission, or forbidden auth
  status commands.
- No deletion of Courtney's files or cleanup outside a path created by an
  explicitly authorized Werkles session.

## Readiness Meaning On Medullina

`READY` means the machine can temporarily retrieve approved source, run bounded
compute, return proof, and stop without persistent background load.

It does not require Medullina to mirror Doss or Betsy, retain the whole organism,
or remain continuously connected after the work session.

## Next Assignment Rule

The next Medullina claimant may proceed past the hostname alias check when the
hands readback proves:

```text
MACHINE: Medullina
HOSTNAME: COURTNEY
USER: <actual current Windows identity>
```

Run the published readiness wrapper in read-only audit mode only. If the wrapper
would install, persist, sync, clone additional repositories, start services, or
write outside its already-authorized packet/receipt location, return:

`BLOCKER: MEDULLINA_MINIMAL_RESIDUE_POLICY_CONFLICT`

The returned receipt must additionally state:

```text
BACKGROUND_PROCESSES_STARTED: NO
PERSISTENT_SERVICES_CREATED: NO
PACKAGES_INSTALLED: NO
LARGE_CACHES_CREATED: NO
DURABLE_RESULT_RETURNED_TO_COCKPIT: <YES | NO with blocker>
```

