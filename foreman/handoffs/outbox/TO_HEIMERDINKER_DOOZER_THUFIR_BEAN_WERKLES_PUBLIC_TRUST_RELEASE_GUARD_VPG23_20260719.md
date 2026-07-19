# VPG23 — Public Trust and Release Guard

PACKET_ID: `TO_HEIMERDINKER_DOOZER_THUFIR_BEAN_WERKLES_PUBLIC_TRUST_RELEASE_GUARD_VPG23_20260719`
STATUS: `CLAIMED`
FROM: `Heimerdinker@Betsy`
TO: `Heimerdinker@Betsy`, `Doozer@Betsy`, `Thufir@Betsy`, `Bean@Betsy`
EXECUTION_OWNER: `Heimerdinker@Betsy`
SOURCE: `codex/werkles-public-test-vpg22-20260718@cd174ef`
EXECUTION_BRANCH: `codex/werkles-public-entry-vpg23-20260719`

## Pulled state

- `/api/beta` is the remaining anonymous service-role write: it parses email/lane, inserts through Supabase, distinguishes duplicate emails, and returns provider errors. The public page calls it while describing the behavior as mock-only; `/privacy` and `/terms` are absent.
- `/signup` is already the approved account doorway, so a second unauthenticated email list is unnecessary for public testing.
- The former broken Production deployment came from a dirty foreign source and omitted required routes; the current alias guard checks aliases and the human gate but not clean source, approved SHA, build-route contract, or candidate readiness.

## Two ideas to execute

1. Fail-close `/api/beta` before request parsing or service access with one generic no-store response; remove the homepage collection form so no anonymous email/lane write or enumeration surface remains.
2. Add a small Production Release Integrity Guard and contract that stop on a dirty worktree, approved-SHA mismatch, missing required build routes, or a non-Ready/missing-route Vercel candidate; add a fixture smoke and package scripts, without deploying Production.

## Acceptance

- Every `/api/beta` POST body receives the same `503` no-store response without parsing, database access, duplicate disclosure, or raw provider error.
- Source and focused test prove the homepage no longer posts to `/api/beta`.
- Release guard fixture matrix passes the exact clean case and fails dirty, SHA mismatch, missing route, and non-Ready candidate cases.
- Guard validates the current `.next/server/app-paths-manifest.json` route contract after `npm run build`.
- No SQL/schema/RLS, Supabase mutation, LLM/provider call, Tier B, saving, payment, alias, or Production deployment occurs.

