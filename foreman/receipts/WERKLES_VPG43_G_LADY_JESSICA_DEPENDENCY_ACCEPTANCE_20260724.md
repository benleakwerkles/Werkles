# VPG43 G Receipt - Lady Jessica Dependency Acceptance

STATUS: `COMPLETED`
CYCLE_ID: `WERKLES-FLOCK-20260724-153458-ET-BETSY-01`
LEGACY_LABEL: `VPG43`
ORDINAL_CLAIM: `NONE`
PACKET: `foreman/handoffs/outbox/TO_HEIMERDINKER_LADY_JESSICA_ENDER_WERKLES_DEPENDENCY_SECURITY_RELEASE_CANDIDATE_VPG43_20260724.md`
EXECUTION_OWNER: `LadyJessica@Betsy`
INTEGRATION_OWNER: `Heimerdinker@Betsy`
BUILD_RUNTIME_OWNER: `Ender@Betsy`
SOURCE_COMMIT: `67c38ace103ba5f1ba473b984c91e243d9120630`
EXECUTION_CONTEXT: `LOCAL_SALLY_WINDOWS`
HOSTNAME: `BETSY`
BRANCH: `codex/werkles-vpg31-20260721`
LIVE_STATE_CHANGED: `NO`

## Exactly two executed ideas

1. **Source-bound frozen recommendation/profile regression.** Compared every path in the VPG41 product/test freeze to its recorded SHA-256, proved no frozen path entered the dependency diff, ran nine focused/inherited recommendation, profile, custody, accessibility, recovery, and selection guards, and ran the targeted UI lint.
2. **Post-build VPG42 acceptance parity.** Probed Ender's single-owner candidate-faithful production server on isolated `127.0.0.1:31244`, bound it to the fresh build ID and fixed dependency versions, and compared the five tester pages, defining readout markers, and exact `401/403/503` boundaries to the VPG42 route matrix and acceptance card.

## Idea 1 - Source and UI regression evidence

Commands:

```text
git diff --name-only HEAD
node -  # inline SHA-256 comparison of all owned_paths in WERKLES_VPG41_PRODUCT_TEST_FREEZE_20260724.json
node scripts/foreman/test-post-push-tester-journey-vpg40-20260723.mjs
node scripts/foreman/test-public-recommendation-activation-vpg26-20260719.mjs
node scripts/foreman/test-public-accessibility-trust-vpg31-20260721.mjs
node scripts/foreman/test-public-tester-journey-vpg25-20260719.mjs
node scripts/foreman/test-profile-builder-polish-20260717.mjs
node scripts/foreman/test-recommendation-decision-moment-vpg31-20260721.mjs
node scripts/foreman/test-recommendation-warmth-interaction-vpg35-20260721.mjs
node scripts/foreman/test-recommendation-clarity-recovery-vpg33-20260721.mjs
node scripts/foreman/test-first-screen-selection-vpg36-20260721.mjs
npm.cmd run lint
```

Results:

- Frozen manifest: `PASS`, 13 of 13 paths exact, 0 mismatches.
- Frozen subset digest: `af5a0994bdeb2b4a8c667a6bed3894d5b420f1ee887555a56866971a01b1354b`.
- Focused/inherited UI scripts: `PASS`, 9 of 9.
- Targeted lint: `PASS`, 0 warnings/errors.
- Frozen-path diff: empty. The tracked diff seen at execution contained only Foreman control evidence plus `package.json` and `package-lock.json`; no product/UI path entered the candidate.

User-visible frozen hashes:

| Path | Expected and actual SHA-256 |
|---|---|
| `app/bellows/recommendations/squibb-recommendations.css` | `ee62cbaca84b9d6845cba449fbcc950d8b53857d4b6a0c4c8228092be9e7fe93` |
| `app/dashboard/profile/page.tsx` | `2e3324cc9afc83c5257e243e4f8f9ee33aed4fe480f2ab1267117c139ace35c7` |
| `app/globals.css` | `d3c83395564e8106b3ad3f7cd808a1cb549e5965a009944c2afe6126f295d6e9` |
| `components/squibb/recommendation-surface.tsx` | `0258191fe86d506ae546cbc6c091cbdcdc188e8cd876a41d7ec558ad1d95c2a0` |

The guards preserve the closed native optional-profile disclosure, one primary save/return action, ordinary Profile Builder behavior, one feature-gated Squibb guide figure, rules scores, custody language, proof/gate relationships, safe return destinations, accessible selection semantics, and the absence of new writes or browser storage.

## Idea 2 - Candidate-faithful acceptance parity

Ender supplied the sole candidate-faithful build/runtime:

- Build ID: `6WBPDpJBeFFm9cBhJ23nz`
- Next: `15.5.21`
- Next-nested PostCSS: `8.5.18`
- Sharp: `0.35.0`
- Origin: `http://127.0.0.1:31244`

Lady Jessica command:

```text
node -  # inline fetch/assert matrix against http://127.0.0.1:31244; no server start
```

The first invocation stopped before any HTTP request because `sharp/package.json` is not package-exported. The single corrected invocation read the same version directly from the filesystem and returned `PASS_VPG42_LOCAL_PARITY`.

| Boundary | Result |
|---|---|
| `GET /` | `200`; `See the worked example` and `/bellows/recommendations` present |
| `GET /bellows` | `200` |
| `GET /bellows/recommendations` | `200`; walkthrough, next-move, Squibb guide/decision, and rules-score markers present |
| `GET /dashboard/profile?next=%2Fbellows%2Frecommendations` | `200`; `Profile Builder` present |
| `GET /privacy` | `200`; `Public Test Data Notice` present |
| `GET /api/bellows/recommendations/personal` | `401`, `Authentication required`, `Cache-Control: private, no-store`, `Pragma: no-cache`, `Vary` includes `Authorization` |
| `POST /api/bellows/recommendations/packet` | `403`, `state: Blocked` |
| `POST /api/bellows/intake` | `503`, `state: Closed` |

The responses also retain `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex`.

## Discarded stale-build stop

Before the single-owner refresh was coordinated, `npm.cmd run build` completed with build ID `aHJ1FSnBliero6Mx705YJ` but reported Next `15.5.18`; direct resolution also showed nested PostCSS `8.4.31` and Sharp `0.34.5`. That build was declared stale, was never served or credited, and runtime work paused immediately. Ender then became the sole install/build/runtime owner. This receipt credits only build `6WBPDpJBeFFm9cBhJ23nz`.

## Custody

Lady Jessica changed no product, package, lock, environment, data, gate, route, score, auth, persistence, or live-service state. This receipt is the only file added by this seat. No browser/cursor control, install, deployment, stage, commit, push, PR, merge, promotion, or alias action occurred.

COMPLETED
