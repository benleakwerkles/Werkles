# VPG45 G Receipt - Thufir Composite Release Custody Adversary

STATUS: `COMPLETED`
CYCLE_ID: `WERKLES-FLOCK-20260724-221246-ET-BETSY-01`
LEGACY_LABEL: `VPG45`
ORDINAL_CLAIM: `NONE`
PACKET: `foreman/handoffs/outbox/TO_HEIMERDINKER_ENDER_THUFIR_WERKLES_COMPOSITE_RELEASE_CUSTODY_GUARD_VPG45_20260724.md`
SEAT: `Thufir@Betsy`
INTEGRATION_OWNER: `Heimerdinker@Betsy`
EXECUTION_CONTEXT: `CODEX_LOCAL on local BETSY Windows`
HOSTNAME: `BETSY`
REPO: `C:\w8`
BRANCH: `codex/werkles-vpg31-20260721`
SOURCE_COMMIT: `67c38ace103ba5f1ba473b984c91e243d9120630`

## Exactly two executed ideas

### 1. Self-issued authority and independent PASS laundering

The adversary used the composite evaluator's separate request/trusted-evidence contract and proved five caller-authority attacks fail closed:

1. The exact VPG45 approval-log row is present and says `APPROVED`, but its phrase is `V, P, G` and its conditions explicitly forbid J, deployment, alias, and Production action. Presenting that ordinary project approval as release authority returns `APPROVAL_RECORD_NOT_AUTHORITATIVE`.
2. A caller-created approval object with a freshly recomputed unkeyed SHA-256 digest returns `APPROVAL_RECORD_NOT_AUTHORITATIVE`.
3. A fabricated `RESOLVED` Harvey claim with 37 caller-authorized removals returns `HARVEY_AUTHORITY_MISSING`.
4. Cycle artifacts carrying only the correct cycle ID and legacy label return `CYCLE_INCOMPLETE`.
5. Independent alias/release/cycle/J/Harvey `PASS` claims without complete raw trusted bindings return ten fail-closed reasons, including `CYCLE_INCOMPLETE`, `J_RECEIPT_MISSING`, `APPROVAL_RECORD_NOT_AUTHORITATIVE`, and `HARVEY_AUTHORITY_MISSING`.

Result: `5/5 STOP`.

Trust-boundary finding: the evaluator CLI accepts a caller-selected
`--trusted-evidence` JSON path, while record digests are format-checked rather
than independently resolved to their source records. The complete synthetic
fixture therefore passes by design, but that receipt is test evidence only and
cannot itself be release authority. No future mutation entrypoint may accept
arbitrary trusted JSON; it must obtain the envelope from an adapter that
independently reads and hashes Git, approval, current-cycle J remote equality,
release-integrity, and Harvey evidence. No checked workflow invokes the
composite guard today, so this is a proof-gap condition rather than a live
Production exploit.

### 2. Cross-cycle replay, snapshot confusion, and TOCTOU

The adversary proved ten custody mutations fail closed:

1. exact stale VPG41 J replay -> `J_CYCLE_MISMATCH`
2. wrong branch -> `BRANCH_MISMATCH`, `J_BINDING_MISMATCH`, `APPROVAL_BINDING_MISMATCH`
3. upstream drift -> `UPSTREAM_MISMATCH`
4. candidate source mismatch -> `CANDIDATE_SOURCE_MISMATCH`
5. Production/rollback identity swap -> `PRODUCTION_DEPLOYMENT_MISMATCH`, `ROLLBACK_DEPLOYMENT_MISMATCH`
6. alias-set drift -> `ALIAS_SET_MISMATCH`, `APPROVAL_BINDING_MISMATCH`
7. approval replay from another cycle/candidate -> `APPROVAL_BINDING_MISMATCH`
8. unresolved, unauthorized Harvey disposition -> `HARVEY_DISPOSITION_UNRESOLVED`, `HARVEY_AUTHORITY_MISSING`
9. dirty and untracked release evidence -> `DIRTY_WORKTREE`, `UNTRACKED_EVIDENCE`
10. post-evaluation snapshot mutation -> `EVIDENCE_DIGEST_MISMATCH`, `BRANCH_MISMATCH`

Result: `10/10 STOP`.

## Verification

- Complete, fully bound synthetic control: `PASS`.
- Adversary matrix: `15/15 STOP` with every required exact reason observed.
- Node syntax: `PASS`.
- Exactly two idea groups executed.
- Evaluator source was read and tested but not edited by Thufir.

Thufir-owned evidence:

- `scripts/foreman/fixtures/vpg45-thufir-release-custody-adversaries-20260724.json`
- `scripts/foreman/red-team-composite-release-custody-thufir-vpg45-20260724.mjs`
- `foreman/receipts/WERKLES_VPG45_G_THUFIR_RELEASE_CUSTODY_ADVERSARY_20260724.md`

No install, build, server, browser/cursor, environment, secret, provider, live action, J, stage, commit, push, deploy, promotion, alias, or Production mutation occurred.

COMPLETED
