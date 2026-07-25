# Werkles VPG49 P — Thufir Dev-Toolchain Audit Containment

STATUS: `P_COMPLETED`
CYCLE_ID: `WERKLES-FLOCK-20260725-015952-ET-BETSY-01`
LEGACY_LABEL: `VPG49`
PACKET: `foreman/handoffs/outbox/TO_HEIMERDINKER_THUFIR_WERKLES_DEV_TOOLCHAIN_AUDIT_CONTAINMENT_VPG49_20260725.md`
SEAT: `Thufir@Betsy`
HOSTNAME_PROOF: `Betsy`
INTEGRATION_OWNER: `Heimerdinker@Betsy`
PUSH_OWNER: `Heimerdinker@Betsy`
REPOSITORY: `C:\w8`
BRANCH: `codex/werkles-vpg31-20260721`
HEAD: `bd24b45d3a01b51ee05c951d5f96e1bac6398686`

## RECEIVED

Thufir pulled and read the VPG49 packet, current VPG48 dirty/Flock state, manifest and lock, fresh full and Production audit graphs, VPG43/VPG47 dependency guards and results, current Next/ESLint peer constraints, current lint/typecheck/build commands, and the no-J boundary.

No G work was performed during P.

## Current source and custody truth

- VPG48 is `COMPLETED_LOCAL_NO_J`; its public-cutover verdict remains `STOP_CURRENT_PREVIEW_HARVEY_AND_PRODUCTION_BINDINGS_REQUIRED`.
- The worktree is dirty. Tracked changes remain in the approval log, cycle ledger, VPG42 cutover review, and VPG44 browser red-team script. The current VPG48/VPG49 packets, guards, fixtures, results, and receipts remain untracked.
- `package.json` and `package-lock.json` have no working-tree diff.
- `package.json` SHA-256: `56570ee3dbf03ccfa371311fbfb9df13bdc5171c389c47c87c9d2f68442354fa`.
- `package-lock.json` SHA-256: `655c4c86ef294ee940d39722b93aa5297c92c9903b01ceb6cd7eee20a4801621`.
- The VPG43 historical lock hash `f0bcbc04f494e214812bdc88eec6e1d6b6a3bc0909610819710e92858e31c392` is superseded. VPG47 already records that historical evidence is not current authority.
- No J is authorized for VPG49. No stage, commit, push, PR, merge, Preview, deploy, promotion, alias, environment, Production, SQL, data, capability, browser, or live action is in scope.

## Fresh audit graph

Read-only commands:

```text
npm.cmd audit --json
npm.cmd audit --omit=dev --json
```

| Graph | Exit | High | Critical | Total | Dependency counts |
| --- | ---: | ---: | ---: | ---: | --- |
| Full | `1` | `9` | `0` | `9` | prod `51`, dev `344`, optional `67`, total `432` |
| Production | `0` | `0` | `0` | `0` | prod `51`, dev `344`, optional `67`, total `432` |

All nine full-audit nodes are currently marked `dev: true` in the lock:

| Node | Locked version | Immediate graph owner |
| --- | --- | --- |
| `@eslint/config-array` | `0.21.2` | ESLint |
| `@eslint/eslintrc` | `3.3.5` | ESLint |
| `brace-expansion` | `1.1.16` | root `minimatch` |
| `eslint` | `9.39.4` | root dev dependency |
| `eslint-config-next` | `15.5.18` | root dev dependency |
| `eslint-plugin-import` | `2.32.0` | `eslint-config-next` |
| `eslint-plugin-jsx-a11y` | `6.10.2` | `eslint-config-next` |
| `eslint-plugin-react` | `7.37.5` | `eslint-config-next` |
| `minimatch` | `3.1.5` | ESLint/config/plugin chain |

The vulnerable root `minimatch@3.1.5` is required as `^3.1.2` or `^3.1.5` by ESLint, its config packages, and its plugins, and it requires `brace-expansion@^1.1.7`. A separate dev-only TypeScript-ESLint subtree already resolves patched `minimatch@10.2.5` with `brace-expansion@5.0.8`; that does not repair the root ESLint chain.

The audit's offered direct fixes cross the packet boundary: ESLint `10.8.0` is semver-major, and `eslint-config-next@16.2.11` is semver-major. A global forced override cannot be called compatible without lock, peer, lint, typecheck, and build proof.

## Peer and command boundary

- Manifest: Next `^15.5.21`, ESLint `^9.27.0`, `eslint-config-next` `^15.3.2`, TypeScript `^5.8.3`.
- Lock: Next `15.5.21`, ESLint `9.39.4`, `eslint-config-next` `15.5.18`, TypeScript `5.9.3`.
- `eslint-config-next@15.5.18` accepts ESLint `^7.23.0 || ^8.0.0 || ^9.0.0` and TypeScript `>=3.3.1`; ESLint 10 is outside that peer range.
- Next `15.5.21` accepts React/React DOM `^18.2.0`, its named React 19 RC, or `^19.0.0`. Its Node engine is `^18.18.0 || ^19.8.0 || >=20.0.0`.
- ESLint `9.39.4` requires Node `^18.18.0 || ^20.9.0 || >=21.1.0`.
- Existing Next overrides remain exact: nested PostCSS `8.5.18`, Sharp `0.35.0`.
- Lint: `eslint --max-warnings=0 app/dashboard/profile/page.tsx components/squibb/evidence-section.tsx components/squibb/personal-recommendation-delivery.tsx components/squibb/recommendation-card.tsx components/squibb/recommendation-surface.tsx`.
- Typecheck: `tsc --noEmit`.
- Build: `next build`.

## Guard/result inheritance

- VPG43's guard fail-closes the Production graph, exact root dependency surfaces, Next/PostCSS/Sharp floors, scoped overrides, registry integrity, and Production high/critical findings. Its historical smoke rejected `15/15` attacks.
- VPG47's cross-cycle result correctly supersedes the old lock hash and distinguishes current Production `0` from the disclosed full-audit `9 high` dev-toolchain residual.
- VPG47's J custody guard binds the package/lock pair and rejects Production-authority laundering, but it does not authorize this cycle's J or prove a new dev-toolchain repair.
- The missing VPG49 layer is a current hash-bound full-versus-Production graph/peer guard plus direct hostile tests against omission, relabeling, override, severity, and scope laundering.

## Exactly TWO strongest bounded ideas

### 1. Current dual-audit dependency/peer-boundary guard

Create a new VPG49 machine-readable guard and fixture bound to the current manifest/lock hashes. It will distinguish `CLEARED`, `CONTAINED_DEV_ONLY`, and `STOP` instead of converting a Production-only zero into a full-graph PASS. It will:

- require fresh full and `--omit=dev` audit JSON with exact command identities and honest exit semantics;
- trace every severe audit node through the lock, require each severe node to be dev/dev-optional reachable only, and prove it is absent from Production;
- preserve the Production direct surface, count `51`, and zero Production findings;
- bind exact root ranges, resolved versions, Next/PostCSS/Sharp overrides, registry integrity, and the Next 15 / ESLint 9 / `eslint-config-next` 15 peer boundary;
- reject stale VPG43 hashes and unbound caller JSON as current authority; and
- classify the present graph only as `CONTAINED_DEV_ONLY`, never vulnerability-free.

This is a new guard/fixture/result lane only. It does not edit dependencies or accept a repair candidate.

### 2. Override, omission, severity, and Production-scope laundering adversary matrix

Create a new VPG49 hostile suite against the guard. It will attack omitted audit nodes, decremented severity/counts, fake zero exits, command substitution, stale VPG43/VPG47 evidence, missing/duplicated audit rows, dev-flag relabeling, prod-to-dev custody laundering, Production dependency growth, lock/root divergence, missing integrity, scoped-override removal, unsupported global `minimatch`/`brace-expansion` overrides, ESLint 10 with config 15, config/Next 16 migration, lint-scope removal, dirty candidate evidence, self-issued PASS, and J/Production scope widening.

The suite will include two honest controls: the current graph must return `CONTAINED_DEV_ONLY`, while a separately supplied, hash-bound compatible repair may return `CLEARED` only after zero full findings plus preserved peers, Production graph, lint, typecheck, and build receipts. Raw synthetic evidence remains non-authoritative.

These are exactly the two proposed ideas. Thufir awaits G before creating or executing either one.

P_COMPLETED
