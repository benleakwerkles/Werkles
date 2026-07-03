# Nerdkle GitHub Source Intake Receipt

PACKET: NERDKLE_GITHUB_SOURCE_INTAKE_V0

STATUS: ARTIFACT

## Correction

`Nerdkle the Book` / Nerdkle source material is in GitHub, not Google Drive.

Verified repository:

`https://github.com/benleakwerkles/Werkles1.git`

Verified local source clone:

`C:\Users\benle\Desktop\github\Werkles`

## Built

- `foreman/nerdkle/source_intake/README.md`
- `foreman/nerdkle/source_manifest.schema.json`
- `foreman/nerdkle/source_intake/inbox/github-book-architecture-stream-split-v0-20260627.json`
- `foreman/nerdkle/source_intake/inbox/github-nerdkle-nervous-system-organs-v0-20260627.json`
- `foreman/nerdkle/source_intake/inbox/github-nmclr-proof-body-preserve-v0-20260627.json`
- `foreman/nerdkle/source_intake/inbox/github-receipt-crawler-v0-20260627.json`
- `foreman/nerdkle/ingest-github-source-material.mjs`
- `foreman/nerdkle/materialize-github-source-material.mjs`
- `foreman/artifacts/nerdkle_github_source_material_status.json`
- `foreman/artifacts/nerdkle_materialized_source_status.json`

Updated:

- `foreman/nerdkle/verify-nerdkle-kernel.mjs`
- `foreman/nerdkle/NERDKLE_KERNEL_V0.md`
- `foreman/nerdkle/FRANKINTENTION_BUILD_COORDINATION.md`
- `foreman/artifacts/nerdkle_kernel_v0_status.json`

## Verified GitHub Sources

| Source | Branch | Commit | Boundary |
| --- | --- | --- | --- |
| Book architecture | `book/architecture-stream-split-v0-20260627` | `605e353737dc4f2a2a18d11c80c328bff05a4229` | Manuscript doctrine cannot prove automation. |
| Nerdkle nervous system organs | `nerdkle/nervous-system-organs-v0-20260627` | `47aa50c73c8ab0eda37d2e591cb956cca363b79d` | Pending production inputs. |
| NMCLR proof body | `nerdkle/nmclr-proof-body-preserve-v0-20260627` | `f14227352ce7820f9e12b135f559d706691e85da` | Preserved only, not canonical. |
| Receipt crawler | `nerdkle/receipt-crawler-v0-20260627` | `312e0f811cf8ad46fac1774ee325ff349fcc3012` | Pending real ledger proof. |

## Commands

```powershell
node --check foreman\nerdkle\ingest-github-source-material.mjs
node --check foreman\nerdkle\materialize-github-source-material.mjs
node --check foreman\nerdkle\verify-nerdkle-kernel.mjs
node foreman\nerdkle\ingest-github-source-material.mjs
node foreman\nerdkle\materialize-github-source-material.mjs
node foreman\nerdkle\ingest-thread-identity-claims.mjs
node foreman\nerdkle\verify-nerdkle-kernel.mjs
```

## Result

```text
PASS_GITHUB_SOURCE_INTAKE: wrote foreman/artifacts/nerdkle_github_source_material_status.json
verified_count=4 blocked_count=0 canonical_count=0

PASS_MATERIALIZED_GITHUB_SOURCE: wrote foreman/artifacts/nerdkle_materialized_source_status.json
materialized_count=4

PASS_LOCAL_WITH_EXTERNAL_BLOCKERS: wrote foreman/artifacts/nerdkle_kernel_v0_status.json
complete_loop_count=5 valid_receipt_count=1
```

## Materialized Snapshot Root

`foreman/nerdkle/source_intake/materialized/`

These files are local read snapshots for build planning. They are not live runtime code and do not promote the GitHub review branches.

## Remaining Boundaries

- GitHub review branches are verified as source material but not promoted canon.
- The Book architecture branch is manuscript-only; it cannot prove automation.
- Nerdkle nervous-system organs still need production inputs and receipts.
- Receipt crawler still needs real `circulation.db` ledger proof.
- External Aeye thread IDs remain missing for `Dink@Sally`, `Thufir@Sally`, `Bean@Sally`, and `Ender@Betsy`.
