# VPG44 G Receipt - Heimerdinker Release Regression

STATUS: `COMPLETED_LOCAL / RELEASE_BLOCKED`
CYCLE_ID: `WERKLES-FLOCK-20260724-185700-ET-BETSY-01`
LEGACY_LABEL: `VPG44`
ORDINAL_CLAIM: `NONE`
SEAT: `Heimerdinker@Betsy`
PACKET: `foreman/handoffs/outbox/TO_HEIMERDINKER_ENDER_THUFIR_WERKLES_RELEASE_CUSTODY_FULL_REGRESSION_RED_TEAM_VPG44_20260724.md`

## Exactly two executed ideas

### 1. Complete deterministic regression census

- `60` `test-*.mjs` files inventoried.
- `52/52` safe deterministic tests passed.
- `8` scripts were deliberately separated: three browser suites, one local-runtime suite, and four provider/environment-dependent Inner/Crucible suites. Browser/runtime coverage was executed against the isolated build by Ender and Lady Jessica; provider/secret-dependent suites remained closed because this cycle forbids secrets, paid/live calls, and external mutation.
- Package lint, full `app`/`components` lint, and TypeScript passed.
- Four local TypeScript workflow smokes passed. The Human Gate generator reported its own health state as fail-closed rather than opening or approving any gate.
- Alias guard: `10/10`; release-integrity guard: `39/39`; Flock-cycle guard: `11/11`.

Ender's exact refreshed snapshot then proved a lock-faithful clean install, `0` dependency vulnerabilities, `52/52` inherited tests, `9/9` configured scripts, lint, TypeScript, and an `83/83` Production build with build ID `oz3lnhtZDaAN186GAORRA`.

### 2. Source, secret, ownership, and release-integrity adversary

The tracked secret scan found only examples/placeholders and a 1Password reference; it printed no values and found no live-key-shaped tracked assignment. The Git index remained empty.

The release adversary proved a generic `TIER_1_HUMAN_GATE` string could independently pass the Production alias guard. That bypass is repaired: Production alias mutation now also requires a structured SHA-256-bound approval matching phrase, cycle, candidate deployment, rollback deployment, and exact aliases. Token-only, mismatched candidate, unknown alias, Preview alias, and missing-gate cases stop; the secure reproduction now passes.

One proof gap remains intentionally fail-closed: no checked workflow composes branch, HEAD, candidate/Production/rollback deployments, aliases, cycle, J receipt, durable approval, and Harvey disposition into a single pre-mutation decision. The current dependency patch is not in the bound Preview, Harvey's 37-path disposition is unresolved, rollback is recovery rather than coexistence, and no J was requested. Therefore local readiness is proven while release authority remains `STOP`.

No stage, commit, push, PR, merge, Preview, deployment, promotion, alias, environment, Production, provider, secret, infrastructure, or machine-control mutation occurred.

COMPLETED
