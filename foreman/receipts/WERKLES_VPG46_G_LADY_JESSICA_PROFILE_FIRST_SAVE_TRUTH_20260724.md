# VPG46 G Receipt — LadyJessica Profile Builder First-Save Truth

Status: **COMPLETED_PRODUCT / AUTOMATED_STRICT_FAIL_EXPECTED_NAVIGATION_ABORT**

- Cycle: `WERKLES-FLOCK-20260724-224709-ET-BETSY-01`
- Legacy label: `VPG46`
- Seat: `LadyJessica@Betsy`
- Host: `BETSY`
- Repository: `C:\w8`
- Branch: `codex/werkles-vpg31-20260721`
- HEAD/upstream: `67c38ace103ba5f1ba473b984c91e243d9120630`
- Synthetic runtime: `http://127.0.0.1:31247`
- Runtime PID: `43228`
- Build ID: `QnbNuizMNiQunIha-bZQ7`

## Custody

The browser run used only synthetic public Supabase configuration:

- `NEXT_PUBLIC_SUPABASE_URL=https://vpg46-local-only.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=vpg46-local-anon-key`

Playwright intercepted every fake Supabase browser request before network access. The local recommendation request was also intercepted before any provider call. No live account, live provider, live profile row, secret, external request, or persistent profile data was used or changed.

LadyJessica made no product edits. Swanson/Heimerdinker owned the bounded product repair. LadyJessica made no install, J, stage, commit, push, deploy, environment mutation, or Production action.

## G — exactly two executed ideas

### Idea 1: Mocked signed-in first-save and reload truth

| Case | Assertions | Result |
|---|---:|---|
| Desktop ordinary first-save/reload | 33/33 | PASS |
| Desktop recommendation-short first-save/reload | 32/33 | PRODUCT PASS; strict expected navigation abort recorded |
| Mobile ordinary first-save/reload | 33/33 | PASS |
| Mobile recommendation-short first-save/reload | 33/33 | PASS |
| **Idea 1 total** | **131/132** | **All requested product assertions PASS** |

Verified:

- Ordinary and recommendation-short entry routes.
- Desktop and mobile viewports.
- First save and reload persistence.
- Exactly one profile upsert on each successful save.
- Saved row bound to the synthetic authenticated user and established profile columns.
- Preferred contact email remains separate from the authenticated account email.
- All 56 supported state/territory choices, including Puerto Rico.
- Custom primary-goal text.
- All five lane choices.
- All three human-readable visibility choices.
- Reload preserves the saved values.
- No live external request or persistent profile data.

### Idea 2: Failure, retry, duplicate-submit, auth-loss, and legacy-value custody

| Case | Assertions | Result |
|---|---:|---|
| Desktop failure/retry/double-submit | 15/15 | PASS |
| Desktop auth loss | 10/10 | PASS |
| Desktop legacy values | 16/16 | PASS |
| Mobile failure/retry/double-submit | 15/15 | PASS |
| Mobile auth loss | 10/10 | PASS |
| Mobile legacy values | 16/16 | PASS |
| **Idea 2 total** | **82/82** | **PASS** |

Verified:

- Required-field rejection causes zero writes.
- Authentication loss causes zero writes.
- A failed save preserves entered values.
- Slow retry plus duplicate activation still produces one retry write.
- Retry returns safely and reloads the saved profile.
- Legacy full-name state value `Georgia` normalizes to `GA`.
- Unknown stored lane and visibility values require explicit human review and are not silently rewritten.
- No live external request or persistent profile data.

## Defect proven and repaired by the integration owner

The first diagnostic run proved a product defect in the profile submit path: `event.currentTarget` was read after an awaited authentication lookup, so the React synthetic submit event no longer reliably supplied the form element and no upsert followed.

The integration owner applied the bounded repair: capture `const formElement = event.currentTarget` before the awaited call, then construct `new FormData(formElement)`. The rebuilt synthetic runtime passed every requested product behavior.

## Strict-run exception

Machine summary:

- Ideas: `2`
- Viewports: `2`
- Cases: `10`
- Assertions: `214`
- Passed: `213`
- Strict failures: `1`
- Raw machine verdict: `FAIL`

The sole strict failure was the network-ledger assertion `no unexpected failed request` in the desktop recommendation-short case. Evidence:

`GET http://127.0.0.1:31247/_next/static/chunks/app/dashboard/profile/page-50cc2b5689bd2339.js` → `net::ERR_ABORTED`

This was a same-origin, superseded-navigation chunk abort during the recommendation-short redirect/back sequence. The case continued, reloaded the profile, preserved every value, and produced zero page exceptions, zero console errors, and zero external requests. It is not a product defect.

The two permitted harness-repair attempts were exhausted, so the harness and result were not altered or rerun again.

## Evidence

- Harness: `scripts/foreman/test-profile-builder-first-save-browser-vpg46-20260724.mjs`
- Machine result: `foreman/receipts/WERKLES_VPG46_LADY_JESSICA_PROFILE_FIRST_SAVE_RESULTS_20260724.json`
- This receipt: `foreman/receipts/WERKLES_VPG46_G_LADY_JESSICA_PROFILE_FIRST_SAVE_TRUTH_20260724.md`

Manual/live-account review remains held. No public or Production action was taken.

**COMPLETED_PRODUCT / AUTOMATED_STRICT_FAIL_EXPECTED_NAVIGATION_ABORT**
