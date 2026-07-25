# VPG43 G Receipt - Ender Dependency Integrity

STATUS: `COMPLETED`
CYCLE_ID: `WERKLES-FLOCK-20260724-153458-ET-BETSY-01`
LEGACY_LABEL: `VPG43`
ORDINAL_CLAIM: `NONE`
PACKET: `foreman/handoffs/outbox/TO_HEIMERDINKER_LADY_JESSICA_ENDER_WERKLES_DEPENDENCY_SECURITY_RELEASE_CANDIDATE_VPG43_20260724.md`
SEAT: `Ender@Betsy`
INTEGRATION_OWNER: `Heimerdinker@Betsy`
EXECUTION_CONTEXT: `CODEX_LOCAL` on `BETSY` Windows
BRANCH: `codex/werkles-vpg31-20260721`
SOURCE_COMMIT: `67c38ace103ba5f1ba473b984c91e243d9120630`
J_REQUESTED: `NO`
LIVE_STATE_CHANGED: `NO`

## Exactly two executed ideas

1. **Fail-closed dependency and lock integrity guard.** Added a contract-bound guard and 15-case smoke suite. The guard rejects root dependency drift, a missing or altered scoped override, Next below `15.5.21` or semver-major drift, every PostCSS node below `8.5.18`, every Sharp node below `0.35.0`, incoherent Next-family versions, missing registry integrity, local/untrusted resolutions, lock-root divergence, missing audit evidence, audit-command failure, and any remaining high or critical production finding. The real candidate passes with Next `15.5.21`, PostCSS `8.5.18` nested under Next plus root `8.5.23`, Sharp `0.35.0`, and audit `0 high / 0 critical / 0 total`.
2. **Lock-faithful build and runtime/Sharp failure-mode proof.** After Heimerdinker completed the single coordinated clean install, Ender verified the installed graph, ran lint, TypeScript, and a production build, then served only the resulting build on isolated port `31244`. The five acceptance pages returned `200`; personal delivery remained private `401`, saving remained `403 Blocked`, and intake remained `503 Closed`. A real Squibb PNG passed through `/_next/image` as `200 image/webp` with `23,728` bytes under Sharp `0.35.0`; sending `/privacy` to the optimizer failed closed as `400` with `The requested resource isn't a valid image.`

## Owned paths

- `scripts/foreman/dependency-security-integrity-guard-vpg43-20260724.mjs`
- `scripts/foreman/fixtures/vpg43-dependency-security-candidate-20260724.json`
- `scripts/foreman/test-dependency-security-integrity-guard-vpg43-20260724.mjs`
- `foreman/receipts/WERKLES_VPG43_G_ENDER_DEPENDENCY_INTEGRITY_20260724.md`

No product TSX, route, copy, image, auth, persistence, data, environment, deploy, or live-service file was edited by Ender.

## Exact commands and results

### Dependency guard

- `node --check scripts/foreman/dependency-security-integrity-guard-vpg43-20260724.mjs` -> `PASS`, exit `0`.
- `node --check scripts/foreman/test-dependency-security-integrity-guard-vpg43-20260724.mjs` -> `PASS`, exit `0`.
- `node scripts/foreman/test-dependency-security-integrity-guard-vpg43-20260724.mjs` -> `VPG43_DEPENDENCY_SECURITY_INTEGRITY_SMOKE: PASS (15 cases)`, exit `0`.
- `node scripts/foreman/dependency-security-integrity-guard-vpg43-20260724.mjs` -> `"pass": true`, no reasons, audit `high: 0`, `critical: 0`, `total: 0`, exit `0`.

### Clean-install coordination truth

- Ender's first `npm.cmd ci` attempt stopped during npm's removal phase with Windows `ENOTEMPTY` at `C:\w8\node_modules\eslint-module-utils\node_modules`; it did not reach install or build.
- Ender immediately paused on the integration owner's instruction, did not retry, did not manually remove `node_modules`, and ran no build or server while paused.
- Heimerdinker then completed and verified the sole lock-faithful clean install. Ender resumed as sole build/runtime owner without another install command.
- `npm.cmd ls next postcss sharp --all` -> Next `15.5.21`, Next PostCSS `8.5.18 overridden`, Sharp `0.35.0 overridden`, root PostCSS `8.5.23`, exit `0`.

### Static and build proof

- `npm.cmd run lint` -> `PASS`, exit `0`.
- `npm.cmd run typecheck` -> `PASS`, exit `0`.
- `npm.cmd run build` -> `PASS`, Next `15.5.21`, compiled successfully, `83/83` static pages generated, exit `0`.
- Build ID: `6WBPDpJBeFFm9cBhJ23nz`.
- The build emitted the existing informational warning that the Next.js ESLint plugin was not detected; there were no lint, type, compile, or page-generation failures.

### Isolated runtime and Sharp proof

- Server executable: `node node_modules/next/dist/bin/next start -H 127.0.0.1 -p 31244`, launched hidden from `C:\w8`.
- Server PID: `41660`; READY in `396ms`.
- `GET /` -> `200`.
- `GET /bellows` -> `200`.
- `GET /bellows/recommendations` -> `200`.
- `GET /dashboard/profile?next=%2Fbellows%2Frecommendations` -> `200`.
- `GET /privacy` -> `200`.
- `GET /api/bellows/recommendations/personal` -> `401`, `Authentication required`, `cache-control: private, no-store`, `vary` includes `Authorization`.
- `POST /api/bellows/recommendations/packet` with `{}` -> `403`, `state: Blocked`.
- `POST /api/bellows/intake` with `{}` -> `503`, `state: Closed`.
- `GET /_next/image?url=%2Fassets%2Fdraft%2Fsquibb-bellows-v1%2Fwerkles-squibb-bellows-lesson-card-v1.png&w=640&q=75` -> `200`, `image/webp`, `23,728` bytes, `x-nextjs-cache: MISS`.
- `GET /_next/image?url=%2Fprivacy&w=640&q=75` -> `400`, non-image response, `The requested resource isn't a valid image.`
- Lady Jessica independently reran VPG42 acceptance parity against the same build and reported `PASS`.
- Heimerdinker independently verified the same page/API/Sharp runtime boundary and reported `PASS`.
- After both consumers finished, Ender stopped only PID `41660`; port `31244` closed. Existing port `3000` remained listening on untouched PID `26556`.

## SHA-256 bindings

- `package.json`: `56570ee3dbf03ccfa371311fbfb9df13bdc5171c389c47c87c9d2f68442354fa`
- `package-lock.json`: `f0bcbc04f494e214812bdc88eec6e1d6b6a3bc0909610819710e92858e31c392`
- `scripts/foreman/dependency-security-integrity-guard-vpg43-20260724.mjs`: `ef0cf7abe3c98fc014543022a3e41fb649ced1fd2a31f57a8666bff27e2434bb`
- `scripts/foreman/fixtures/vpg43-dependency-security-candidate-20260724.json`: `7b0dbdfa1a9f3f95a562362542f8b54c87345b374aba8e6c5b40977444c34113`
- `scripts/foreman/test-dependency-security-integrity-guard-vpg43-20260724.mjs`: `cf3a405604d214d9dd392d9c82c368140e40772902ec47edc7dc6f2c6be1c31d`

## Boundaries preserved

No deploy, Preview creation, Production change, alias, environment mutation, browser/cursor control, Mouse Without Borders action, J, stage, commit, push, PR, merge, provider/LLM, payment, SQL/schema/RLS/data mutation, saving/Tier B, or intake opening occurred.

COMPLETED
