# VPG44 - Public Tester Full-Story Red Team

PACKET_ID: `TO_HEIMERDINKER_LADY_JESSICA_BEAN_WERKLES_PUBLIC_TESTER_FULL_STORY_RED_TEAM_VPG44_20260724`
STATUS: `COMPLETED`
FROM: `Heimerdinker@Betsy`
TO: `Heimerdinker@Betsy`, `LadyJessica@Betsy`, `Bean@Betsy`
INTEGRATION_OWNER: `Heimerdinker@Betsy`
PUSH_OWNER: `Heimerdinker@Betsy`
CYCLE_ID: `WERKLES-FLOCK-20260724-185700-ET-BETSY-01`
LEGACY_LABEL: `VPG44`
ORDINAL_CLAIM: `NONE`
SOURCE_COMMIT: `67c38ace103ba5f1ba473b984c91e243d9120630`
EXECUTION_BRANCH: `codex/werkles-vpg31-20260721`
EXECUTION_CONTEXT: `CODEX_LOCAL on local BETSY Windows`

## User story

A public tester enters Werkles from the homepage, understands the worked-example path, reaches Bellows recommendations, can optionally improve the readout through Profile Builder, and receives an explainable recommendation without exposing private data or silently opening saving, intake, providers, payments, or introductions.

Flow: `homepage UI -> Bellows UI -> recommendation/profile UI -> Bellows API boundaries -> rendered response/closed-state recovery`.

## P

Every addressed Aeye independently performs a LOCAL HANDS READBACK, then pulls this packet plus current Flock state, VPG41-VPG43 receipts, frozen product hashes, route/API handlers, client/server calls, environment-variable names only, and the current dirty candidate.

Each seat returns exactly two strongest red-team ideas before G. No G work is credited during P.

## G

Every addressed Aeye executes its own exactly two strongest ideas and returns an individual receipt.

- Heimerdinker: full request/response data-flow matrix and adversarial contract/fuzz proof.
- Lady Jessica: non-interactive browser verification across desktop/mobile, interaction, navigation, accessibility, console, and network state.
- Bean: hostile input, auth/cache/privacy, method/content-type, injection, and accidental-capability-opening attacks.

If a concrete bug is proven, Heimerdinker may integrate the smallest bounded repair inside this story and rerun the failing proof. Maximum two repair attempts per failed proof.

## Required red-team dimensions

- happy path and recovery path
- blank/oversized/malformed/hostile input
- GET/POST/method mismatch and content-type mismatch
- authentication absence and spoof attempts
- cache-control, `Vary`, robots, and private-response leakage
- browser console/error overlay/network failures
- keyboard and mobile interaction
- explainability, custody, score/ranking, and safe-return invariants
- no browser storage or unexpected write
- no saving, intake write, Tier B, providers/LLM, payments, introductions, SQL/schema/RLS/data mutation, or control-plane opening

## Bounds

- Local deterministic work only. No paid calls.
- No cosmetic redesign or speculative feature work.
- No secret values may be printed, stored, or transmitted.
- No browser/cursor takeover; browser proof must be isolated and non-interactive.
- No J, stage, commit, push, PR, merge, Preview creation, deployment, promotion, alias, environment change, Production action, or public launch.
- No Mouse Without Borders, RustDesk, infrastructure, or machine-control changes.

## Expected seat receipts

- `foreman/receipts/WERKLES_VPG44_G_HEIMERDINKER_PUBLIC_TESTER_RED_TEAM_20260724.md`
- `foreman/receipts/WERKLES_VPG44_G_LADY_JESSICA_BROWSER_RED_TEAM_20260724.md`
- `foreman/receipts/WERKLES_VPG44_G_BEAN_PUBLIC_SECURITY_RED_TEAM_20260724.md`

## Completion condition

All three addressed seats execute exactly two ideas; proven bugs receive bounded repairs or specific blockers; the whole public-tester flow passes static, API, browser, privacy, and negative-path verification.
