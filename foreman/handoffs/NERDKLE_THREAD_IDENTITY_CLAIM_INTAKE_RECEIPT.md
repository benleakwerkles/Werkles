# Nerdkle Thread Identity Claim Intake Receipt

PACKET: NERDKLE_THREAD_IDENTITY_CLAIM_INTAKE_V0

FROM: Codex / Dink@Sally

## STATUS

PASS_LOCAL_WITH_EXTERNAL_BLOCKERS

## ARTIFACTS

- `foreman/nerdkle/thread_identity_claim.schema.json`
- `foreman/nerdkle/thread_identity_claims/README.md`
- `foreman/nerdkle/thread_identity_claims/inbox/thufir-sally-local-daemon-20260628.json`
- `foreman/nerdkle/ingest-thread-identity-claims.mjs`
- `foreman/nerdkle/verify-nerdkle-kernel.mjs`
- `foreman/artifacts/thread_identity_claims_status.json`
- `foreman/artifacts/nerdkle_kernel_v0_status.json`

## CHANGE

Added the Thread Identity Claim intake organ.

This lets Maker@Doss or any future Aeye drop a structured claim proving a thread identity without changing the canonical registry by hand.

Claims are evidence only:

- `local_daemon` proves local file-backed chat identity.
- `remote_machine` proves a machine-local claim from another machine.
- `external_platform` is required before external Aeye thread identity is considered satisfied.

## VERIFICATION

Commands:

```powershell
node --check foreman\nerdkle\ingest-thread-identity-claims.mjs
node --check foreman\nerdkle\verify-nerdkle-kernel.mjs
node foreman\nerdkle\ingest-thread-identity-claims.mjs
node foreman\nerdkle\verify-nerdkle-kernel.mjs
```

Result:

```text
PASS_CLAIM_INTAKE_WITH_EXTERNAL_BLOCKERS: wrote foreman/artifacts/thread_identity_claims_status.json
accepted=1 external=0 missing_external=4
PASS_LOCAL_WITH_EXTERNAL_BLOCKERS: wrote foreman/artifacts/nerdkle_kernel_v0_status.json
complete_loop_count=5 valid_receipt_count=1
```

## PROOF

- `foreman/artifacts/thread_identity_claims_status.json` accepted one local claim for `Thufir@Sally`.
- `foreman/artifacts/nerdkle_kernel_v0_status.json` now separates:
  - `thread_registry_local_routes`: `PASS_LOCAL`
  - `thread_identity_claim_intake`: `PASS_LOCAL`
  - `thread_registry_external_identity`: `PARTIAL_LOCAL`

## BLOCKERS

External thread identity is still missing for:

- `Dink@Sally`
- `Thufir@Sally`
- `Bean@Sally`
- `Ender@Betsy`

The local claim intentionally does not satisfy external platform proof.
