# VPG44 G Receipt - Heimerdinker Public Tester Red Team

STATUS: `COMPLETED`
CYCLE_ID: `WERKLES-FLOCK-20260724-185700-ET-BETSY-01`
LEGACY_LABEL: `VPG44`
ORDINAL_CLAIM: `NONE`
SEAT: `Heimerdinker@Betsy`
PACKET: `foreman/handoffs/outbox/TO_HEIMERDINKER_LADY_JESSICA_BEAN_WERKLES_PUBLIC_TESTER_FULL_STORY_RED_TEAM_VPG44_20260724.md`

## Exactly two executed ideas

### 1. Exhaustive request/response boundary matrix

The hostile matrix exercised missing, malformed, wrong-scheme, double-space, tab-separated, invalid, trailing-segment, and case-insensitive valid Bearer headers; closed methods and content types; spoofed ownership; private cache headers; and mutation/storage/provider absence.

It proved one fail-open defect: a valid token followed by attacker-controlled text was accepted because the parser ignored later segments. `lib/supabase/request.ts` now accepts only one complete `Bearer <token>` header. The repaired matrix passes all eight auth cases, five hostile content types, method declarations, owner filtering, private/no-store/`Vary: Authorization`, and zero mutation/storage/provider calls.

The response corpus proved 12 malformed personal sessions were accepted: invalid ranks/scores, empty or approval-free top gates, duplicate IDs, empty decks, oversized text, and blank required text. `lib/matching/personal-recommendation-contract.ts` now enforces bounded nonblank fields, positive integer ranks, scores from 0 through 100, bounded nonempty decks/gates, unique IDs, a human-approved top recommendation, authenticated-profile source custody, and no document/intake/packet paths. All 12 attacks now fail closed; XSS output remains escaped; 11 hostile return paths remain rejected; no unsafe sink, browser storage, or mutating client call was found.

### 2. Deterministic source-to-runtime full-story contract

The complete safe static census passed `52/52`. Five stale regression harnesses were repaired to assert the already-intended current product contracts: `Example situation`, three Bellows choices including Profile Builder, the moved optional-profile boundary, compressed private-result copy, and a valid nonempty personal-session fixture. One Windows path conversion bug was repaired with `fileURLToPath`.

Root headless verification on the isolated Production build opened the homepage and recommendations with correct titles/headings, accessible interactive structure, no Next error overlay, no local/session storage, and zero Axe WCAG A/AA violations on both pages. Axe left two manual-review groups incomplete: generic-element ARIA support and gradient-backed contrast. The only console warning was an unavailable external Google Fonts preload; all application assets and routes loaded, fallback rendering remained intact, and no application error was recorded.

No saving, intake opening, provider, payment, introduction, SQL/schema/RLS, secret, J, push, deployment, alias, Production, infrastructure, or machine-control action occurred.

COMPLETED
