# VPG44 G Receipt - Thufir Release / Custody Red Team

STATUS: `COMPLETED`
CYCLE_ID: `WERKLES-FLOCK-20260724-185700-ET-BETSY-01`
LEGACY_LABEL: `VPG44`
ORDINAL_CLAIM: `NONE`
PACKET: `foreman/handoffs/outbox/TO_HEIMERDINKER_ENDER_THUFIR_WERKLES_RELEASE_CUSTODY_FULL_REGRESSION_RED_TEAM_VPG44_20260724.md`
SEAT: `Thufir@Betsy`
INTEGRATION_OWNER: `Heimerdinker@Betsy`
EXECUTION_CONTEXT: `CODEX_LOCAL on local BETSY Windows`
HOSTNAME: `BETSY`
REPO: `C:\w8`
BRANCH: `codex/werkles-vpg31-20260721`
SOURCE_COMMIT: `67c38ace103ba5f1ba473b984c91e243d9120630`

## Local hands binding

- Terminal: PowerShell available.
- Localhost: port `3000` is running from the unrelated `C:\Users\Ben Leak\github\Werkles` checkout, not this candidate; it was not touched or used as VPG44 evidence.
- HEAD and upstream: exact match at `67c38ace103ba5f1ba473b984c91e243d9120630`.
- Index: empty throughout this receipt.

## Exactly two executed adversarial ideas

### 1. Composite release-authorization bypass adversary

`red-team-release-guard-composition-vpg44-20260724.mjs` constructed a complete passing production-release fixture at the current exact candidate and deployment identities, then separately evaluated the production alias guard.

Proven results:

- **VULNERABILITY - generic Human Gate bearer token.** `werkles.com` received alias-guard `PASS` when the caller supplied only `HUMAN_GATE=TIER_1_HUMAN_GATE`. The guard did not require a durable approval-log record, cycle, exact phrase, candidate deployment, J receipt, Harvey disposition, or rollback binding.
- **PROOF GAP - guards are not composed.** The production release guard separately returned `PASS` without branch, cycle, J, durable Human Gate, alias, Harvey, rollback, or environment fields. The only checked GitHub workflow invokes none of the alias, release, cycle, or Harvey guards.
- This does **not** prove that an automatic live exploit path currently invokes both guards; no Production deploy workflow exists in the checked repository. It proves that independent guard `PASS` receipts cannot safely be treated as release authority.

Reproducible failing secure invariant:

```text
node scripts/foreman/red-team-release-guard-composition-vpg44-20260724.mjs --expect-secure
```

Observed: expected exit `1`; assertion actual `true`, secure expected `false`.

Minimal repair design for Heimerdinker:

1. Add one composite release-custody evaluator requiring exact branch, HEAD, candidate deployment/source, current Production deployment, rollback, aliases, cycle, J receipt, durable Human Gate record, and Harvey disposition.
2. Replace the generic Human Gate string with a parsed, hash-bound approval artifact whose cycle, phrase, decision, candidate deployment, alias set, and rollback all match.
3. Make the only Production deploy/alias entrypoint call the composite evaluator before mutation. Add negative cases for token-only, stale gate, wrong branch, wrong deployment, missing J, unresolved Harvey, and rollback-as-coexistence.

No existing product, package, alias, release, deploy, or Harvey guard code was edited.

### 2. Stale/uncommitted custody and rollback adversary

`red-team-release-custody-current-state-vpg44-20260724.mjs` bound current Git, dependency, Preview, Production, Human Gate, and Harvey evidence without contacting or mutating a provider.

Exact result: `STOP_UNCOMMITTED_CANDIDATE_AND_UNRESOLVED_HARVEY`.

- Candidate/upstream: `67c38ace103ba5f1ba473b984c91e243d9120630`.
- `origin/main`: `294f98396b122b413275a3f8c45524987de284fe`.
- Harvey Production: `3998101aed1835e7478a83cc44bd823502676648`.
- Merge base: `294f98396b122b413275a3f8c45524987de284fe`; divergence `10 Production-only / 95 candidate-only`.
- Bound Preview `dpl_9KrWte1jcoMSDVHEXdK2MQg6QhMd` still sources commit `67c38ace`.
- Committed Next range is `^15.3.2`; local dirty range is `^15.5.21`. The dependency repair is therefore not in the bound Preview.
- Five named Harvey/gate/promotion custody artifacts remain untracked.
- Raw cutover still removes exactly 37 Harvey paths; inventory digest is `3b746a15ed0beaebb375d08152cda25b6ed2bb2c4633cd5850d707403a4bdc46`.
- No Harvey mode is selected, execution authorization is false, and rollback is explicitly recovery rather than coexistence.
- The VPG42 cutover gate remains `BLOCKED_TECHNICAL_PRECONDITIONS`; promotion eligibility remains false.

Classification: this current state is a **proof-gap stop**, not an active release vulnerability, because the gate is still closed. It becomes the authorization vulnerability proven in idea 1 only if independent `PASS` receipts are treated as sufficient release authority.

Two tracked test files became dirty concurrently during this proof:

- `scripts/foreman/test-matching-example-custody-intake-clarity-vpg12-20260717.mjs`
- `scripts/foreman/test-matching-example-custody-intake-clarity-vpg12-browser.mjs`

They are other-seat work, were not read as release truth, and are not claimed by Thufir.

## Added Thufir-owned evidence

- `scripts/foreman/fixtures/vpg44-release-custody-current-20260724.json`
- `scripts/foreman/red-team-release-guard-composition-vpg44-20260724.mjs`
- `scripts/foreman/red-team-release-custody-current-state-vpg44-20260724.mjs`
- `foreman/receipts/WERKLES_VPG44_G_THUFIR_RELEASE_CUSTODY_RED_TEAM_20260724.md`

## Verification

- Both scripts: Node syntax `PASS`.
- Composition bypass reproduction: `PASS`, vulnerability reproduced.
- Secure invariant: expected `FAIL`, exit `1`, confirmed.
- Current-state custody proof: `PASS`, correct fail-closed release verdict.
- Network mutation, install, build, server start, browser/cursor, J, stage, commit, push, deploy, alias, and environment change: `NONE`.

COMPLETED
