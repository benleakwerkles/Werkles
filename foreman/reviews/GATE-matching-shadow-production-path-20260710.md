# Tier 1 Gate — Matching Shadow Production Path

Status: `AWAITING BEN DECISION`  
Confidence: `HIGH` on local mechanical evidence; `MEDIUM` on production behavior until deploy and live smoke  
Branch: `maker/site-g-20260703`  
Current HEAD/origin: `1499d4b`

## Decision

Choose one:

### A — Approve temporary shadow deploy

Deploy the existing crash-prevention and matching commits for bounded production diagnostics while accepting that `/tmp` receipts are ephemeral and instance-local.

### B — Require durable persistence first

Do not deploy matching shadow yet. Authorize preparation of a Supabase migration/RLS implementation and return to a separate SQL/apply gate.

Recommended: **B — durable persistence first.** Option A is acceptable only if Ben explicitly wants a production execution diagnostic before durable custody exists.

## Local evidence

- Root typecheck: PASS
- Next.js production build: PASS
- Static generation: 84/84
- `/operator/matching/shadow` present in final route manifest
- Vercel-mode writable root avoids `/var/task`
- Local semantic smoke: PASS 7/7
- Capital top path: `verify_proof`
- Job top path: `find_better_job`
- Training top path: `get_training`
- Partner suppression and disqualification dedupe: PASS

Receipts:

- `foreman/receipts/WERKLES_MATCHING_PREDEPLOY_READINESS_VPG3_20260710.md`
- `foreman/receipts/WERKLES_MATCHING_RANKING_DEDUPE_VPG2_20260710.md`
- `foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_20260710.json`
- `foreman/reviews/WERKLES_MATCHING_DURABLE_STORAGE_OPTIONS_V0_20260710.md`

## Files and commits

Already at branch HEAD/origin:

- `22e455c` — matching intake storage on Vercel and localhost smoke preference
- `1499d4b` — ranking tune, not-match dedupe, golden semantic assertions

Current matching-adjacent dirty files:

- `tsconfig.json` — excludes separate Harvey mobile app from root Next.js typecheck
- `foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_20260710.json` — latest local smoke evidence
- V/P/G packets and review receipts created locally

The broader worktree contains unrelated dirty files. Any commit/push must use an explicit matching allowlist; bulk staging is forbidden.

## Blast radius

- Discovery API persistence path
- Matching shadow persistence/read path
- Operator shadow review route
- Root web typecheck boundary
- Production serverless execution and receipt visibility

No public matching flag, LLM flag, billing path, membership path, or schema has been changed by the completed matching commits.

## Unknowns

- Whether production currently serves `1499d4b`
- Whether one Vercel invocation can read another invocation's temporary files
- Retention and access requirements for discovery payloads
- Final Supabase schema, RLS, retention, and deletion policy
- Whether all intended matching artifacts are included in a future allowlisted commit

## Risks

- Option A can produce successful POSTs without durable operator-visible custody.
- Discovery payloads may contain personal information; durable storage requires deliberate access and retention rules.
- The large dirty worktree creates accidental-commit risk.
- A live deploy may expose a route whose receipts disappear after cold start.

## Budget

No paid calls are authorized or required for this review. Provider, billing, secret, and account actions remain prohibited.

## Lane status

Matching is approved for shadow/local technical proof only. Public matching and LLM matching remain OFF. Push, deploy, SQL/schema/RLS apply, and production mutation remain human gates.

## What remains blocked

- Push/deploy without explicit approval
- Durable shared persistence without schema/RLS approval
- Public flip until durable custody and live QA pass

## Decision phrases

Approve temporary diagnostic path:

`APPROVE MATCHING SHADOW TEMPORARY DEPLOY — EPHEMERAL RECEIPTS ACCEPTED`

Require durable persistence first:

`REQUIRE MATCHING DURABLE PERSISTENCE BEFORE DEPLOY`

Reject this production move:

`REJECT MATCHING SHADOW PRODUCTION PATH`

Request changes:

`PATCH MATCHING SHADOW PRODUCTION GATE: <instructions>`

