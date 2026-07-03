# Nerdkle Kernel V0

Status: LOCAL KERNEL SLICE

## Purpose

This is the first active-workspace Nerdkle body slice. It does not build a new dashboard and it does not claim external Aeye delivery.

The kernel proves the organism can hold four separate functions without blending them:

- Speaker preserves causal memory and warnings.
- Thread Registry records where packets can go.
- Organism event bus records what actually happened.
- Kernel verifier reports proof from files only.

## Source Lore

The Speaker office was ported from `C:\Dev\Werkles\foreman\speaker\` into this workspace at `foreman/speaker/`.

The Book / Nerdkle source material is tracked from GitHub review branches in `https://github.com/benleakwerkles/Werkles1.git`, not from Google Drive. The local intake records branch, commit, packet, artifact, and proof-boundary evidence under `foreman/nerdkle/source_intake/`.

The active workspace already had local relay evidence under:

- `data/organism/`
- `tinkerden/dispatch/packets/`
- `tinkarden/aeyes/`
- `speaker/receipts/raw/inbox/`

## Proof Contract

The verifier must prove these from local artifacts, or report the missing proof:

| Proof | Required evidence |
| --- | --- |
| Packet left | `packet_left_relay_boundary` event |
| Aeye chat exists | `aeye_chat_created` event |
| Nerdkle-origin activity exists | `nerdkle_prompt_activity` event |
| Query exists | `aeye_query_sent` and `aeye_query_visible` events |
| Receipt exists | `aeye_receipt_ack` event or schema-valid Speaker receipt |
| Answer exists | `aeye_answer_observed` event |
| Answer returned to origin | `origin_response_delivered` event |

## Non-Goals

- No autonomous send.
- No live provider execution.
- No production data mutation.
- No doctrine ratification.
- No external thread identity claim without proof.
- No dashboard success claim unless the verifier can point to evidence.

## Files

- `foreman/speaker/` - causal memory office.
- `foreman/nerdkle/thread_registry.json` - local thread/address registry.
- `foreman/nerdkle/thread_identity_claims/` - observed thread identity claim inbox.
- `foreman/nerdkle/ingest-thread-identity-claims.mjs` - validates thread identity claims without ratifying them.
- `foreman/nerdkle/source_intake/` - GitHub source manifest inbox for Book/Nerdkle review branches.
- `foreman/nerdkle/ingest-github-source-material.mjs` - verifies GitHub branch/object source material without promoting it.
- `foreman/nerdkle/materialize-github-source-material.mjs` - snapshots verified GitHub source files into the active workspace without making them live runtime code.
- `foreman/nerdkle/build-source-work-queue.mjs` - ranks verified source snapshots into the next safe build queue.
- `foreman/nerdkle/run-nmclr-sandbox-execution-proof.mjs` - executes the NMCLR proof-body snapshot in an isolated artifact sandbox.
- `foreman/nerdkle/verify-nerdkle-kernel.mjs` - evidence-only verifier.
- `foreman/artifacts/nerdkle_github_source_material_status.json` - generated GitHub source report.
- `foreman/artifacts/nerdkle_materialized_source_status.json` - generated local source snapshot report.
- `foreman/artifacts/nerdkle_source_work_queue.json` - generated next-build queue from verified source snapshots.
- `foreman/artifacts/nmclr_sandbox_execution_status.json` - generated NMCLR sandbox execution proof.
- `foreman/artifacts/nerdkle_kernel_v0_status.json` - generated proof report.

## Run

```powershell
node foreman\nerdkle\ingest-github-source-material.mjs
node foreman\nerdkle\materialize-github-source-material.mjs
node foreman\nerdkle\run-nmclr-sandbox-execution-proof.mjs
node foreman\nerdkle\build-source-work-queue.mjs
node foreman\nerdkle\ingest-thread-identity-claims.mjs
node foreman\nerdkle\verify-nerdkle-kernel.mjs
```
