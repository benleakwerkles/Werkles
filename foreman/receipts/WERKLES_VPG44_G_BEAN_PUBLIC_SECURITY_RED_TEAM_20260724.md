# Werkles VPG44 G Receipt — Bean Public Security Red Team

STATUS: `COMPLETED`
CYCLE_ID: `WERKLES-FLOCK-20260724-185700-ET-BETSY-01`
LEGACY_LABEL: `VPG44`
SEAT: `Bean@Betsy`
HOSTNAME: `BETSY`
REPOSITORY: `C:\w8`
BRANCH: `codex/werkles-vpg31-20260721`
SOURCE_COMMIT: `67c38ace103ba5f1ba473b984c91e243d9120630`
PACKET: `foreman/handoffs/outbox/TO_HEIMERDINKER_LADY_JESSICA_BEAN_WERKLES_PUBLIC_TESTER_FULL_STORY_RED_TEAM_VPG44_20260724.md`

## Bounds held

- Executed exactly the two ideas selected during Bean P.
- Added only two bounded adversarial test files and this receipt.
- Did not edit product, package, environment, database, provider, deployment, or machine-control state.
- Did not start a server, install anything, print secret values, perform a live write or paid call, use a browser, or perform J.
- Existing port `3000` from the separate `C:\Users\Ben Leak\github\Werkles` checkout remained untouched.

## Idea 1 — Hostile API boundary matrix

Harness:

- `scripts/foreman/test-public-tester-api-boundary-red-team-vpg44-20260724.mjs`

Executed:

- Eight authorization shapes: missing, Basic, missing token, double-space, tab-separated, invalid token, trailing segment, and case-insensitive valid Bearer.
- Five content types against both closed POST boundaries: JSON, plain text, form encoded, multipart, and octet stream.
- Query, body, and forwarding-header owner spoof attempts.
- Handler export inventory for GET/POST and method mismatch.
- Mutation sentinels on profile insert/update/upsert/delete, intake storage, matching pipeline, and feature/provider calls.
- Exact personal-response cache header checks.

Held:

- Missing, Basic, missing-token, double-space, tab-separated, and invalid-token authorization returned `401`.
- Case-insensitive valid Bearer returned `200`.
- Owner identity came only from authenticated user `id`; query/body/forwarding spoof values were ignored.
- Personal response preserved `Cache-Control: private, no-store`, `Pragma: no-cache`, and `Vary: Authorization`.
- Five of five content types reached intake `503 Closed` before body parsing.
- Five of five content types reached packet saving `403 Blocked` before body parsing.
- Request-body reads: `0`.
- Profile mutation calls: `0`.
- Intake storage calls: `0`.
- Matching/provider/feature calls: `0`.
- Declared handlers remain personal `GET`, intake `POST`, packet `POST`; no extra route methods were exported.

Proven defect:

- `Authorization: Bearer valid-token attacker-controlled` returned `200`; expected `401`.
- Cause: `bearerToken()` splits on spaces and destructures only the first two entries, silently ignoring trailing segments.
- Smallest proposed repair for Heimerdinker: make the entire header match one Bearer credential, such as `/^Bearer ([^\s]+)$/i`, and retain the existing missing/invalid-token behavior.

Harness result before repair: `FAIL`, exit `2`, one of eight authorization shapes bypassed strict header grammar.

## Idea 2 — Response-contract and rendering attack corpus

Harness:

- `scripts/foreman/test-public-tester-response-contract-red-team-vpg44-20260724.mjs`

Executed twelve malformed authenticated personal payloads:

1. rank `0`
2. fractional rank
3. score below `0`
4. score above `100`
5. empty human-gate list
6. no approval or blocker gate
7. duplicate ranked ID
8. duplicate catalog ID
9. empty ranked deck
10. empty catalog
11. 100,001-character title
12. empty required headline

Also executed:

- A script/image/onerror corpus through real React server rendering of `RecommendationCard`.
- Unsafe-return fuzz with eleven protocol, host, traversal, encoding, object, and array shapes.
- Static sink scan across personal delivery, recommendation surface/card, and closed intake client.
- Browser-storage and mutating personal-client method scans.

Held:

- React escaped the hostile HTML/script/attribute corpus; no raw script, image, or event-handler injection rendered.
- Unsafe return paths rejected: `11/11`.
- Unsafe rendering sinks: `0`.
- Browser storage uses: `0`.
- Personal client mutating methods or request bodies: `0`.

Proven defect:

- All `12/12` malformed personal payloads passed `isPersonalRecommendationResponse()` and were classified as `status: personal`.
- Smallest proposed repair for Heimerdinker:
  - require bounded, non-empty required strings;
  - require positive integer ranks;
  - require finite scores from `0` through `100`;
  - require a non-empty human-gate list with an approval-required blocker for personal recommendations;
  - require non-empty ranked/catalog decks with unique recommendation IDs.

Harness result before repair: `FAIL`, exit `2`, twelve contract bypasses.

## Handoff

Both defects are local, deterministic, and reproducible. The new harnesses are intentionally red until Heimerdinker integrates the smallest product repairs. After repair, rerun both files and require exit `0` with an empty `proven_bypasses` list.

No defect was hidden behind a runtime, live-data, secret, provider, or human gate.

COMPLETED
